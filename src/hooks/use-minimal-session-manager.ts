'use client'

import { useEffect, useRef, useState } from 'react'
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

  // Função simples para verificar sessão
  const checkSession = () => {
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
  }

  // Efeito simples com dependência mínima
  useEffect(() => {
    checkSession()
    
    // Verificar a cada 2 minutos
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(checkSession, 120000) // 2 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session?.access_token, loading])

  return {
    isSessionValid: sessionState.isValid,
    expiresAt: sessionState.expiresAt,
    timeUntilExpiry: sessionState.expiresAt 
      ? Math.max(0, sessionState.expiresAt * 1000 - Date.now())
      : null,
    forceRefresh: async () => {
      checkSession()
      return sessionState.isValid
    },
  }
}