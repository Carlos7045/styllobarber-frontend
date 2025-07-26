'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { uploadAvatar, removeAvatar, type UploadResult } from '@/lib/storage'

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

  // Função de teste para debugging
  const testProfileAccess = async (userId: string) => {
    console.log('🔍 Testando acesso ao perfil para userId:', userId)
    
    try {
      // Teste 1: Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Usuário autenticado:', {
        userId: user?.id,
        email: user?.email,
        authError: authError,
        sessionUserId: userId,
        idsMatch: user?.id === userId
      })
      
      // Teste 2: Verificar auth.uid() diretamente
      const { data: authUidTest, error: authUidError } = await supabase
        .rpc('get_current_user_id')
        .single()
      
      console.log('🔑 Teste auth.uid():', { data: authUidTest, error: authUidError })
      
      // Teste 3: Tentar buscar sem filtro (para testar RLS)
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('id, nome, email, role')
        .limit(1)
      
      console.log('📋 Teste busca geral (RLS):', { 
        data: allProfiles, 
        error: allError,
        count: allProfiles?.length || 0
      })
      
      // Teste 4: Buscar perfil específico
      const { data: specificProfile, error: specificError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('🎯 Teste busca específica:', { 
        data: specificProfile, 
        error: specificError,
        errorCode: specificError?.code,
        errorMessage: specificError?.message
      })
      
      // Teste 5: Verificar se o perfil existe na tabela
      const { data: profileExists, error: existsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      
      console.log('📍 Teste existência do perfil:', { 
        exists: !!profileExists, 
        error: existsError 
      })
      
    } catch (error) {
      console.error('❌ Erro no teste de acesso:', error)
    }
  }

  // Função para buscar perfil do usuário
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId) {
        console.warn('fetchUserProfile: userId não fornecido')
        return null
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil do Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId,
          errorObject: error,
        })
        
        // Log adicional para debugging
        console.log('Detalhes completos do erro:', JSON.stringify(error, null, 2))
        
        return null
      }

      if (!data) {
        console.warn('Perfil não encontrado para userId:', userId)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', {
        error,
        userId,
        type: typeof error,
      })
      return null
    }
  }

  // Função para atualizar estado de autenticação
  const updateAuthState = async (session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      // Executar teste de debugging
      await testProfileAccess(session.user.id)
      
      const userProfile = await fetchUserProfile(session.user.id)
      setProfile(userProfile)
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

  // Função de login
  const signIn = async (data: LoginData): Promise<AuthResult> => {
    try {
      setLoading(true)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      if (error) {
        return { success: false, error }
      }

      return { 
        success: true, 
        error: null, 
        user: authData.user,
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

  // Função para atualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    try {
      if (!user) {
        return { 
          success: false, 
          error: { message: 'Usuário não autenticado' } as AuthError 
        }
      }

      setLoading(true)

      // Atualizar no Supabase Auth se necessário
      const authUpdates: any = {}
      if (updates.nome) authUpdates.nome = updates.nome
      if (updates.telefone) authUpdates.telefone = updates.telefone

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates,
        })

        if (authError) {
          return { success: false, error: authError }
        }
      }

      // Atualizar na tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error as any }
      }

      // Atualizar estado local
      setProfile(data as UserProfile)

      return { 
        success: true, 
        error: null, 
        profile: data as UserProfile 
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

  // Função para fazer upload de avatar
  const uploadUserAvatar = async (file: File): Promise<AuthResult> => {
    try {
      if (!user) {
        return { 
          success: false, 
          error: { message: 'Usuário não autenticado' } as AuthError 
        }
      }

      setLoading(true)

      // Remover avatar antigo se existir
      if (profile?.avatar_url) {
        await removeAvatar(profile.avatar_url)
      }

      // Fazer upload do novo avatar
      const uploadResult: UploadResult = await uploadAvatar(user.id, file)

      if (!uploadResult.success) {
        return {
          success: false,
          error: { message: uploadResult.error || 'Erro no upload' } as AuthError
        }
      }

      // Atualizar perfil com nova URL do avatar
      const updateResult = await updateProfile({
        avatar_url: uploadResult.url
      })

      return updateResult
    } catch (error) {
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