/**
 * Sistema de logging estruturado para autenticação
 * Implementa diferentes níveis de log e formatação consistente
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  context?: any
  userId?: string
  sessionId?: string
  error?: Error
  metadata?: Record<string, any>
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxStorageEntries: number
  enableRemoteLogging: boolean
}

/**
 * Classe principal do sistema de logging
 */
export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private logStorage: LogEntry[] = []
  private listeners: ((entry: LogEntry) => void)[] = []

  private constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      enableRemoteLogging: false,
      ...config
    }
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config)
    }
    return Logger.instance
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, category: string, message: string, context?: any, error?: Error): void {
    // Verificar se deve logar baseado no nível
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      error,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }
    }

    // Adicionar informações de sessão se disponível
    if (typeof window !== 'undefined' && (window as any).__auth_session_id) {
      entry.sessionId = (window as any).__auth_session_id
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logToStorage(entry)
    }

    // Notificar listeners
    this.notifyListeners(entry)

    // Remote logging (se habilitado)
    if (this.config.enableRemoteLogging) {
      this.logToRemote(entry)
    }
  }

  /**
   * Logging para console com formatação
   */
  private logToConsole(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level)
    const levelName = LogLevel[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    
    const prefix = `${emoji} [${timestamp}] ${levelName} [${entry.category}]:`
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context)
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context)
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, entry.message, entry.context, entry.error)
        break
    }
  }

  /**
   * Logging para storage local
   */
  private logToStorage(entry: LogEntry): void {
    this.logStorage.push(entry)
    
    // Limitar tamanho do storage
    if (this.logStorage.length > this.config.maxStorageEntries) {
      this.logStorage = this.logStorage.slice(-this.config.maxStorageEntries)
    }
  }

  /**
   * Logging remoto (placeholder para implementação futura)
   */
  private logToRemote(entry: LogEntry): void {
    // TODO: Implementar envio para serviço de logging remoto
    // Por exemplo: Sentry, LogRocket, etc.
  }

  /**
   * Notificar listeners
   */
  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry)
      } catch (error) {
        console.error('Erro em listener de log:', error)
      }
    })
  }

  /**
   * Obter emoji para nível de log
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🐛'
      case LogLevel.INFO: return 'ℹ️'
      case LogLevel.WARN: return '⚠️'
      case LogLevel.ERROR: return '❌'
      case LogLevel.CRITICAL: return '🚨'
      default: return '📝'
    }
  }

  // Métodos públicos de logging
  public debug(category: string, message: string, context?: any): void {
    this.log(LogLevel.DEBUG, category, message, context)
  }

  public info(category: string, message: string, context?: any): void {
    this.log(LogLevel.INFO, category, message, context)
  }

  public warn(category: string, message: string, context?: any): void {
    this.log(LogLevel.WARN, category, message, context)
  }

  public error(category: string, message: string, context?: any, error?: Error): void {
    this.log(LogLevel.ERROR, category, message, context, error)
  }

  public critical(category: string, message: string, context?: any, error?: Error): void {
    this.log(LogLevel.CRITICAL, category, message, context, error)
  }

  // Métodos de gerenciamento
  public addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  public getLogs(filter?: {
    level?: LogLevel
    category?: string
    since?: Date
    limit?: number
  }): LogEntry[] {
    let logs = [...this.logStorage]

    if (filter) {
      if (filter.level !== undefined) {
        logs = logs.filter(log => log.level >= filter.level!)
      }

      if (filter.category) {
        logs = logs.filter(log => log.category === filter.category)
      }

      if (filter.since) {
        logs = logs.filter(log => new Date(log.timestamp) >= filter.since!)
      }

      if (filter.limit) {
        logs = logs.slice(-filter.limit)
      }
    }

    return logs
  }

  public clearLogs(): void {
    this.logStorage = []
  }

  public exportLogs(): string {
    return JSON.stringify(this.logStorage, null, 2)
  }

  public getStats(): {
    totalLogs: number
    logsByLevel: Record<string, number>
    logsByCategory: Record<string, number>
    oldestLog?: string
    newestLog?: string
  } {
    const stats = {
      totalLogs: this.logStorage.length,
      logsByLevel: {} as Record<string, number>,
      logsByCategory: {} as Record<string, number>,
      oldestLog: undefined as string | undefined,
      newestLog: undefined as string | undefined
    }

    if (this.logStorage.length > 0) {
      stats.oldestLog = this.logStorage[0].timestamp
      stats.newestLog = this.logStorage[this.logStorage.length - 1].timestamp
    }

    this.logStorage.forEach(log => {
      const levelName = LogLevel[log.level]
      stats.logsByLevel[levelName] = (stats.logsByLevel[levelName] || 0) + 1
      stats.logsByCategory[log.category] = (stats.logsByCategory[log.category] || 0) + 1
    })

    return stats
  }
}

// Instância singleton
export const logger = Logger.getInstance()

// Logger específico para autenticação
export class AuthLogger {
  private static instance: AuthLogger
  private logger: Logger

  private constructor() {
    this.logger = Logger.getInstance()
  }

  public static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger()
    }
    return AuthLogger.instance
  }

  // Métodos específicos para autenticação
  public sessionStart(userId: string, sessionId: string): void {
    this.logger.info('AUTH_SESSION', 'Sessão iniciada', {
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    })
  }

  public sessionEnd(userId: string, sessionId: string, reason: string): void {
    this.logger.info('AUTH_SESSION', 'Sessão finalizada', {
      userId,
      sessionId,
      reason,
      timestamp: new Date().toISOString()
    })
  }

  public sessionValidation(userId: string, isValid: boolean, details?: any): void {
    this.logger.debug('AUTH_VALIDATION', 'Validação de sessão', {
      userId,
      isValid,
      details,
      timestamp: new Date().toISOString()
    })
  }

  public profileSync(userId: string, success: boolean, details?: any): void {
    const level = success ? 'info' : 'warn'
    this.logger[level]('AUTH_PROFILE', 'Sincronização de perfil', {
      userId,
      success,
      details,
      timestamp: new Date().toISOString()
    })
  }

  public errorRecovery(userId: string, errorType: string, strategy: string, success: boolean): void {
    this.logger.info('AUTH_RECOVERY', 'Tentativa de recovery', {
      userId,
      errorType,
      strategy,
      success,
      timestamp: new Date().toISOString()
    })
  }

  public circuitBreakerStateChange(oldState: string, newState: string, reason: string): void {
    this.logger.warn('AUTH_CIRCUIT', 'Mudança de estado do circuit breaker', {
      oldState,
      newState,
      reason,
      timestamp: new Date().toISOString()
    })
  }

  public performanceMetric(operation: string, duration: number, success: boolean): void {
    this.logger.debug('AUTH_PERFORMANCE', 'Métrica de performance', {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString()
    })
  }

  public securityEvent(eventType: string, userId?: string, details?: any): void {
    this.logger.critical('AUTH_SECURITY', `Evento de segurança: ${eventType}`, {
      userId,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// Instância singleton do AuthLogger
export const authLogger = AuthLogger.getInstance()