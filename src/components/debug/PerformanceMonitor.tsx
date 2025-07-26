'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Activity, Database, Zap, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cacheManager } from '@/lib/cache-manager'
import { queryOptimizer } from '@/lib/query-optimizer'
import { connectionPool } from '@/lib/connection-pool'

interface PerformanceMonitorProps {
  className?: string
  refreshInterval?: number
}

export function PerformanceMonitor({ 
  className, 
  refreshInterval = 5000 
}: PerformanceMonitorProps) {
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [queryStats, setQueryStats] = useState<any>(null)
  const [poolStats, setPoolStats] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Atualizar estatísticas
  const updateStats = () => {
    try {
      setCacheStats(cacheManager.getStats())
      setQueryStats(queryOptimizer.getStats())
      setPoolStats(connectionPool.getStats())
    } catch (error) {
      console.warn('⚠️ Erro ao obter estatísticas de performance:', error)
    }
  }

  useEffect(() => {
    // Atualizar imediatamente
    updateStats()

    // Configurar intervalo de atualização
    const interval = setInterval(updateStats, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  // Só mostrar em desenvolvimento ou para usuários específicos
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      window.location.search.includes('debug=true')
    setIsVisible(shouldShow)
  }, [])

  if (!isVisible) return null

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      <Card className="bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Cache Stats */}
          {cacheStats && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400">
                <Zap className="h-3 w-3" />
                <span className="font-medium">Cache</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Hits: {formatNumber(cacheStats.hits)}</div>
                <div>Misses: {formatNumber(cacheStats.misses)}</div>
                <div>Size: {cacheStats.size}</div>
                <div className={`${cacheStats.hitRate > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                  Rate: {formatPercentage(cacheStats.hitRate)}
                </div>
              </div>
            </div>
          )}

          {/* Query Stats */}
          {queryStats && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-400">
                <Database className="h-3 w-3" />
                <span className="font-medium">Queries</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Total: {formatNumber(queryStats.totalQueries)}</div>
                <div>Errors: {formatNumber(queryStats.errors)}</div>
                <div className={`${queryStats.cacheHitRate > 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                  Cache: {formatPercentage(queryStats.cacheHitRate)}
                </div>
                <div>Avg: {formatTime(queryStats.avgExecutionTime)}</div>
              </div>
            </div>
          )}

          {/* Connection Pool Stats */}
          {poolStats && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-400">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Pool</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Total: {poolStats.totalConnections}</div>
                <div>Active: {poolStats.activeConnections}</div>
                <div>Idle: {poolStats.idleConnections}</div>
                <div className={`${poolStats.waitingRequests > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  Queue: {poolStats.waitingRequests}
                </div>
              </div>
            </div>
          )}

          {/* Performance Indicators */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Performance</span>
              <div className="flex items-center gap-1">
                {cacheStats?.hitRate > 70 && queryStats?.errorRate < 5 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-yellow-400" />
                )}
                <span className={`text-xs ${
                  cacheStats?.hitRate > 70 && queryStats?.errorRate < 5 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {cacheStats?.hitRate > 70 && queryStats?.errorRate < 5 ? 'Good' : 'Fair'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => {
                cacheManager.clear()
                queryOptimizer.clearCache()
                updateStats()
              }}
              className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
            >
              Clear Cache
            </button>
            <button
              onClick={() => {
                queryOptimizer.resetStats()
                updateStats()
              }}
              className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
            >
              Reset Stats
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}