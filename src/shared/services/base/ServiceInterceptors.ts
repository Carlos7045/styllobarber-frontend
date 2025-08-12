import { supabase } from '@/lib/supabase'
import { errorHandler, ServiceError, ErrorType, ErrorSeverity } from './ErrorHandler'

/**
 * Contexto da requisição
 */
export interface RequestContext {
  method: string
  table?: string
  operation?: string
  userId?: string
  startTime: number
  metadata?: Record<string, any>
}

/**
 * Interceptor de requisição
 */
export type RequestInterceptor = (context: RequestContext) => Promise<RequestContext> | RequestContext

/**
 * Interceptor de resposta
 */
export type ResponseInterceptor = (
  context: RequestContext,
  result: any,
  error?: any
) => Promise<any> | any

/**
 * Interceptor de erro
 */
export type ErrorInterceptor = (
  context: RequestContext,
  error: any
) => Promise<ServiceError> | ServiceError

/**
 * Configuração dos interceptors
 */
export interface InterceptorConfig {
  /** Se deve logar requisições (padrão: true) */
  enableRequestLogging?: boolean
  /** Se deve logar respostas (padrão: false) */
  enableResponseLogging?: boolean
  /** Se deve coletar métricas (padrão: true) */
  enableMetrics?: boolean
  /** Se deve validar autenticação (padrão: true) */
  enableAuthValidation?: boolean
  /** Timeout para requisições em ms (padrão: 30000) */
  requestTimeout?: number
}

/**
 * Métricas de requisições
 */
interface RequestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  requestsByTable: Map<string, number>
  errorsByType: Map<string, number>
}

/**
 * Gerenciador de interceptors para services
 * 
 * @description
 * Sistema centralizado para interceptar e processar requisições,
 * respostas e erros em todos os services. Fornece funcionalidades como:
 * - Logging automático de requisições
 * - Validação de autenticação
 * - Coleta de métricas
 * - Tratamento padronizado de erros
 * - Timeout de requisições
 * 
 * @example
 * ```typescript
 * const interceptors = new ServiceInterceptors({
 *   enableRequestLogging: true,
 *   enableMetrics: true,
 *   requestTimeout: 10000
 * })
 * 
 * // Adicionar interceptor customizado
 * interceptors.addRequestInterceptor(async (context) => {
 *   console.log('Request started:', context.method)
 *   return context
 * })
 * 
 * // Usar em um service
 * const result = await interceptors.execute(
 *   { method: 'findById', table: 'users', startTime: Date.now() },
 *   async () => {
 *     return await supabase.from('users').select('*').eq('id', '123').single()
 *   }
 * )
 * ```
 */
export class ServiceInterceptors {
  private config: Required<InterceptorConfig>
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []
  private metrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsByTable: new Map(),
    errorsByType: new Map(),
  }
  private responseTimes: number[] = []

  constructor(config: InterceptorConfig = {}) {
    this.config = {
      enableRequestLogging: true,
      enableResponseLogging: false,
      enableMetrics: true,
      enableAuthValidation: true,
      requestTimeout: 30000,
      ...config,
    }

    this.setupDefaultInterceptors()
  }

  /**
   * Configura interceptors padrão
   */
  private setupDefaultInterceptors(): void {
    // Interceptor de logging de requisições
    if (this.config.enableRequestLogging) {
      this.addRequestInterceptor(this.requestLoggingInterceptor.bind(this))
    }

    // Interceptor de validação de autenticação
    if (this.config.enableAuthValidation) {
      this.addRequestInterceptor(this.authValidationInterceptor.bind(this))
    }

    // Interceptor de métricas
    if (this.config.enableMetrics) {
      this.addResponseInterceptor(this.metricsInterceptor.bind(this))
    }

    // Interceptor de logging de respostas
    if (this.config.enableResponseLogging) {
      this.addResponseInterceptor(this.responseLoggingInterceptor.bind(this))
    }

    // Interceptor de tratamento de erros
    this.addErrorInterceptor(this.errorHandlingInterceptor.bind(this))
  }

  /**
   * Adiciona interceptor de requisição
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * Adiciona interceptor de resposta
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * Adiciona interceptor de erro
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor)
  }

  /**
   * Executa uma operação com todos os interceptors
   */
  async execute<T>(
    initialContext: Omit<RequestContext, 'startTime'>,
    operation: () => Promise<T>
  ): Promise<T> {
    let context: RequestContext = {
      ...initialContext,
      startTime: Date.now(),
    }

    try {
      // Executar interceptors de requisição
      for (const interceptor of this.requestInterceptors) {
        context = await interceptor(context)
      }

      // Executar operação com timeout
      const result = await this.executeWithTimeout(operation, this.config.requestTimeout)

      // Executar interceptors de resposta
      let processedResult = result
      for (const interceptor of this.responseInterceptors) {
        processedResult = await interceptor(context, processedResult)
      }

      return processedResult
    } catch (error) {
      // Executar interceptors de erro
      let processedError = error
      for (const interceptor of this.errorInterceptors) {
        processedError = await interceptor(context, processedError)
      }

      throw processedError
    }
  }

  /**
   * Executa operação com timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ])
  }

  /**
   * Interceptor de logging de requisições
   */
  private requestLoggingInterceptor(context: RequestContext): RequestContext {
    console.log(`🚀 Request: ${context.method}`, {
      table: context.table,
      operation: context.operation,
      userId: context.userId,
      timestamp: new Date(context.startTime).toISOString(),
    })
    return context
  }

  /**
   * Interceptor de validação de autenticação
   */
  private async authValidationInterceptor(context: RequestContext): Promise<RequestContext> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new ServiceError(
        'Usuário não autenticado',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        'AUTH_REQUIRED',
        context,
        undefined,
        false,
        'Sua sessão expirou. Faça login novamente.'
      )
    }

    // Verificar se a sessão não está expirada
    const now = Date.now() / 1000
    if (session.expires_at && session.expires_at < now) {
      throw new ServiceError(
        'Sessão expirada',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        'SESSION_EXPIRED',
        context,
        undefined,
        false,
        'Sua sessão expirou. Faça login novamente.'
      )
    }

    return {
      ...context,
      userId: session.user.id,
    }
  }

  /**
   * Interceptor de métricas
   */
  private metricsInterceptor(
    context: RequestContext,
    result: any,
    error?: any
  ): any {
    const responseTime = Date.now() - context.startTime

    // Atualizar métricas
    this.metrics.totalRequests++
    
    if (error) {
      this.metrics.failedRequests++
      const errorType = error.type || 'UNKNOWN'
      const currentCount = this.metrics.errorsByType.get(errorType) || 0
      this.metrics.errorsByType.set(errorType, currentCount + 1)
    } else {
      this.metrics.successfulRequests++
    }

    if (context.table) {
      const currentCount = this.metrics.requestsByTable.get(context.table) || 0
      this.metrics.requestsByTable.set(context.table, currentCount + 1)
    }

    // Atualizar tempo médio de resposta
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift() // Manter apenas os últimos 100
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length

    return result
  }

  /**
   * Interceptor de logging de respostas
   */
  private responseLoggingInterceptor(
    context: RequestContext,
    result: any,
    error?: any
  ): any {
    const responseTime = Date.now() - context.startTime
    
    if (error) {
      console.error(`❌ Response: ${context.method} (${responseTime}ms)`, {
        error: error.message,
        table: context.table,
        operation: context.operation,
      })
    } else {
      console.log(`✅ Response: ${context.method} (${responseTime}ms)`, {
        table: context.table,
        operation: context.operation,
        dataLength: Array.isArray(result?.data) ? result.data.length : undefined,
      })
    }

    return result
  }

  /**
   * Interceptor de tratamento de erros
   */
  private errorHandlingInterceptor(
    context: RequestContext,
    error: any
  ): ServiceError {
    return errorHandler.handle(error, {
      service: context.table,
      method: context.method,
      userId: context.userId,
      additionalData: {
        operation: context.operation,
        responseTime: Date.now() - context.startTime,
      },
    })
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): RequestMetrics & { 
    successRate: number
    errorRate: number
    requestsPerMinute: number
  } {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0

    const errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0

    // Calcular requests por minuto (baseado nos últimos response times)
    const oneMinuteAgo = Date.now() - 60000
    const recentRequests = this.responseTimes.length // Aproximação simples
    const requestsPerMinute = recentRequests

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute,
    }
  }

  /**
   * Reseta métricas
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByTable: new Map(),
      errorsByType: new Map(),
    }
    this.responseTimes = []
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getDetailedStats() {
    return {
      metrics: this.getMetrics(),
      topTables: Array.from(this.metrics.requestsByTable.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      topErrors: Array.from(this.metrics.errorsByType.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      recentResponseTimes: this.responseTimes.slice(-20),
    }
  }
}

// Instância global dos interceptors
export const serviceInterceptors = new ServiceInterceptors()
