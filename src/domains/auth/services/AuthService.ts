import { User } from 'lucide-react'

import { BaseService, ServiceResult } from '@/shared/services/base/BaseService'
import { serviceInterceptors } from '@/shared/services/base/ServiceInterceptors'
import { ServiceError, ErrorType, ErrorSeverity } from '@/shared/services/base/ErrorHandler'
import { supabase } from '@/lib/api/supabase'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Dados de login
 */
export interface LoginData {
  email: string
  password: string
  remember?: boolean
}

/**
 * Dados de registro
 */
export interface RegisterData {
  email: string
  password: string
  nome: string
  telefone?: string
  role?: 'client' | 'barber' | 'admin'
}

/**
 * Dados de recuperação de senha
 */
export interface PasswordResetData {
  email: string
}

/**
 * Dados de atualização de senha
 */
export interface PasswordUpdateData {
  currentPassword: string
  newPassword: string
}

/**
 * Resultado de autenticação
 */
export interface AuthResult {
  user: User
  session: Session
  profile?: any
}

/**
 * Service para gerenciamento de autenticação
 * 
 * @description
 * Service especializado para operações de autenticação, incluindo
 * login, logout, registro, recuperação de senha e gerenciamento de sessão.
 * 
 * @example
 * ```typescript
 * const authService = new AuthService()
 * 
 * // Login
 * const result = await authService.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * })
 * 
 * // Registro
 * const newUser = await authService.register({
 *   email: 'new@example.com',
 *   password: 'password123',
 *   nome: 'Novo Usuário'
 * })
 * ```
 */
export class AuthService extends BaseService {
  constructor() {
    super({
      tableName: 'profiles',
      enableCache: false, // Auth não deve usar cache
      maxRetries: 2,
      retryDelay: 1000,
    })
  }

  /**
   * Realiza login do usuário
   */
  async login(loginData: LoginData): Promise<ServiceResult<AuthResult>> {
    return serviceInterceptors.execute(
      {
        method: 'login',
        operation: 'AUTH_LOGIN',
        metadata: { email: loginData.email },
      },
      async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        })

        if (error) {
          throw new ServiceError(
            'Credenciais inválidas',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            'INVALID_CREDENTIALS',
            { email: loginData.email },
            error,
            false,
            'Email ou senha incorretos. Verifique suas credenciais.'
          )
        }

        if (!data.user || !data.session) {
          throw new ServiceError(
            'Falha na autenticação',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            'AUTH_FAILED',
            { email: loginData.email },
            undefined,
            false,
            'Não foi possível realizar o login. Tente novamente.'
          )
        }

        // Buscar perfil do usuário
        const profile = await this.getUserProfile(data.user.id)

        // Verificar se usuário está ativo
        if (profile && !profile.is_active) {
          await supabase.auth.signOut()
          throw new ServiceError(
            'Usuário inativo',
            ErrorType.AUTHORIZATION,
            ErrorSeverity.HIGH,
            'USER_INACTIVE',
            { userId: data.user.id },
            undefined,
            false,
            'Sua conta está inativa. Entre em contato com o suporte.'
          )
        }

        const result: AuthResult = {
          user: data.user,
          session: data.session,
          profile,
        }

        return { success: true, data: result }
      }
    )
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<ServiceResult<void>> {
    return serviceInterceptors.execute(
      {
        method: 'logout',
        operation: 'AUTH_LOGOUT',
      },
      async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw new ServiceError(
            'Erro ao fazer logout',
            ErrorType.UNKNOWN,
            ErrorSeverity.LOW,
            'LOGOUT_ERROR',
            {},
            error,
            true,
            'Não foi possível fazer logout. Tente novamente.'
          )
        }

        return { success: true }
      }
    )
  }

  /**
   * Registra novo usuário
   */
  async register(registerData: RegisterData): Promise<ServiceResult<AuthResult>> {
    return serviceInterceptors.execute(
      {
        method: 'register',
        operation: 'AUTH_REGISTER',
        metadata: { email: registerData.email, role: registerData.role },
      },
      async () => {
        // Validar dados
        this.validateRegisterData(registerData)

        // Criar usuário no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: registerData.email,
          password: registerData.password,
          options: {
            data: {
              nome: registerData.nome,
              telefone: registerData.telefone,
              role: registerData.role || 'client',
            },
          },
        })

        if (error) {
          if (error.message.includes('already registered')) {
            throw new ServiceError(
              'Email já cadastrado',
              ErrorType.CONFLICT,
              ErrorSeverity.MEDIUM,
              'EMAIL_ALREADY_EXISTS',
              { email: registerData.email },
              error,
              false,
              'Este email já está cadastrado. Tente fazer login ou use outro email.'
            )
          }

          throw new ServiceError(
            'Erro no registro',
            ErrorType.VALIDATION,
            ErrorSeverity.MEDIUM,
            'REGISTER_ERROR',
            { email: registerData.email },
            error,
            false,
            'Não foi possível criar sua conta. Verifique os dados e tente novamente.'
          )
        }

        if (!data.user) {
          throw new ServiceError(
            'Falha no registro',
            ErrorType.UNKNOWN,
            ErrorSeverity.HIGH,
            'REGISTER_FAILED',
            { email: registerData.email },
            undefined,
            false,
            'Não foi possível criar sua conta. Tente novamente.'
          )
        }

        // Se o usuário foi criado mas precisa confirmar email
        if (!data.session) {
          return {
            success: true,
            data: {
              user: data.user,
              session: null as any,
              profile: null,
            },
          }
        }

        // Buscar perfil criado automaticamente
        const profile = await this.getUserProfile(data.user.id)

        const result: AuthResult = {
          user: data.user,
          session: data.session,
          profile,
        }

        return { success: true, data: result }
      }
    )
  }

  /**
   * Solicita recuperação de senha
   */
  async requestPasswordReset(resetData: PasswordResetData): Promise<ServiceResult<void>> {
    return serviceInterceptors.execute(
      {
        method: 'requestPasswordReset',
        operation: 'AUTH_PASSWORD_RESET',
        metadata: { email: resetData.email },
      },
      async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(resetData.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
          throw new ServiceError(
            'Erro ao solicitar recuperação',
            ErrorType.UNKNOWN,
            ErrorSeverity.MEDIUM,
            'PASSWORD_RESET_ERROR',
            { email: resetData.email },
            error,
            true,
            'Não foi possível enviar o email de recuperação. Tente novamente.'
          )
        }

        return { success: true }
      }
    )
  }

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(passwordData: PasswordUpdateData): Promise<ServiceResult<void>> {
    return serviceInterceptors.execute(
      {
        method: 'updatePassword',
        operation: 'AUTH_PASSWORD_UPDATE',
      },
      async () => {
        // Verificar senha atual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new ServiceError(
            'Usuário não autenticado',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            'USER_NOT_AUTHENTICATED',
            {},
            undefined,
            false,
            'Você precisa estar logado para alterar a senha.'
          )
        }

        // Tentar fazer login com senha atual para validar
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: passwordData.currentPassword,
        })

        if (verifyError) {
          throw new ServiceError(
            'Senha atual incorreta',
            ErrorType.VALIDATION,
            ErrorSeverity.MEDIUM,
            'CURRENT_PASSWORD_INVALID',
            {},
            verifyError,
            false,
            'A senha atual está incorreta.'
          )
        }

        // Atualizar senha
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword,
        })

        if (error) {
          throw new ServiceError(
            'Erro ao atualizar senha',
            ErrorType.UNKNOWN,
            ErrorSeverity.MEDIUM,
            'PASSWORD_UPDATE_ERROR',
            {},
            error,
            true,
            'Não foi possível atualizar a senha. Tente novamente.'
          )
        }

        return { success: true }
      }
    )
  }

  /**
   * Obtém sessão atual
   */
  async getCurrentSession(): Promise<ServiceResult<Session | null>> {
    return serviceInterceptors.execute(
      {
        method: 'getCurrentSession',
        operation: 'AUTH_GET_SESSION',
      },
      async () => {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw new ServiceError(
            'Erro ao obter sessão',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            'SESSION_ERROR',
            {},
            error,
            true,
            'Erro ao verificar sua sessão.'
          )
        }

        return { success: true, data: session }
      }
    )
  }

  /**
   * Obtém usuário atual
   */
  async getCurrentUser(): Promise<ServiceResult<User | null>> {
    return serviceInterceptors.execute(
      {
        method: 'getCurrentUser',
        operation: 'AUTH_GET_USER',
      },
      async () => {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          throw new ServiceError(
            'Erro ao obter usuário',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            'USER_ERROR',
            {},
            error,
            true,
            'Erro ao verificar seus dados.'
          )
        }

        return { success: true, data: user }
      }
    )
  }

  /**
   * Obtém perfil completo do usuário
   */
  async getCurrentUserProfile(): Promise<ServiceResult<any>> {
    return serviceInterceptors.execute(
      {
        method: 'getCurrentUserProfile',
        operation: 'SELECT',
        table: this.config.tableName,
      },
      async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new ServiceError(
            'Usuário não autenticado',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            'USER_NOT_AUTHENTICATED',
            {},
            undefined,
            false,
            'Você precisa estar logado.'
          )
        }

        const profile = await this.getUserProfile(user.id)

        if (!profile) {
          throw new ServiceError(
            'Perfil não encontrado',
            ErrorType.NOT_FOUND,
            ErrorSeverity.HIGH,
            'PROFILE_NOT_FOUND',
            { userId: user.id },
            undefined,
            false,
            'Seu perfil não foi encontrado.'
          )
        }

        return { success: true, data: profile }
      }
    )
  }

  /**
   * Verifica se usuário tem permissão
   */
  async hasPermission(permission: string): Promise<ServiceResult<boolean>> {
    return serviceInterceptors.execute(
      {
        method: 'hasPermission',
        operation: 'AUTH_CHECK_PERMISSION',
        metadata: { permission },
      },
      async () => {
        const profileResult = await this.getCurrentUserProfile()
        
        if (!profileResult.success || !profileResult.data) {
          return { success: true, data: false }
        }

        const profile = profileResult.data
        const userRole = profile.role

        // Definir permissões por role
        const permissions = {
          admin: ['*'], // Admin tem todas as permissões
          barber: [
            'appointments:read',
            'appointments:create',
            'appointments:update',
            'clients:read',
            'services:read',
            'profile:update',
          ],
          client: [
            'appointments:read:own',
            'appointments:create:own',
            'profile:update:own',
          ],
        }

        const userPermissions = permissions[userRole as keyof typeof permissions] || []
        
        // Verificar se tem a permissão específica ou todas (*)
        const hasPermission = userPermissions.includes('*') || userPermissions.includes(permission)

        return { success: true, data: hasPermission }
      }
    )
  }

  /**
   * Busca perfil do usuário por ID
   */
  private async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await this.query()
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  /**
   * Valida dados de registro
   */
  private validateRegisterData(data: RegisterData): void {
    const errors: string[] = []

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Email inválido')
    }

    // Validar senha
    if (data.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres')
    }

    // Validar nome
    if (!data.nome || data.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    // Validar telefone se fornecido
    if (data.telefone) {
      const phoneRegex = /^\(?(\d{2})\)?[\s-]?9?\d{4}[\s-]?\d{4}$/
      if (!phoneRegex.test(data.telefone)) {
        errors.push('Telefone inválido')
      }
    }

    if (errors.length > 0) {
      throw new ServiceError(
        'Dados inválidos',
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        'VALIDATION_ERROR',
        { errors },
        undefined,
        false,
        errors.join(', ')
      )
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(profileData: {
    nome?: string
    telefone?: string
    avatar_url?: string
  }): Promise<ServiceResult<any>> {
    return serviceInterceptors.execute(
      {
        method: 'updateProfile',
        operation: 'UPDATE',
        table: this.config.tableName,
      },
      async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new ServiceError(
            'Usuário não autenticado',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            'USER_NOT_AUTHENTICATED',
            {},
            undefined,
            false,
            'Você precisa estar logado.'
          )
        }

        const { data, error } = await this.query()
          .eq('id', user.id)
          .update({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        return { success: true, data }
      }
    )
  }

  /**
   * Verifica se email já existe
   */
  async emailExists(email: string): Promise<ServiceResult<boolean>> {
    return serviceInterceptors.execute(
      {
        method: 'emailExists',
        operation: 'SELECT',
        table: this.config.tableName,
        metadata: { email },
      },
      async () => {
        const { data, error } = await this.query()
          .select('id')
          .eq('email', email)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        return { success: true, data: !!data }
      }
    )
  }
}

// Instância singleton do service
export const authService = new AuthService()