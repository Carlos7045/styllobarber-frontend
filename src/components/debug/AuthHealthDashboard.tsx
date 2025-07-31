/**
 * Dashboard completo de saúde da autenticação
 * Combina monitoramento de sistema, performance e logs
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuthHealth } from '@/hooks/use-auth-health'
import { logger, LogLevel } from '@/lib/logger'
import { performanceMonitor } from '@/lib/performance-monitor'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Download,
  Trash2,
  Eye,
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface DashboardTab {
  id: string
  label: string
  icon: React.ReactNode
}

export function AuthHealthDashboard() {
  const authHealth = useAuthHealth()
  const [activeTab, setActiveTab] = useState('overview')
  const [performanceStats, setPerformanceStats] = useState<any>(null)
  const [logStats, setLogStats] = useState<any>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  const tabs: DashboardTab[] = [
    { id: 'overview', label: 'Visão Geral', icon: <Activity className="h-4 w-4" /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'logs', label: 'Logs', icon: <Eye className="h-4 w-4" /> },
    { id: 'alerts', label: 'Alertas', icon: <AlertCircle className="h-4 w-4" /> }
  ]

  // Atualizar dados periodicamente
  useEffect(() => {
    const updateData = () => {
      setPerformanceStats(performanceMonitor.getSystemOverview())
      setLogStats(logger.getStats())
      setRecentLogs(logger.getLogs({ limit: 20 }))
    }

    updateData()

    if (autoRefresh) {
      const interval = setInterval(updateData, 5000) // A cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5" />
    if (score >= 70) return <AlertTriangle className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemHealth: authHealth.systemHealth,
      metrics: authHealth.metrics,
      performance: performanceStats,
      logs: logStats,
      recentLogs: recentLogs.slice(0, 50) // Últimos 50 logs
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-health-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados de monitoramento?')) {
      logger.clearLogs()
      performanceMonitor.reset()
      authHealth.resetSystemState()
      setRecentLogs([])
      setLogStats(null)
      setPerformanceStats(null)
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Health Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Score de Saúde Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${getHealthScoreColor(performanceStats?.healthScore || 0)}`}>
            <div className="flex items-center gap-3">
              {getHealthScoreIcon(performanceStats?.healthScore || 0)}
              <div>
                <div className="text-2xl font-bold">
                  {performanceStats?.healthScore?.toFixed(0) || '0'}/100
                </div>
                <div className="text-sm opacity-75">
                  {performanceStats?.healthScore >= 90 ? 'Excelente' :
                   performanceStats?.healthScore >= 70 ? 'Bom' : 'Crítico'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Taxa de Sucesso</span>
            </div>
            <div className="text-2xl font-bold">
              {performanceStats?.overallSuccessRate?.toFixed(1) || '0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Tempo Médio</span>
            </div>
            <div className="text-2xl font-bold">
              {performanceStats?.averageResponseTime?.toFixed(0) || '0'}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Total Operações</span>
            </div>
            <div className="text-2xl font-bold">
              {performanceStats?.totalOperations || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      {performanceStats?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {performanceStats.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Estatísticas de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMonitor.getAllStats().map((stat, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{stat.operation}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    stat.successRate >= 95 ? 'bg-green-100 text-green-700' :
                    stat.successRate >= 80 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stat.successRate.toFixed(1)}% sucesso
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Chamadas:</span>
                    <div className="font-medium">{stat.totalCalls}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tempo Médio:</span>
                    <div className="font-medium">{stat.averageDuration.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Min/Max:</span>
                    <div className="font-medium">{stat.minDuration.toFixed(0)}/{stat.maxDuration.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Última:</span>
                    <div className="font-medium">{stat.lastCall.toLocaleTimeString()}</div>
                  </div>
                </div>
                {stat.recentErrors.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs text-red-600">Erros recentes:</span>
                    <ul className="text-xs text-red-600 mt-1">
                      {stat.recentErrors.slice(0, 3).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLogsTab = () => (
    <div className="space-y-6">
      {/* Estatísticas de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500">Total de Logs</span>
              <div className="text-xl font-bold">{logStats?.totalLogs || 0}</div>
            </div>
            {logStats?.logsByLevel && Object.entries(logStats.logsByLevel).map(([level, count]) => (
              <div key={level}>
                <span className="text-sm text-gray-500">{level}</span>
                <div className="text-xl font-bold">{count as number}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentLogs.map((log, index) => (
              <div key={index} className={`p-2 rounded text-xs border-l-4 ${
                log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL ? 'border-red-500 bg-red-50' :
                log.level === LogLevel.WARN ? 'border-yellow-500 bg-yellow-50' :
                log.level === LogLevel.INFO ? 'border-blue-500 bg-blue-50' :
                'border-gray-500 bg-gray-50'
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">[{log.category}] {log.message}</span>
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.context && (
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertas Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!authHealth.isHealthy && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Sistema não saudável</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  O sistema de autenticação apresenta problemas que requerem atenção.
                </p>
              </div>
            )}

            {authHealth.needsAttention && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Requer atenção</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">
                  Múltiplas falhas detectadas ou problemas de validação de sessão.
                </p>
              </div>
            )}

            {authHealth.isInCriticalState && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Estado crítico</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Circuit breaker aberto ou muitas falhas consecutivas. Sistema em proteção.
                </p>
              </div>
            )}

            {performanceStats?.criticalOperations?.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Operações críticas</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Operações com baixa taxa de sucesso: {performanceStats.criticalOperations.join(', ')}
                </p>
              </div>
            )}

            {authHealth.isHealthy && !authHealth.needsAttention && !authHealth.isInCriticalState && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Sistema saudável</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Todos os sistemas operando normalmente.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Dashboard de Saúde da Autenticação
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'logs' && renderLogsTab()}
        {activeTab === 'alerts' && renderAlertsTab()}
      </CardContent>
    </Card>
  )
}