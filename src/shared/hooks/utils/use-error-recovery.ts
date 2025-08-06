/**
 * Hook para usar o sistema de Error Recovery em componentes React
 */

import { useState, useEffect, useCallback } from 'react'
import { errorRecovery, RecoveryResult, ErrorType, RecoveryStrategy } from '@/lib/error-recovery'

export interface ErrorRecoveryState {
  isRecovering: boolean
  lastRecoveryResult: RecoveryResult | null
  circuitState: string
  failureCount: number
  isInFallbackMode: boolean
}

export function useErrorRecovery() {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    lastRecoveryResult: null,
    circuitState: 'closed',
    failureCount: 0,
    isInFallbackMode: false
  })

  // Atualizar estado do sistema
  const updateState = useCallback(() => {
    setState(prev => ({
      ...prev,
      circuitState: errorRecovery.getCircuitState(),
      failureCount: errorRecovery.getFailureCount(),
      isInFallbackMode: errorRecovery.isInFallbackMode()
    }))
  }, [])

  // Executar recovery manual
  const recoverFromError = useCallback(async (error: Error, context?: any): Promise<RecoveryResult> => {
    setState(prev => ({ ...prev, isRecovering: true }))
    
    try {
      const result = await errorRecovery.recoverFromError(error, context)
      
      setState(prev => ({
        ...prev,
        isRecovering: false,
        lastRecoveryResult: result
      }))
      
      updateState()
      return result
    } catch (recoveryError) {
      const errorResult: RecoveryResult = {
        success: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        error: recoveryError as Error
      }
      
      setState(prev => ({
        ...prev,
        isRecovering: false,
        lastRecoveryResult: errorResult
      }))
      
      return errorResult
    }
  }, [updateState])

  // Reset manual do circuit breaker
  const resetCircuit = useCallback(() => {
    errorRecovery.resetCircuit()
    updateState()
  }, [updateState])

  // Wrapper para operações que podem falhar
  const withErrorRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ success: boolean; data?: T; error?: Error }> => {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      console.log(`🔄 Error caught, attempting recovery for: ${context}`)
      
      const recoveryResult = await recoverFromError(error as Error, { context })
      
      if (recoveryResult.success && !recoveryResult.fallbackMode) {
        // Tentar novamente após recovery bem-sucedido
        try {
          const data = await operation()
          return { success: true, data }
        } catch (retryError) {
          return { success: false, error: retryError as Error }
        }
      }
      
      return { success: false, error: error as Error }
    }
  }, [recoverFromError])

  // Atualizar estado periodicamente
  useEffect(() => {
    updateState()
    
    const interval = setInterval(updateState, 5000) // A cada 5 segundos
    return () => clearInterval(interval)
  }, []) // Remover dependência para evitar loop

  return {
    ...state,
    recoverFromError,
    resetCircuit,
    withErrorRecovery,
    updateState
  }
}

// Hook específico para operações de autenticação
export function useAuthErrorRecovery() {
  const errorRecovery = useErrorRecovery()
  
  const recoverAuthError = useCallback(async (error: Error, userId?: string) => {
    return errorRecovery.recoverFromError(error, { 
      type: 'auth',
      userId,
      timestamp: Date.now()
    })
  }, [errorRecovery])

  const withAuthRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'auth-operation'
  ) => {
    return errorRecovery.withErrorRecovery(operation, `auth:${context}`)
  }, [errorRecovery])

  return {
    ...errorRecovery,
    recoverAuthError,
    withAuthRecovery
  }
}

// Hook para monitoramento de saúde do sistema
export function useSystemHealth() {
  const [health, setHealth] = useState({
    isHealthy: true,
    issues: [] as string[],
    lastCheck: new Date()
  })

  const checkHealth = useCallback(() => {
    const issues: string[] = []
    
    // Verificar circuit breaker
    const circuitState = errorRecovery.getCircuitState()
    if (circuitState === 'open') {
      issues.push('Circuit breaker aberto - sistema em proteção')
    } else if (circuitState === 'half_open') {
      issues.push('Circuit breaker em teste - funcionalidade limitada')
    }
    
    // Verificar modo fallback
    if (errorRecovery.isInFallbackMode()) {
      issues.push('Sistema operando em modo fallback')
    }
    
    // Verificar número de falhas
    const failureCount = errorRecovery.getFailureCount()
    if (failureCount > 3) {
      issues.push(`Alto número de falhas recentes: ${failureCount}`)
    }
    
    setHealth({
      isHealthy: issues.length === 0,
      issues,
      lastCheck: new Date()
    })
  }, [])

  useEffect(() => {
    checkHealth()
    
    const interval = setInterval(checkHealth, 10000) // A cada 10 segundos
    return () => clearInterval(interval)
  }, []) // Remover dependência para evitar loop

  return {
    ...health,
    checkHealth,
    refresh: checkHealth
  }
}
