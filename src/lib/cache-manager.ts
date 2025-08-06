/**
 * Sistema de Cache Inteligente para Autenticação
 * Implementa cache em memória com TTL e invalidação automática
 */

import { UserProfile } from '@/contexts/AuthContext'
import { User, Session } from '@supabase/supabase-js'

// Interface para item do cache
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em milissegundos
  key: string
}

// Interface para estatísticas do cache
interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// Configurações do cache
const CACHE_CONFIG = {
  // TTL padrão: 5 minutos
  DEFAULT_TTL: 5 * 60 * 1000,
  
  // TTL específicos por tipo
  PROFILE_TTL: 10 * 60 * 1000, // 10 minutos para perfis
  SESSION_TTL: 30 * 60 * 1000, // 30 minutos para sessões
  USER_TTL: 15 * 60 * 1000,    // 15 minutos para dados de usuário
  
  // Tamanho máximo do cache
  MAX_SIZE: 1000,
  
  // Intervalo de limpeza automática
  CLEANUP_INTERVAL: 2 * 60 * 1000, // 2 minutos
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanupTimer()
    console.log('🗄️ CacheManager inicializado')
  }

  /**
   * Iniciar timer de limpeza automática
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, CACHE_CONFIG.CLEANUP_INTERVAL)
  }

  /**
   * Parar timer de limpeza
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Gerar chave do cache
   */
  private generateKey(type: string, id: string): string {
    return `${type}:${id}`
  }

  /**
   * Verificar se item está expirado
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl
  }

  /**
   * Atualizar estatísticas
   */
  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0
  }

  /**
   * Armazenar item no cache
   */
  private set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    // Verificar tamanho máximo
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      this.cleanup()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    }

    this.cache.set(key, item)
    this.updateStats()

    console.log(`📦 Cache SET: ${key} (TTL: ${ttl}ms)`)
  }

  /**
   * Recuperar item do cache
   */
  private get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      this.updateStats()
      console.log(`❌ Cache MISS: ${key}`)
      return null
    }

    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateStats()
      console.log(`⏰ Cache EXPIRED: ${key}`)
      return null
    }

    this.stats.hits++
    this.updateStats()
    console.log(`✅ Cache HIT: ${key}`)
    return item.data as T
  }

  /**
   * Remover item do cache
   */
  private delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.updateStats()
    if (deleted) {
      console.log(`🗑️ Cache DELETE: ${key}`)
    }
    return deleted
  }

  /**
   * Limpeza automática de itens expirados
   */
  private cleanup(): void {
    const before = this.cache.size
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
        cleaned++
      }
    }

    this.updateStats()

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} itens removidos (${before} → ${this.cache.size})`)
    }
  }

  // ===== MÉTODOS PÚBLICOS PARA PERFIS =====

  /**
   * Armazenar perfil no cache
   */
  setProfile(userId: string, profile: UserProfile): void {
    const key = this.generateKey('profile', userId)
    this.set(key, profile, CACHE_CONFIG.PROFILE_TTL)
  }

  /**
   * Recuperar perfil do cache
   */
  getProfile(userId: string): UserProfile | null {
    const key = this.generateKey('profile', userId)
    return this.get<UserProfile>(key)
  }

  /**
   * Invalidar perfil do cache
   */
  invalidateProfile(userId: string): boolean {
    const key = this.generateKey('profile', userId)
    return this.delete(key)
  }

  // ===== MÉTODOS PÚBLICOS PARA SESSÕES =====

  /**
   * Armazenar sessão no cache
   */
  setSession(userId: string, session: Session): void {
    const key = this.generateKey('session', userId)
    this.set(key, session, CACHE_CONFIG.SESSION_TTL)
  }

  /**
   * Recuperar sessão do cache
   */
  getSession(userId: string): Session | null {
    const key = this.generateKey('session', userId)
    return this.get<Session>(key)
  }

  /**
   * Invalidar sessão do cache
   */
  invalidateSession(userId: string): boolean {
    const key = this.generateKey('session', userId)
    return this.delete(key)
  }

  // ===== MÉTODOS PÚBLICOS PARA USUÁRIOS =====

  /**
   * Armazenar usuário no cache
   */
  setUser(userId: string, user: User): void {
    const key = this.generateKey('user', userId)
    this.set(key, user, CACHE_CONFIG.USER_TTL)
  }

  /**
   * Recuperar usuário do cache
   */
  getUser(userId: string): User | null {
    const key = this.generateKey('user', userId)
    return this.get<User>(key)
  }

  /**
   * Invalidar usuário do cache
   */
  invalidateUser(userId: string): boolean {
    const key = this.generateKey('user', userId)
    return this.delete(key)
  }

  // ===== MÉTODOS DE GESTÃO GERAL =====

  /**
   * Invalidar todos os dados de um usuário
   */
  invalidateUserData(userId: string): void {
    this.invalidateProfile(userId)
    this.invalidateSession(userId)
    this.invalidateUser(userId)
    console.log(`🧹 Todos os dados do usuário ${userId} invalidados`)
  }

  /**
   * Pré-aquecer cache com dados do usuário
   */
  async warmup(userId: string, data: {
    user?: User
    profile?: UserProfile
    session?: Session
  }): Promise<void> {
    console.log(`🔥 Aquecendo cache para usuário: ${userId}`)

    if (data.user) {
      this.setUser(userId, data.user)
    }

    if (data.profile) {
      this.setProfile(userId, data.profile)
    }

    if (data.session) {
      this.setSession(userId, data.session)
    }
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    }
    console.log(`🗑️ Cache completamente limpo (${size} itens removidos)`)
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Obter informações detalhadas do cache
   */
  getInfo(): {
    stats: CacheStats
    config: typeof CACHE_CONFIG
    items: Array<{
      key: string
      type: string
      age: number
      ttl: number
      expired: boolean
    }>
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      type: key.split(':')[0],
      age: Date.now() - item.timestamp,
      ttl: item.ttl,
      expired: this.isExpired(item)
    }))

    return {
      stats: this.getStats(),
      config: CACHE_CONFIG,
      items
    }
  }

  /**
   * Destruir cache manager
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
    console.log('🗄️ CacheManager destruído')
  }
}

// Instância singleton
export const cacheManager = new CacheManager()

// Limpar cache quando a página é fechada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.destroy()
  })
}

export default cacheManager
