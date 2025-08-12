import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Configuração base para services
 */
export interface ServiceConfig {
  /** Nome da tabela no banco */
  tableName: string
  /** Se deve usar cache (padrão: true) */
  enableCache?: boolean
  /** TTL do cache em ms (padrão: 5 minutos) */
  cacheTTL?: number
  /** Número máximo de tentativas (padrão: 3) */
  maxRetries?: number
  /** Delay entre tentativas em ms (padrão: 1000) */
  retryDelay?: number
}

/**
 * Resultado de operação do service
 */
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Resultado de operação de lista
 */
export interface ServiceListResult<T> {
  success: boolean
  data?: T[]
  error?: string
  code?: string
  count?: number
  hasMore?: boolean
}

/**
 * Filtros para queries
 */
export interface QueryFilters {
  [key: string]: any
}

/**
 * Opções de ordenação
 */
export interface SortOptions {
  column: string
  ascending?: boolean
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Classe base para todos os services
 * 
 * @description
 * Fornece funcionalidades comuns como CRUD, cache, retry logic,
 * error handling e logging para todos os services da aplicação.
 * 
 * @example
 * ```typescript
 * class UserService extends BaseService<User> {
 *   constructor() {
 *     super({
 *       tableName: 'users',
 *       enableCache: true,
 *       cacheTTL: 10 * 60 * 1000 // 10 minutos
 *     })
 *   }
 * 
 *   async findByEmail(email: string): Promise<ServiceResult<User>> {
 *     return this.executeWithRetry(async () => {
 *       const { data, error } = await this.query()
 *         .eq('email', email)
 *         .single()
 * 
 *       if (error) throw error
 *       return { success: true, data }
 *     })
 *   }
 * }
 * ```
 */
export abstract class BaseService<T = any> {
  protected config: Required<ServiceConfig>
  protected cache = new Map<string, { data: any; timestamp: number }>()

  constructor(config: ServiceConfig) {
    this.config = {
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutos
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    }
  }

  /**
   * Obtém uma query builder para a tabela
   */
  protected query() {
    return supabase.from(this.config.tableName)
  }

  /**
   * Executa uma operação com retry automático
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    retries = this.config.maxRetries
  ): Promise<R> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay)
        return this.executeWithRetry(operation, retries - 1)
      }
      throw error
    }
  }

  /**
   * Determina se um erro deve ser retentado
   */
  protected shouldRetry(error: any): boolean {
    // Retry em erros de rede ou temporários
    if (error?.code === 'PGRST301' || error?.code === 'PGRST302') return true
    if (error?.message?.includes('network')) return true
    if (error?.message?.includes('timeout')) return true
    return false
  }

  /**
   * Delay para retry
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtém dados do cache
   */
  protected getFromCache<R>(key: string): R | null {
    if (!this.config.enableCache) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Salva dados no cache
   */
  protected setCache(key: string, data: any): void {
    if (!this.config.enableCache) return

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Invalida cache por padrão
   */
  protected invalidateCache(pattern?: string): void {
    if (pattern) {
      // Remove entradas que correspondem ao padrão
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Limpa todo o cache
      this.cache.clear()
    }
  }

  /**
   * Trata erros do Supabase
   */
  protected handleError(error: PostgrestError | Error): ServiceResult<never> {
    console.error(`${this.constructor.name} Error:`, error)

    if ('code' in error && error.code) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }

  /**
   * Busca um registro por ID
   */
  async findById(id: string): Promise<ServiceResult<T>> {
    const cacheKey = `${this.config.tableName}:${id}`
    const cached = this.getFromCache<T>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return this.executeWithRetry(async () => {
      const { data, error } = await this.query()
        .eq('id', id)
        .single()

      if (error) {
        return this.handleError(error)
      }

      this.setCache(cacheKey, data)
      return { success: true, data }
    })
  }

  /**
   * Busca todos os registros com filtros opcionais
   */
  async findMany(
    filters?: QueryFilters,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<ServiceListResult<T>> {
    const cacheKey = `${this.config.tableName}:list:${JSON.stringify({ filters, sort, pagination })}`
    const cached = this.getFromCache<T[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return this.executeWithRetry(async () => {
      let query = this.query().select('*', { count: 'exact' })

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Aplicar ordenação
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending ?? true })
      }

      // Aplicar paginação
      if (pagination) {
        const { page, limit, offset } = pagination
        if (offset !== undefined) {
          query = query.range(offset, offset + (limit || 10) - 1)
        } else if (page && limit) {
          const start = (page - 1) * limit
          query = query.range(start, start + limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) {
        return this.handleError(error)
      }

      const result = {
        success: true,
        data: data || [],
        count: count || 0,
        hasMore: pagination ? (count || 0) > (pagination.offset || 0) + (data?.length || 0) : false,
      }

      this.setCache(cacheKey, data)
      return result
    })
  }

  /**
   * Cria um novo registro
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<T>> {
    return this.executeWithRetry(async () => {
      const { data: result, error } = await this.query()
        .insert(data)
        .select()
        .single()

      if (error) {
        return this.handleError(error)
      }

      // Invalidar cache relacionado
      this.invalidateCache(this.config.tableName)

      return { success: true, data: result }
    })
  }

  /**
   * Atualiza um registro existente
   */
  async update(id: string, data: Partial<T>): Promise<ServiceResult<T>> {
    return this.executeWithRetry(async () => {
      const { data: result, error } = await this.query()
        .eq('id', id)
        .update(data)
        .select()
        .single()

      if (error) {
        return this.handleError(error)
      }

      // Invalidar cache relacionado
      this.invalidateCache(this.config.tableName)
      this.invalidateCache(id)

      return { success: true, data: result }
    })
  }

  /**
   * Remove um registro
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return this.executeWithRetry(async () => {
      const { error } = await this.query()
        .eq('id', id)
        .delete()

      if (error) {
        return this.handleError(error)
      }

      // Invalidar cache relacionado
      this.invalidateCache(this.config.tableName)
      this.invalidateCache(id)

      return { success: true }
    })
  }

  /**
   * Conta registros com filtros opcionais
   */
  async count(filters?: QueryFilters): Promise<ServiceResult<number>> {
    return this.executeWithRetry(async () => {
      let query = this.query().select('*', { count: 'exact', head: true })

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        return this.handleError(error)
      }

      return { success: true, data: count || 0 }
    })
  }
}
