/**
 * Sistema de Error Recovery para autenticação
 * Implementa estratégias de recuperação automática para diferentes tipos de erro
 */

import { sessionManager } from './session-manager'
import { profileSync } from './profile-sync'
import { supabase } from './supabase'

// Tipos de erro que o sistema pode recuperar
export enum ErrorType {
  SESSION_EXPIRED = 'session_expired',
  PROFILE_MISSING = 'profile_missing',
  NETWORK_ERROR = 'network_error',
  DATABASE_ERROR = 'database_error',
  PERMISSION_ERROR = 'permission_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Estratégias de recovery disponíveis
export enum RecoveryStrategy {
  REFRESH_SESSION = 'refresh_session',
  RECREATE_PROFILE = 'recreate_profile',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  FALLBACK_MODE = 'fallback_mode',
  LOGOUT_USER = 'logout_user',
  NO_RECOVERY = 'no_recovery'
}

// Resultado de uma tentativa de recovery
export interface RecoveryResult {
  success: boolean
  strategy: RecoveryStrategy
  error?: Error
  fallbackMode?: boolean
  retryAfter?: number
}

// Configuração do circuit breaker
interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

// Estado do circuit breaker
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Classe principal do sistema de Error Recovery
 */
export class ErrorRecovery {
  private static instance: ErrorRecovery
  private circuitState: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private recoveryAttempts: Map<string, number> = new Map()
  
  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minuto
    monitoringPeriod: 300000 // 5 minutos
  }

  private constructor() {
    this.startMonitoring()
  }

  public static getInstance(): ErrorRecovery {
    if (!ErrorRecovery.instance) {
      ErrorRecovery.instance = new ErrorRecovery()
    }
    return ErrorRecovery.instance
  }

  /**
   * Método principal para recuperação de erros
   */
  public async recoverFromError(error: Error, context?: any): Promise<RecoveryResult> {
    const errorType = this.classifyError(error)
    const errorKey = `${errorType}_${context?.userId || 'anonymous'}`

    // Verificar circuit breaker
    if (this.circuitState === CircuitState.OPEN) {
      return {
        success: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        error: new Error('Circuit breaker is open - recovery temporarily disabled'),
        retryAfter: this.config.resetTimeout
      }
    }

    // Verificar limite de tentativas
    const attempts = this.recoveryAttempts.get(errorKey) || 0
    if (attempts >= 3) {
      this.recordFailure()
      return {
        success: false,
        strategy: RecoveryStrategy.FALLBACK_MODE,
        fallbackMode: true,
        error: new Error('Maximum recovery attempts exceeded')
      }
    }

    // Incrementar contador de tentativas
    this.recoveryAttempts.set(errorKey, attempts + 1)

    try {
      const strategy = this.selectRecoveryStrategy(errorType, attempts)
      const result = await this.executeRecoveryStrategy(strategy, error, context)

      if (result.success) {
        // Recovery bem-sucedido - limpar contadores
        this.recoveryAttempts.delete(errorKey)
        this.recordSuccess()
      } else {
        this.recordFailure()
      }

      return result
    } catch (recoveryError) {
      this.recordFailure()
      return {
        success: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        error: recoveryError as Error
      }
    }
  }

  /**
   * Classifica o tipo de erro baseado na mensagem e contexto
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()

    if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
      return ErrorType.SESSION_EXPIRED
    }

    if (message.includes('profile') && message.includes('not found')) {
      return ErrorType.PROFILE_MISSING
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK_ERROR
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION_ERROR
    }

    if (message.includes('database') || message.includes('postgres')) {
      return ErrorType.DATABASE_ERROR
    }

    return ErrorType.UNKNOWN_ERROR
  }

  /**
   * Seleciona a estratégia de recovery baseada no tipo de erro e tentativas
   */
  private selectRecoveryStrategy(errorType: ErrorType, attempts: number): RecoveryStrategy {
    switch (errorType) {
      case ErrorType.SESSION_EXPIRED:
        return attempts === 0 ? RecoveryStrategy.REFRESH_SESSION : RecoveryStrategy.LOGOUT_USER

      case ErrorType.PROFILE_MISSING:
        return RecoveryStrategy.RECREATE_PROFILE

      case ErrorType.NETWORK_ERROR:
        return RecoveryStrategy.RETRY_WITH_BACKOFF

      case ErrorType.DATABASE_ERROR:
        return attempts < 2 ? RecoveryStrategy.RETRY_WITH_BACKOFF : RecoveryStrategy.FALLBACK_MODE

      case ErrorType.PERMISSION_ERROR:
        return RecoveryStrategy.LOGOUT_USER

      default:
        return attempts < 2 ? RecoveryStrategy.RETRY_WITH_BACKOFF : RecoveryStrategy.FALLBACK_MODE
    }
  }

  /**
   * Executa a estratégia de recovery selecionada
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    originalError: Error,
    context?: any
  ): Promise<RecoveryResult> {
    console.log(`🔄 Executing recovery strategy: ${strategy}`)

    switch (strategy) {
      case RecoveryStrategy.REFRESH_SESSION:
        return await this.refreshSessionRecovery()

      case RecoveryStrategy.RECREATE_PROFILE:
        return await this.recreateProfileRecovery(context)

      case RecoveryStrategy.RETRY_WITH_BACKOFF:
        return await this.retryWithBackoffRecovery(originalError, context)

      case RecoveryStrategy.FALLBACK_MODE:
        return this.enableFallbackMode()

      case RecoveryStrategy.LOGOUT_USER:
        return await this.logoutUserRecovery()

      default:
        return {
          success: false,
          strategy,
          error: new Error('No recovery strategy available')
        }
    }
  }

  /**
   * Estratégia: Refresh da sessão
   */
  private async refreshSessionRecovery(): Promise<RecoveryResult> {
    try {
      await sessionManager.refreshSession()
      return {
        success: true,
        strategy: RecoveryStrategy.REFRESH_SESSION
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.REFRESH_SESSION,
        error: error as Error
      }
    }
  }

  /**
   * Estratégia: Recriar perfil
   */
  private async recreateProfileRecovery(context?: any): Promise<RecoveryResult> {
    try {
      if (!context?.userId) {
        throw new Error('User ID required for profile recreation')
      }

      await profileSync.ensureProfileExists(context.userId)
      return {
        success: true,
        strategy: RecoveryStrategy.RECREATE_PROFILE
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RECREATE_PROFILE,
        error: error as Error
      }
    }
  }

  /**
   * Estratégia: Retry com backoff exponencial
   */
  private async retryWithBackoffRecovery(
    originalError: Error,
    context?: any
  ): Promise<RecoveryResult> {
    const attempts = this.recoveryAttempts.get('retry_attempts') || 0
    const delay = Math.min(1000 * Math.pow(2, attempts), 10000) // Max 10s

    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      // Tentar reconectar com Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        return {
          success: true,
          strategy: RecoveryStrategy.RETRY_WITH_BACKOFF
        }
      } else {
        throw new Error('Session not available after retry')
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
        error: error as Error,
        retryAfter: delay * 2
      }
    }
  }

  /**
   * Estratégia: Modo fallback
   */
  private enableFallbackMode(): RecoveryResult {
    console.log('🚨 Enabling fallback mode - limited functionality')
    
    return {
      success: true,
      strategy: RecoveryStrategy.FALLBACK_MODE,
      fallbackMode: true
    }
  }

  /**
   * Estratégia: Logout do usuário
   */
  private async logoutUserRecovery(): Promise<RecoveryResult> {
    try {
      await sessionManager.signOut()
      return {
        success: true,
        strategy: RecoveryStrategy.LOGOUT_USER
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.LOGOUT_USER,
        error: error as Error
      }
    }
  }

  /**
   * Registra uma falha no circuit breaker
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.circuitState = CircuitState.OPEN
      console.log('🔴 Circuit breaker opened - recovery disabled temporarily')
    }
  }

  /**
   * Registra um sucesso no circuit breaker
   */
  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED
      this.failureCount = 0
      console.log('🟢 Circuit breaker closed - recovery re-enabled')
    }
  }

  /**
   * Inicia o monitoramento do circuit breaker
   */
  private startMonitoring(): void {
    setInterval(() => {
      const now = Date.now()
      
      // Reset do circuit breaker após timeout
      if (this.circuitState === CircuitState.OPEN && 
          now - this.lastFailureTime > this.config.resetTimeout) {
        this.circuitState = CircuitState.HALF_OPEN
        console.log('🟡 Circuit breaker half-open - testing recovery')
      }

      // Limpeza de tentativas antigas
      const cutoff = now - this.config.monitoringPeriod
      for (const [key, timestamp] of this.recoveryAttempts.entries()) {
        if (timestamp < cutoff) {
          this.recoveryAttempts.delete(key)
        }
      }
    }, 30000) // Check a cada 30 segundos
  }

  /**
   * Métodos públicos para monitoramento
   */
  public getCircuitState(): CircuitState {
    return this.circuitState
  }

  public getFailureCount(): number {
    return this.failureCount
  }

  public resetCircuit(): void {
    this.circuitState = CircuitState.CLOSED
    this.failureCount = 0
    this.recoveryAttempts.clear()
    console.log('🔄 Circuit breaker manually reset')
  }

  /**
   * Verifica se o sistema está em modo fallback
   */
  public isInFallbackMode(): boolean {
    return this.circuitState === CircuitState.OPEN
  }
}

// Instância singleton
export const errorRecovery = ErrorRecovery.getInstance()