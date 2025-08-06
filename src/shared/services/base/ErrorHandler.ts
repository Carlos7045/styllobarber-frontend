/**
 * Tipos de erro do sistema
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Severidade do erro
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Contexto do erro
 */
export interface ErrorContext {
  service?: string
  method?: string
  userId?: string
  sessionId?: string
  timestamp?: number
  userAgent?: string
  url?: string
  additionalData?: Record<string, any>
}

/**
 * Erro estruturado do sistema
 */
export class ServiceError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly code: string
  public readonly context: ErrorContext
  public readonly originalError?: Error
  public readonly retryable: boolean
  public readonly userMessage: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    context: ErrorContext = {},
    originalError?: Error,
    retryable = false,
    userMessage?: string
  ) {
    super(message)
    this.name = 'ServiceError'
    this.type = type
    this.severity = severity
    this.code = code || this.generateErrorCode(type)
    this.context = {
      timestamp: Date.now(),
      ...context,
    }
    this.originalError = originalError
    this.retryable = retryable
    this.userMessage = userMessage || this.getDefaultUserMessage(type)
  }

  private generateErrorCode(type: ErrorType): string {
    const timestamp = Date.now().toString(36)
    return `${type}_${timestamp}`
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.NETWORK]: 'Problema de conexão. Verifique sua internet e tente novamente.',
      [ErrorType.VALIDATION]: 'Dados inválidos. Verifique as informações e tente novamente.',
      [ErrorType.AUTHENTICATION]: 'Sessão expirada. Faça login novamente.',
      [ErrorType.AUTHORIZATION]: 'Você não tem permissão para esta ação.',
      [ErrorType.NOT_FOUND]: 'Recurso não encontrado.',
      [ErrorType.CONFLICT]: 'Conflito nos dados. Atualize a página e tente novamente.',
      [ErrorType.RATE_LIMIT]: 'Muitas tentativas. Aguarde um momento e tente novamente.',
      [ErrorType.SERVER_ERROR]: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      [ErrorType.UNKNOWN]: 'Erro inesperado. Tente novamente.',
    }
    return messages[type]
  }

  /**
   * Converte o erro para um objeto JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    }
  }
}

/**
 * Configuração do error handler
 */
export interface ErrorHandlerConfig {
  /** Se deve logar erros no console (padrão: true) */
  enableConsoleLogging?: boolean
  /** Se deve enviar erros para serviço externo (padrão: false) */
  enableRemoteLogging?: boolean
  /** URL do serviço de logging remoto */
  remoteLoggingUrl?: string
  /** Se deve mostrar notificações de erro (padrão: true) */
  enableNotifications?: boolean
  /** Função customizada para mostrar notificações */
  notificationHandler?: (error: ServiceError) => void
}

/**
 * Gerenciador centralizado de erros
 * 
 * @description
 * Sistema centralizado para captura, tratamento e logging de erros
 * em toda a aplicação. Fornece funcionalidades como:
 * - Classificação automática de erros
 * - Logging estruturado
 * - Notificações para usuário
 * - Integração com serviços externos
 * 
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler({
 *   enableConsoleLogging: true,
 *   enableNotifications: true,
 *   notificationHandler: (error) => {
 *     toast.error(error.userMessage)
 *   }
 * })
 * 
 * // Capturar e tratar erro
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   errorHandler.handle(error, {
 *     service: 'UserService',
 *     method: 'createUser'
 *   })
 * }
 * ```
 */
export class ErrorHandler {
  private config: Required<ErrorHandlerConfig>
  private errorCounts = new Map<string, number>()
  private lastErrors = new Map<string, number>()

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      remoteLoggingUrl: '',
      enableNotifications: true,
      notificationHandler: () => {},
      ...config,
    }
  }

  /**
   * Trata um erro capturado
   */
  handle(error: unknown, context: ErrorContext = {}): ServiceError {
    const serviceError = this.normalizeError(error, context)
    
    // Incrementar contador de erros
    this.incrementErrorCount(serviceError.code)
    
    // Logar erro
    if (this.config.enableConsoleLogging) {
      this.logToConsole(serviceError)
    }
    
    // Enviar para serviço remoto
    if (this.config.enableRemoteLogging && this.config.remoteLoggingUrl) {
      this.logToRemoteService(serviceError)
    }
    
    // Mostrar notificação para usuário
    if (this.config.enableNotifications && this.shouldShowNotification(serviceError)) {
      this.config.notificationHandler(serviceError)
    }
    
    return serviceError
  }

  /**
   * Normaliza diferentes tipos de erro para ServiceError
   */
  private normalizeError(error: unknown, context: ErrorContext): ServiceError {
    if (error instanceof ServiceError) {
      return error
    }

    if (error instanceof Error) {
      const type = this.classifyError(error)
      const severity = this.determineSeverity(type, error)
      const retryable = this.isRetryable(type, error)

      return new ServiceError(
        error.message,
        type,
        severity,
        undefined,
        context,
        error,
        retryable
      )
    }

    // Erro do Supabase
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const supabaseError = error as any
      const type = this.classifySupabaseError(supabaseError.code)
      const severity = this.determineSeverity(type)

      return new ServiceError(
        supabaseError.message || 'Erro do banco de dados',
        type,
        severity,
        supabaseError.code,
        context,
        undefined,
        this.isRetryable(type)
      )
    }

    // Erro desconhecido
    return new ServiceError(
      typeof error === 'string' ? error : 'Erro desconhecido',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      undefined,
      context
    )
  }

  /**
   * Classifica o tipo de erro baseado na mensagem/código
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return ErrorType.AUTHORIZATION
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND
    }
    if (message.includes('conflict') || message.includes('409')) {
      return ErrorType.CONFLICT
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorType.RATE_LIMIT
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION
    }
    if (message.includes('server error') || message.includes('500')) {
      return ErrorType.SERVER_ERROR
    }

    return ErrorType.UNKNOWN
  }

  /**
   * Classifica erros do Supabase baseado no código
   */
  private classifySupabaseError(code: string): ErrorType {
    const codeMap: Record<string, ErrorType> = {
      'PGRST301': ErrorType.NOT_FOUND,
      'PGRST302': ErrorType.SERVER_ERROR,
      '23505': ErrorType.CONFLICT, // unique_violation
      '23503': ErrorType.VALIDATION, // foreign_key_violation
      '23502': ErrorType.VALIDATION, // not_null_violation
      '42501': ErrorType.AUTHORIZATION, // insufficient_privilege
    }

    return codeMap[code] || ErrorType.SERVER_ERROR
  }

  /**
   * Determina a severidade do erro
   */
  private determineSeverity(type: ErrorType, error?: Error): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.HIGH
      case ErrorType.AUTHORIZATION:
      case ErrorType.CONFLICT:
        return ErrorSeverity.MEDIUM
      case ErrorType.VALIDATION:
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.LOW
      case ErrorType.NETWORK:
      case ErrorType.RATE_LIMIT:
        return ErrorSeverity.MEDIUM
      default:
        return ErrorSeverity.MEDIUM
    }
  }

  /**
   * Determina se o erro pode ser retentado
   */
  private isRetryable(type: ErrorType, error?: Error): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.SERVER_ERROR,
      ErrorType.RATE_LIMIT,
    ]
    return retryableTypes.includes(type)
  }

  /**
   * Incrementa contador de erros
   */
  private incrementErrorCount(code: string): void {
    const current = this.errorCounts.get(code) || 0
    this.errorCounts.set(code, current + 1)
    this.lastErrors.set(code, Date.now())
  }

  /**
   * Determina se deve mostrar notificação
   */
  private shouldShowNotification(error: ServiceError): boolean {
    // Não mostrar notificações para erros de baixa severidade
    if (error.severity === ErrorSeverity.LOW) {
      return false
    }

    // Não mostrar notificações repetidas muito frequentes
    const lastError = this.lastErrors.get(error.code)
    if (lastError && Date.now() - lastError < 5000) { // 5 segundos
      return false
    }

    return true
  }

  /**
   * Loga erro no console
   */
  private logToConsole(error: ServiceError): void {
    const logMethod = error.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn'
    console[logMethod]('ServiceError:', error.toJSON())
  }

  /**
   * Envia erro para serviço remoto
   */
  private async logToRemoteService(error: ServiceError): Promise<void> {
    try {
      await fetch(this.config.remoteLoggingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error.toJSON()),
      })
    } catch (logError) {
      console.error('Failed to log error to remote service:', logError)
    }
  }

  /**
   * Obtém estatísticas de erros
   */
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByCode: Object.fromEntries(this.errorCounts),
      recentErrors: Array.from(this.lastErrors.entries())
        .filter(([, timestamp]) => Date.now() - timestamp < 60000) // Últimos 60 segundos
        .length,
    }
  }

  /**
   * Limpa estatísticas antigas
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    for (const [code, timestamp] of this.lastErrors.entries()) {
      if (timestamp < oneHourAgo) {
        this.lastErrors.delete(code)
        this.errorCounts.delete(code)
      }
    }
  }
}

// Instância global do error handler
export const errorHandler = new ErrorHandler()
