'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { uploadAvatar, removeAvatar, type UploadResult } from '@/lib/storage'
import { uploadAvatarFallback, removeAvatarFallback } from '@/lib/storage-fallback'
import { authInterceptor } from '@/lib/auth-interceptor'
import { sessionManager } from '@/lib/session-manager'
import { profileSync } from '@/lib/profile-sync'

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
  
  // Ações
  signIn: (data: LoginData) => Promise<AuthResult>
  signUp: (data: SignUpData) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  resetPassword: (data: ResetPasswordData) => Promise<AuthResult>
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>
  updateProfileSimple: (updates: Partial<UserProfile>) => Promise<AuthResult>
  uploadUserAvatar: (file: File) => Promise<AuthResult>
  
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



  // Função para buscar perfil do usuário com ProfileSync e AuthInterceptor
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId) {
        console.warn('fetchUserProfile: userId não fornecido')
        return null
      }

      // Usar AuthInterceptor para operação com retry e recovery
      const result = await authInterceptor.intercept(async () => {
        const syncResult = await profileSync.syncProfile(userId)

        if (!syncResult.success) {
          throw new Error(syncResult.error || 'Erro ao sincronizar perfil')
        }

        return syncResult.profile
      }, 'fetchUserProfile')

      if (!result.success) {
        console.error('Erro ao buscar perfil com interceptor:', result.error)
        
        // Tentar recuperação manual como fallback
        const recoveredProfile = await profileSync.recoverProfile(userId)
        if (recoveredProfile) {
          console.log('✅ Perfil recuperado com fallback')
          return recoveredProfile
        }
        
        return null
      }

      return result.data || null
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', {
        error,
        userId,
        type: typeof error,
      })
      return null
    }
  }

  // Função para atualizar estado de autenticação com AuthInterceptor
  const updateAuthState = async (session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      try {
        // Usar AuthInterceptor para validar sessão com retry
        const validationResult = await authInterceptor.intercept(async () => {
          return await sessionManager.validateSession()
        }, 'validateSession')
        
        if (!validationResult.success || !validationResult.data) {
          console.warn('⚠️ Sessão inválida detectada pelo interceptor')
          setProfile(null)
          setLoading(false)
          setInitialized(true)
          return
        }

        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } catch (error) {
        console.error('❌ Erro ao atualizar estado de auth:', error)
        setProfile(null)
      }
    } else {
      setProfile(null)
    }

    setLoading(false)
    setInitialized(true)
  }

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true

    // Obter sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        }

        if (mounted) {
          await updateAuthState(session)
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error)
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
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

  // Função de login com AuthInterceptor
  const signIn = async (data: LoginData): Promise<AuthResult> => {
    try {
      setLoading(true)

      const result = await authInterceptor.wrapSupabaseOperation(
        () => supabase.auth.signInWithPassword({
          email: data.email,
          password: data.senha,
        }),
        'signIn'
      )

      if (!result.success) {
        return { success: false, error: result.error as any }
      }

      return { 
        success: true, 
        error: null, 
        user: result.data?.user,
        profile: profile 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de cadastro
  const signUp = async (data: SignUpData): Promise<AuthResult> => {
    try {
      setLoading(true)

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone,
          },
        },
      })

      if (error) {
        return { success: false, error }
      }

      return { 
        success: true, 
        error: null, 
        user: authData.user 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      }
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true)

      console.log('🔄 Iniciando logout do Supabase...')

      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Erro no logout do Supabase:', error)
        return { success: false, error }
      }

      console.log('✅ Logout do Supabase realizado com sucesso')

      // Limpar estado local imediatamente
      setUser(null)
      setProfile(null)
      setSession(null)

      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error)
      
      // Mesmo com erro, limpar estado local
      setUser(null)
      setProfile(null)
      setSession(null)
      
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
          () => supabase.auth.updateUser({ data: authUpdates }),
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
        () => supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id)
          .select()
          .single(),
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

  // Função para recarregar perfil
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)
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
    
    // Ações
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateProfileSimple,
    uploadUserAvatar,
    
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