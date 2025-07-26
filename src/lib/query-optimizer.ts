/**
 * Otimizador de Queries para Supabase
 * Implementa connection pooling, query caching e otimizações
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { cacheManager } from './cache-manager'

interface QueryOptions {
  cache?: boolean
  cacheTTL?: number
  retries?: number
  timeout?: number
}

interface QueryStats {
  totalQueries: number
  cacheHits: number
  cacheMisses: number
  avgResponseTime: number
  errors: number
}

interface ConnectionPoolConfig {
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
}

/**
 * Otimizador de Queries com cache e connection pooling
 */
export class QueryOptimizer {
  private client: SupabaseClient
  private stats: QueryStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    errors: 0
  }
  private responseTimes: number[] = []

  // Pool de conexões simulado (Supabase gerencia isso internamente)
  private connectionPool: ConnectionPoolConfig = {
    maxConnections: 10,
    idleTimeout: 30000,
    connectionTimeout: 5000
  }

  constructor(client: SupabaseClient = supabase) {
    this.client = client
    console.log('⚡ QueryOptimizer inicializado', {
      connectionPool: this.connectionPool
    })
  }

  /**
   * Executa query otimizada com cache
   */
  async query<T>(
    table: string,
    queryBuilder: (client: SupabaseClient) => any,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const startTime = Date.now()
    const queryKey = this.generateQueryKey(table, queryBuilder.toString())
    
    this.stats.totalQueries++

    try {
      // Verificar cache se habilitado
      if (options.cache !== false) {
        const cached = cacheManager.get<T>(queryKey)
        if (cached) {
          this.stats.cacheHits++
          console.log('✅ Query cache hit', { table, queryKey })
          return cached
        }
        this.stats.cacheMisses++
      }

      // Executar query com timeout
      const result = await this.executeWithTimeout(
        queryBuilder(this.client),
        options.timeout || 10000
      )

      if (result.error) {
        this.stats.errors++
        console.error('❌ Erro na query', {
          table,
          error: result.error,
          queryKey
        })
        throw result.error
      }

      // Armazenar no cache se habilitado
      if (options.cache !== false && result.data) {
        cacheManager.set(queryKey, result.data, options.cacheTTL)
      }

      // Atualizar estatísticas
      const responseTime = Date.now() - startTime
      this.updateStats(responseTime)

      console.log('✅ Query executada com sucesso', {
        table,
        responseTime,
        cached: false
      })

      return result.data

    } catch (error) {
      this.stats.errors++
      const responseTime = Date.now() - startTime
      this.updateStats(responseTime)

      console.error('❌ Falha na execução da query', {
        table,
        error,
        responseTime,
        queryKey
      })

      // Retry se configurado
      if (options.retries && options.retries > 0) {
        console.log('🔄 Tentando novamente query', {
          table,
          retriesLeft: options.retries
        })
        
        await this.delay(1000) // Aguardar 1s antes do retry
        return this.query(table, queryBuilder, {
          ...options,
          retries: options.retries - 1
        })
      }

      throw error
    }
  }

  /**
   * Queries otimizadas específicas para autenticação
   */
  async getUserProfile(userId: string): Promise<any> {
    return this.query(
      'profiles',
      (client) => client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      { cache: true, cacheTTL: 30 * 60 * 1000 } // 30 min cache
    )
  }

  async getUserWithProfile(userId: string): Promise<any> {
    const cacheKey = `user_with_profile:${userId}`
    const cached = cacheManager.get(cacheKey)
    
    if (cached) {
      this.stats.cacheHits++
      return cached
    }

    // Query otimizada com JOIN
    const result = await this.query(
      'profiles',
      (client) => client
        .from('profiles')
        .select(`
          *,
          user:auth.users(*)
        `)
        .eq('user_id', userId)
        .single(),
      { cache: true, cacheTTL: 15 * 60 * 1000 }
    )

    return result
  }

  async getActiveUserSessions(userId: string): Promise<any> {
    return this.query(
      'user_sessions',
      (client) => client
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      { cache: true, cacheTTL: 5 * 60 * 1000 } // 5 min cache
    )
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.query(
      'user_permissions',
      (client) => client
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId),
      { cache: true, cacheTTL: 10 * 60 * 1000 }
    )

    return result ? result.map((p: any) => p.permission) : []
  }

  /**
   * Batch queries para reduzir round trips
   */
  async batchUserData(userId: string): Promise<{
    profile: any
    sessions: any[]
    permissions: string[]
  }> {
    const cacheKey = `batch_user_data:${userId}`
    const cached = cacheManager.get(cacheKey)
    
    if (cached) {
      this.stats.cacheHits++
      return cached
    }

    try {
      // Executar queries em paralelo
      const [profile, sessions, permissions] = await Promise.all([
        this.getUserProfile(userId),
        this.getActiveUserSessions(userId),
        this.getUserPermissions(userId)
      ])

      const result = { profile, sessions, permissions }
      
      // Cache por 10 minutos
      cacheManager.set(cacheKey, result, 10 * 60 * 1000)
      
      return result

    } catch (error) {
      console.error('❌ Erro no batch de dados do usuário', {
        userId,
        error
      })
      throw error
    }
  }

  /**
   * Invalidação inteligente de cache
   */
  invalidateUserCache(userId: string): void {
    // Invalidar todos os caches relacionados ao usuário
    cacheManager.invalidatePattern(`.*${userId}.*`)
    
    console.log('🗑️ Cache do usuário invalidado', { userId })
  }

  /**
   * Preparar queries frequentes (warm up)
   */
  async warmupQueries(userId: string): Promise<void> {
    try {
      // Pre-carregar dados frequentemente acessados
      await Promise.all([
        this.getUserProfile(userId),
        this.getUserPermissions(userId)
      ])

      console.log('🔥 Queries aquecidas para usuário', { userId })
    } catch (error) {
      console.error('❌ Erro ao aquecer queries', { userId, error })
    }
  }

  /**
   * Otimizações específicas para diferentes tipos de query
   */
  async optimizedSelect<T>(
    table: string,
    columns: string,
    filters: Record<string, any>,
    options: QueryOptions = {}
  ): Promise<T[]> {
    return this.query(
      table,
      (client) => {
        let query = client.from(table).select(columns)
        
        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        })

        return query
      },
      options
    ) as Promise<T[]>
  }

  async optimizedCount(
    table: string,
    filters: Record<string, any> = {}
  ): Promise<number> {
    const result = await this.query(
      table,
      (client) => {
        let query = client.from(table).select('*', { count: 'exact', head: true })
        
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })

        return query
      },
      { cache: true, cacheTTL: 2 * 60 * 1000 } // 2 min cache para counts
    )

    return result?.count || 0
  }

  /**
   * Utilitários privados
   */
  private generateQueryKey(table: string, query: string): string {
    // Gerar chave única para a query
    const hash = this.simpleHash(query)
    return `query:${table}:${hash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ])
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private updateStats(responseTime: number): void {
    this.responseTimes.push(responseTime)
    
    // Manter apenas os últimos 100 tempos de resposta
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift()
    }

    // Calcular média
    this.stats.avgResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  /**
   * Estatísticas e monitoramento
   */
  getStats(): QueryStats & {
    cacheHitRate: number
    connectionPoolStatus: ConnectionPoolConfig
  } {
    const totalCacheQueries = this.stats.cacheHits + this.stats.cacheMisses
    const cacheHitRate = totalCacheQueries > 0 
      ? (this.stats.cacheHits / totalCacheQueries) * 100 
      : 0

    return {
      ...this.stats,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      connectionPoolStatus: this.connectionPool
    }
  }

  /**
   * Limpeza e otimização periódica
   */
  async optimize(): Promise<void> {
    // Limpar estatísticas antigas
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-100)
    }

    // Log de estatísticas
    const stats = this.getStats()
    console.log('📊 Estatísticas do QueryOptimizer', stats)
  }
}

// Instância singleton
export const queryOptimizer = new QueryOptimizer()

// Executar otimização a cada 30 minutos
if (typeof window === 'undefined') {
  setInterval(() => {
    queryOptimizer.optimize()
  }, 30 * 60 * 1000)
}