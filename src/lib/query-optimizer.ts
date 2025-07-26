/**
 * Otimizador de Queries para Supabase
 * Implementa cache de queries, batching e otimizações de performance
 */

import { supabase } from '@/lib/supabase'
import { cacheManager } from '@/lib/cache-manager'
import { UserProfile } from '@/contexts/AuthContext'

// Interface para resultado de query
interface QueryResult<T> {
  data: T | null
  error: any
  fromCache: boolean
  executionTime: number
}

// Interface para configuração de query
interface QueryConfig {
  cacheKey?: string
  cacheTTL?: number
  enableCache?: boolean
  timeout?: number
  retries?: number
}

// Configurações padrão
const DEFAULT_CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  TIMEOUT: 10000, // 10 segundos
  RETRIES: 3,
  BATCH_SIZE: 10,
  BATCH_DELAY: 100, // 100ms
}

class QueryOptimizer {
  private queryCache = new Map<string, any>()
  private batchQueue = new Map<string, Array<{
    resolve: (value: any) => void
    reject: (error: any) => void
    config: QueryConfig
  }>>()
  private batchTimer: NodeJS.Timeout | null = null
  private stats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    avgExecutionTime: 0
  }

  constructor() {
    console.log('⚡ QueryOptimizer inicializado')
  }

  /**
   * Gerar chave de cache para query
   */
  private generateCacheKey(table: string, filters: any): string {
    const filterStr = JSON.stringify(filters)
    return `query:${table}:${btoa(filterStr)}`
  }

  /**
   * Executar query com timeout
   */
  private async executeWithTimeout<T>(
    queryPromise: Promise<T>, 
    timeout: number = DEFAULT_CONFIG.TIMEOUT
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Query timeout')), timeout)
      
      // Limpar timeout se a promise resolver primeiro
      queryPromise.finally(() => clearTimeout(timeoutId))
    })

    return Promise.race([queryPromise, timeoutPromise])
  }

  /**
   * Executar query com retry
   */
  private async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    retries: number = DEFAULT_CONFIG.RETRIES
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await queryFn()
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Query falhou (tentativa ${attempt}/${retries}):`, error)
        
        if (attempt < retries) {
          // Backoff exponencial
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Processar batch de queries
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.size === 0) return

    console.log(`📦 Processando batch de ${this.batchQueue.size} queries`)

    for (const [key, requests] of this.batchQueue.entries()) {
      try {
        // Executar query uma vez para todos os requests
        const result = await this.executeQuery(key, requests[0].config)
        
        // Resolver todos os requests com o mesmo resultado
        requests.forEach(request => request.resolve(result))
      } catch (error) {
        // Rejeitar todos os requests com o mesmo erro
        requests.forEach(request => request.reject(error))
      }
    }

    this.batchQueue.clear()
  }

  /**
   * Executar query real
   */
  private async executeQuery(queryKey: string, config: QueryConfig): Promise<any> {
    // Implementar lógica específica baseada na chave da query
    // Por enquanto, retorna um placeholder
    throw new Error('Query execution not implemented for key: ' + queryKey)
  }

  /**
   * Buscar perfil otimizado
   */
  async getProfile(userId: string, config: QueryConfig = {}): Promise<QueryResult<UserProfile>> {
    const startTime = Date.now()
    this.stats.totalQueries++

    const finalConfig = {
      enableCache: true,
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL,
      timeout: DEFAULT_CONFIG.TIMEOUT,
      retries: DEFAULT_CONFIG.RETRIES,
      ...config
    }

    const cacheKey = `profile:${userId}`

    // Verificar cache primeiro
    if (finalConfig.enableCache) {
      const cached = cacheManager.getProfile(userId)
      if (cached) {
        this.stats.cacheHits++
        return {
          data: cached,
          error: null,
          fromCache: true,
          executionTime: Date.now() - startTime
        }
      }
    }

    this.stats.cacheMisses++

    try {
      // Executar query com otimizações
      const queryFn = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data as UserProfile
      }

      const result = await this.executeWithTimeout(
        this.executeWithRetry(queryFn, finalConfig.retries),
        finalConfig.timeout
      )

      // Armazenar no cache
      if (finalConfig.enableCache && result) {
        cacheManager.setProfile(userId, result)
      }

      const executionTime = Date.now() - startTime
      this.updateAvgExecutionTime(executionTime)

      return {
        data: result,
        error: null,
        fromCache: false,
        executionTime
      }

    } catch (error) {
      this.stats.errors++
      console.error('❌ Erro na query otimizada de perfil:', error)

      return {
        data: null,
        error,
        fromCache: false,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Buscar múltiplos perfis otimizado
   */
  async getProfiles(userIds: string[], config: QueryConfig = {}): Promise<QueryResult<UserProfile[]>> {
    const startTime = Date.now()
    this.stats.totalQueries++

    const finalConfig = {
      enableCache: true,
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL,
      timeout: DEFAULT_CONFIG.TIMEOUT,
      retries: DEFAULT_CONFIG.RETRIES,
      ...config
    }

    // Verificar cache para cada usuário
    const cachedProfiles: UserProfile[] = []
    const uncachedUserIds: string[] = []

    if (finalConfig.enableCache) {
      for (const userId of userIds) {
        const cached = cacheManager.getProfile(userId)
        if (cached) {
          cachedProfiles.push(cached)
          this.stats.cacheHits++
        } else {
          uncachedUserIds.push(userId)
          this.stats.cacheMisses++
        }
      }
    } else {
      uncachedUserIds.push(...userIds)
    }

    // Se todos estão em cache, retornar
    if (uncachedUserIds.length === 0) {
      return {
        data: cachedProfiles,
        error: null,
        fromCache: true,
        executionTime: Date.now() - startTime
      }
    }

    try {
      // Buscar perfis não cacheados
      const queryFn = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uncachedUserIds)

        if (error) throw error
        return data as UserProfile[]
      }

      const uncachedProfiles = await this.executeWithTimeout(
        this.executeWithRetry(queryFn, finalConfig.retries),
        finalConfig.timeout
      )

      // Armazenar no cache
      if (finalConfig.enableCache && uncachedProfiles) {
        uncachedProfiles.forEach(profile => {
          cacheManager.setProfile(profile.id, profile)
        })
      }

      const allProfiles = [...cachedProfiles, ...uncachedProfiles]
      const executionTime = Date.now() - startTime
      this.updateAvgExecutionTime(executionTime)

      return {
        data: allProfiles,
        error: null,
        fromCache: cachedProfiles.length > 0,
        executionTime
      }

    } catch (error) {
      this.stats.errors++
      console.error('❌ Erro na query otimizada de perfis:', error)

      return {
        data: cachedProfiles.length > 0 ? cachedProfiles : null,
        error,
        fromCache: cachedProfiles.length > 0,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Atualizar tempo médio de execução
   */
  private updateAvgExecutionTime(executionTime: number): void {
    this.stats.avgExecutionTime = (
      (this.stats.avgExecutionTime * (this.stats.totalQueries - 1)) + executionTime
    ) / this.stats.totalQueries
  }

  /**
   * Invalidar cache de usuário
   */
  invalidateUserCache(userId: string): void {
    cacheManager.invalidateProfile(userId)
    console.log(`🗑️ Cache de usuário ${userId} invalidado`)
  }

  /**
   * Invalidar cache de múltiplos usuários
   */
  invalidateUsersCache(userIds: string[]): void {
    userIds.forEach(userId => this.invalidateUserCache(userId))
  }

  /**
   * Pré-carregar perfis
   */
  async preloadProfiles(userIds: string[]): Promise<void> {
    console.log(`🔥 Pré-carregando ${userIds.length} perfis`)
    
    // Dividir em batches para não sobrecarregar
    const batches = []
    for (let i = 0; i < userIds.length; i += DEFAULT_CONFIG.BATCH_SIZE) {
      batches.push(userIds.slice(i, i + DEFAULT_CONFIG.BATCH_SIZE))
    }

    // Processar batches sequencialmente
    for (const batch of batches) {
      await this.getProfiles(batch, { enableCache: true })
      
      // Pequeno delay entre batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.BATCH_DELAY))
      }
    }
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.totalQueries > 0 
        ? (this.stats.cacheHits / this.stats.totalQueries) * 100 
        : 0,
      errorRate: this.stats.totalQueries > 0 
        ? (this.stats.errors / this.stats.totalQueries) * 100 
        : 0
    }
  }

  /**
   * Resetar estatísticas
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      avgExecutionTime: 0
    }
    console.log('📊 Estatísticas do QueryOptimizer resetadas')
  }

  /**
   * Limpar todos os caches
   */
  clearCache(): void {
    this.queryCache.clear()
    cacheManager.clear()
    console.log('🗑️ Cache do QueryOptimizer limpo')
  }
}

// Instância singleton
export const queryOptimizer = new QueryOptimizer()

export default queryOptimizer