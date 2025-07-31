'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

interface SessionState {
  isValid: boolean
  expiresAt: number | null
  timeUntilExpiry: number | null
  isRefreshing: boolean
}

export function useSessionManagerSimple() {
  const { session, signOut, loading } = useAuth()
  const router = useRouter()
  
  const [sessionState, setSessionState] = useState<SessionState>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isRefreshing: false,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Função para calcular tempo até expiração
  const calculateTimeUntilExpiry = useCallback((expiresAt: number): number => {
    return Math.max(0, expiresAt * 1000 - Date.now())
  }, [])

  // Função para verificar se a sessão é válida
  const isSessionValid = useCallback((session: any): boolean => {
    if (!session?.access_token || !session?.expires_at) {
      return false
    }
    const timeUntilExpiry = calculateTimeUntilExpiry(session.expires_at)
    return timeUntilExpiry > 0
  }, [calculateTimeUntilExpiry])

  // Função para renovar token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (sessionState.isRefreshing) return false
    
    try {
      console.log('🔄 Renovando token...')
      setSessionState(prev => ({ ...prev, isRefreshing: true }))

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('❌ Erro ao renovar token:', error)
        setSessionState(prev => ({ ...prev, isRefreshing: false }))
        return false
      }

      if (data.session) {
        console.log('✅ Token renovado com sucesso')
        setSessionState(prev => ({ ...prev, isRefreshing: false }))
        return true
      }

      setSessionState(prev => ({ ...prev, isRefreshing: false }))
      return false
    } catch (error) {
      console.error('❌ Erro inesperado ao renovar token:', error)
      setSessionState(prev => ({ ...prev, isRefreshing: false }))
      return false
    }
  }, [sessionState.isRefreshing])

  // Função para verificar estado da sessão (simplificada)
  const checkSessionState = useCallback(() => {
    if (loading) return

    if (!session) {
      setSessionState({
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isRefreshing: false,
      })
      return
    }

    const expiresAt = session.expires_at
    const timeUntilExpiry = expiresAt ? calculateTimeUntilExpiry(expiresAt) : null
    const isValid = isSessionValid(session)

    setSessionState(prev => ({
      ...prev,
      isValid,
      expiresAt: expiresAt || null,
      timeUntilExpiry,
    }))

    // Se a sessão expirou, fazer logout
    if (!isValid && expiresAt) {
      console.log('⚠️ Sessão expirada - fazendo logout')
      signOut()
      router.replace('/login?reason=session-expired')
    }
  }, [loading, session, calculateTimeUntilExpiry, isSessionValid, signOut, router])

  // Verificação periódica simplificada
  useEffect(() => {
    // Verificar imediatamente
    checkSessionState()

    // Configurar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(checkSessionState, 60000) // 1 minuto

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session?.access_token]) // Dependência simples

  // Função para forçar renovação
  const forceRefresh = useCallback(async (): Promise<boolean> => {
    return await refreshToken()
  }, [refreshToken])

  return {
    sessionState,
    forceRefresh,
    isSessionValid: sessionState.isValid,
    timeUntilExpiry: sessionState.timeUntilExpiry,
    isRefreshing: sessionState.isRefreshing,
  }
}