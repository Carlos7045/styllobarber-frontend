'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { securityLogger } from '@/lib/security-logger'
import { rateLimiterEnhanced } from '@/lib/rate-limiter-enhanced'

interface SecurityMonitorProps {
  className?: string
  refreshInterval?: number
}

export function SecurityMonitor({ 
  className, 
  refreshInterval = 10000 
}: SecurityMonitorProps) {
  const [securityStats, setSecurityStats] = useState<any>(null)
  const [rateLimitStats, setRateLimitStats] = useState<any>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Atualizar estatísticas
  const updateStats = () => {
    try {
      // Estatísticas de segurança (últimas 24h)
      const last24h = Date.now() - (24 * 60 * 60 * 1000)
      const stats = securityLogger.getStats(last24h)
      setSecurityStats(stats)

      // Estatísticas de rate limiting
      const rateLimitStats = rateLimiterEnhanced.getStats()
      setRateLimitStats(rateLimitStats)

      // Eventos recentes
      const events = securityLogger.getLogs({ limit: 10 })
      setRecentEvents(events)
    } catch (error) {
      console.warn('⚠️ Erro ao obter estatísticas de segurança:', error)
    }
  }

  useEffect(() => {
    // Só mostrar em desenvolvimento ou para usuários específicos
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      window.location.search.includes('security=true')
    setIsVisible(shouldShow)

    if (shouldShow) {
      updateStats()
      const interval = setInterval(updateStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  if (!isVisible) return null

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '🟡'
      case 'low': return '🔵'
      default: return '⚪'
    }
  }

  const exportLogs = () => {
    const logs = securityLogger.exportLogs('json')
    const blob = new Blob([logs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-sm ${className}`}>
      <Card className="bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Monitor
            <Button
              size="sm"
              variant="ghost"
              onClick={updateStats}
              className="ml-auto p-1 h-6 w-6"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Estatísticas Gerais */}
          {securityStats && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">Últimas 24h</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Total: {securityStats.totalEvents}</div>
                <div>Críticos: {securityStats.eventsBySeverity.critical || 0}</div>
                <div>Usuários: {securityStats.uniqueUsers}</div>
                <div>IPs: {securityStats.uniqueIps}</div>
              </div>
            </div>
          )}

          {/* Rate Limiting */}
          {rateLimitStats && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Rate Limiting</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Chaves: {rateLimitStats.totalKeys}</div>
                <div className={`${rateLimitStats.blockedKeys > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  Bloqueados: {rateLimitStats.blockedKeys}
                </div>
              </div>
            </div>
          )}

          {/* Eventos Recentes */}
          {recentEvents.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="h-3 w-3" />
                <span className="font-medium">Eventos Recentes</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300">
                    <span className="text-xs">
                      {getSeverityIcon(event.severity)}
                    </span>
                    <span className="text-xs truncate flex-1">
                      {event.event.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indicador de Risco */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <div className="flex items-center gap-1">
                {securityStats?.recentCriticalEvents?.length > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-400">Alto Risco</span>
                  </>
                ) : rateLimitStats?.blockedKeys > 0 ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Atenção</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">Normal</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-2 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => {
                securityLogger.cleanup()
                updateStats()
              }}
              className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={exportLogs}
              className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
            <button
              onClick={() => {
                const logs = securityLogger.getLogs({ limit: 50 })
                console.table(logs)
              }}
              className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}