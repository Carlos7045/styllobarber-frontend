/**
 * Hook para monitorar a saúde do sistema de autenticação
 */

import { useAuth } from '@/hooks/use-auth'
import { useCallback, useEffect, useState } from 'react'

export interface AuthHealthMetrics {
  sessionValidity: boolean
  profileSyncStatus: boolean
  errorRecoveryStatus: boolean
  lastSuccessfulOperation: Date | null
  consecutiveFailures: number
  averageResponseTime: number
}

export function useAuthHealth() {
  const { systemHealth, performHealthCheck, recoverFromError, resetSystemState } = useAuth()
  const [metrics, setMetrics] = useState<AuthHealthMetrics>({
    sessionValidity: true,
    profileSyncStatus: true,
    errorRecoveryStatus: true,
    lastSuccessfulOperation: null,
    consecutiveFailures: 0,
    averageResponseTime: 0
  })
  
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Função para executar diagnóstico completo
  const runDiagnostics = useCallback(async () => {
    console.log('🔍 Executando diagnóstico completo do sistema de autenticação...')
    
    const startTime = Date.now()
    const diagnosticResults = {
      sessionValidity: true,
      profileSyncStatus: true,
      errorRecoveryStatus: true,
      lastSuccessfulOperation: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: 0
    }

    try {
      // Executar health check
      await performHealthCheck()
      
      // Calcular tempo de resposta
      const responseTime = Date.now() - startTime
      diagnosticResults.averageResponseTime = responseTime
      
      // Verificar estado do sistema
      diagnosticResults.sessionValidity = systemHealth.isHealthy
      diagnosticResults.errorRecoveryStatus = !systemHealth.isInFallbackMode
      
      // Se há falhas, incrementar contador
      if (!systemHealth.isHealthy) {
        diagnosticResults.consecutiveFailures = systemHealth.failureCount
      } else {
        diagnosticResults.consecutiveFailures = 0
        diagnosticResults.lastSuccessfulOperation = new Date()
      }
      
      setMetrics(diagnosticResults)
      console.log('✅ Diagnóstico concluído:', diagnosticResults)
      
    } catch (error) {
      console.error('❌ Erro durante diagnóstico:', error)
      
      diagnosticResults.sessionValidity = false
      diagnosticResults.profileSyncStatus = false
      diagnosticResults.consecutiveFailures += 1
      
      setMetrics(diagnosticResults)
    }
  }, [systemHealth, performHealthCheck])

  // Função para tentar auto-reparo
  const attemptAutoRepair = useCallback(async (): Promise<boolean> => {
    console.log('🔧 Tentando auto-reparo do sistema de autenticação...')
    
    try {
      // Primeiro, tentar reset do sistema
      resetSystemState()
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Executar health check
      await performHealthCheck()
      
      // Verificar se melhorou
      if (systemHealth.isHealthy) {
        console.log('✅ Auto-reparo bem-sucedido')
        await runDiagnostics()
        return true
      }
      
      // Se ainda há problemas, tentar recovery de erro genérico
      const recoverySuccess = await recoverFromError(new Error('System health check failed'))
      
      if (recoverySuccess) {
        console.log('✅ Recovery bem-sucedido durante auto-reparo')
        await runDiagnostics()
        return true
      }
      
      console.log('❌ Auto-reparo falhou')
      return false
      
    } catch (error) {
      console.error('❌ Erro durante auto-reparo:', error)
      return false
    }
  }, [systemHealth, resetSystemState, performHealthCheck, recoverFromError, runDiagnostics])

  // Função para iniciar monitoramento contínuo
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return
    
    console.log('🔄 Iniciando monitoramento contínuo da saúde da autenticação...')
    setIsMonitoring(true)
    
    // Diagnóstico inicial
    runDiagnostics()
    
    // Monitoramento periódico
    const monitoringInterval = setInterval(() => {
      runDiagnostics()
    }, 30000) // A cada 30 segundos
    
    // Cleanup
    return () => {
      clearInterval(monitoringInterval)
      setIsMonitoring(false)
    }
  }, [isMonitoring, runDiagnostics])

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Parando monitoramento da saúde da autenticação...')
    setIsMonitoring(false)
  }, [])

  // Função para obter recomendações baseadas na saúde
  const getHealthRecommendations = useCallback((): string[] => {
    const recommendations: string[] = []
    
    if (!metrics.sessionValidity) {
      recommendations.push('Sessão inválida - considere fazer login novamente')
    }
    
    if (!metrics.profileSyncStatus) {
      recommendations.push('Problemas de sincronização de perfil - verifique conexão')
    }
    
    if (!metrics.errorRecoveryStatus) {
      recommendations.push('Sistema em modo fallback - funcionalidade limitada')
    }
    
    if (metrics.consecutiveFailures > 3) {
      recommendations.push('Múltiplas falhas detectadas - considere reiniciar aplicação')
    }
    
    if (metrics.averageResponseTime > 5000) {
      recommendations.push('Tempo de resposta alto - verifique conexão de rede')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Sistema operando normalmente')
    }
    
    return recommendations
  }, [metrics])

  // Monitoramento automático quando o hook é usado
  useEffect(() => {
    const cleanup = startMonitoring()
    return cleanup
  }, []) // Remover dependência para evitar loop

  return {
    // Estado
    systemHealth,
    metrics,
    isMonitoring,
    
    // Ações
    runDiagnostics,
    attemptAutoRepair,
    startMonitoring,
    stopMonitoring,
    
    // Helpers
    getHealthRecommendations,
    
    // Status helpers
    isHealthy: systemHealth.isHealthy && metrics.sessionValidity,
    needsAttention: metrics.consecutiveFailures > 2 || !metrics.sessionValidity,
    isInCriticalState: systemHealth.circuitState === 'open' || metrics.consecutiveFailures > 5
  }
}

// Hook simplificado para componentes que só precisam saber se está saudável
export function useAuthHealthStatus() {
  const { systemHealth } = useAuth()
  
  return {
    isHealthy: systemHealth.isHealthy,
    isInFallbackMode: systemHealth.isInFallbackMode,
    circuitState: systemHealth.circuitState,
    lastHealthCheck: systemHealth.lastHealthCheck
  }
}