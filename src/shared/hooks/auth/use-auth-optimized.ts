import { useState, useEffect, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/api/supabase'

/**
 * Estados de autenticação
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

/**
 * Configuração do hook de autenticação
 */
export interface AuthConfig {
  /** Se deve fazer cache do usuário (padrão: true) */
  enableCache?: boolean
  /** TTL do cache em ms (padrão: 5 minutos) */
  cacheTTL?: number
  /** Se deve fazer refresh automático (padrão: true) */
  autoRefresh?: boolean
  /** Callback quando o usuário faz login */
  onLogin?: (user: User) => void
  /** Callback quando o usuário faz logout */
  onLogout?: () => void
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void
}

/**
 * Estado de autenticação
 */
export interface AuthState {
  user: User | null
  session: Session | null
  status: AuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

/**
 * Cache de autenticação
 */
interface AuthCache {
  user: User | null
  session: Session | null
  timestamp: number
  ttl: number
}

// Cache global
let authCache: AuthCache | null = null

/**
 * Hook otimizado para autenticação
 * 
 * @description
 * Hook consolidado para gerenciar autenticação com:
 * - Cache inteligente
 * - Refresh automático de tokens
 * - Estados de loading otimizados
 * - Callbacks configuráveis
 * 
 * @example
 * ```tsx
 * const {
 *   user,
 *   session,
 *   status,
 *   isAuthenticated,
 *   login,
 *   logout,
 *   refreshAuth
 * } = useAuthOptimized({
 *   enableCache: true,
 *   autoRefresh: true,
 *   onLogin: (user) => {
 *     console.log('User logged in:', user.email)
 *   }
 * })
 * ```
 */
export function useAuthOptimized(config: AuthConfig = {}) {
  const {
    enableCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutos
    autoRefresh = true,
    onLogin,
    onLogout,
    onError,
  } = config

  // Estado local
  const [state, setState] = useState<AuthState>(() => {
    // Tentar usar cache se disponível
    if (enableCache && authCache) {
      const now = Date.now()
      if (now - authCache.timestamp < authCache.ttl) {
        return {
          user: authCache.user,
          session: authCache.session,
          status: authCache.user ? 'authenticated' : 'unauthenticated',
          isLoading: false,
          isAuthenticated: !!authCache.user,
          error: null,
        }
      }
    }

    return {
      user: null,
      session: null,
      status: 'loading',
      isLoading: true,
      isAuthenticated: false,
      error: null,
    }
  })

  const mountedRef = useRef(true)

  // Função para atualizar cache
  const updateCache = useCallback((user: User | null, session: Session | null) => {
    if (enableCache) {
      authCache = {
        user,
        session,
        timestamp: Date.now(),
        ttl: cacheTTL,
      }
    }
  }, [enableCache, cacheTTL])

  // Função para atualizar estado
  const updateAuthState = useCallback((user: User | null, session: Session | null, error?: Error) => {
    if (!mountedRef.current) return

    const newState: AuthState = {
      user,
      session,
      status: error ? 'error' : (user ? 'authenticated' : 'unauthenticated'),
      isLoading: false,
      isAuthenticated: !!user,
      error: error || null,
    }

    setState(newState)
    updateCache(user, session)

    // Callbacks
    if (error && onError) {
      onError(error)
    } else if (user && onLogin) {
      onLogin(user)
    } else if (!user && state.user && onLogout) {
      onLogout()
    }
  }, [updateCache, onError, onLogin, onLogout, state.user])

  // Função para fazer login
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      updateAuthState(data.user, data.session)
      return { success: true, user: data.user }
    } catch (error) {
      updateAuthState(null, null, error as Error)
      return { success: false, error: error as Error }
    }
  }, [updateAuthState])

  // Função para fazer logout
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      updateAuthState(null, null)
      return { success: true }
    } catch (error) {
      updateAuthState(state.user, state.session, error as Error)
      return { success: false, error: error as Error }
    }
  }, [updateAuthState, state.user, state.session])

  // Função para refresh da autenticação
  const refreshAuth = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) throw error

      updateAuthState(data.user, data.session)
      return { success: true, user: data.user }
    } catch (error) {
      updateAuthState(null, null, error as Error)
      return { success: false, error: error as Error }
    }
  }, [updateAuthState])

  // Inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        updateAuthState(session?.user || null, session)
      } catch (error) {
        updateAuthState(null, null, error as Error)
      }
    }

    // Se não temos cache válido, inicializar
    if (!enableCache || !authCache || (Date.now() - authCache.timestamp >= authCache.ttl)) {
      initializeAuth()
    }

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mountedRef.current) {
        updateAuthState(session?.user || null, session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [enableCache, updateAuthState])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    ...state,
    login,
    logout,
    refreshAuth,
  }
}
