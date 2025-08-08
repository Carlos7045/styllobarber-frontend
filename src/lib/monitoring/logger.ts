/**
 * Sistema de logging estruturado
 * Fornece logging consistente com diferentes níveis e contextos
 */

// Níveis de log
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Interface para entrada de log
export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  duration?: number
  error?: Error
  tags?: string[]
}

// Interface para configuração do logger
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxStorageEntries: number
  enableRemoteLogging: boolean
  remoteEndpoint?: string
  enablePerformanceLogging: boolean
  sensitiveFields: string[]
}

// Configuração padrão
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableRemoteLogging: false,
  enablePerformanceLogging: true,
  sensitiveFields: ['password', 'token', 'key', 'secret', 'auth', 'credit_card'],
}

// Classe principal do Logger
export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private logEntries: LogEntry[] = []
  private performanceMarks = new Map<string, number>()

  private constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config)
    }
    return Logger.instance
  }

  /**
   * Log de debug
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log de informação
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log de aviso
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log de erro
   */
  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error })
  }

  /**
   * Log crítico
   */
  public critical(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, { ...context, error })
  }

  /**
   * Log principal
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Verificar se deve logar baseado no nível
    if (level < this.config.level) return

    // Criar entrada de log
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message: this.sanitizeMessage(message),
      context: this.sanitizeContext(context),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      component: context?.component,
      action: context?.action,
      duration: context?.duration,
      error: context?.error,
      tags: context?.tags,
    }

    // Armazenar se habilitado
    if (this.config.enableStorage) {
      this.storeLogEntry(entry)
    }

    // Log no console se habilitado
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // Enviar para servidor remoto se habilitado
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(entry)
    }
  }

  /**
   * Inicia medição de performance
   */
  public startPerformance(operationId: string): void {
    if (!this.config.enablePerformanceLogging) return

    this.performanceMarks.set(operationId, performance.now())
    this.debug(`Performance tracking started: ${operationId}`)
  }

  /**
   * Finaliza medição de performance
   */
  public endPerformance(operationId: string, context?: Record<string, any>): number | null {
    if (!this.config.enablePerformanceLogging) return null

    const startTime = this.performanceMarks.get(operationId)
    if (!startTime) {
      this.warn(`Performance mark not found: ${operationId}`)
      return null
    }

    const duration = performance.now() - startTime
    this.performanceMarks.delete(operationId)

    // Log da performance
    this.info(`Performance: ${operationId}`, {
      ...context,
      duration: Math.round(duration),
      operationId,
    })

    return duration
  }

  /**
   * Log de ação do usuário
   */
  public logUserAction(action: string, component: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      component,
      action,
      tags: ['user-action'],
    })
  }

  /**
   * Log de erro de API
   */
  public logApiError(
    endpoint: string,
    method: string,
    status: number,
    error: Error,
    context?: Record<string, any>
  ): void {
    this.error(`API Error: ${method} ${endpoint} (${status})`, error, {
      ...context,
      endpoint,
      method,
      status,
      tags: ['api-error'],
    })
  }

  /**
   * Log de sucesso de API
   */
  public logApiSuccess(
    endpoint: string,
    method: string,
    status: number,
    duration?: number,
    context?: Record<string, any>
  ): void {
    this.info(`API Success: ${method} ${endpoint} (${status})`, {
      ...context,
      endpoint,
      method,
      status,
      duration,
      tags: ['api-success'],
    })
  }

  /**
   * Log de navegação
   */
  public logNavigation(from: string, to: string, context?: Record<string, any>): void {
    this.info(`Navigation: ${from} → ${to}`, {
      ...context,
      from,
      to,
      tags: ['navigation'],
    })
  }

  /**
   * Armazenar entrada de log
   */
  private storeLogEntry(entry: LogEntry): void {
    this.logEntries.unshift(entry)

    // Manter apenas as últimas N entradas
    if (this.logEntries.length > this.config.maxStorageEntries) {
      this.logEntries = this.logEntries.slice(0, this.config.maxStorageEntries)
    }
  }

  /**
   * Log no console com formatação
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] ${levelName}:`

    // Preparar dados para log
    const logData = {
      message: entry.message,
      ...(entry.context && Object.keys(entry.context).length > 0 && { context: entry.context }),
      ...(entry.component && { component: entry.component }),
      ...(entry.action && { action: entry.action }),
      ...(entry.duration && { duration: `${entry.duration}ms` }),
      ...(entry.tags && { tags: entry.tags }),
    }

    // Log baseado no nível
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logData)
        break
      case LogLevel.INFO:
        console.info(prefix, logData)
        break
      case LogLevel.WARN:
        console.warn(prefix, logData)
        break
      case LogLevel.ERROR:
        console.error(prefix, logData, entry.error || '')
        break
      case LogLevel.CRITICAL:
        console.error(`🚨 ${prefix}`, logData, entry.error?.message || entry.error || '')
        break
    }
  }

  /**
   * Enviar para servidor remoto
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          error: entry.error
            ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack,
              }
            : undefined,
        }),
      })
    } catch (error) {
      // Não logar erro de logging para evitar loop infinito
      console.warn('Failed to send log to remote endpoint:', error)
    }
  }

  /**
   * Sanitizar mensagem
   */
  private sanitizeMessage(message: string): string {
    let sanitized = message

    this.config.sensitiveFields.forEach((field) => {
      const regex = new RegExp(`${field}[=:]\\s*\\S+`, 'gi')
      sanitized = sanitized.replace(regex, `${field}=***`)
    })

    return sanitized
  }

  /**
   * Sanitizar contexto
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    const sanitized = { ...context }

    this.config.sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '***'
      }
    })

    // Sanitizar objetos aninhados
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key])
      }
    })

    return sanitized
  }

  /**
   * Gerar ID único para log
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Obter ID do usuário atual
   */
  private getCurrentUserId(): string | undefined {
    // Implementar lógica para obter ID do usuário
    // Por exemplo, do localStorage ou contexto de autenticação
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }

  /**
   * Obter ID da sessão
   */
  private getSessionId(): string | undefined {
    // Implementar lógica para obter ID da sessão
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sessionId') || undefined
    }
    return undefined
  }

  /**
   * Métodos públicos para análise
   */
  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let logs = this.logEntries

    if (level !== undefined) {
      logs = logs.filter((entry) => entry.level >= level)
    }

    if (limit) {
      logs = logs.slice(0, limit)
    }

    return logs
  }

  public getLogsByComponent(component: string, limit?: number): LogEntry[] {
    const logs = this.logEntries.filter((entry) => entry.component === component)
    return limit ? logs.slice(0, limit) : logs
  }

  public getLogsByTag(tag: string, limit?: number): LogEntry[] {
    const logs = this.logEntries.filter((entry) => entry.tags?.includes(tag))
    return limit ? logs.slice(0, limit) : logs
  }

  public getErrorLogs(limit?: number): LogEntry[] {
    return this.getLogs(LogLevel.ERROR, limit)
  }

  public getLogStats(): Record<string, number> {
    const stats = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.CRITICAL]: 0,
    }

    this.logEntries.forEach((entry) => {
      stats[entry.level]++
    })

    return stats
  }

  public clearLogs(): void {
    this.logEntries = []
  }

  public exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2)
  }
}

// Instância singleton
export const logger = Logger.getInstance()

// Funções de conveniência
export const debug = (message: string, context?: Record<string, any>) =>
  logger.debug(message, context)

export const info = (message: string, context?: Record<string, any>) =>
  logger.info(message, context)

export const warn = (message: string, context?: Record<string, any>) =>
  logger.warn(message, context)

export const error = (message: string, err?: Error, context?: Record<string, any>) =>
  logger.error(message, err, context)

export const critical = (message: string, err?: Error, context?: Record<string, any>) =>
  logger.critical(message, err, context)

export const startPerformance = (operationId: string) => logger.startPerformance(operationId)

export const endPerformance = (operationId: string, context?: Record<string, any>) =>
  logger.endPerformance(operationId, context)

export const logUserAction = (action: string, component: string, context?: Record<string, any>) =>
  logger.logUserAction(action, component, context)

export const logApiError = (
  endpoint: string,
  method: string,
  status: number,
  err: Error,
  context?: Record<string, any>
) => logger.logApiError(endpoint, method, status, err, context)

export const logApiSuccess = (
  endpoint: string,
  method: string,
  status: number,
  duration?: number,
  context?: Record<string, any>
) => logger.logApiSuccess(endpoint, method, status, duration, context)
