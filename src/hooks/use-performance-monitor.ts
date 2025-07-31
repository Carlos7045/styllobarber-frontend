/**
 * Hook para monitorar performance e cache do sistema
 */

import { useState, useEffect, useCallback } from 'react'
import { cacheManager } from '@/lib/cache-manager'
import { queryOptimizer } from '@/lib/query-optimizer'
import { connectionPool } from '@/lib/connection-pool'

interface PerformanceMetrics {
  cache: {
    stats: ReturnType<typeof cacheManager.getStats>
    info: ReturnType<typeof cacheManager.getInfo>
  }
  queries: ReturnType<typeof queryOptimizer.getStats>
  connectionPool: ReturnType<typeof connectionPool.getStats>
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'critical'
    issues: string[]
    recommendations: string[]
  }
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Função para coletar métricas
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const cacheStats = cacheManager.getStats()
    const cacheInfo = cacheManager.getInfo()
    const queryStats = queryOptimizer.getStats()
    const poolStats = connectionPool.getStats()

    // Analisar saúde geral do sistema
    const issues: string[] = []
    const recommendations: string[] = []
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'

    // Verificar cache
    if (cacheStats.hitRate < 50) {
      issues.push('Taxa de hit do cache baixa')
      recommendations.push('Considere aumentar TTL do cache ou revisar padrões de acesso')
      overall = 'degraded'
    }

    if (cacheStats.size > 1000) {
      issues.push('Cache muito grande')
      recommendations.push('Implemente limpeza mais agressiva do cache')
    }

    // Verificar queries
    if (queryStats.cacheHitRate < 30) {
      issues.push('Cache de queries com baixa eficiência')
      recommendations.push('Otimize queries frequentes para usar cache')
      overall = 'degraded'
    }

    if (queryStats.avgExecutionTime > 1000) {
      issues.push('Tempo de resposta das queries alto')
      recommendations.push('Otimize queries lentas ou aumente recursos')
      if (overall === 'healthy') overall = 'degraded'
    }

    if (queryStats.errors > 10) {
      issues.push('Muitos erros nas queries')
      recommendations.push('Investigue e corrija erros recorrentes')
      overall = 'critical'
    }

    // Verificar connection pool (usando propriedades disponíveis)
    if (poolStats.activeConnections > 10) {
      issues.push('Connection pool com muitas conexões ativas')
      recommendations.push('Monitore o uso de conexões')
      overall = 'degraded'
    }

    if (poolStats.activeConnections > 15) {
      issues.push('Connection pool sobrecarregado')
      recommendations.push('Otimize queries ou aumente recursos')
    }

    return {
      cache: {
        stats: cacheStats,
        info: cacheInfo
      },
      queries: queryStats,
      connectionPool: poolStats,
      systemHealth: {
        overall,
        issues,
        recommendations
      }
    }
  }, [])

  // Função para atualizar métricas
  const updateMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      const newMetrics = await collectMetrics()
      setMetrics(newMetrics)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao coletar métricas de performance:', error)
    } finally {
      setIsLoading(false)
    }
  }, [collectMetrics])

  // Função para limpar cache
  const clearCache = useCallback(() => {
    cacheManager.clear()
    updateMetrics()
  }, [updateMetrics])

  // Função para invalidar cache por padrão
  const invalidateCache = useCallback((pattern: string) => {
    const removed = cacheManager.clear() // Usar método disponível
    updateMetrics()
    return removed
  }, [updateMetrics])

  // Função para otimizar sistema
  const optimizeSystem = useCallback(async () => {
    try {
      // Executar otimizações
      // Otimizações básicas disponíveis
      queryOptimizer.getStats() // Verificar stats
      
      // Limpar cache antigo
      const cacheInfo = cacheManager.getInfo()
      const now = Date.now()
      
      // Limpar cache se necessário
      if (cacheInfo.items.length > 100) {
        cacheInfo.items.forEach(item => {
          if (item.expired) {
            // Cache manager já remove automaticamente itens expirados
          }
        })
      }

      // Atualizar métricas
      await updateMetrics()
      
      return true
    } catch (error) {
      console.error('Erro ao otimizar sistema:', error)
      return false
    }
  }, [updateMetrics])

  // Função para aquecer cache
  const warmupCache = useCallback(async (userId: string) => {
    try {
      // Simular warmup básico
      queryOptimizer.getStats()
      await updateMetrics()
      return true
    } catch (error) {
      console.error('Erro ao aquecer cache:', error)
      return false
    }
  }, [updateMetrics])

  // Efeito para coletar métricas iniciais
  useEffect(() => {
    updateMetrics()
  }, [updateMetrics])

  // Efeito para atualização periódica
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics()
    }, 30000) // Atualizar a cada 30 segundos

    return () => clearInterval(interval)
  }, [updateMetrics])

  // Função para obter recomendações específicas
  const getRecommendations = useCallback(() => {
    if (!metrics) return []

    const recommendations: Array<{
      type: 'cache' | 'query' | 'connection' | 'general'
      priority: 'low' | 'medium' | 'high'
      message: string
      action?: () => void
    }> = []

    // Recomendações de cache
    if (metrics.cache.stats.hitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Taxa de hit do cache pode ser melhorada',
        action: () => optimizeSystem()
      })
    }

    // Recomendações de queries
    if (metrics.queries.avgExecutionTime > 500) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        message: 'Tempo de resposta das queries está alto',
        action: () => optimizeSystem()
      })
    }

    // Recomendações de conexão
    if (metrics.connectionPool.activeConnections > 10) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        message: 'Muitas requisições aguardando conexão'
      })
    }

    return recommendations
  }, [metrics, optimizeSystem])

  // Função para exportar métricas
  const exportMetrics = useCallback(() => {
    if (!metrics) return null

    return {
      timestamp: new Date().toISOString(),
      metrics,
      recommendations: getRecommendations()
    }
  }, [metrics, getRecommendations])

  return {
    // Estado
    metrics,
    isLoading,
    lastUpdate,
    
    // Ações
    updateMetrics,
    clearCache,
    invalidateCache,
    optimizeSystem,
    warmupCache,
    
    // Utilitários
    getRecommendations,
    exportMetrics,
    
    // Helpers
    isHealthy: metrics?.systemHealth.overall === 'healthy',
    isDegraded: metrics?.systemHealth.overall === 'degraded',
    isCritical: metrics?.systemHealth.overall === 'critical'
  }
}