'use client'
import { User } from 'lucide-react'


import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/api/supabase'
import { uploadAvatar, removeAvatar, type UploadResult } from '@/lib/storage'
import { uploadAvatarFallback, removeAvatarFallback } from '@/lib/storage-fallback'
import { authInterceptor } from '@/lib/api/auth-interceptor'
import { sessionManager } from '@/lib/session-manager'
import { profileSync } from '@/lib/profile-sync'
import { errorRecovery } from '@/lib/error-recovery'
import { useErrorRecovery } from '@/shared/hooks/utils/use-error-recovery'
import { securityLogger } from '@/lib/monitoring/security-logger'
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/rate-limiter-enhanced'
// Importações de otimização de performance
import { cacheManager } from '@/lib/cache-manager'
import { queryOptimizer } from '@/lib/query-optimizer'
import { connectionPool } from '@/lib/connection-pool'
// Modal de primeiro acesso
import { PrimeiroAcessoModal } from '@/domains/auth/components/PrimeiroAcessoModal'

// Interfaces para dados de autenticação
export interface LoginData {
  email: string
  senha: string
}

export interface SignUpData {
  nome: string
  email: string
  telefone: string
  senha: string
  confirmarSenha: string
}

export interface ResetPasswordData {
  email: string
}

export interface UserProfile {
  id: string
  nome: string
  email: string
  telefone?: string
  role: 'admin' | 'barber' | 'client' | 'saas_owner'
  avatar_url?: string
  pontos_fidelidade?: number
  data_nascimento?: string
  created_at: string
  updated_at: string
}

export interface AuthResult {
  success: boolean
  error?: AuthError | null
  user?: User | null
  profile?: UserProfile | null
  message?: string // Para mensagens de feedback ao usuário
}

// Helper para criar AuthError de forma consistente
function createAuthError(message: string, code?: string, status?: number): AuthError {
  const error = new Error(message) as AuthError
  error.name = 'AuthError'
  error.code = code || 'CUSTOM_ERROR'
  error.status = status || 400
  return error
}

// Interface do contexto de autenticação
export interface AuthContextType {
  // Estado
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean

  // Estado de saúde do sistema
  systemHealth: {
    isHealthy: boolean
    circuitState: string
    failureCount: number
    isInFallbackMode: boolean
    lastHealthCheck: Date | null
  }

  // Ações
  signIn: (data: LoginData) => Promise<AuthResult>
  signUp: (data: SignUpData) => Promise<AuthResult> // Cadastro público (clientes)
  createAdmin: (data: SignUpData & { barbeariaId?: string }) => Promise<AuthResult> // SaaS Owner cria admin
  createEmployee: (data: SignUpData & { barbeariaId: string }) => Promise<AuthResult> // Admin cria funcionário
  signOut: () => Promise<AuthResult>
  resetPassword: (data: ResetPasswordData) => Promise<AuthResult>
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>
  updateProfileSimple: (updates: Partial<UserProfile>) => Promise<AuthResult>
  uploadUserAvatar: (file: File) => Promise<AuthResult>

  // Ações de sistema
  performHealthCheck: () => Promise<void>
  recoverFromError: (error: Error) => Promise<boolean>
  resetSystemState: () => void

  // Helpers
  hasRole: (role: 'admin' | 'barber' | 'client' | 'saas_owner') => boolean
  hasPermission: (permission: string) => boolean
  refreshProfile: () => Promise<void>
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook para usar o contexto
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Provider do contexto de autenticação
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Estado de saúde do sistema
  const [systemHealth, setSystemHealth] = useState({
    isHealthy: true,
    circuitState: 'closed',
    failureCount: 0,
    isInFallbackMode: false,
    lastHealthCheck: null as Date | null,
  })

  // Hook de error recovery
  const errorRecoveryHook = useErrorRecovery()

  // Função simplificada para health check (não bloqueia performance)
  const performHealthCheck = async (): Promise<void> => {
    try {
      console.log('🔍 Realizando health check simplificado...')

      const health = {
        isHealthy: true,
        circuitState: 'closed',
        failureCount: 0,
        isInFallbackMode: false,
        lastHealthCheck: new Date(),
      }

      // Verificação básica e rápida
      try {
        // Apenas verificar se os serviços existem (sem chamadas custosas)
        if (typeof errorRecovery?.getCircuitState === 'function') {
          health.circuitState = errorRecovery.getCircuitState()
          health.failureCount = errorRecovery.getFailureCount()
        }
      } catch (error) {
        console.warn('⚠️ Erro no health check (não crítico):', error)
        health.isHealthy = false
      }

      setSystemHealth(health)
      console.log('✅ Health check concluído rapidamente')
    } catch (error) {
      console.warn('⚠️ Erro durante health check (ignorando):', error)
      // Não atualizar estado em caso de erro para evitar problemas
    }
  }

  // Função para recuperação de erros
  const recoverFromError = async (error: Error): Promise<boolean> => {
    try {
      console.log('🔧 AuthContext: Iniciando recovery de erro:', error.message)

      const recoveryResult = await errorRecovery.recoverFromError(error, {
        userId: user?.id,
        context: 'AuthContext',
        timestamp: Date.now(),
      })

      if (recoveryResult.success) {
        console.log('✅ Recovery bem-sucedido no AuthContext')

        // Atualizar health após recovery
        await performHealthCheck()

        // Se houve mudança na sessão, revalidar
        if (recoveryResult.strategy === 'refresh_session') {
          const currentSession = await sessionManager.getCurrentSession()
          if (currentSession) {
            await updateAuthState(currentSession)
          }
        }

        return true
      } else {
        console.log('❌ Recovery falhou no AuthContext:', recoveryResult.error)
        return false
      }
    } catch (recoveryError) {
      console.error('❌ Erro durante recovery no AuthContext:', recoveryError)
      return false
    }
  }

  // Função para resetar estado do sistema
  const resetSystemState = (): void => {
    console.log('🔄 Resetando estado do sistema de autenticação...')

    // Reset do error recovery
    errorRecovery.resetCircuit()

    // Reset do health
    setSystemHealth({
      isHealthy: true,
      circuitState: 'closed',
      failureCount: 0,
      isInFallbackMode: false,
      lastHealthCheck: new Date(),
    })

    console.log('✅ Estado do sistema resetado')
  }

  // Função otimizada para buscar perfil (sem timeout desnecessário)
  const fetchProfileDirect = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔄 Buscando perfil diretamente:', userId)

      // Query otimizada com campos específicos e timeout menor
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, role, avatar_url, pontos_fidelidade, data_nascimento, created_at, updated_at')
        .eq('id', userId)
        .single()
        .abortSignal(AbortSignal.timeout(3000)) // 3s timeout usando AbortSignal nativo

      if (error) {
        console.warn('⚠️ Erro na busca direta do perfil:', error)
        return null
      }

      if (profile) {
        console.log('✅ Perfil obtido via busca direta')
        return profile
      }

      return null
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ Timeout na busca do perfil (3s)')
      } else {
        console.error('❌ Erro na busca direta do perfil:', error)
      }
      return null
    }
  }

  // Função otimizada para buscar perfil do usuário
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId) {
        console.warn('fetchUserProfile: userId não fornecido')
        return null
      }

      console.log('🔍 Buscando perfil para usuário:', userId)

      // Verificar cache primeiro
      try {
        const cachedProfile = cacheManager.getProfile(userId)
        if (cachedProfile) {
          console.log('✅ Perfil obtido do cache')
          return cachedProfile
        }
      } catch (cacheError) {
        console.warn('⚠️ Erro ao verificar cache (continuando):', cacheError)
      }

      // Busca direta otimizada
      const directResult = await fetchProfileDirect(userId)
      if (directResult) {
        // Armazenar no cache para próximas consultas
        try {
          cacheManager.setProfile(userId, directResult)
        } catch (cacheError) {
          console.warn('⚠️ Erro ao salvar no cache (não crítico):', cacheError)
        }
        return directResult
      }

      console.warn('⚠️ Não foi possível obter perfil do usuário')
      return null
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar perfil:', {
        error: error instanceof Error ? error.message : error,
        userId,
      })
      return null
    }
  }

  // Função otimizada para atualizar estado de autenticação
  const updateAuthState = async (session: Session | null) => {
    console.log('🔄 Atualizando estado de autenticação:', {
      hasSession: !!session,
      userId: session?.user?.id,
    })

    // Atualizar estado básico imediatamente
    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      console.log('👤 Usuário encontrado na sessão, buscando perfil...')

      // Buscar perfil de forma assíncrona sem bloquear a UI
      fetchUserProfile(session.user.id)
        .then((userProfile) => {
          console.log('📋 Perfil obtido:', userProfile ? 'sucesso' : 'falhou')
          setProfile(userProfile)
        })
        .catch((error) => {
          console.error('❌ Erro ao buscar perfil:', error)
          setProfile(null)
        })

      // Health check em background (não bloqueia)
      performHealthCheck().catch((healthError) => {
        console.warn('⚠️ Erro no health check (não crítico):', healthError)
      })
    } else {
      console.log('🚫 Nenhum usuário na sessão, limpando estado...')
      setProfile(null)

      // Atualizar estado de saúde de forma simples
      setSystemHealth((prev) => ({
        ...prev,
        isHealthy: true,
        lastHealthCheck: new Date(),
      }))
    }

    // Liberar loading imediatamente para melhor UX
    setLoading(false)
    setInitialized(true)
    console.log('✅ Estado de autenticação atualizado')
  }

  // Inicializar autenticação de forma otimizada
  useEffect(() => {
    let mounted = true

    // Obter sessão inicial de forma mais rápida
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando sistema de autenticação...')

        // Usar getSession diretamente para ser mais rápido
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('⚠️ Erro ao obter sessão inicial:', error)
        }

        if (mounted) {
          await updateAuthState(session)
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da auth:', error)

        if (mounted) {
          // Em caso de erro, apenas liberar o loading
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)

      if (mounted) {
        await updateAuthState(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Health checks periódicos otimizados
  useEffect(() => {
    if (!initialized || !user) return

    // Health check inicial em background (não bloqueia)
    setTimeout(() => {
      performHealthCheck().catch(console.warn)
    }, 1000)

    // Health checks periódicos menos frequentes (5 minutos)
    const healthCheckInterval = setInterval(() => {
      if (user) {
        performHealthCheck().catch(console.warn)
      }
    }, 300000) // 5 minutos

    return () => clearInterval(healthCheckInterval)
  }, [initialized, user?.id])

  // Função de login com rate limiting e segurança
  const signIn = async (data: LoginData): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('🔐 Tentando fazer login com:', { email: data.email })

      // Verificar rate limiting
      const rateLimitResult = checkLoginRateLimit(data.email)
      if (!rateLimitResult.allowed) {
        console.warn('🚫 Login bloqueado por rate limiting:', rateLimitResult)

        securityLogger.logLoginBlocked(data.email, {
          retryAfter: rateLimitResult.retryAfter,
          requests: rateLimitResult.info.requests,
          maxRequests: rateLimitResult.info.requests,
        })

        return {
          success: false,
          error: createAuthError(
            `Muitas tentativas de login. Tente novamente em ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutos.`,
            'RATE_LIMIT_EXCEEDED',
            429
          ),
        }
      }

      // Login direto no Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      console.log('📊 Resultado do login:', {
        success: !authError,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError,
      })

      if (authError) {
        console.error('❌ Erro no login:', authError)

        // Registrar tentativa falhada no rate limiter
        recordLoginAttempt(data.email, false)

        // Log de segurança para tentativa falhada
        securityLogger.logLoginFailed(data.email, authError.message || 'Erro desconhecido', {
          errorCode: authError.status,
          timestamp: Date.now(),
        })

        // Mensagem mais clara para erro de email não confirmado
        let errorToReturn = authError
        if (authError.message?.includes('Email not confirmed')) {
          errorToReturn = createAuthError(
            'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.',
            authError.code || 'EMAIL_NOT_CONFIRMED',
            authError.status || 400
          )
        }

        return {
          success: false,
          error: errorToReturn,
        }
      }

      if (!authData?.user) {
        console.error('❌ Login sem usuário retornado')
        return {
          success: false,
          error: createAuthError('Usuário não retornado pelo login'),
        }
      }

      const user = authData.user
      console.log('✅ Login bem-sucedido para usuário:', user.id)

      // Registrar tentativa bem-sucedida no rate limiter
      recordLoginAttempt(data.email, true)

      // Buscar perfil do usuário
      let userProfile: UserProfile | null = null
      try {
        userProfile = await fetchUserProfile(user.id)
        console.log('👤 Perfil do usuário:', userProfile ? 'encontrado' : 'não encontrado')
      } catch (profileError) {
        console.warn('⚠️ Erro ao buscar perfil após login:', profileError)
      }

      // Log de segurança para login bem-sucedido
      securityLogger.logLoginSuccess(user.id, data.email, {
        userRole: userProfile?.role || user.user_metadata?.role,
        profileFound: !!userProfile,
        timestamp: Date.now(),
      })

      // Cache warming para melhor performance
      if (user && userProfile) {
        try {
          await cacheManager.warmup(user.id, {
            user,
            profile: userProfile,
            session: authData.session,
          })
          console.log('🔥 Cache aquecido para usuário:', user.id)
        } catch (cacheError) {
          console.warn('⚠️ Erro ao aquecer cache no login:', cacheError)
        }
      }

      return {
        success: true,
        error: null,
        user: user,
        profile: userProfile,
      }
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de cadastro público (apenas clientes)
  const signUp = async (data: SignUpData): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('📝 Tentando cadastrar usuário:', { email: data.email, nome: data.nome })

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone,
            role: 'client', // Definir role padrão
          },
        },
      })

      console.log('📊 Resultado do cadastro:', {
        success: !error,
        hasUser: !!authData?.user,
        needsConfirmation: !authData?.session,
        error,
      })

      if (error) {
        console.error('❌ Erro no cadastro:', error)
        return { success: false, error }
      }

      if (!authData?.user) {
        console.error('❌ Cadastro sem usuário retornado')
        return {
          success: false,
          error: createAuthError('Usuário não foi criado'),
        }
      }

      const user = authData.user
      console.log('✅ Usuário cadastrado com sucesso:', user.id)

      // Verificar se precisa de confirmação de email
      if (!authData.session) {
        console.log('� Usuárioo precisa confirmar email')
        return {
          success: true,
          error: null,
          user: authData.user,
          profile: null,
          // Adicionar mensagem específica para confirmação
          message:
            'Cadastro realizado com sucesso! Verifique seu email para confirmar a conta antes de fazer login.',
        }
      }

      // Se o usuário foi confirmado automaticamente, criar perfil
      if (authData.session && user) {
        console.log('🔄 Criando perfil para usuário confirmado...')
        try {
          // Tentar criar perfil na tabela profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              nome: data.nome,
              email: data.email,
              telefone: data.telefone,
              role: 'client',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (profileError) {
            console.warn('⚠️ Erro ao criar perfil:', profileError)
          } else {
            console.log('✅ Perfil criado com sucesso:', profileData)
          }
        } catch (profileError) {
          console.warn('⚠️ Erro inesperado ao criar perfil:', profileError)
        }
      }

      return {
        success: true,
        error: null,
        user: authData.user,
        message: 'Cadastro realizado e confirmado com sucesso!',
      }
    } catch (error) {
      console.error('❌ Erro inesperado no cadastro:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para cadastrar administrador (apenas SaaS Owner)
  const createAdmin = async (data: SignUpData & { barbeariaId?: string }): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('👨‍💼 Criando administrador:', { email: data.email, nome: data.nome })

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone,
            role: 'admin',
            barbeariaId: data.barbeariaId,
          },
        },
      })

      if (error) {
        console.error('❌ Erro ao criar admin:', error)
        return { success: false, error }
      }

      if (!authData?.user) {
        return {
          success: false,
          error: createAuthError('Administrador não foi criado'),
        }
      }

      const user = authData.user
      console.log('✅ Administrador criado com sucesso:', user.id)

      // Criar perfil de administrador
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              nome: data.nome,
              email: data.email,
              telefone: data.telefone,
              role: 'admin',
              barbearia_id: data.barbeariaId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (profileError) {
            console.warn('⚠️ Erro ao criar perfil de admin:', profileError)
          } else {
            console.log('✅ Perfil de admin criado:', profileData)
          }
        } catch (profileError) {
          console.warn('⚠️ Erro inesperado ao criar perfil de admin:', profileError)
        }
      }

      return {
        success: true,
        error: null,
        user: authData.user,
        message: 'Administrador criado com sucesso!',
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao criar admin:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para cadastrar funcionário/barbeiro (apenas Admin)
  const createEmployee = async (
    data: SignUpData & { barbeariaId: string }
  ): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('✂️ Criando funcionário:', { email: data.email, nome: data.nome })

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone,
            role: 'barber',
            barbeariaId: data.barbeariaId,
          },
        },
      })

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error)
        return { success: false, error }
      }

      if (!authData?.user) {
        return {
          success: false,
          error: createAuthError('Funcionário não foi criado'),
        }
      }

      const user = authData.user
      console.log('✅ Funcionário criado com sucesso:', user.id)

      // Criar perfil de funcionário
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              nome: data.nome,
              email: data.email,
              telefone: data.telefone,
              role: 'barber',
              barbearia_id: data.barbeariaId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (profileError) {
            console.warn('⚠️ Erro ao criar perfil de funcionário:', profileError)
          } else {
            console.log('✅ Perfil de funcionário criado:', profileData)
          }
        } catch (profileError) {
          console.warn('⚠️ Erro inesperado ao criar perfil de funcionário:', profileError)
        }
      }

      return {
        success: true,
        error: null,
        user: authData.user,
        message: 'Funcionário criado com sucesso!',
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao criar funcionário:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de logout simplificada que limpa apenas o estado local
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('🔄 AuthContext: Limpando estado local...')

      const currentUserId = user?.id

      // Limpar estado local IMEDIATAMENTE
      setUser(null)
      setProfile(null)
      setSession(null)

      // Log de segurança (sem bloquear o logout)
      try {
        if (currentUserId && profile?.email) {
          securityLogger.logLogout(currentUserId, profile.email, {
            userRole: profile.role,
            timestamp: Date.now(),
          })
        }
      } catch (logError) {
        console.warn('⚠️ Erro no log de segurança (não crítico):', logError)
      }

      // Limpar cache (sem bloquear o logout)
      try {
        if (currentUserId) {
          cacheManager.invalidateUserData(currentUserId)
          queryOptimizer.invalidateUserCache(currentUserId)
          console.log('🧹 Cache do usuário limpo')
        }
      } catch (cacheError) {
        console.warn('⚠️ Erro ao limpar cache (não crítico):', cacheError)
      }

      // Reset do sistema (sem bloquear)
      try {
        resetSystemState()
      } catch (resetError) {
        console.warn('⚠️ Erro no reset do sistema (não crítico):', resetError)
      }

      console.log('✅ AuthContext: Estado local limpo')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Erro no AuthContext signOut:', error)

      // SEMPRE limpar estado local, mesmo com erro
      setUser(null)
      setProfile(null)
      setSession(null)

      // Tentar reset mesmo com erro
      try {
        resetSystemState()
      } catch (resetError) {
        console.warn('⚠️ Erro no reset após falha:', resetError)
      }

      // Retornar sucesso mesmo com erro (logout local funcionou)
      return { success: true, error: null }
    } finally {
      setLoading(false)
    }
  }

  // Função de recuperação de senha
  const resetPassword = async (data: ResetPasswordData): Promise<AuthResult> => {
    try {
      console.log('🔄 Iniciando reset de senha para:', data.email)
      console.log('🌐 URL de redirect:', `${window.location.origin}/auth/reset-password`)
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      console.log('📊 Resultado do resetPasswordForEmail:', { error })

      if (error) {
        console.error('❌ Erro no reset:', error)
        return { success: false, error }
      }

      console.log('✅ Reset enviado com sucesso')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Erro inesperado no reset:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    }
  }

  // Função para atualizar perfil com AuthInterceptor
  const updateProfile = async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    try {
      if (!user) {
        console.error('❌ Tentativa de atualizar perfil sem usuário autenticado')
        return {
          success: false,
          error: createAuthError('Usuário não autenticado', 'UNAUTHENTICATED', 401),
        }
      }

      console.log('🔄 Atualizando perfil:', { userId: user.id, updates })
      setLoading(true)

      // Atualizar no Supabase Auth se necessário com interceptor
      const authUpdates: any = {}
      if (updates.nome) authUpdates.nome = updates.nome
      if (updates.telefone !== undefined) authUpdates.telefone = updates.telefone

      if (Object.keys(authUpdates).length > 0) {
        console.log('🔄 Atualizando dados do auth:', authUpdates)
        const authResult = await authInterceptor.wrapSupabaseOperation(async () => {
          const response = await supabase.auth.updateUser({ data: authUpdates })
          return { data: response.data, error: response.error }
        }, 'updateUserAuth')

        if (!authResult.success) {
          console.error('❌ Erro ao atualizar auth:', authResult.error)
          return { success: false, error: authResult.error as any }
        }
        console.log('✅ Auth atualizado com sucesso')
      }

      // Preparar dados para atualização na tabela profiles
      const profileUpdates = { ...updates }

      // Adicionar timestamp de atualização
      profileUpdates.updated_at = new Date().toISOString()

      console.log('🔄 Atualizando tabela profiles:', profileUpdates)

      // Atualizar na tabela profiles com interceptor
      const profileResult = await authInterceptor.wrapSupabaseOperation(async () => {
        const response = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id)
          .select()
          .single()
        return { data: response.data, error: response.error }
      }, 'updateProfile')

      if (!profileResult.success) {
        console.error('❌ Erro ao atualizar profiles:', profileResult.error)
        return { success: false, error: profileResult.error as any }
      }

      console.log('✅ Perfil atualizado na tabela:', profileResult.data)

      // Atualizar estado local
      setProfile(profileResult.data as UserProfile)

      return {
        success: true,
        error: null,
        profile: profileResult.data as UserProfile,
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar perfil:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função simplificada para atualizar perfil sem interceptor (evita loops)
  const updateProfileSimple = async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    try {
      if (!user) {
        console.error('❌ Tentativa de atualizar perfil sem usuário autenticado')
        return {
          success: false,
          error: createAuthError('Usuário não autenticado', 'UNAUTHENTICATED', 401),
        }
      }

      console.log('🔄 Atualizando perfil (simples):', { userId: user.id, updates })
      setLoading(true)

      // Atualizar diretamente na tabela profiles sem interceptor
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar profiles:', error)
        return { success: false, error: error as any }
      }

      console.log('✅ Perfil atualizado na tabela:', data)

      // Atualizar estado local
      setProfile(data as UserProfile)

      return {
        success: true,
        error: null,
        profile: data as UserProfile,
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar perfil:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para fazer upload de avatar
  const uploadUserAvatar = async (file: File): Promise<AuthResult> => {
    try {
      if (!user) {
        console.error('❌ Tentativa de upload sem usuário autenticado')
        return {
          success: false,
          error: createAuthError('Usuário não autenticado', 'UNAUTHENTICATED', 401),
        }
      }

      console.log('🔄 Iniciando upload de avatar:', {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      setLoading(true)

      // Remover avatar antigo se existir
      if (profile?.avatar_url) {
        console.log('🗑️ Removendo avatar antigo:', profile.avatar_url)
        try {
          await removeAvatar(profile.avatar_url)
          console.log('✅ Avatar antigo removido')
        } catch (removeError) {
          console.warn('⚠️ Erro ao remover avatar antigo (continuando):', removeError)
        }
      }

      // Fazer upload do novo avatar
      console.log('📤 Fazendo upload do novo avatar...')
      let uploadResult: UploadResult = await uploadAvatar(user.id, file)

      // Se falhar, tentar fallback
      if (!uploadResult.success) {
        console.log('⚠️ Upload principal falhou, tentando fallback...')
        uploadResult = await uploadAvatarFallback(user.id, file)
      }

      if (!uploadResult.success) {
        console.error('❌ Erro no upload (incluindo fallback):', uploadResult.error)
        return {
          success: false,
          error: createAuthError(uploadResult.error || 'Erro no upload', 'UPLOAD_ERROR', 500),
        }
      }

      console.log('✅ Upload realizado com sucesso:', uploadResult.url)

      // Atualizar perfil com nova URL do avatar
      console.log('🔄 Atualizando perfil com nova URL do avatar...')
      const updateResult = await updateProfile({
        avatar_url: uploadResult.url,
      })

      if (updateResult.success) {
        console.log('✅ Avatar atualizado no perfil com sucesso')
      } else {
        console.error('❌ Erro ao atualizar perfil com nova URL:', updateResult.error)
      }

      return updateResult
    } catch (error) {
      console.error('❌ Erro inesperado no upload de avatar:', error)
      return {
        success: false,
        error: error as AuthError,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para recarregar perfil com cache
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      // Invalidar cache do perfil antes de recarregar (se disponível)
      if (cacheManager) {
        try {
          cacheManager.invalidateProfile(user.id)
        } catch (error) {
          console.warn('⚠️ Erro ao invalidar cache:', error)
        }
      }

      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)

      // Atualizar cache com novo perfil (se disponível)
      if (userProfile && cacheManager) {
        try {
          cacheManager.setProfile(user.id, userProfile)
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar cache:', error)
        }
      }
    }
  }

  // Helper para verificar role
  const hasRole = (role: 'admin' | 'barber' | 'client' | 'saas_owner'): boolean => {
    if (!profile) return false
    return profile.role === role
  }

  // Helper para verificar permissões
  const hasPermission = (permission: string): boolean => {
    if (!profile) return false

    // Importar mapeamento de permissões
    const rolePermissions: Record<string, string[]> = {
      saas_owner: ['*'], // SaaS Owner tem todas as permissões
      admin: [
        // Usuários
        'manage_users',
        'view_users',
        'create_users',
        'edit_users',
        'delete_users',
        // Funcionários
        'manage_employees',
        'view_employees',
        'create_employees',
        'edit_employees',
        'delete_employees',
        // Serviços
        'manage_services',
        'view_services',
        'create_services',
        'edit_services',
        'delete_services',
        // Agendamentos
        'manage_all_appointments',
        'view_all_appointments',
        'create_appointments',
        'cancel_appointments',
        // Financeiro
        'view_financial',
        'manage_financial',
        'view_all_financial',
        'manage_transactions',
        'view_reports',
        'export_data',
        // Configurações
        'manage_settings',
        'view_settings',
        // Sistema
        'manage_roles',
      ],
      barber: [
        // Usuários (limitado)
        'view_users',
        // Serviços (visualização)
        'view_services',
        // Agendamentos (próprios e visualização)
        'view_all_appointments',
        'manage_own_appointments',
        'create_appointments',
        // Financeiro (próprio)
        'view_financial',
        'view_own_financial',
        'view_reports',
        // Configurações (limitado)
        'view_settings',
      ],
      client: [
        // Agendamentos (próprios)
        'view_own_appointments',
        'create_appointments',
        'cancel_appointments',
        // Serviços (visualização)
        'view_services',
        // Configurações (próprias)
        'view_settings',
      ],
    }

    const userPermissions = rolePermissions[profile.role] || []
    return userPermissions.includes('*') || userPermissions.includes(permission)
  }

  const value: AuthContextType = {
    // Estado
    user,
    profile,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,

    // Estado de saúde do sistema
    systemHealth,

    // Ações
    signIn,
    signUp, // Cadastro público (clientes)
    createAdmin, // SaaS Owner cria admin
    createEmployee, // Admin cria funcionário
    signOut,
    resetPassword,
    updateProfile,
    updateProfileSimple,
    uploadUserAvatar,

    // Ações de sistema
    performHealthCheck,
    recoverFromError,
    resetSystemState,

    // Helpers
    hasRole,
    hasPermission,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Modal de primeiro acesso para clientes cadastrados automaticamente */}
      <PrimeiroAcessoModal />
    </AuthContext.Provider>
  )
}
