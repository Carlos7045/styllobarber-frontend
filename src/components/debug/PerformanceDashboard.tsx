/**
 * Dashboard de Performance e Cache
 * Monitora métricas do sistema em tempo real
 */

'use client'

import React from 'react'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { 
  Activity, 
  Database, 
  Zap, 
  RefreshCw, 
  Trash2, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'

export function PerformanceDashboard() {
  const {
    metrics,
    isLoading,
    lastUpdate,
    updateMetrics,
    clearCache,
    optimizeSystem,
    getRecommendations,
    isHealthy,
    isDegraded,
    isCritical
  } = usePerformanceMonitor()

  if (isLoading && !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
          <span className="ml-3">Carregando métricas...</span>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <p>Erro ao carregar métricas de performance</p>
          <Button onClick={updateMetrics} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const recommendations = getRecommendations()

  const getHealthIcon = () => {
    if (isHealthy) return <CheckCircle className="h-5 w-5 text-success" />
    if (isDegraded) return <AlertTriangle className="h-5 w-5 text-warning" />
    return <XCircle className="h-5 w-5 text-error" />
  }

  const getHealthColor = () => {
    if (isHealthy) return 'success'
    if (isDegraded) return 'warning'
    return 'error'
  }

  return (
    <div className="space-y-6">
      {/* Header com status geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary-gold" />
              <CardTitle>Performance Dashboard</CardTitle>
              {getHealthIcon()}
              <Badge variant={getHealthColor() as any}>
                {metrics.systemHealth.overall.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={optimizeSystem}
              >
                <Zap className="h-4 w-4 mr-2" />
                Otimizar
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-sm text-text-muted">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cache Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Hit Rate</p>
                <p className="text-2xl font-bold text-primary-gold">
                  {metrics.cache.stats.hitRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Tamanho</p>
                <p className="text-2xl font-bold">
                  {metrics.cache.stats.size}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hits</span>
                <span className="text-success">{metrics.cache.stats.hits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Misses</span>
                <span className="text-warning">{metrics.cache.stats.misses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Evictions</span>
                <span className="text-error">{metrics.cache.stats.evictions}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </CardContent>
        </Card>

        {/* Query Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-primary-gold">
                  {metrics.queries.cacheHitRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {Math.round(metrics.queries.avgResponseTime)}ms
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span>{metrics.queries.totalQueries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache Hits</span>
                <span className="text-success">{metrics.queries.cacheHits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Erros</span>
                <span className="text-error">{metrics.queries.errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Pool Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connection Pool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Ativas</p>
                <p className="text-2xl font-bold text-primary-gold">
                  {metrics.connectionPool.activeConnections}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Total</p>
                <p className="text-2xl font-bold">
                  {metrics.connectionPool.totalConnections}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Idle</span>
                <span>{metrics.connectionPool.idleConnections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Na Fila</span>
                <span className="text-warning">{metrics.connectionPool.queuedRequests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tempo Médio</span>
                <span>{Math.round(metrics.connectionPool.avgWaitTime)}ms</span>
              </div>
            </div>

            <Badge 
              variant={metrics.connectionPool.healthStatus === 'healthy' ? 'success' : 
                      metrics.connectionPool.healthStatus === 'degraded' ? 'warning' : 'error'}
              className="w-full justify-center"
            >
              {metrics.connectionPool.healthStatus.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Issues e Recomendações */}
      {(metrics.systemHealth.issues.length > 0 || recommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issues */}
          {metrics.systemHealth.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {metrics.systemHealth.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recomendações */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-info">
                  <TrendingUp className="h-5 w-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant={rec.priority === 'high' ? 'error' : 
                                  rec.priority === 'medium' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {rec.priority}
                        </Badge>
                        <span className="text-sm flex-1">{rec.message}</span>
                      </div>
                      {rec.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={rec.action}
                          className="ml-6"
                        >
                          Aplicar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cache Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Detalhes do Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Entradas Ativas</p>
                <p className="text-text-muted">{metrics.cache.info.entries.length}</p>
              </div>
              <div>
                <p className="font-medium">TTL Médio Restante</p>
                <p className="text-text-muted">
                  {metrics.cache.info.entries.length > 0 
                    ? Math.round(metrics.cache.info.entries.reduce((acc, entry) => acc + entry.remainingTtl, 0) / metrics.cache.info.entries.length / 1000)
                    : 0}s
                </p>
              </div>
              <div>
                <p className="font-medium">Idade Média</p>
                <p className="text-text-muted">
                  {metrics.cache.info.entries.length > 0 
                    ? Math.round(metrics.cache.info.entries.reduce((acc, entry) => acc + entry.age, 0) / metrics.cache.info.entries.length / 1000)
                    : 0}s
                </p>
              </div>
            </div>

            {metrics.cache.info.entries.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Chave</th>
                      <th className="text-left py-2">Idade</th>
                      <th className="text-left py-2">TTL Restante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.cache.info.entries.slice(0, 10).map((entry, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-1 truncate max-w-xs">{entry.key}</td>
                        <td className="py-1">{Math.round(entry.age / 1000)}s</td>
                        <td className="py-1">{Math.round(entry.remainingTtl / 1000)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {metrics.cache.info.entries.length > 10 && (
                  <p className="text-xs text-text-muted mt-2">
                    Mostrando 10 de {metrics.cache.info.entries.length} entradas
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}