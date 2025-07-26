/**
 * Componente de monitoramento de saúde do sistema
 * Para uso em desenvolvimento e debugging
 */

'use client'

import { useSystemHealth, useErrorRecovery } from '@/hooks/use-error-recovery'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Shield,
  Zap,
  Clock
} from 'lucide-react'

export function SystemHealthMonitor() {
  const health = useSystemHealth()
  const errorRecovery = useErrorRecovery()

  const getCircuitStateIcon = () => {
    switch (errorRecovery.circuitState) {
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'half_open':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'open':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getCircuitStateColor = () => {
    switch (errorRecovery.circuitState) {
      case 'closed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'half_open':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'open':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Status Geral
          </h4>
          
          <div className={`p-3 rounded-lg border ${health.isHealthy 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {health.isHealthy ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="font-medium">
                {health.isHealthy ? 'Sistema Saudável' : 'Problemas Detectados'}
              </span>
            </div>
            
            {!health.isHealthy && (
              <ul className="text-sm space-y-1 ml-6">
                {health.issues.map((issue, index) => (
                  <li key={index} className="list-disc">
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Circuit Breaker Status */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Circuit Breaker
          </h4>
          
          <div className={`p-3 rounded-lg border ${getCircuitStateColor()}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getCircuitStateIcon()}
                <span className="font-medium capitalize">
                  {errorRecovery.circuitState.replace('_', ' ')}
                </span>
              </div>
              
              <div className="text-sm">
                Falhas: {errorRecovery.failureCount}
              </div>
            </div>
            
            <div className="text-sm opacity-75">
              {errorRecovery.circuitState === 'closed' && 'Sistema operando normalmente'}
              {errorRecovery.circuitState === 'half_open' && 'Testando recuperação do sistema'}
              {errorRecovery.circuitState === 'open' && 'Sistema em proteção - funcionalidade limitada'}
            </div>
          </div>
        </div>

        {/* Recovery Status */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Error Recovery
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Status:</span>
              <span className={`text-sm font-medium ${
                errorRecovery.isRecovering ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {errorRecovery.isRecovering ? 'Recuperando...' : 'Standby'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Modo Fallback:</span>
              <span className={`text-sm font-medium ${
                errorRecovery.isInFallbackMode ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {errorRecovery.isInFallbackMode ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            {errorRecovery.lastRecoveryResult && (
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-sm mb-1">Último Recovery:</div>
                <div className={`text-xs font-mono ${
                  errorRecovery.lastRecoveryResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {errorRecovery.lastRecoveryResult.strategy} - {
                    errorRecovery.lastRecoveryResult.success ? 'Sucesso' : 'Falha'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Informações de Tempo
          </h4>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>Última verificação: {health.lastCheck.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Ações */}
        <div>
          <h4 className="font-medium mb-3">Ações</h4>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={health.refresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={errorRecovery.resetCircuit}
              disabled={errorRecovery.circuitState === 'closed'}
            >
              <Zap className="h-4 w-4 mr-2" />
              Reset Circuit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('System Health Debug Info:', {
                  health,
                  errorRecovery: {
                    circuitState: errorRecovery.circuitState,
                    failureCount: errorRecovery.failureCount,
                    isInFallbackMode: errorRecovery.isInFallbackMode,
                    lastRecoveryResult: errorRecovery.lastRecoveryResult
                  }
                })
              }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Log Debug Info
            </Button>
          </div>
        </div>

        {/* Aviso de desenvolvimento */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <strong>Modo de Desenvolvimento:</strong> Este monitor é apenas para debugging e deve ser removido em produção.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}