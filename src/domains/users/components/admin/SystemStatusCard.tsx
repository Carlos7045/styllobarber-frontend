
'use client'
/**
 * Componente simplificado de status do sistema para administradores da barbearia
 * Mostra apenas informações relevantes para o negócio
 */


import { useState, useEffect } from 'react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Shield, Clock, TrendingUp, Users } from 'lucide-react'

interface SystemStatus {
  isHealthy: boolean
  uptime: string
  responseTime: number
  activeUsers: number
  lastIncident?: Date
  criticalAlerts: number
}

export function SystemStatusCard() {
  const { profile } = useAuth()
  const { permissions, canAccess } = useMonitoringPermissions(profile?.role || 'client', profile)
  const [status, setStatus] = useState<SystemStatus>({
    isHealthy: true,
    uptime: '99.9%',
    responseTime: 0,
    activeUsers: 0,
    criticalAlerts: 0
  })
  const [loading, setLoading] = useState(false)

  // Se o usuário não tem permissão, não mostrar nada
  if (!canAccess('canViewSystemHealth')) {
    return null
  }

  const updateStatus = async () => {
    setLoading(true)
    try {
      const overview = performanceMonitor.getSystemOverview()
      
      setStatus({
        isHealthy: overview.healthScore > 80,
        uptime: `${Math.min(99.9, (overview.overallSuccessRate || 0)).toFixed(1)}%`,
        responseTime: Math.round(overview.averageResponseTime || 0),
        activeUsers: 0, // Seria obtido de uma fonte real
        criticalAlerts: overview.criticalOperations?.length || 0,
        lastIncident: overview.criticalOperations?.length > 0 ? new Date() : undefined
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    updateStatus()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(updateStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (!status.isHealthy) return 'border-red-500 bg-red-50'
    if (status.criticalAlerts > 0) return 'border-yellow-500 bg-yellow-50'
    return 'border-green-500 bg-green-50'
  }

  const getStatusIcon = () => {
    if (!status.isHealthy) return <XCircle className="h-5 w-5 text-red-600" />
    if (status.criticalAlerts > 0) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <CheckCircle className="h-5 w-5 text-green-600" />
  }

  const getStatusText = () => {
    if (!status.isHealthy) return 'Sistema com Problemas'
    if (status.criticalAlerts > 0) return 'Sistema Operacional (Alertas)'
    return 'Sistema Operacional'
  }

  return (
    <Card className={`border-l-4 ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status do Sistema
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={updateStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Principal */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="font-medium">{getStatusText()}</div>
            <div className="text-sm text-gray-600">
              Última verificação: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Métricas Básicas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-secondary-graphite-light rounded-lg border border-gray-200 dark:border-secondary-graphite hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Disponibilidade</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {status.uptime}
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-secondary-graphite-light rounded-lg border border-gray-200 dark:border-secondary-graphite hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Tempo Resposta</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              {status.responseTime}ms
            </div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {status.criticalAlerts > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {status.criticalAlerts} problema{status.criticalAlerts > 1 ? 's' : ''} detectado{status.criticalAlerts > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              O sistema está funcionando, mas com performance reduzida. 
              Nossa equipe técnica foi notificada.
            </p>
          </div>
        )}

        {/* Último Incidente */}
        {status.lastIncident && (
          <div className="text-xs text-gray-500">
            Último problema: {status.lastIncident.toLocaleString()}
          </div>
        )}

        {/* Mensagem de Tranquilidade */}
        {status.isHealthy && status.criticalAlerts === 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Tudo funcionando perfeitamente!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Todos os sistemas estão operacionais e com boa performance.
            </p>
          </div>
        )}

        {/* Informações de Contato (apenas se houver problemas) */}
        {(!status.isHealthy || status.criticalAlerts > 0) && (
          <div className="pt-3 border-t text-xs text-gray-500">
            Em caso de problemas persistentes, entre em contato com o suporte técnico.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
