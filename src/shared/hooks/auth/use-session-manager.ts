import { useState, useEffect, useCallback, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/api/supabase'

/**
 * Estados da sessão
 */
export type SessionStatus = 
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'expired'
  | 'refreshing'
  | 'error'

/**
 * Configuração do gerenciador de sessão
 */
export interface SessionManagerConfig {
  /** Intervalo de verificação da sessão em ms (padrão: 60000 - 1 minuto) */
  checkInterval?: number
  /** Tempo antes da expiração para fazer refresh em ms (padrão: 300000 - 5 minutos) */
  refreshBeforeExpiry?: number
  /** Número máximo de tentativas de refresh (padrão: 3) */
  maxRefreshAttempts?: number
  /** Se deve fazer refresh automático (padrão: true) */
  autoRefresh?: boolean
  /** Callback quando a sessão expira */
  onSessionExpired?: () => void
  /** Callback quando o refresh falha */
  onRefreshFailed?: (error: Error) => void
}

/**
 * Estado do gerenciador de sessão
 */
export interface SessionState {
  session: Session | null
  status: SessionStatus
  isValid: boolean
  isExpired: boolean
  needsRefresh: boolean
  expiresAt: number | null
  expiresIn: number | null
  refreshAttempts: number
  error: Error | null
}

/**
 * Hook para gerenciamento avançado de sessão
 * 
 * @description
 * Hook especializado para gerenciar sessões de autenticação com:
 * - Refresh automático de tokens
 * - Detecção de expiração
 * - Retry automático em caso de falha
 * - Estados detalhados da sessão
 * 
 * @example
 * ```tsx
 * const {
 *   session,
 *   status,
 *   isValid,
 *   needsRefresh,
 *   refreshSession
 * } = useSessionManager({
 *   autoRefresh: true,
 *   refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutos
 *   onSessionExpired: () => {
 *     // Redirecionar para login
 *   }
 * })
 * ```
 */
export function useSessionManager(config: SessionManagerConfig = {}) {
  const {
    checkInterval = 60 * 1000, // 1 minuto
    refreshBeforeExpiry = 5 * 60 * 1000, // 5 minutos
    maxRefreshAttempts = 3,
    autoRefresh = true,
    onSessionExpired,
    onRefreshFailed,
  } = config

  // Estado da sessão
  const [state, setState] = useState<SessionState>({
    session: null,
    status: 'loading',
    isValid: false,
    isExpired: false,
    needsRefresh: false,
    expiresAt: null,
    expiresIn: null,
    refreshAttempts: 0,
    error: null,
  })

  // Refs para controle
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const mountedRef = useRef(true)

  // Função para calcular estado da sessão
  const calculateSessionState = useCallback((session: Session | null): Partial<SessionState> => {
    if (!session) {
      return {
        session: null,
        status: 'unauthenticated',
        isValid: false,
        isExpired: false,
        needsRefresh: false,
        expiresAt: null,
        expiresIn: null,
      }
    }

    const now = Date.now()
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const expiresIn = Math.max(0, expiresAt - now)
    const isExpired = expiresIn <= 0
    const needsRefresh = expiresIn <= refreshBeforeExpiry && expiresIn > 0
    const isValid = !isExpired

    let status: SessionStatus = 'authenticated'
    if (isExpired) status = 'expired'
    else if (needsRefresh) status = 'refreshing'

    return {
      session,
      status,
      isValid,
      isExpired,
      needsRefresh,
      expiresAt,
      expiresIn,
    }
  }, [refreshBeforeExpiry])

  // Função para fazer refresh da sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false
    }

    try {
      isRefreshingRef.current = true
      
      setState(prev => ({ 
        ...prev, 
        status: 'refreshing',
        error: null,
      }))

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      if (!data.session) {
        throw new Error('Sessão não retornada no refresh')
      }

      // Sucesso no refresh
      const newState = calculateSessionState(data.session)
      setState(prev => ({
        ...prev,
        ...newState,
        refreshAttempts: 0,
        error: null,
      }))

      return true
    } catch (error) {
      console.error('Erro no refresh da sessão:', error)

      const newAttempts = state.refreshAttempts + 1
      const shouldRetry = newAttempts < maxRefreshAttempts

      setState(prev => ({
        ...prev,
        status: shouldRetry ? 'refreshing' : 'error',
        refreshAttempts: newAttempts,
        error: error as Error,
      }))

      if (!shouldRetry && onRefreshFailed) {
        onRefreshFailed(error as Error)
      }

      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [state.refreshAttempts, maxRefreshAttempts, calculateSessionState, onRefreshFailed])

  // Inicialização
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const newState = calculateSessionState(session)
        setState(prev => ({ ...prev, ...newState }))
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error)
        setState(prev => ({
          ...prev,
          status: 'error',
          error: error as Error,
        }))
      }
    }

    initializeSession()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mountedRef.current) {
        const newState = calculateSessionState(session)
        setState(prev => ({ ...prev, ...newState }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [calculateSessionState])

  // Verificação periódica
  useEffect(() => {
    if (state.status === 'loading') return

    checkIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return

      const currentState = calculateSessionState(state.session)
      
      // Verificar se sessão expirou
      if (currentState.isExpired && !state.isExpired) {
        setState(prev => ({ ...prev, ...currentState }))
        if (onSessionExpired) {
          onSessionExpired()
        }
      }
      // Verificar se precisa refresh
      else if (currentState.needsRefresh && autoRefresh && !isRefreshingRef.current) {
        refreshSession()
      }
    }, checkInterval)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [state.status, state.session, state.isExpired, calculateSessionState, onSessionExpired, autoRefresh, refreshSession, checkInterval])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  return {
    ...state,
    refreshSession,
  }
}
