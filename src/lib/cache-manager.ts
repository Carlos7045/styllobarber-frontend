/**
 * Sistema de Cache para Autenticação
 * Implementa cache em memória com TTL e invalidação automática
 */

import { User } from '@supabase/supabase-js'

// Tipos para o sistema de cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
}

interface ProfileData {
  id: string
  nome: string
  email: string
  telefone?: string
  role: 'admin' | 'barber' | 'client'
  avatar_url?: string
  pontos_fidelidade?: number
  data_nascimento?: string
  created_at: string
  updated_at: string
}

/**
 * Gerenciador de Cache para Autenticação
 * Implementa cache em memória com TTL, invalidação e métricas
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null

  // TTL padrão para diferentes tipos de dados (em ms)
  private readonly DEFAULT_TTLS = {
    session: 15 * 60 * 1000, // 15 minutos
    profile: 30 * 60 * 1000, // 30 minutos
    user: 10 * 60 * 1000,    // 10 minutos
    permissions: 5 * 60 * 1000 // 5 minutos
  }

  constructor() {
    this.startCleanupTimer()
    console.log('✅ CacheManager inicializado', {
      defaultTTLs: this.DEFAULT_TTLS
    })
  }

  /**
   * Armazena dados no cache com TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTLS.session,
      key
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size

    console.log('📦 Item adicionado ao cache', {
      key,
      ttl: entry.ttl,
      size: this.stats.size
    })
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.stats.misses++
      console.log('❌ Cache miss', { key })
      return null
    }

    // Verificar se expirou
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.evictions++
      this.stats.size = this.cache.size
      this.stats.misses++
      
      console.log('⏰ Item expirado removido do cache', {
        key,
        age: Date.now() - entry.timestamp
      })
      return null
    }

    this.stats.hits++
    console.log('✅ Cache hit', { key })
    return entry.data
  }

  /**
   * Remove item específico do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size = this.cache.size
      console.log('🗑️ Item removido do cache', { key })
    }
    return deleted
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const previousSize = this.cache.size
    this.cache.clear()
    this.stats.size = 0
    this.stats.evictions += previousSize
    
    console.log('🧹 Cache limpo completamente', {
      itemsRemovidos: previousSize
    })
  }

  /**
   * Invalida cache por padrão de chave
   */
  invalidatePattern(pattern: string): number {
    let removed = 0
    const regex = new RegExp(pattern)

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        removed++
      }
    }

    this.stats.size = this.cache.size
    this.stats.evictions += removed

    console.log('🔄 Cache invalidado por padrão', {
      pattern,
      itemsRemovidos: removed
    })

    return removed
  }

  /**
   * Métodos específicos para cache de sessão
   */
  setSession(userId: string, sessionData: any): void {
    this.set(`session:${userId}`, sessionData, this.DEFAULT_TTLS.session)
  }

  getSession(userId: string): any | null {
    return this.get(`session:${userId}`)
  }

  invalidateSession(userId: string): void {
    this.delete(`session:${userId}`)
    console.log('🔐 Sessão invalidada', { userId })
  }

  /**
   * Métodos específicos para cache de perfil
   */
  setProfile(userId: string, profile: ProfileData): void {
    this.set(`profile:${userId}`, profile, this.DEFAULT_TTLS.profile)
  }

  getProfile(userId: string): ProfileData | null {
    return this.get(`profile:${userId}`)
  }

  invalidateProfile(userId: string): void {
    this.delete(`profile:${userId}`)
    console.log('👤 Perfil invalidado', { userId })
  }

  /**
   * Métodos específicos para cache de usuário
   */
  setUser(userId: string, user: User): void {
    this.set(`user:${userId}`, user, this.DEFAULT_TTLS.user)
  }

  getUser(userId: string): User | null {
    return this.get(`user:${userId}`)
  }

  invalidateUser(userId: string): void {
    this.delete(`user:${userId}`)
    this.invalidateSession(userId)
    this.invalidateProfile(userId)
    console.log('🚮 Usuário e dados relacionados invalidados', { userId })
  }

  /**
   * Cache de permissões
   */
  setPermissions(userId: string, permissions: string[]): void {
    this.set(`permissions:${userId}`, permissions, this.DEFAULT_TTLS.permissions)
  }

  getPermissions(userId: string): string[] | null {
    return this.get(`permissions:${userId}`)
  }

  /**
   * Verifica se um item expirou
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Limpa itens expirados
   */
  private cleanup(): void {
    let removed = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      this.stats.size = this.cache.size
      this.stats.evictions += removed
      
      console.log('🧽 Limpeza automática executada', {
        itemsRemovidos: removed,
        tamanhoAtual: this.stats.size
      })
    }
  }

  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    // Limpar a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Para o timer de limpeza
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }

  /**
   * Retorna informações detalhadas do cache
   */
  getInfo(): {
    stats: CacheStats & { hitRate: number }
    entries: Array<{
      key: string
      age: number
      ttl: number
      remainingTtl: number
    }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      remainingTtl: Math.max(0, entry.ttl - (now - entry.timestamp))
    }))

    return {
      stats: this.getStats(),
      entries
    }
  }

  /**
   * Aquece o cache com dados frequentemente acessados
   */
  async warmup(userId: string, userData?: {
    user?: User
    profile?: ProfileData
    permissions?: string[]
  }): Promise<void> {
    if (!userData) return

    if (userData.user) {
      this.setUser(userId, userData.user)
    }

    if (userData.profile) {
      this.setProfile(userId, userData.profile)
    }

    if (userData.permissions) {
      this.setPermissions(userId, userData.permissions)
    }

    console.log('🔥 Cache aquecido para usuário', {
      userId,
      items: Object.keys(userData)
    })
  }
}

// Instância singleton do cache manager
export const cacheManager = new CacheManager()

// Cleanup ao encerrar a aplicação
if (typeof window === 'undefined') {
  process.on('SIGTERM', () => {
    cacheManager.stopCleanup()
  })

  process.on('SIGINT', () => {
    cacheManager.stopCleanup()
  })
}