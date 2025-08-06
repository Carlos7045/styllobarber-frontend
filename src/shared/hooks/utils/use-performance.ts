import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  /** First Contentful Paint */
  fcp?: number
  /** Largest Contentful Paint */
  lcp?: number
  /** First Input Delay */
  fid?: number
  /** Cumulative Layout Shift */
  cls?: number
  /** Time to First Byte */
  ttfb?: number
  /** Tempo de carregamento da página */
  loadTime?: number
  /** Uso de memória (se disponível) */
  memoryUsage?: {
    used: number
    total: number
    percentage: number
  }
}

/**
 * Configuração do hook usePerformance
 */
export interface UsePerformanceConfig {
  /** Se deve coletar Web Vitals automaticamente */
  collectWebVitals?: boolean
  /** Se deve monitorar uso de memória */
  monitorMemory?: boolean
  /** Intervalo para coleta de métricas (em ms) */
  interval?: number
  /** Callback chamado quando métricas são atualizadas */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

/**
 * Hook para monitoramento de performance e Web Vitals
 * 
 * @description
 * Hook que coleta e monitora métricas de performance da aplicação,
 * incluindo Web Vitals e uso de memória.
 * 
 * @example
 * ```tsx
 * const {
 *   metrics,
 *   isSupported,
 *   startMonitoring,
 *   stopMonitoring,
 *   measureOperation,
 *   getNavigationTiming
 * } = usePerformance({
 *   collectWebVitals: true,
 *   monitorMemory: true,
 *   onMetricsUpdate: (metrics) => {
 *     console.log('Performance metrics:', metrics)
 *   }
 * })
 * 
 * // Medir operação específica
 * const handleExpensiveOperation = async () => {
 *   const duration = await measureOperation('expensive-op', async () => {
 *     // Operação custosa
 *     await heavyComputation()
 *   })
 *   console.log(`Operation took ${duration}ms`)
 * }
 * ```
 */
export function usePerformance(config: UsePerformanceConfig = {}) {
  const {
    collectWebVitals = true,
    monitorMemory = false,
    interval = 5000,
    onMetricsUpdate
  } = config

  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isMonitoring, setIsMonitoring] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar se Performance API está disponível
  const isSupported = typeof window !== 'undefined' && 
                     'performance' in window && 
                     'PerformanceObserver' in window

  // Coletar Web Vitals
  const collectWebVitalsMetrics = useCallback(() => {
    if (!collectWebVitals || !isSupported) return

    try {
      // Importar web-vitals dinamicamente (opcional)
      import('web-vitals').then((webVitals) => {
        const { onCLS, onFCP, onLCP, onTTFB } = webVitals
        onCLS((metric: any) => {
          setMetrics(prev => ({ ...prev, cls: metric.value }))
        })

        // onFID não está disponível na web-vitals v5+

        onFCP((metric: any) => {
          setMetrics(prev => ({ ...prev, fcp: metric.value }))
        })

        onLCP((metric: any) => {
          setMetrics(prev => ({ ...prev, lcp: metric.value }))
        })

        onTTFB((metric: any) => {
          setMetrics(prev => ({ ...prev, ttfb: metric.value }))
        })
      }).catch(() => {
        // web-vitals não disponível, usar Performance API nativa
        if (window.performance && window.performance.getEntriesByType) {
          const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            setMetrics(prev => ({
              ...prev,
              loadTime: navigation.loadEventEnd - (navigation as any).navigationStart,
              ttfb: navigation.responseStart - navigation.requestStart
            }))
          }
        }
      })
    } catch (error) {
      console.warn('Error collecting Web Vitals:', error)
    }
  }, [collectWebVitals, isSupported])

  // Coletar métricas de memória
  const collectMemoryMetrics = useCallback(() => {
    if (!monitorMemory || typeof window === 'undefined') return

    try {
      // @ts-expect-error - performance.memory pode não estar tipado
      const memory = window.performance?.memory
      if (memory) {
        const memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        }
        setMetrics(prev => ({ ...prev, memoryUsage }))
      }
    } catch (error) {
      console.warn('Error collecting memory metrics:', error)
    }
  }, [monitorMemory])

  // Atualizar métricas
  const updateMetrics = useCallback(() => {
    const newMetrics: PerformanceMetrics = {}

    // Coletar métricas básicas de navegação
    if (isSupported && window.performance.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        newMetrics.loadTime = navigation.loadEventEnd - (navigation as any).navigationStart
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart
      }
    }

    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics }
      if (onMetricsUpdate) {
        onMetricsUpdate(updated)
      }
      return updated
    })

    collectMemoryMetrics()
  }, [isSupported, onMetricsUpdate, collectMemoryMetrics])

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)
    updateMetrics()
    collectWebVitalsMetrics()

    if (interval > 0) {
      intervalRef.current = setInterval(updateMetrics, interval)
    }
  }, [isMonitoring, updateMetrics, collectWebVitalsMetrics, interval])

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Medir operação específica
  const measureOperation = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!isSupported) {
      return await operation()
    }

    const startTime = performance.now()
    const result = await operation()
    const endTime = performance.now()
    const duration = endTime - startTime

    // Marcar performance
    if (window.performance.mark) {
      window.performance.mark(`${name}-start`)
      window.performance.mark(`${name}-end`)
      
      if (window.performance.measure) {
        window.performance.measure(name, `${name}-start`, `${name}-end`)
      }
    }

    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    return result
  }, [isSupported])

  // Obter timing de navegação
  const getNavigationTiming = useCallback(() => {
    if (!isSupported || !window.performance.getEntriesByType) {
      return null
    }

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation || null
  }, [isSupported])

  // Iniciar monitoramento automaticamente
  useEffect(() => {
    if (isSupported) {
      startMonitoring()
    }

    return () => {
      stopMonitoring()
    }
  }, [isSupported, startMonitoring, stopMonitoring])

  return {
    metrics,
    isSupported,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation,
    getNavigationTiming,
    updateMetrics
  }
}

/**
 * Hook simplificado para medir performance de operações
 * 
 * @description
 * Versão simplificada focada apenas em medir operações específicas.
 * 
 * @example
 * ```tsx
 * const { measureAsync, measureSync } = usePerformanceMeasure()
 * 
 * const handleAsyncOperation = async () => {
 *   const result = await measureAsync('api-call', () => 
 *     fetch('/api/data').then(r => r.json())
 *   )
 * }
 * 
 * const handleSyncOperation = () => {
 *   const result = measureSync('calculation', () => {
 *     return heavyCalculation()
 *   })
 * }
 * ```
 */
export function usePerformanceMeasure() {
  const measureAsync = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    const result = await operation()
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    return result
  }, [])

  const measureSync = useCallback(<T>(
    name: string,
    operation: () => T
  ): T => {
    const startTime = performance.now()
    const result = operation()
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    return result
  }, [])

  return {
    measureAsync,
    measureSync
  }
}
