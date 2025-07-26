'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { uploadAvatar, removeAvatar, type UploadResult } from '@/lib/storage'
import { uploadAvatarFallback, removeAvatarFallback } from '@/lib/storage-fallback'
import { authInterceptor } from '@/lib/auth-interceptor'
import { sessionManager } from '@/lib/session-manager'
import { profileSync } from '@/lib/profile-sync'
import { errorRecovery } from '@/lib/error-recovery'
import { useErrorRecovery } from '@/hooks/use-error-recovery'
// Importações com verificação de disponibilidade
let cacheManager: any = null
let queryOptimizer: any = null
let connectionPool: any = null

try {
  const cacheModule = require('@/lib/cache-manager')
  cacheManager = cacheModule.cacheManager
} catch (error) {
  console.warn('⚠️ CacheManager não disponível:', error)
}

try {
  const queryModule = require('@/lib/query-optimizer')
  queryOptimizer = queryModule.queryOptimizer
} catch (error) {
  console.warn('⚠️ QueryOptimizer não disponível:', error)
}

try {
  const poolModule = require('@/lib/connection-pool')
  connectionPool = poolModule.connectionPool
} catch (error) {
  console.warn('⚠️ ConnectionPool não disponível:', error)
}

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
  role: 'admin' | 'barber' | 'client'
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

// Interface do contexto de autenticação
interface AuthContextType {
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
  signUp: (data: SignUpData) => Promise<AuthResult>
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
  hasRole: (role: 'admin' | 'barber' | 'client') => boolean
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
    lastHealthCheck: null as Date | null
  })

  // Hook de error recovery
  const errorRecoveryHook = useErrorRecovery()



  // Função para realizar health check do sistema
  const performHealthCheck = async (): Promise<void> => {
    try {
      console.log('🔍 Realizando health check do sistema de autenticação...')

      const health = {
        isHealthy: true,
        circuitState: 'closed',
        failureCount: 0,
        isInFallbackMode: false,
        lastHealthCheck: new Date()
      }

      // Verificar errorRecovery com try-catch
      try {
        health.circuitState = errorRecovery.getCircuitState()
        health.failureCount = errorRecovery.getFailureCount()
        health.isInFallbackMode = errorRecovery.isInFallbackMode()

        // Verificar se há problemas críticos
        if (health.circuitState === 'open' || health.failureCount > 5) {
          health.isHealthy = false
        }
      } catch (errorRecoveryError) {
        console.warn('⚠️ Erro ao verificar errorRecovery:', errorRecoveryError)
        health.isHealthy = false
      }

      // Verificar se a sessão atual é válida (com timeout)
      if (session) {
        try {
          const sessionCheckPromise = sessionManager.validateSession()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session validation timeout')), 5000)
          )

          const isSessionValid = await Promise.race([sessionCheckPromise, timeoutPromise])
          if (!isSessionValid) {
            health.isHealthy = false
            console.warn('⚠️ Health check: Sessão inválida detectada')
          }
        } catch (error) {
          health.isHealthy = false
          console.warn('⚠️ Health check: Erro ao validar sessão:', error)
        }
      }

      setSystemHealth(health)
      console.log('✅ Health check concluído:', health)
    } catch (error) {
      console.error('❌ Erro durante health check:', error)
      setSystemHealth(prev => ({
        ...prev,
        isHealthy: false,
        lastHealthCheck: new Date()
      }))
    }
  }

  // Função para recuperação de erros
  const recoverFromError = async (error: Error): Promise<boolean> => {
    try {
      console.log('🔧 AuthContext: Iniciando recovery de erro:', error.message)

      const recoveryResult = await errorRecovery.recoverFromError(error, {
        userId: user?.id,
        context: 'AuthContext',
        timestamp: Date.now()
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
      lastHealthCheck: new Date()
    })

    console.log('✅ Estado do sistema resetado')
  }

  // Função para buscar perfil do usuário com cache, ProfileSync e AuthInterceptor
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId) {
        console.warn('fetchUserProfile: userId não fornecido')
        return null
      }

      // Verificar cache primeiro (se disponível)
      if (cacheManager) {
        try {
          const cachedProfile = cacheManager.getProfile(userId)
          if (cachedProfile) {
            console.log('✅ Perfil obtido do cache')
            return cachedProfile
          }
        } catch (cacheError) {
          console.warn('⚠️ Erro ao acessar cache, continuando sem cache:', cacheError)
        }
      }

      // Tentar query direta primeiro (mais simples e confiável)
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.warn('⚠️ Erro na query direta do perfil:', error)
        } else if (profile) {
          console.log('✅ Perfil obtido via query direta')

          // Tentar armazenar no cache (se disponível)
          if (cacheManager) {
            try {
              cacheManager.setProfile(userId, profile)
            } catch (cacheError) {
              console.warn('⚠️ Erro ao armazenar no cache:', cacheError)
            }
          }

          return profile
        }
      } catch (directQueryError) {
        console.warn('⚠️ Erro na query direta:', directQueryError)
      }

      // Fallback: usar ProfileSync
      try {
        const syncResult = await profileSync.syncProfile(userId)
        if (syncResult.success && syncResult.profile) {
          console.log('✅ Perfil obtido via ProfileSync')

          // Tentar armazenar no cache (se disponível)
          if (cacheManager) {
            try {
              cacheManager.setProfile(userId, syncResult.profile)
            } catch (cacheError) {
              console.warn('⚠️ Erro ao armazenar no cache:', cacheError)
            }
          }

          return syncResult.profile
        }
      } catch (syncError) {
        console.warn('⚠️ Erro no ProfileSync:', syncError)
      }

      // Último fallback: tentar recuperação
      try {
        const recoveredProfile = await profileSync.recoverProfile(userId)
        if (recoveredProfile) {
          console.log('✅ Perfil recuperado com fallback')
          return recoveredProfile
        }
      } catch (recoveryError) {
        console.warn('⚠️ Erro na recuperação:', recoveryError)
      }

      console.warn('⚠️ Não foi possível obter perfil para o usuário:', userId)
      return null

    } catch (error) {
      console.error('❌ Erro inesperado ao buscar perfil:', {
        error: error instanceof Error ? error.message : error,
        userId,
      })
      return null
    }
  }

  // Função para atualizar estado de autenticação (simplificada para debug)
  const updateAuthState = async (session: Session | null) => {
    console.log('🔄 Atualizando estado de autenticação:', {
      hasSession: !!session,
      userId: session?.user?.id
    })

    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      console.log('👤 Usuário encontrado na sessão, buscando perfil...')

      try {
        // Buscar perfil diretamente (sem SessionManager para debug)
        const userProfile = await fetchUserProfile(session.user.id)
        console.log('📋 Perfil obtido:', userProfile ? 'sucesso' : 'falhou')
        setProfile(userProfile)

        // Health check opcional
        try {
          await performHealthCheck()
        } catch (healthError) {
          console.warn('⚠️ Erro no health check (não crítico):', healthError)
        }

      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error)
        setProfile(null)
      }
    } else {
      console.log('🚫 Nenhum usuário na sessão, limpando estado...')
      setProfile(null)

      // Limpar estado de saúde quando não há sessão
      setSystemHealth(prev => ({
        ...prev,
        isHealthy: true,
        lastHealthCheck: new Date()
      }))
    }

    setLoading(false)
    setInitialized(true)
    console.log('✅ Estado de autenticação atualizado')
  }

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true

    // Obter sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando sistema de autenticação...')

        // Usar SessionManager para obter sessão inicial
        const session = await sessionManager.getCurrentSession()

        if (mounted) {
          await updateAuthState(session)
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da auth:', error)

        if (mounted) {
          // Tentar recovery na inicialização
          const recoverySuccess = await recoverFromError(error as Error)

          if (!recoverySuccess) {
            setLoading(false)
            setInitialized(true)
          }
        }
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)

        if (mounted) {
          await updateAuthState(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Health checks periódicos
  useEffect(() => {
    if (!initialized) return

    // Health check inicial
    performHealthCheck()

    // Health checks periódicos a cada 2 minutos
    const healthCheckInterval = setInterval(() => {
      if (user) {
        performHealthCheck()
      }
    }, 120000) // 2 minutos

    return () => clearInterval(healthCheckInterval)
  }, [initialized, user?.id]) // Usar user.id em vez de user completo

  // Função de login simplificada para debug
  const signIn = async (data: LoginData): Promise<AuthResult> => {
    try {
      setLoading(true)
      console.log('🔐 Tentando fazer login com:', { email: data.email })

      // Login direto no Supabase sem interceptor para debug
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      console.log('📊 Resultado do login:', {
        success: !authError,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError
      })

      if (authError) {
        console.error('❌ Erro no login:', authError)

        // Mensagem mais clara para erro de email não confirmado
        let errorMessage = authError.message
        if (authError.message?.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.'
        }

        return {
          success: false,
          error: { ...authError, message: errorMessage }
        }
      }

      if (!authData?.user) {
        console.error('❌ Login sem usuário retornado')
        return {
          success: false,
          error: { message: 'Usuário não retornado pelo login' } as AuthError
        }
      }

      const user = authData.user
      console.log('✅ Login bem-sucedido para usuário:', user.id)

      // Buscar perfil do usuário
      let userProfile: UserProfile | null = null
      try {
        userProfile = await fetchUserProfile(user.id)
        console.log('👤 Perfil do usuário:', userProfile ? 'encontrado' : 'não encontrado')
      } catch (profileError) {
        console.warn('⚠️ Erro ao buscar perfil após login:', profileError)
      }

      // Cache opcional (se disponível)
      if (cacheManager && user) {
        try {
          await cacheManager.warmup(user.id, { user })
        } catch (cacheError) {
          console.warn('⚠️ Erro ao gerenciar cache no login:', cacheError)
        }
      }

      return {
        success: true,
        error: null,
        user: user,
        profile: userProfile
      }

    } catch (error) {
      console.error('❌ Erro inesperado no login:', error)
      return {
        success: false,
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de cadastro com criação de perfil
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
            role: 'client' // Definir role padrão
          },
        },
      })

      console.log('📊 Resultado do cadastro:', {
        success: !error,
        hasUser: !!authData?.user,
        needsConfirmation: !authData?.session,
        error
      })

      if (error) {
        console.error('❌ Erro no cadastro:', error)
        return { success: false, error }
      }

      if (!authData?.user) {
        console.error('❌ Cadastro sem usuário retornado')
        return {
          success: false,
          error: { message: 'Usuário não foi criado' } as AuthError
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
          message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar a conta antes de fazer login.'
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
              updated_at: new Date().toISOString()
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
        message: 'Cadastro realizado e confirmado com sucesso!'
      }
    } catch (error) {
      console.error('❌ Erro inesperado no cadastro:', error)
      return {
        success: false,
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de logout usando SessionManager e limpeza de cache
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true)

      console.log('🔄 Iniciando logout usando SessionManager...')

      const currentUserId = user?.id

      // Usar SessionManager para logout robusto
      const logoutSuccess = await sessionManager.signOut()

      if (!logoutSuccess) {
        console.error('❌ Erro no logout via SessionManager')

        // Fallback: tentar logout direto no Supabase
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('❌ Erro no logout fallback:', error)
          return { success: false, error }
        }
      }

      console.log('✅ Logout realizado com sucesso')

      // Limpar cache do usuário (se disponível)
      if (currentUserId) {
        if (cacheManager) {
          try {
            cacheManager.invalidateUser(currentUserId)
          } catch (cacheError) {
            console.warn('⚠️ Erro ao invalidar cache no logout:', cacheError)
          }
        }

        if (queryOptimizer) {
          try {
            queryOptimizer.invalidateUserCache(currentUserId)
          } catch (queryError) {
            console.warn('⚠️ Erro ao invalidar query cache no logout:', queryError)
          }
        }
      }

      // Limpar estado local imediatamente
      setUser(null)
      setProfile(null)
      setSession(null)

      // Reset do sistema
      resetSystemState()

      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error)

      // Mesmo com erro, limpar estado local
      setUser(null)
      setProfile(null)
      setSession(null)
      resetSystemState()

      return {
        success: false,
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de recuperação de senha
  const resetPassword = async (data: ResetPasswordData): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error as AuthError
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
          error: { message: 'Usuário não autenticado' } as AuthError
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
        const authResult = await authInterceptor.wrapSupabaseOperation(
          async () => {
            const response = await supabase.auth.updateUser({ data: authUpdates })
            return { data: response.data, error: response.error }
          },
          'updateUserAuth'
        )

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
      const profileResult = await authInterceptor.wrapSupabaseOperation(
        async () => {
          const response = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id)
            .select()
            .single()
          return { data: response.data, error: response.error }
        },
        'updateProfile'
      )

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
        profile: profileResult.data as UserProfile
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar perfil:', error)
      return {
        success: false,
        error: error as AuthError
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
          error: { message: 'Usuário não autenticado' } as AuthError
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
        profile: data as UserProfile
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar perfil:', error)
      return {
        success: false,
        error: error as AuthError
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
          error: { message: 'Usuário não autenticado' } as AuthError
        }
      }

      console.log('🔄 Iniciando upload de avatar:', {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
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
          error: { message: uploadResult.error || 'Erro no upload' } as AuthError
        }
      }

      console.log('✅ Upload realizado com sucesso:', uploadResult.url)

      // Atualizar perfil com nova URL do avatar
      console.log('🔄 Atualizando perfil com nova URL do avatar...')
      const updateResult = await updateProfile({
        avatar_url: uploadResult.url
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
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para recarregar perfil com cache
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      // Invalidar cache do perfil antes de recarregar
      cacheManager.invalidateProfile(user.id)

      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)

      // Atualizar cache com novo perfil
      if (userProfile) {
        cacheManager.setProfile(user.id, userProfile)
      }
    }
  }

  // Helper para verificar role
  const hasRole = (role: 'admin' | 'barber' | 'client'): boolean => {
    return profile?.role === role
  }

  // Helper para verificar permissões
  const hasPermission = (permission: string): boolean => {
    if (!profile) return false

    // Definir permissões por role
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // Admin tem todas as permissões
      barber: [
        'view_appointments',
        'manage_own_appointments',
        'view_clients',
        'view_services',
        'view_financial'
      ],
      client: [
        'view_own_appointments',
        'create_appointments',
        'cancel_own_appointments',
        'view_own_profile',
        'update_own_profile'
      ]
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
    signUp,
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
    </AuthContext.Provider>
  )
}