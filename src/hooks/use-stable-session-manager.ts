'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

interface SessionState {
    isValid: boolean
    expiresAt: number | null
    lastCheck: number
    error?: string
}

interface SessionConfig {
    checkInterval: number      // 60000ms (1 minuto)
    warningThreshold: number   // 300000ms (5 minutos)
    maxRetries: number         // 3
    debounceMs: number         // 1000ms
}

const DEFAULT_CONFIG: SessionConfig = {
    checkInterval: 60000,      // 1 minuto
    warningThreshold: 300000,  // 5 minutos
    maxRetries: 3,
    debounceMs: 1000,
}

export function useStableSessionManager(config: Partial<SessionConfig> = {}) {
    const { session, signOut, loading } = useAuth()
    const router = useRouter()

    // Configuração estável
    const configRef = useRef<SessionConfig>({ ...DEFAULT_CONFIG, ...config })

    // Estados separados para evitar dependências circulares
    const [sessionState, setSessionState] = useState<SessionState>({
        isValid: false,
        expiresAt: null,
        lastCheck: 0,
    })

    // Refs para controle de execução
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isCheckingRef = useRef(false)
    const retryCountRef = useRef(0)
    const lastSessionTokenRef = useRef<string | null>(null)

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

    // Função para renovar token (com retry)
    const refreshToken = useCallback(async (): Promise<boolean> => {
        if (isCheckingRef.current) {
            console.log('🔄 Refresh já em andamento, ignorando...')
            return false
        }

        isCheckingRef.current = true

        try {
            console.log('🔄 Renovando token...')

            const { data, error } = await supabase.auth.refreshSession()

            if (error) {
                console.error('❌ Erro ao renovar token:', error.message)
                retryCountRef.current++

                if (retryCountRef.current >= configRef.current.maxRetries) {
                    console.log('🚪 Máximo de tentativas atingido, fazendo logout')
                    await signOut()
                    router.replace('/login?reason=session-expired')
                    return false
                }

                return false
            }

            if (data.session) {
                console.log('✅ Token renovado com sucesso')
                retryCountRef.current = 0 // Reset retry count
                return true
            }

            return false
        } catch (error) {
            console.error('❌ Erro inesperado ao renovar token:', error)
            return false
        } finally {
            isCheckingRef.current = false
        }
    }, [signOut, router])

    // Função para verificar estado da sessão (debounced)
    const checkSession = useCallback(() => {
        // Evitar verificações simultâneas
        if (isCheckingRef.current || loading) {
            return
        }

        const now = Date.now()

        // Debounce: evitar verificações muito frequentes
        if (now - sessionState.lastCheck < configRef.current.debounceMs) {
            return
        }

        // Se não há sessão
        if (!session) {
            setSessionState(prev => ({
                ...prev,
                isValid: false,
                expiresAt: null,
                lastCheck: now,
                error: undefined,
            }))
            return
        }

        // Verificar se o token mudou (evitar verificações desnecessárias)
        if (lastSessionTokenRef.current === session.access_token) {
            return
        }

        lastSessionTokenRef.current = session.access_token

        const expiresAt = session.expires_at
        const timeUntilExpiry = expiresAt ? calculateTimeUntilExpiry(expiresAt) : null
        const isValid = isSessionValid(session)

        setSessionState(prev => ({
            ...prev,
            isValid,
            expiresAt,
            lastCheck: now,
            error: undefined,
        }))

        // Se a sessão expirou
        if (!isValid && expiresAt) {
            console.log('⚠️ Sessão expirada detectada')

            // Tentar renovar automaticamente
            refreshToken().then(renewed => {
                if (!renewed) {
                    console.log('🚪 Não foi possível renovar, fazendo logout')
                    signOut()
                    router.replace('/login?reason=session-expired')
                }
            })
        }
    }, [
        loading,
        session,
        sessionState.lastCheck,
        calculateTimeUntilExpiry,
        isSessionValid,
        refreshToken,
        signOut,
        router
    ])

    // Debounced version of checkSession
    const debouncedCheckSession = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            checkSession()
        }, configRef.current.debounceMs)
    }, [checkSession])

    // Configurar verificação periódica
    useEffect(() => {
        // Verificar imediatamente se há mudança na sessão
        if (session?.access_token !== lastSessionTokenRef.current) {
            checkSession()
        }

        // Configurar intervalo
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            checkSession()
        }, configRef.current.checkInterval)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [session?.access_token]) // Dependência mínima e estável

    // Cleanup garantido
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            isCheckingRef.current = false
        }
    }, [])

    // Função para forçar verificação (com debounce)
    const forceCheck = useCallback(() => {
        debouncedCheckSession()
    }, [debouncedCheckSession])

    // Função para forçar renovação
    const forceRefresh = useCallback(async (): Promise<boolean> => {
        return await refreshToken()
    }, [refreshToken])

    return {
        // Estado da sessão
        sessionState,

        // Funções de controle
        forceCheck,
        forceRefresh,

        // Informações úteis (valores derivados estáveis)
        isSessionValid: sessionState.isValid,
        expiresAt: sessionState.expiresAt,
        timeUntilExpiry: sessionState.expiresAt
            ? calculateTimeUntilExpiry(sessionState.expiresAt)
            : null,
        lastCheck: sessionState.lastCheck,
        error: sessionState.error,

        // Formatador útil
        formatTimeUntilExpiry: useCallback((ms: number | null): string => {
            if (!ms) return 'Desconhecido'

            const minutes = Math.floor(ms / 60000)
            const seconds = Math.floor((ms % 60000) / 1000)

            if (minutes > 0) {
                return `${minutes}m ${seconds}s`
            }
            return `${seconds}s`
        }, []),
    }
}