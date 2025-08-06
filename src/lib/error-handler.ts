/**
 * Sistema centralizado de tratamento de erros
 * Fornece funcionalidades robustas para captura, classificação e recuperação de erros
 */

import { useToast } from '@/shared/components/ui/toast'

// Tipos de erro do sistema
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown',
}

// Severidade do erro
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Interface para erro estruturado
export interface StructuredError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  originalError?: Error
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
  retryable: boolean
  retryCount?: number
  maxRetries?: number
}

// Interface para resultado de operação
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: StructuredError
  warnings?: string[]
}

// Configuração de retry
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

// Configuração padrão de retry
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.EXTERNAL_API, ErrorType.DATABASE],
}

// Classe principal do Error Handler
export class ErrorHandler {
  private static instance: ErrorHandler
  private retryConfig: RetryConfig
  private errorLog: StructuredError[] = []
  private maxLogSize = 100

  private constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  public static getInstance(config?: Partial<RetryConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config)
    }
    return ErrorHandler.instance
  }

  /**
   * Classifica um erro baseado em sua natureza
   */
  private classifyError(error: Error): { type: ErrorType; severity: ErrorSeverity } {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    // Erros de validação
    if (
      name.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW }
    }

    // Erros de rede
    if (
      name.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('cors')
    ) {
      return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM }
    }

    // Erros de autenticação
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('login') ||
      message.includes('token')
    ) {
      return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.HIGH }
    }

    // Erros de autorização
    if (
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access denied')
    ) {
      return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.HIGH }
    }

    // Erros de banco de dados
    if (
      message.includes('database') ||
      message.includes('sql') ||
      message.includes('query') ||
      name.includes('postgres')
    ) {
      return { type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH }
    }

    // Erros de API externa
    if (
      message.includes('api') ||
      message.includes('service unavailable') ||
      message.includes('external')
    ) {
      return { type: ErrorType.EXTERNAL_API, severity: ErrorSeverity.MEDIUM }
    }

    // Erro desconhecido
    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM }
  }

  /**
   * Cria um erro estruturado
   */
  public createStructuredError(
    error: Error,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): StructuredError {
    const { type, severity } = this.classifyError(error)
    const isRetryable = this.retryConfig.retryableErrors.includes(type)

    const structuredError: StructuredError = {
      id: this.generateErrorId(),
      type,
      severity,
      message: this.sanitizeErrorMessage(error.message),
      originalError: error,
      context: this.sanitizeContext(context),
      timestamp: new Date(),
      userId,
      sessionId,
      retryable: isRetryable,
      retryCount: 0,
      maxRetries: isRetryable ? this.retryConfig.maxRetries : 0,
    }

    // Adicionar ao log
    this.addToLog(structuredError)

    return structuredError
  }

  /**
   * Executa uma operação com retry automático
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<OperationResult<T>> {
    const config = { ...this.retryConfig, ...customRetryConfig }
    let lastError: StructuredError | null = null
    let attempt = 0

    while (attempt <= config.maxRetries) {
      try {
        const result = await operation()

        // Se chegou aqui, a operação foi bem-sucedida
        if (lastError && attempt > 0) {
          console.log(`✅ Operação bem-sucedida após ${attempt} tentativas`)
        }

        return {
          success: true,
          data: result,
          warnings: attempt > 0 ? [`Operação bem-sucedida após ${attempt} tentativas`] : undefined,
        }
      } catch (error) {
        const structuredError = this.createStructuredError(error as Error, {
          ...context,
          attempt,
          maxRetries: config.maxRetries,
        })

        lastError = structuredError
        attempt++

        // Se não é retryable ou excedeu tentativas, falha
        if (!structuredError.retryable || attempt > config.maxRetries) {
          console.error(`❌ Operação falhou após ${attempt - 1} tentativas:`, structuredError)

          return {
            success: false,
            error: structuredError,
          }
        }

        // Calcular delay para próxima tentativa
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        )

        console.warn(
          `⚠️ Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`,
          structuredError.message
        )

        // Aguardar antes da próxima tentativa
        await this.delay(delay)
      }
    }

    // Nunca deveria chegar aqui, mas por segurança
    return {
      success: false,
      error:
        lastError ||
        this.createStructuredError(new Error('Operação falhou por motivo desconhecido')),
    }
  }

  /**
   * Trata um erro e exibe feedback apropriado ao usuário
   */
  public handleError(
    error: Error | StructuredError,
    showToast: boolean = true,
    context?: Record<string, any>
  ): StructuredError {
    let structuredError: StructuredError

    if ('id' in error) {
      structuredError = error
    } else {
      structuredError = this.createStructuredError(error, context)
    }

    // Log do erro
    console.error('🚨 Erro capturado:', {
      id: structuredError.id,
      type: structuredError.type,
      severity: structuredError.severity,
      message: structuredError.message,
      context: structuredError.context,
    })

    // Exibir toast se solicitado
    if (showToast) {
      this.showErrorToast(structuredError)
    }

    // Reportar erro crítico
    if (structuredError.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(structuredError)
    }

    return structuredError
  }

  /**
   * Exibe toast apropriado baseado no tipo de erro
   */
  private showErrorToast(error: StructuredError): void {
    const userFriendlyMessage = this.getUserFriendlyMessage(error)

    // Como não podemos usar hooks em classes, vamos usar uma abordagem diferente
    // Emitir evento customizado que será capturado por um hook
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('show-error-toast', {
          detail: {
            type: this.getToastType(error.severity),
            title: this.getToastTitle(error.severity),
            description: userFriendlyMessage,
          },
        })
      )
    }
  }

  private getToastType(severity: ErrorSeverity): 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'warning'
      case ErrorSeverity.MEDIUM:
        return 'error'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'error'
    }
  }

  private getToastTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'Atenção'
      case ErrorSeverity.MEDIUM:
        return 'Erro'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'Erro Crítico'
      default:
        return 'Erro'
    }
  }

  /**
   * Converte erro técnico em mensagem amigável
   */
  private getUserFriendlyMessage(error: StructuredError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return error.message || 'Por favor, verifique os dados informados.'

      case ErrorType.NETWORK:
        return 'Problema de conexão. Verifique sua internet e tente novamente.'

      case ErrorType.AUTHENTICATION:
        return 'Sessão expirada. Por favor, faça login novamente.'

      case ErrorType.AUTHORIZATION:
        return 'Você não tem permissão para realizar esta ação.'

      case ErrorType.DATABASE:
        return 'Erro interno do sistema. Nossa equipe foi notificada.'

      case ErrorType.EXTERNAL_API:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'

      case ErrorType.BUSINESS_LOGIC:
        return error.message || 'Não foi possível completar a operação.'

      default:
        return 'Erro inesperado. Tente novamente ou contate o suporte.'
    }
  }

  /**
   * Reporta erros críticos (implementar integração com serviço de monitoramento)
   */
  private reportCriticalError(error: StructuredError): void {
    // TODO: Integrar com serviço de monitoramento (Sentry, LogRocket, etc.)
    console.error('🚨 ERRO CRÍTICO REPORTADO:', error)

    // Por enquanto, apenas log detalhado
    if (typeof window !== 'undefined') {
      // Enviar para analytics ou serviço de erro
      // analytics.track('critical_error', { errorId: error.id, type: error.type })
    }
  }

  /**
   * Utilitários privados
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove informações sensíveis da mensagem de erro
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    const sanitized = { ...context }

    // Remove campos sensíveis
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth']
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '***'
      }
    })

    return sanitized
  }

  private addToLog(error: StructuredError): void {
    this.errorLog.unshift(error)

    // Manter apenas os últimos N erros
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Métodos públicos para análise
   */
  public getErrorLog(): StructuredError[] {
    return [...this.errorLog]
  }

  public getErrorStats(): Record<ErrorType, number> {
    const stats = Object.values(ErrorType).reduce(
      (acc, type) => {
        acc[type] = 0
        return acc
      },
      {} as Record<ErrorType, number>
    )

    this.errorLog.forEach((error) => {
      stats[error.type]++
    })

    return stats
  }

  public clearErrorLog(): void {
    this.errorLog = []
  }
}

// Instância singleton
export const errorHandler = ErrorHandler.getInstance()

// Funções de conveniência
export const handleError = (error: Error, context?: Record<string, any>) =>
  errorHandler.handleError(error, true, context)

export const executeWithRetry = <T>(operation: () => Promise<T>, context?: Record<string, any>) =>
  errorHandler.executeWithRetry(operation, context)

export const createOperationResult = <T>(
  success: boolean,
  data?: T,
  error?: Error | StructuredError,
  warnings?: string[]
): OperationResult<T> => ({
  success,
  data,
  error: error
    ? error instanceof Error
      ? errorHandler.createStructuredError(error)
      : error
    : undefined,
  warnings,
})
