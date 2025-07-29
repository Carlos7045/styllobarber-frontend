/**
 * Sistema inteligente de retry para operações de rede
 * Implementa estratégias adaptativas baseadas no tipo de erro
 */

import { errorHandler, ErrorType, OperationResult } from './error-handler'

// Configuração de retry por tipo de operação
export interface RetryStrategy {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryCondition?: (error: Error, attempt: number) => boolean
}

// Estratégias predefinidas
export const RETRY_STRATEGIES = {
  // Para operações críticas (login, pagamentos)
  CRITICAL: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: Error, attempt: number) => {
      // Não retry em erros de autenticação após 2 tentativas
      if (error.message.includes('unauthorized') && attempt > 2) return false
      // Não retry em erros de validação
      if (error.message.includes('validation')) return false
      return true
    },
  } as RetryStrategy,

  // Para operações normais (CRUD)
  STANDARD: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    jitter: true,
  } as RetryStrategy,

  // Para operações rápidas (busca, filtros)
  FAST: {
    maxRetries: 2,
    baseDelay: 200,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: false,
  } as RetryStrategy,

  // Para uploads/downloads
  UPLOAD: {
    maxRetries: 4,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: Error) => {
      // Retry apenas em erros de rede, não em erros de tamanho de arquivo
      return !error.message.includes('file size') && !error.message.includes('file type')
    },
  } as RetryStrategy,

  // Para operações em background
  BACKGROUND: {
    maxRetries: 10,
    baseDelay: 5000,
    maxDelay: 300000, // 5 minutos
    backoffMultiplier: 1.2,
    jitter: true,
  } as RetryStrategy,
}

// Classe para gerenciar retries inteligentes
export class NetworkRetryManager {
  private static instance: NetworkRetryManager
  private activeOperations = new Map<string, AbortController>()
  private operationStats = new Map<
    string,
    {
      attempts: number
      lastSuccess: Date
      lastFailure: Date
      successRate: number
    }
  >()

  private constructor() {}

  public static getInstance(): NetworkRetryManager {
    if (!NetworkRetryManager.instance) {
      NetworkRetryManager.instance = new NetworkRetryManager()
    }
    return NetworkRetryManager.instance
  }

  /**
   * Executa operação com retry inteligente
   */
  public async executeWithRetry<T>(
    operationId: string,
    operation: (signal?: AbortSignal) => Promise<T>,
    strategy: RetryStrategy = RETRY_STRATEGIES.STANDARD
  ): Promise<OperationResult<T>> {
    // Cancelar operação anterior se existir
    this.cancelOperation(operationId)

    // Criar novo AbortController
    const abortController = new AbortController()
    this.activeOperations.set(operationId, abortController)

    let lastError: Error | null = null
    let attempt = 0

    // Obter estatísticas da operação
    const stats = this.operationStats.get(operationId)

    // Ajustar estratégia baseada no histórico
    const adaptedStrategy = this.adaptStrategy(strategy, stats)

    try {
      while (attempt <= adaptedStrategy.maxRetries) {
        // Verificar se foi cancelado
        if (abortController.signal.aborted) {
          throw new Error('Operation cancelled')
        }

        try {
          console.log(
            `🔄 Tentativa ${attempt + 1}/${adaptedStrategy.maxRetries + 1} para ${operationId}`
          )

          const result = await operation(abortController.signal)

          // Sucesso - atualizar estatísticas
          this.updateStats(operationId, true)
          this.activeOperations.delete(operationId)

          if (attempt > 0) {
            console.log(`✅ ${operationId} bem-sucedido após ${attempt + 1} tentativas`)
          }

          return {
            success: true,
            data: result,
            warnings:
              attempt > 0 ? [`Operação bem-sucedida após ${attempt + 1} tentativas`] : undefined,
          }
        } catch (error) {
          lastError = error as Error
          attempt++

          // Atualizar estatísticas
          this.updateStats(operationId, false)

          // Verificar se deve tentar novamente
          if (
            attempt > adaptedStrategy.maxRetries ||
            (adaptedStrategy.retryCondition && !adaptedStrategy.retryCondition(lastError, attempt))
          ) {
            break
          }

          // Calcular delay com jitter se habilitado
          const delay = this.calculateDelay(adaptedStrategy, attempt)

          console.warn(
            `⚠️ ${operationId} falhou (tentativa ${attempt}), tentando novamente em ${delay}ms:`,
            lastError.message
          )

          // Aguardar antes da próxima tentativa
          await this.delay(delay, abortController.signal)
        }
      }

      // Todas as tentativas falharam
      this.activeOperations.delete(operationId)

      const structuredError = errorHandler.createStructuredError(
        lastError || new Error('Operação falhou por motivo desconhecido'),
        {
          operationId,
          attempts: attempt,
          strategy: adaptedStrategy,
        }
      )

      console.error(`❌ ${operationId} falhou após ${attempt} tentativas:`, structuredError)

      return {
        success: false,
        error: structuredError,
      }
    } catch (error) {
      this.activeOperations.delete(operationId)

      return {
        success: false,
        error: errorHandler.createStructuredError(error as Error, {
          operationId,
          attempts: attempt,
        }),
      }
    }
  }

  /**
   * Cancela operação em andamento
   */
  public cancelOperation(operationId: string): void {
    const controller = this.activeOperations.get(operationId)
    if (controller) {
      controller.abort()
      this.activeOperations.delete(operationId)
      console.log(`🚫 Operação ${operationId} cancelada`)
    }
  }

  /**
   * Cancela todas as operações
   */
  public cancelAllOperations(): void {
    this.activeOperations.forEach((controller, operationId) => {
      controller.abort()
      console.log(`🚫 Operação ${operationId} cancelada`)
    })
    this.activeOperations.clear()
  }

  /**
   * Adapta estratégia baseada no histórico
   */
  private adaptStrategy(strategy: RetryStrategy, stats?: any): RetryStrategy {
    if (!stats) return strategy

    const adapted = { ...strategy }

    // Se a taxa de sucesso é baixa, aumentar delays
    if (stats.successRate < 0.5) {
      adapted.baseDelay *= 1.5
      adapted.maxDelay *= 1.2
    }

    // Se houve falha recente, ser mais conservador
    const timeSinceLastFailure = Date.now() - stats.lastFailure.getTime()
    if (timeSinceLastFailure < 60000) {
      // Menos de 1 minuto
      adapted.maxRetries = Math.max(1, adapted.maxRetries - 1)
    }

    return adapted
  }

  /**
   * Calcula delay com backoff exponencial e jitter
   */
  private calculateDelay(strategy: RetryStrategy, attempt: number): number {
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1)

    // Aplicar limite máximo
    delay = Math.min(delay, strategy.maxDelay)

    // Aplicar jitter se habilitado (±25%)
    if (strategy.jitter) {
      const jitterRange = delay * 0.25
      delay += (Math.random() - 0.5) * 2 * jitterRange
    }

    return Math.max(100, Math.floor(delay)) // Mínimo 100ms
  }

  /**
   * Atualiza estatísticas da operação
   */
  private updateStats(operationId: string, success: boolean): void {
    const current = this.operationStats.get(operationId) || {
      attempts: 0,
      lastSuccess: new Date(0),
      lastFailure: new Date(0),
      successRate: 1,
    }

    current.attempts++

    if (success) {
      current.lastSuccess = new Date()
      current.successRate = (current.successRate * (current.attempts - 1) + 1) / current.attempts
    } else {
      current.lastFailure = new Date()
      current.successRate = (current.successRate * (current.attempts - 1)) / current.attempts
    }

    this.operationStats.set(operationId, current)
  }

  /**
   * Delay com suporte a cancelamento
   */
  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms)

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('Delay cancelled'))
        })
      }
    })
  }

  /**
   * Obter estatísticas de uma operação
   */
  public getOperationStats(operationId: string) {
    return this.operationStats.get(operationId)
  }

  /**
   * Obter todas as estatísticas
   */
  public getAllStats() {
    return Object.fromEntries(this.operationStats)
  }

  /**
   * Limpar estatísticas antigas
   */
  public cleanupStats(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now()

    for (const [operationId, stats] of this.operationStats.entries()) {
      const lastActivity = Math.max(stats.lastSuccess.getTime(), stats.lastFailure.getTime())

      if (now - lastActivity > maxAge) {
        this.operationStats.delete(operationId)
      }
    }
  }
}

// Instância singleton
export const networkRetry = NetworkRetryManager.getInstance()

// Funções de conveniência
export const executeWithRetry = <T>(
  operationId: string,
  operation: (signal?: AbortSignal) => Promise<T>,
  strategy?: RetryStrategy
) => networkRetry.executeWithRetry(operationId, operation, strategy)

export const cancelOperation = (operationId: string) => networkRetry.cancelOperation(operationId)

export const cancelAllOperations = () => networkRetry.cancelAllOperations()

// Hook para usar em componentes React
export function useNetworkRetry() {
  return {
    executeWithRetry,
    cancelOperation,
    cancelAllOperations,
    getStats: (operationId: string) => networkRetry.getOperationStats(operationId),
    getAllStats: () => networkRetry.getAllStats(),
  }
}
