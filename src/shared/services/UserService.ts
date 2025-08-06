import { BaseService, ServiceResult, ServiceListResult } from './base/BaseService'
import { serviceInterceptors } from './base/ServiceInterceptors'
import { ServiceError, ErrorType, ErrorSeverity } from './base/ErrorHandler'

/**
 * Interface do usuário
 */
export interface User {
  id: string
  email: string
  nome: string
  telefone?: string
  role: 'admin' | 'barber' | 'client'
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Dados para criação de usuário
 */
export interface CreateUserData {
  email: string
  nome: string
  telefone?: string
  role: 'admin' | 'barber' | 'client'
  avatar_url?: string
}

/**
 * Dados para atualização de usuário
 */
export interface UpdateUserData {
  nome?: string
  telefone?: string
  avatar_url?: string
  is_active?: boolean
}

/**
 * Filtros para busca de usuários
 */
export interface UserFilters {
  role?: 'admin' | 'barber' | 'client'
  is_active?: boolean
  search?: string
}

/**
 * Service para gerenciamento de usuários
 * 
 * @description
 * Service especializado para operações com usuários, estendendo
 * a funcionalidade base com métodos específicos do domínio.
 * 
 * @example
 * ```typescript
 * const userService = new UserService()
 * 
 * // Buscar usuário por email
 * const user = await userService.findByEmail('user@example.com')
 * 
 * // Criar novo usuário
 * const newUser = await userService.create({
 *   email: 'new@example.com',
 *   nome: 'Novo Usuário',
 *   role: 'client'
 * })
 * 
 * // Buscar usuários ativos
 * const activeUsers = await userService.findActiveUsers()
 * ```
 */
export class UserService extends BaseService<User> {
  constructor() {
    super({
      tableName: 'profiles',
      enableCache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutos
      maxRetries: 3,
      retryDelay: 1000,
    })
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<ServiceResult<User>> {
    const cacheKey = `user:email:${email}`
    const cached = this.getFromCache<User>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findByEmail',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { email },
      },
      async () => {
        const { data, error } = await this.query()
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new ServiceError(
              'Usuário não encontrado',
              ErrorType.NOT_FOUND,
              ErrorSeverity.LOW,
              'USER_NOT_FOUND',
              { email },
              error,
              false,
              'Usuário não encontrado com este email.'
            )
          }
          throw error
        }

        this.setCache(cacheKey, data)
        return { success: true, data }
      }
    )
  }

  /**
   * Busca usuários ativos
   */
  async findActiveUsers(role?: User['role']): Promise<ServiceListResult<User>> {
    const cacheKey = `users:active:${role || 'all'}`
    const cached = this.getFromCache<User[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findActiveUsers',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { role },
      },
      async () => {
        let query = this.query()
          .select('*')
          .eq('is_active', true)
          .order('nome')

        if (role) {
          query = query.eq('role', role)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        this.setCache(cacheKey, data)
        return { 
          success: true, 
          data: data || [],
          count: data?.length || 0 
        }
      }
    )
  }

  /**
   * Busca usuários com filtros avançados
   */
  async findWithFilters(filters: UserFilters): Promise<ServiceListResult<User>> {
    return serviceInterceptors.execute(
      {
        method: 'findWithFilters',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { filters },
      },
      async () => {
        let query = this.query().select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters.role) {
          query = query.eq('role', filters.role)
        }

        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active)
        }

        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        query = query.order('nome')

        const { data, error, count } = await query

        if (error) {
          throw error
        }

        return {
          success: true,
          data: data || [],
          count: count || 0,
        }
      }
    )
  }

  /**
   * Cria um novo usuário
   */
  async create(userData: CreateUserData): Promise<ServiceResult<User>> {
    return serviceInterceptors.execute(
      {
        method: 'create',
        table: this.config.tableName,
        operation: 'INSERT',
        metadata: { email: userData.email, role: userData.role },
      },
      async () => {
        // Validar se email já existe
        const existingUser = await this.findByEmail(userData.email)
        if (existingUser.success && existingUser.data) {
          throw new ServiceError(
            'Email já está em uso',
            ErrorType.CONFLICT,
            ErrorSeverity.MEDIUM,
            'EMAIL_ALREADY_EXISTS',
            { email: userData.email },
            undefined,
            false,
            'Este email já está sendo usado por outro usuário.'
          )
        }

        // Criar usuário
        const { data, error } = await this.query()
          .insert({
            ...userData,
            is_active: true,
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') { // unique_violation
            throw new ServiceError(
              'Email já está em uso',
              ErrorType.CONFLICT,
              ErrorSeverity.MEDIUM,
              'EMAIL_ALREADY_EXISTS',
              { email: userData.email },
              error,
              false,
              'Este email já está sendo usado por outro usuário.'
            )
          }
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('users:active')
        this.invalidateCache(`user:email:${userData.email}`)

        return { success: true, data }
      }
    )
  }

  /**
   * Atualiza um usuário existente
   */
  async update(id: string, userData: UpdateUserData): Promise<ServiceResult<User>> {
    return serviceInterceptors.execute(
      {
        method: 'update',
        table: this.config.tableName,
        operation: 'UPDATE',
        metadata: { userId: id },
      },
      async () => {
        const { data, error } = await this.query()
          .eq('id', id)
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new ServiceError(
              'Usuário não encontrado',
              ErrorType.NOT_FOUND,
              ErrorSeverity.LOW,
              'USER_NOT_FOUND',
              { userId: id },
              error,
              false,
              'Usuário não encontrado.'
            )
          }
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('users:active')
        this.invalidateCache(`user:email:${data.email}`)
        this.invalidateCache(id)

        return { success: true, data }
      }
    )
  }

  /**
   * Desativa um usuário (soft delete)
   */
  async deactivate(id: string): Promise<ServiceResult<User>> {
    return this.update(id, { is_active: false })
  }

  /**
   * Reativa um usuário
   */
  async activate(id: string): Promise<ServiceResult<User>> {
    return this.update(id, { is_active: true })
  }

  /**
   * Busca usuários por role
   */
  async findByRole(role: User['role']): Promise<ServiceListResult<User>> {
    return this.findActiveUsers(role)
  }

  /**
   * Conta usuários por role
   */
  async countByRole(): Promise<ServiceResult<Record<User['role'], number>>> {
    return serviceInterceptors.execute(
      {
        method: 'countByRole',
        table: this.config.tableName,
        operation: 'SELECT',
      },
      async () => {
        const { data, error } = await this.query()
          .select('role')
          .eq('is_active', true)

        if (error) {
          throw error
        }

        const counts = (data || []).reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as Record<User['role'], number>)

        // Garantir que todas as roles tenham um valor
        const result = {
          admin: counts.admin || 0,
          barber: counts.barber || 0,
          client: counts.client || 0,
        }

        return { success: true, data: result }
      }
    )
  }

  /**
   * Busca usuários recentemente criados
   */
  async findRecentUsers(days = 7): Promise<ServiceListResult<User>> {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    return serviceInterceptors.execute(
      {
        method: 'findRecentUsers',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { days },
      },
      async () => {
        const { data, error } = await this.query()
          .select('*')
          .gte('created_at', dateThreshold.toISOString())
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return {
          success: true,
          data: data || [],
          count: data?.length || 0,
        }
      }
    )
  }
}

// Instância singleton do service
export const userService = new UserService()
