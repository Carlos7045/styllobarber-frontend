/**
 * Componente para monitoramento de performance do sistema de agendamentos
 * Exibe métricas em tempo real e alertas de performance
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Activity,
  Clock,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { useAppointmentCache } from '@/shared/utils/appointment-cache'

interface PerformanceMetrics {
  cacheHitRate: number
  averageResponseTime: number
  totalQueries: number
  memoryUsage: number
  errorRate: number
  activeConnections: number
}

interface PerformanceMonitorProps {
  showDetailed?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PerformanceMonitor({
  showDetailed = false,
  autoRefresh = true,
  refreshInterval = 5000,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalQueries: 0,
    memoryUsage: 0,
    errorRate: 0,
    activeConnections: 0,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const cache = useAppointmentCache()

  // Coletar métricas
  const collectMetrics = async () => {
    setIsLoading(true)

    try {
      const cacheStats = cache.getStats()

      // Simular outras métricas (em produção viriam de APIs reais)
      const performanceEntries = performance.getEntriesByType('navigation')
      const navigationEntry = performanceEntries[0] as PerformanceNavigationTiming

      setMetrics({
        cacheHitRate: cacheStats.availability.hitRate * 100,
        averageResponseTime: navigationEntry?.responseEnd - navigationEntry?.requestStart || 0,
        totalQueries:
          cacheStats.availability.size +
          cacheStats.blockedSlots.size +
          cacheStats.appointments.size,
        memoryUsage: cacheStats.totalMemory / 1024, // KB
        errorRate: Math.random() * 5, // Simular taxa de erro
        activeConnections: Math.floor(Math.random() * 10) + 1,
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao coletar métricas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh
  useEffect(() => {
    collectMetrics()

    if (autoRefresh) {
      const interval = setInterval(collectMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Determinar status da performance
  const getPerformanceStatus = () => {
    if (metrics.cacheHitRate > 80 && metrics.averageResponseTime < 500 && metrics.errorRate < 2) {
      return { status: 'excellent', color: 'green', icon: CheckCircle }
    } else if (
      metrics.cacheHitRate > 60 &&
      metrics.averageResponseTime < 1000 &&
      metrics.errorRate < 5
    ) {
      return { status: 'good', color: 'blue', icon: TrendingUp }
    } else {
      return { status: 'needs-attention', color: 'yellow', icon: AlertTriangle }
    }
  }

  const performanceStatus = getPerformanceStatus()
  const StatusIcon = performanceStatus.icon

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant={performanceStatus.color === 'green' ? 'default' : 'secondary'}
            className={` ${performanceStatus.color === 'green' ? 'bg-green-100 text-green-800' : ''} ${performanceStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''} ${performanceStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''} `}
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {performanceStatus.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={collectMetrics} disabled={isLoading}>
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {/* Cache Hit Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Cache Hit Rate</span>
            </div>
            <div className="text-lg font-semibold">{metrics.cacheHitRate.toFixed(1)}%</div>
            <div className="h-1 w-full rounded-full bg-gray-200">
              <div
                className="h-1 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${metrics.cacheHitRate}%` }}
              />
            </div>
          </div>

          {/* Response Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <div className="text-lg font-semibold">{metrics.averageResponseTime.toFixed(0)}ms</div>
            <div
              className={`text-xs ${
                metrics.averageResponseTime < 500
                  ? 'text-green-600'
                  : metrics.averageResponseTime < 1000
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {metrics.averageResponseTime < 500
                ? 'Excellent'
                : metrics.averageResponseTime < 1000
                  ? 'Good'
                  : 'Slow'}
            </div>
          </div>

          {/* Total Queries */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Queries</span>
            </div>
            <div className="text-lg font-semibold">{metrics.totalQueries.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Since last reset</div>
          </div>

          {showDetailed && (
            <>
              {/* Memory Usage */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Memory Usage</span>
                </div>
                <div className="text-lg font-semibold">{metrics.memoryUsage.toFixed(1)} KB</div>
                <div className="text-xs text-muted-foreground">Cache memory</div>
              </div>

              {/* Error Rate */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Error Rate</span>
                </div>
                <div className="text-lg font-semibold">{metrics.errorRate.toFixed(2)}%</div>
                <div
                  className={`text-xs ${
                    metrics.errorRate < 2
                      ? 'text-green-600'
                      : metrics.errorRate < 5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {metrics.errorRate < 2 ? 'Low' : metrics.errorRate < 5 ? 'Medium' : 'High'}
                </div>
              </div>

              {/* Active Connections */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Active Connections</span>
                </div>
                <div className="text-lg font-semibold">{metrics.activeConnections}</div>
                <div className="text-xs text-muted-foreground">Current sessions</div>
              </div>
            </>
          )}
        </div>

        {/* Last Update */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Performance Recommendations */}
        {showDetailed && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Recommendations:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              {metrics.cacheHitRate < 70 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>Consider increasing cache TTL to improve hit rate</span>
                </div>
              )}
              {metrics.averageResponseTime > 1000 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span>Response time is high, check database queries</span>
                </div>
              )}
              {metrics.memoryUsage > 1000 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>High memory usage, consider cache cleanup</span>
                </div>
              )}
              {metrics.cacheHitRate > 80 && metrics.averageResponseTime < 500 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Performance is excellent!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook para usar métricas de performance em outros componentes
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const cache = useAppointmentCache()

  const collectMetrics = async () => {
    const cacheStats = cache.getStats()

    setMetrics({
      cacheHitRate: cacheStats.availability.hitRate * 100,
      averageResponseTime: 0, // Seria calculado baseado em medições reais
      totalQueries:
        cacheStats.availability.size + cacheStats.blockedSlots.size + cacheStats.appointments.size,
      memoryUsage: cacheStats.totalMemory / 1024,
      errorRate: 0, // Seria calculado baseado em logs de erro
      activeConnections: 1,
    })
  }

  useEffect(() => {
    collectMetrics()
  }, [])

  return { metrics, collectMetrics }
}
