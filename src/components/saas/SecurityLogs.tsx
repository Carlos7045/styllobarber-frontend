'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { securityLogger, type SecurityLogEntry, type SecurityEventType } from '@/lib/security-logger'

interface SecurityLogsProps {
  className?: string
}

export function SecurityLogs({ className }: SecurityLogsProps) {
  const [logs, setLogs] = useState<SecurityLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SecurityLogEntry[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState({
    event: '' as SecurityEventType | '',
    severity: '' as 'low' | 'medium' | 'high' | 'critical' | '',
    timeRange: '24h' as '1h' | '24h' | '7d' | '30d'
  })
  const [loading, setLoading] = useState(true)

  // Carregar logs e estatísticas
  const loadData = () => {
    setLoading(true)
    
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    
    const since = Date.now() - timeRanges[filters.timeRange]
    
    // Obter logs filtrados
    const allLogs = securityLogger.getLogs({
      event: filters.event || undefined,
      severity: filters.severity || undefined,
      since,
      limit: 100
    })
    
    setLogs(allLogs)
    setFilteredLogs(allLogs)
    
    // Obter estatísticas
    const statistics = securityLogger.getStats(since)
    setStats(statistics)
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [filters])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...logs]
    
    if (filters.event) {
      filtered = filtered.filter(log => log.event === filters.event)
    }
    
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity)
    }
    
    setFilteredLogs(filtered)
  }, [logs, filters])

  // Exportar logs
  const handleExport = (format: 'json' | 'csv') => {
    const data = securityLogger.exportLogs(format)
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Obter ícone para tipo de evento
  const getEventIcon = (event: SecurityEventType) => {
    const icons = {
      login_success: CheckCircle,
      login_failed: XCircle,
      login_blocked: Shield,
      logout: CheckCircle,
      unauthorized_access: AlertTriangle,
      suspicious_activity: AlertTriangle,
      password_reset_request: Clock,
      password_reset_success: CheckCircle,
      account_created: User,
      account_locked: Shield,
      permission_denied: XCircle,
      session_expired: Clock
    }
    return icons[event] || AlertTriangle
  }

  // Obter cor para severidade
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-400 bg-green-500/10',
      medium: 'text-yellow-400 bg-yellow-500/10',
      high: 'text-orange-400 bg-orange-500/10',
      critical: 'text-red-400 bg-red-500/10'
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  // Formatar timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Logs de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="ml-2 text-gray-400">Carregando logs...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Eventos</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
                <Shield className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Únicos</p>
                  <p className="text-2xl font-bold text-white">{stats.uniqueUsers}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">IPs Únicos</p>
                  <p className="text-2xl font-bold text-white">{stats.uniqueIps}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Eventos Críticos</p>
                  <p className="text-2xl font-bold text-red-400">{stats.eventsBySeverity.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Controles */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por período */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Período
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  timeRange: e.target.value as any 
                }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="1h">Última hora</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>

            {/* Filtro por severidade */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severidade
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  severity: e.target.value as any 
                }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            {/* Filtro por tipo de evento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Evento
              </label>
              <select
                value={filters.event}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  event: e.target.value as any 
                }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Todos</option>
                <option value="login_success">Login Sucesso</option>
                <option value="login_failed">Login Falhado</option>
                <option value="login_blocked">Login Bloqueado</option>
                <option value="logout">Logout</option>
                <option value="unauthorized_access">Acesso Negado</option>
                <option value="suspicious_activity">Atividade Suspeita</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Logs de Segurança ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhum log encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const Icon = getEventIcon(log.event)
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${getSeverityColor(log.severity).split(' ')[0]}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">
                          {log.details.message || log.event}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>📧 {log.email || 'N/A'}</span>
                          <span>🌐 {log.ip}</span>
                          <span>⏰ {formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        {Object.keys(log.details).length > 1 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-amber-400 hover:text-amber-300">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}