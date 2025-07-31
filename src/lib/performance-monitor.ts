/**
 * Sistema de monitoramento de performance para autenticação
 * Coleta métricas de tempo de resposta, taxa de sucesso, etc.
 */

import { logger } from './logger'

export interface PerformanceMetric {
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  success?: boolean
  error?: Error
  metadata?: Record<string, any>
}

export interface PerformanceStats {
  operation: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  successRate: number
  lastCall: Date
  recentErrors: string[]
}

export interface SystemPerformanceOverview {
  totalOperations: number
  overallSuccessRate: number
  averageResponseTime: number
  criticalOperations: string[]
  healthScore: number
  recommendations: string[]
}

/**
 * Classe principal de monitoramento de performance
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private activeOperations: Map<string, PerformanceMetric> = new Map()
  private maxMetricsPerOperation = 100

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Iniciar medição de uma operação
   */
  public startOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      metadata
    }

    this.activeOperations.set(operationId, metric)
    
    logger.info(`Performance started: ${operation}`) // Log início
    
    return operationId
  }

  /**
   * Finalizar medição de uma operação
   */
  public endOperation(operationId: string, success: boolean = true, error?: Error): void {
    const metric = this.activeOperations.get(operationId)
    
    if (!metric) {
      console.warn('PerformanceMonitor: Operação não encontrada:', operationId)
      return
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.success = success
    metric.error = error

    // Armazenar métrica
    this.storeMetric(metric)

    // Remover da lista de operações ativas
    this.activeOperations.delete(operationId)

    // Log da performance
    logger.info(`Performance completed: ${metric.operation}`, { duration: metric.duration, success })
  }

  /**
   * Wrapper para medir operações automaticamente
   */
  public async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = this.startOperation(operation, metadata)
    
    try {
      const result = await fn()
      this.endOperation(operationId, true)
      return result
    } catch (error) {
      this.endOperation(operationId, false, error as Error)
      throw error
    }
  }

  /**
   * Wrapper síncrono para medir operações
   */
  public measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const operationId = this.startOperation(operation, metadata)
    
    try {
      const result = fn()
      this.endOperation(operationId, true)
      return result
    } catch (error) {
      this.endOperation(operationId, false, error as Error)
      throw error
    }
  }

  /**
   * Armazenar métrica no histórico
   */
  private storeMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, [])
    }

    const operationMetrics = this.metrics.get(metric.operation)!
    operationMetrics.push(metric)

    // Limitar número de métricas por operação
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.splice(0, operationMetrics.length - this.maxMetricsPerOperation)
    }
  }

  /**
   * Obter estatísticas de uma operação específica
   */
  public getOperationStats(operation: string): PerformanceStats | null {
    const metrics = this.metrics.get(operation)
    
    if (!metrics || metrics.length === 0) {
      return null
    }

    const completedMetrics = metrics.filter(m => m.duration !== undefined)
    const successfulMetrics = completedMetrics.filter(m => m.success === true)
    const failedMetrics = completedMetrics.filter(m => m.success === false)

    const durations = completedMetrics.map(m => m.duration!).filter(d => d > 0)
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0

    const successRate = completedMetrics.length > 0 ? (successfulMetrics.length / completedMetrics.length) * 100 : 0

    const recentErrors = failedMetrics
      .slice(-5) // Últimos 5 erros
      .map(m => m.error?.message || 'Erro desconhecido')

    const lastMetric = metrics[metrics.length - 1]
    const lastCall = new Date(Date.now() - (performance.now() - lastMetric.startTime))

    return {
      operation,
      totalCalls: completedMetrics.length,
      successfulCalls: successfulMetrics.length,
      failedCalls: failedMetrics.length,
      averageDuration,
      minDuration,
      maxDuration,
      successRate,
      lastCall,
      recentErrors
    }
  }

  /**
   * Obter visão geral de performance do sistema
   */
  public getSystemOverview(): SystemPerformanceOverview {
    const allOperations = Array.from(this.metrics.keys())
    const allStats = allOperations.map(op => this.getOperationStats(op)).filter(Boolean) as PerformanceStats[]

    const totalOperations = allStats.reduce((sum, stat) => sum + stat.totalCalls, 0)
    const totalSuccessful = allStats.reduce((sum, stat) => sum + stat.successfulCalls, 0)
    const overallSuccessRate = totalOperations > 0 ? (totalSuccessful / totalOperations) * 100 : 100

    const averageResponseTime = allStats.length > 0 
      ? allStats.reduce((sum, stat) => sum + stat.averageDuration, 0) / allStats.length 
      : 0

    // Identificar operações críticas (baixa taxa de sucesso ou alta latência)
    const criticalOperations = allStats
      .filter(stat => stat.successRate < 90 || stat.averageDuration > 5000)
      .map(stat => stat.operation)

    // Calcular score de saúde (0-100)
    let healthScore = 100
    if (overallSuccessRate < 95) healthScore -= (95 - overallSuccessRate) * 2
    if (averageResponseTime > 2000) healthScore -= Math.min(30, (averageResponseTime - 2000) / 100)
    if (criticalOperations.length > 0) healthScore -= criticalOperations.length * 10
    healthScore = Math.max(0, Math.min(100, healthScore))

    // Gerar recomendações
    const recommendations: string[] = []
    if (overallSuccessRate < 95) {
      recommendations.push(`Taxa de sucesso baixa (${overallSuccessRate.toFixed(1)}%) - investigar falhas`)
    }
    if (averageResponseTime > 3000) {
      recommendations.push(`Tempo de resposta alto (${averageResponseTime.toFixed(0)}ms) - otimizar performance`)
    }
    if (criticalOperations.length > 0) {
      recommendations.push(`Operações críticas detectadas: ${criticalOperations.join(', ')}`)
    }
    if (recommendations.length === 0) {
      recommendations.push('Sistema operando dentro dos parâmetros normais')
    }

    return {
      totalOperations,
      overallSuccessRate,
      averageResponseTime,
      criticalOperations,
      healthScore,
      recommendations
    }
  }

  /**
   * Obter todas as estatísticas de operações
   */
  public getAllStats(): PerformanceStats[] {
    return Array.from(this.metrics.keys())
      .map(operation => this.getOperationStats(operation))
      .filter(Boolean) as PerformanceStats[]
  }

  /**
   * Limpar métricas antigas
   */
  public clearOldMetrics(olderThanMinutes: number = 60): void {
    const cutoffTime = performance.now() - (olderThanMinutes * 60 * 1000)

    for (const [operation, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.startTime > cutoffTime)
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(operation)
      } else {
        this.metrics.set(operation, filteredMetrics)
      }
    }
  }

  /**
   * Exportar métricas para análise
   */
  public exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      systemOverview: this.getSystemOverview(),
      operationStats: this.getAllStats(),
      rawMetrics: Object.fromEntries(this.metrics)
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Resetar todas as métricas
   */
  public reset(): void {
    this.metrics.clear()
    this.activeOperations.clear()
  }
}

// Instância singleton
export const performanceMonitor = PerformanceMonitor.getInstance()

// Decorador para medir performance automaticamente
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureOperation(
        `${target.constructor.name}.${operation}`,
        () => method.apply(this, args),
        { className: target.constructor.name, methodName: propertyName }
      )
    }
  }
}