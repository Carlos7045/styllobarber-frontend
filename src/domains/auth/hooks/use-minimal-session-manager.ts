'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './use-auth'

interface MinimalSessionState {
  isValid: boolean
  expiresAt: number | null
}

export function useMinimalSessionManager() {
  const { session, loading } = useAuth()
  const [sessionState, setSessionState] = useState<MinimalSessionState>({
    isValid: false,
    expiresAt: null,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Função memoizada para verificar sessão (evita dependência circular)
  const checkSession = useCallback(() => {
    if (loading) return

    if (!session?.access_token || !session?.expires_at) {
      setSessionState({
        isValid: false,
        expiresAt: null,
      })
      return
    }

    const now = Date.now()
    const expiresAt = session.expires_at * 1000
    const isValid = expiresAt > now

    setSessionState({
      isValid,
      expiresAt: session.expires_at,
    })
  }, [session?.access_token, session?.expires_at, loading])

  // Efeito otimizado com dependências estáveis
  useEffect(() => {
    checkSession()

    // Limpar interval anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Verificar a cada 2 minutos (menos agressivo)
    intervalRef.current = setInterval(checkSession, 120000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkSession])

  // Função de refresh memoizada
  const forceRefresh = useCallback(async () => {
    checkSession()
    return sessionState.isValid
  }, [checkSession, sessionState.isValid])

  return {
    isSessionValid: sessionState.isValid,
    expiresAt: sessionState.expiresAt,
    timeUntilExpiry: sessionState.expiresAt
      ? Math.max(0, sessionState.expiresAt * 1000 - Date.now())
      : null,
    forceRefresh,
  }
}
