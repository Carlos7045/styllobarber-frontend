/**
 * Interceptor para requisições HTTP que detecta erros de autenticação
 * e invalida a sessão automaticamente
 */

import { supabase } from './supabase'
import { clearAuthLocalData } from './auth-utils'

// Códigos de erro que indicam problemas de autenticação
const AUTH_ERROR_CODES = [
  401, // Unauthorized
  403, // Forbidden (em alguns casos)
]

// Mensagens de erro que indicam problemas de sessão
const AUTH_ERROR_MESSAGES = [
  'jwt expired',
  'invalid jwt',
  'token expired',
  'session expired',
  'unauthorized',
  'invalid token',
  'authentication required',
  'access denied',
]

// Callbacks para diferentes tipos de erro de auth
interface AuthInterceptorCallbacks {
  onTokenExpired?: () => void
  onUnauthorized?: () => void
  onSessionInvalid?: () => void
  onAuthError?: (error: AuthError) => void
}

interface AuthError {
  code: number
  message: string
  type: 'token_expired' | 'unauthorized' | 'session_invalid' | 'auth_error'
  originalError?: any
}

class AuthInterceptor {
  private callbacks: AuthInterceptorCallbacks = {}
  private isHandlingAuthError = false

  // Registrar callbacks
  setCallbacks(callbacks: AuthInterceptorCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // Verificar se um erro é relacionado à autenticação
  isAuthError(error: any): AuthError | null {
    // Verificar código de status HTTP
    if (error.status && AUTH_ERROR_CODES.includes(error.status)) {
      return {
        code: error.status,
        message: error.message || 'Erro de autenticação',
        type: error.status === 401 ? 'unauthorized' : 'auth_error',
        originalError: error
      }
    }

    // Verificar mensagem de erro
    const errorMessage = (error.message || error.error_description || '').toLowerCase()
    
    for (const authMessage of AUTH_ERROR_MESSAGES) {
      if (errorMessage.includes(authMessage)) {
        let type: AuthError['type'] = 'auth_error'
        
        if (authMessage.includes('expired')) {
          type = 'token_expired'
        } else if (authMessage.includes('unauthorized')) {
          type = 'unauthorized'
        } else if (authMessage.includes('session')) {
          type = 'session_invalid'
        }

        return {
          code: error.status || 401,
          message: error.message || 'Erro de autenticação',
          type,
          originalError: error
        }
      }
    }

    // Verificar erros específicos do Supabase
    if (error.error === 'invalid_grant' || error.error === 'invalid_token') {
      return {
        code: 401,
        message: 'Token inválido',
        type: 'token_expired',
        originalError: error
      }
    }

    return null
  }

  // Lidar com erro de autenticação
  async handleAuthError(authError: AuthError): Promise<void> {
    // Evitar múltiplas execuções simultâneas
    if (this.isHandlingAuthError) {
      console.log('⚠️ Já está lidando com erro de auth, ignorando...')
      return
    }

    this.isHandlingAuthError = true

    try {
      console.log(`🚨 Erro de autenticação detectado:`, authError)

      // Tentar renovar token primeiro (apenas para token expirado)
      if (authError.type === 'token_expired') {
        console.log('🔄 Tentando renovar token...')
        
        try {
          const { data, error } = await supabase.auth.refreshSession()
          
          if (!error && data.session) {
            console.log('✅ Token renovado com sucesso')
            this.callbacks.onTokenExpired?.()
            return
          }
        } catch (refreshError) {
          console.log('❌ Falha ao renovar token:', refreshError)
        }
      }

      // Se chegou aqui, a sessão é inválida
      console.log('🚪 Invalidando sessão...')

      // Limpar dados locais
      clearAuthLocalData()

      // Fazer logout no Supabase
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.warn('⚠️ Erro ao fazer signOut:', signOutError)
      }

      // Chamar callbacks apropriados
      switch (authError.type) {
        case 'token_expired':
          this.callbacks.onTokenExpired?.()
          break
        case 'unauthorized':
          this.callbacks.onUnauthorized?.()
          break
        case 'session_invalid':
          this.callbacks.onSessionInvalid?.()
          break
        default:
          this.callbacks.onAuthError?.(authError)
      }

      // Redirecionar para login
      const currentPath = window.location.pathname
      const loginUrl = `/login?reason=${authError.type}&redirect=${encodeURIComponent(currentPath)}`
      
      window.location.href = loginUrl

    } finally {
      // Resetar flag após um tempo para permitir novas tentativas
      setTimeout(() => {
        this.isHandlingAuthError = false
      }, 5000)
    }
  }

  // Interceptar fetch requests
  interceptFetch() {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        // Verificar se a resposta indica erro de auth
        if (!response.ok && AUTH_ERROR_CODES.includes(response.status)) {
          const errorData = await response.clone().json().catch(() => ({}))
          
          const authError = this.isAuthError({
            status: response.status,
            message: errorData.message || response.statusText,
            ...errorData
          })

          if (authError) {
            await this.handleAuthError(authError)
          }
        }

        return response
      } catch (error) {
        // Verificar se o erro de rede é relacionado à auth
        const authError = this.isAuthError(error)
        if (authError) {
          await this.handleAuthError(authError)
        }
        
        throw error
      }
    }

    console.log('🔧 Interceptor de fetch configurado')
  }

  // Interceptar erros do Supabase
  interceptSupabase() {
    // Interceptar mudanças de estado de auth
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event)

      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuário deslogado')
        clearAuthLocalData()
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token renovado automaticamente')
        this.callbacks.onTokenExpired?.()
      }
    })

    console.log('🔧 Interceptor do Supabase configurado')
  }

  // Verificar sessão periodicamente
  startPeriodicCheck(interval: number = 60000) {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          const authError = this.isAuthError(error)
          if (authError) {
            await this.handleAuthError(authError)
          }
          return
        }

        if (!session) {
          console.log('⚠️ Nenhuma sessão encontrada')
          return
        }

        // Verificar se a sessão está próxima da expiração
        const expiresAt = session.expires_at
        if (expiresAt) {
          const timeUntilExpiry = (expiresAt * 1000) - Date.now()
          
          // Se expira em menos de 5 minutos, tentar renovar
          if (timeUntilExpiry < 300000 && timeUntilExpiry > 0) {
            console.log('⏰ Sessão próxima da expiração, renovando...')
            
            try {
              await supabase.auth.refreshSession()
            } catch (refreshError) {
              const authError = this.isAuthError(refreshError)
              if (authError) {
                await this.handleAuthError(authError)
              }
            }
          }
        }

      } catch (error) {
        console.warn('⚠️ Erro na verificação periódica:', error)
      }
    }

    // Verificar imediatamente
    checkSession()

    // Configurar verificação periódica
    const intervalId = setInterval(checkSession, interval)

    console.log(`⏰ Verificação periódica configurada (${interval}ms)`)

    return () => {
      clearInterval(intervalId)
      console.log('⏰ Verificação periódica removida')
    }
  }

  // Inicializar todos os interceptors
  initialize(callbacks: AuthInterceptorCallbacks = {}, options: {
    enableFetchInterceptor?: boolean
    enableSupabaseInterceptor?: boolean
    enablePeriodicCheck?: boolean
    periodicCheckInterval?: number
  } = {}) {
    const {
      enableFetchInterceptor = true,
      enableSupabaseInterceptor = true,
      enablePeriodicCheck = true,
      periodicCheckInterval = 60000
    } = options

    this.setCallbacks(callbacks)

    if (enableFetchInterceptor) {
      this.interceptFetch()
    }

    if (enableSupabaseInterceptor) {
      this.interceptSupabase()
    }

    let cleanupPeriodicCheck: (() => void) | undefined

    if (enablePeriodicCheck) {
      cleanupPeriodicCheck = this.startPeriodicCheck(periodicCheckInterval)
    }

    console.log('🚀 AuthInterceptor inicializado')

    // Retornar função de cleanup
    return () => {
      cleanupPeriodicCheck?.()
      console.log('🧹 AuthInterceptor limpo')
    }
  }
}

// Instância singleton
export const authInterceptor = new AuthInterceptor()

// Hook para usar o interceptor em componentes React
export function useAuthInterceptor(callbacks: AuthInterceptorCallbacks = {}) {
  const { useEffect } = require('react')

  useEffect(() => {
    const cleanup = authInterceptor.initialize(callbacks)
    return cleanup
  }, [])

  return {
    isAuthError: authInterceptor.isAuthError.bind(authInterceptor),
    handleAuthError: authInterceptor.handleAuthError.bind(authInterceptor),
  }
}

// Função para configurar interceptor globalmente
export function setupGlobalAuthInterceptor(callbacks: AuthInterceptorCallbacks = {}) {
  return authInterceptor.initialize(callbacks)
}