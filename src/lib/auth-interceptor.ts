'use client'

import { supabase } from './supabase'
import { sessionManager } from './session-manager'
import { profileSync } from './profile-sync'
import { errorRecovery, ErrorType, RecoveryStrategy } from './error-recovery'

// Tipos para o interceptor
export interface InterceptorConfig {
  maxRetries: number
  retryDelay: number
  enableAutoRecovery: boolean
  enableCircuitBreaker: boolean
}

export interface InterceptorError {
  type: 'auth' | 'network' | 'server' | 'unknown'
  code?: string
  message: string
  statusCode?: number
  retryable: boolean
}

export interface InterceptorResult<T = any> {
  success: boolean
  data?: T
  error?: InterceptorError
  retryCount?: number
}

// Estados do Circuit Breaker
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class AuthInterceptor {
  private static instance: AuthInterceptor
  private config: InterceptorConfig
  private circuitState: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private circuitTimeout = 60000 // 1 minuto

  private constructor(config?: Partial<InterceptorConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoRecovery: true,
      enableCircuitBreaker: true,
      ...config
    }
  }

  static getInstance(config?: Partial<InterceptorConfig>): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor(config)
    }
    return AuthInterceptor.instance
  }

  // Interceptar requisições do Supabase
  async intercept<T>(
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<InterceptorResult<T>> {
    // Verificar circuit breaker
    if (this.config.enableCircuitBreaker && this.isCircuitOpen()) {
      return {
        success: false,
        error: {
          type: 'server',
          message: 'Serviço temporariamente indisponível (Circuit Breaker)',
          retryable: false
        }
      }
    }

    let lastError: InterceptorError | null = null
    let retryCount = 0

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 AuthInterceptor: Tentativa ${attempt}/${this.config.maxRetries} para ${context}`)

        const result = await operation()
        
        // Sucesso - resetar circuit breaker
        this.onSuccess()
        
        return {
          success: true,
          data: result,
          retryCount: attempt - 1
        }

      } catch (error: any) {
        retryCount = attempt - 1
        lastError = this.classifyError(error)
        
        console.error(`❌ AuthInterceptor: Erro na tentativa ${attempt}:`, {
          context,
          error: lastError,
          originalError: error
        })

        // Se é erro 500 ou erro de autenticação, tentar recovery
        if (this.shouldAttemptRecovery(lastError)) {
          const recoverySuccess = await this.attemptRecovery(lastError, context)
          
          if (recoverySuccess && attempt < this.config.maxRetries) {
            console.log('✅ Recovery bem-sucedido, tentando novamente...')
            continue
          }
        }

        // Se não é retryable ou é a última tentativa
        if (!lastError.retryable || attempt === this.config.maxRetries) {
          this.onFailure(lastError)
          break
        }

        // Aguardar antes da próxima tentativa (backoff exponencial)
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
          await this.delay(delay)
        }
      }
    }

    return {
      success: false,
      error: lastError!,
      retryCount
    }
  }

  // Classificar tipo de erro
  private classifyError(error: any): InterceptorError {
    // Erro de rede
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return {
        type: 'network',
        message: 'Erro de conexão de rede',
        retryable: true
      }
    }

    // Erro HTTP
    if (error.status || error.statusCode) {
      const statusCode = error.status || error.statusCode

      // Erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        return {
          type: 'auth',
          code: error.code,
          message: 'Erro de autenticação',
          statusCode,
          retryable: true
        }
      }

      // Erro interno do servidor
      if (statusCode >= 500) {
        return {
          type: 'server',
          code: error.code,
          message: 'Erro interno do servidor',
          statusCode,
          retryable: true
        }
      }

      // Outros erros HTTP
      return {
        type: 'server',
        code: error.code,
        message: error.message || 'Erro do servidor',
        statusCode,
        retryable: statusCode >= 500
      }
    }

    // Erros específicos do Supabase
    if (error.code) {
      // Erro de sessão expirada
      if (error.code === 'invalid_token' || error.code === 'token_expired') {
        return {
          type: 'auth',
          code: error.code,
          message: 'Sessão expirada',
          retryable: true
        }
      }

      // Erro de RLS
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return {
          type: 'auth',
          code: error.code,
          message: 'Erro de permissão (RLS)',
          retryable: true
        }
      }
    }

    // Erro genérico
    return {
      type: 'unknown',
      message: error.message || 'Erro desconhecido',
      retryable: false
    }
  }

  // Verificar se deve tentar recovery
  private shouldAttemptRecovery(error: InterceptorError): boolean {
    if (!this.config.enableAutoRecovery) return false

    return (
      error.type === 'auth' ||
      error.type === 'server' ||
      (error.statusCode && error.statusCode >= 500)
    )
  }

  // Tentar recovery automático usando o sistema de Error Recovery
  private async attemptRecovery(error: InterceptorError, context: string): Promise<boolean> {
    try {
      console.log('🔧 AuthInterceptor: Delegando recovery para ErrorRecovery system...', { error, context })

      // Criar erro compatível com o sistema de Error Recovery
      const recoveryError = new Error(error.message)
      
      // Adicionar contexto adicional
      const recoveryContext = {
        interceptorError: error,
        context,
        userId: await this.getCurrentUserId()
      }

      // Usar o sistema de Error Recovery
      const recoveryResult = await errorRecovery.recoverFromError(recoveryError, recoveryContext)

      if (recoveryResult.success) {
        console.log(`✅ Recovery bem-sucedido usando estratégia: ${recoveryResult.strategy}`)
        
        // Se entrou em modo fallback, notificar
        if (recoveryResult.fallbackMode) {
          console.log('⚠️ Sistema operando em modo fallback')
        }
        
        return true
      } else {
        console.log(`❌ Recovery falhou com estratégia: ${recoveryResult.strategy}`, recoveryResult.error)
        
        // Se foi sugerido logout, executar
        if (recoveryResult.strategy === RecoveryStrategy.LOGOUT_USER) {
          await this.performAutoLogout('Recovery system requested logout')
        }
        
        return false
      }
    } catch (recoveryError) {
      console.error('❌ Erro durante recovery:', recoveryError)
      return false
    }
  }

  // Obter ID do usuário atual para contexto de recovery
  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const session = await sessionManager.getCurrentSession()
      return session?.user?.id
    } catch {
      return undefined
    }
  }

  // Circuit Breaker
  private isCircuitOpen(): boolean {
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now()
      if (now - this.lastFailureTime > this.circuitTimeout) {
        this.circuitState = CircuitState.HALF_OPEN
        console.log('🔄 Circuit Breaker: Mudando para HALF_OPEN')
        return false
      }
      return true
    }
    return false
  }

  private onSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED
      console.log('✅ Circuit Breaker: Mudando para CLOSED')
    }
    this.failureCount = 0
  }

  private onFailure(error: InterceptorError): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.config.enableCircuitBreaker && this.failureCount >= 5) {
      this.circuitState = CircuitState.OPEN
      console.log('🚨 Circuit Breaker: Mudando para OPEN devido a muitas falhas')
    }
  }

  // Logout automático em caso de falha crítica
  private async performAutoLogout(reason: string): Promise<void> {
    try {
      console.log('🚪 AuthInterceptor: Fazendo logout automático:', reason)
      
      await sessionManager.clearSession()
      
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const redirectUrl = `/login?message=auto-logout&reason=${encodeURIComponent(reason)}&redirect=${encodeURIComponent(currentPath)}`
        window.location.href = redirectUrl
      }
    } catch (error) {
      console.error('❌ Erro durante logout automático:', error)
    }
  }

  // Utilitários
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Métodos públicos para monitoramento
  getCircuitState(): CircuitState {
    return this.circuitState
  }

  getFailureCount(): number {
    return this.failureCount
  }

  resetCircuit(): void {
    this.circuitState = CircuitState.CLOSED
    this.failureCount = 0
    this.lastFailureTime = 0
    console.log('🔄 Circuit Breaker resetado manualmente')
  }

  // Wrapper para operações do Supabase
  async wrapSupabaseOperation<T>(
    operation: () => Promise<{ data: T; error: any }>,
    context: string = 'supabase-operation'
  ): Promise<InterceptorResult<T>> {
    return this.intercept(async () => {
      const { data, error } = await operation()
      
      if (error) {
        throw error
      }
      
      return data
    }, context)
  }
}

// Export singleton instance
export const authInterceptor = AuthInterceptor.getInstance()

// Hook para usar o interceptor em componentes React
export function useAuthInterceptor() {
  return {
    intercept: authInterceptor.intercept.bind(authInterceptor),
    wrapSupabaseOperation: authInterceptor.wrapSupabaseOperation.bind(authInterceptor),
    getCircuitState: authInterceptor.getCircuitState.bind(authInterceptor),
    getFailureCount: authInterceptor.getFailureCount.bind(authInterceptor),
    resetCircuit: authInterceptor.resetCircuit.bind(authInterceptor)
  }
}