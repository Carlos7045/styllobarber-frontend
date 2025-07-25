import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
// import { useToast } from '@/components/ui'

// Interface para dados de login
export interface LoginData {
  email: string
  senha: string
}

// Interface para dados de cadastro
export interface SignUpData {
  nome: string
  email: string
  telefone: string
  senha: string
  confirmarSenha: string
}

// Interface para dados de recuperação de senha
export interface ResetPasswordData {
  email: string
}

// Interface para o estado de autenticação
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

// Hook principal de autenticação
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  })
  
  // const { toast } = useToast()
  const toast = (options: { variant?: string; title?: string; description?: string }) => {
    console.log('Toast:', options)
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
          toast({
            variant: 'error',
            title: 'Erro de autenticação',
            description: 'Não foi possível verificar sua sessão.',
          })
        }

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          })
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error)
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }))
        }
      }
    }

    initializeAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          })

          // Mostrar notificações baseadas no evento
          switch (event) {
            case 'SIGNED_IN':
              toast({
                variant: 'success',
                title: 'Login realizado',
                description: 'Bem-vindo ao StylloBarber!',
              })
              break
            case 'SIGNED_OUT':
              toast({
                variant: 'info',
                title: 'Logout realizado',
                description: 'Você foi desconectado com sucesso.',
              })
              break
            case 'TOKEN_REFRESHED':
              console.log('Token renovado automaticamente')
              break
            case 'USER_UPDATED':
              toast({
                variant: 'success',
                title: 'Perfil atualizado',
                description: 'Suas informações foram atualizadas.',
              })
              break
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [toast])

  // Função de login
  const signIn = async (data: LoginData) => {
    try {
      console.log('🔐 Hook signIn chamado para:', data.email)
      setAuthState(prev => ({ ...prev, loading: true }))

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      console.log('📊 Resposta do Supabase:', { authData, error })

      if (error) {
        throw error
      }

      console.log('✅ Login realizado com sucesso no hook')
      return { success: true, error: null }
    } catch (error) {
      const authError = error as AuthError
      let message = 'Erro desconhecido ao fazer login'

      // Traduzir mensagens de erro comuns
      switch (authError.message) {
        case 'Invalid login credentials':
          message = 'Email ou senha incorretos'
          break
        case 'Email not confirmed':
          message = 'Email não confirmado. Verifique sua caixa de entrada.'
          break
        case 'Too many requests':
          message = 'Muitas tentativas. Tente novamente em alguns minutos.'
          break
        default:
          message = authError.message
      }

      toast({
        variant: 'error',
        title: 'Erro no login',
        description: message,
      })

      return { success: false, error: authError }
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  // Função de cadastro
  const signUp = async (data: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))

      const { error } = await supabase.auth.signUp({
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
        throw error
      }

      toast({
        variant: 'success',
        title: 'Cadastro realizado',
        description: 'Verifique seu email para confirmar a conta.',
      })

      return { success: true, error: null }
    } catch (error) {
      const authError = error as AuthError
      let message = 'Erro desconhecido ao criar conta'

      // Traduzir mensagens de erro comuns
      switch (authError.message) {
        case 'User already registered':
          message = 'Este email já está cadastrado'
          break
        case 'Password should be at least 6 characters':
          message = 'A senha deve ter pelo menos 6 caracteres'
          break
        case 'Invalid email':
          message = 'Email inválido'
          break
        default:
          message = authError.message
      }

      toast({
        variant: 'error',
        title: 'Erro no cadastro',
        description: message,
      })

      return { success: false, error: authError }
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      const authError = error as AuthError
      
      toast({
        variant: 'error',
        title: 'Erro no logout',
        description: authError.message,
      })

      return { success: false, error: authError }
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  // Função de recuperação de senha
  const resetPassword = async (data: ResetPasswordData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      toast({
        variant: 'success',
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      })

      return { success: true, error: null }
    } catch (error) {
      const authError = error as AuthError
      
      toast({
        variant: 'error',
        title: 'Erro ao enviar email',
        description: authError.message,
      })

      return { success: false, error: authError }
    }
  }

  // Função para atualizar perfil
  const updateProfile = async (updates: { nome?: string; telefone?: string }) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))

      const { error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      const authError = error as AuthError
      
      toast({
        variant: 'error',
        title: 'Erro ao atualizar perfil',
        description: authError.message,
      })

      return { success: false, error: authError }
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    // Estado
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    isAuthenticated: !!authState.user,
    
    // Ações
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }
}