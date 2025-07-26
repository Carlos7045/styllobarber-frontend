'use client'

import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { UserProfile } from '@/contexts/AuthContext'

// Interfaces
export interface SessionHealth {
  isValid: boolean
  lastValidated: Date
  errorCount: number
  lastError?: Error
}

export interface SessionEvent {
  type: 'login' | 'logout' | 'refresh' | 'error' | 'recovery'
  userId?: string
  timestamp: Date
  details: Record<string, any>
  error?: Error
}

// SessionManager Class
export class SessionManager {
  private static instance: SessionManager
  private sessionHealth: SessionHealth
  private eventLog: SessionEvent[] = []
  private maxRetries = 3
  private retryDelay = 1000

  private constructor() {
    this.sessionHealth = {
      isValid: false,
      lastValidated: new Date(),
      errorCount: 0
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Gestão de sessão
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        this.logSessionEvent({
          type: 'error',
          timestamp: new Date(),
          details: { action: 'getCurrentSession' },
          error
        })
        return null
      }

      this.updateSessionHealth(true)
      return session
    } catch (error) {
      this.updateSessionHealth(false, error as Error)
      return null
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession()
      const isValid = !!session?.user

      this.updateSessionHealth(isValid)
      
      if (isValid) {
        this.logSessionEvent({
          type: 'refresh',
          userId: session!.user.id,
          timestamp: new Date(),
          details: { action: 'validateSession', result: 'valid' }
        })
      }

      return isValid
    } catch (error) {
      this.updateSessionHealth(false, error as Error)
      return false
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        this.logSessionEvent({
          type: 'error',
          timestamp: new Date(),
          details: { action: 'refreshSession' },
          error
        })
        return false
      }

      const isValid = !!session?.user
      this.updateSessionHealth(isValid)
      
      if (isValid) {
        this.logSessionEvent({
          type: 'refresh',
          userId: session!.user.id,
          timestamp: new Date(),
          details: { action: 'refreshSession', result: 'success' }
        })
      }

      return isValid
    } catch (error) {
      this.updateSessionHealth(false, error as Error)
      return false
    }
  }

  async signOut(): Promise<boolean> {
    try {
      console.log('🚪 SessionManager: Iniciando logout...')
      
      await supabase.auth.signOut()
      
      this.sessionHealth = {
        isValid: false,
        lastValidated: new Date(),
        errorCount: 0
      }

      this.logSessionEvent({
        type: 'logout',
        timestamp: new Date(),
        details: { action: 'signOut', success: true }
      })

      console.log('✅ SessionManager: Logout realizado com sucesso')
      return true
    } catch (error) {
      console.error('❌ SessionManager: Erro no logout:', error)
      
      this.logSessionEvent({
        type: 'error',
        timestamp: new Date(),
        details: { action: 'signOut', success: false },
        error: error as Error
      })
      
      return false
    }
  }

  async clearSession(): Promise<void> {
    try {
      await supabase.auth.signOut()
      
      this.sessionHealth = {
        isValid: false,
        lastValidated: new Date(),
        errorCount: 0
      }

      this.logSessionEvent({
        type: 'logout',
        timestamp: new Date(),
        details: { action: 'clearSession' }
      })
    } catch (error) {
      console.error('Erro ao limpar sessão:', error)
    }
  }

  // Recovery
  async recoverFromError(): Promise<boolean> {
    console.log('🔄 Tentando recuperar da falha de sessão...')
    
    try {
      // Tentar refresh primeiro
      const refreshSuccess = await this.refreshSession()
      if (refreshSuccess) {
        console.log('✅ Sessão recuperada com refresh')
        this.sessionHealth.errorCount = 0
        return true
      }

      // Se refresh falhar, validar sessão atual
      const isValid = await this.validateSession()
      if (isValid) {
        console.log('✅ Sessão ainda válida')
        this.sessionHealth.errorCount = 0
        return true
      }

      // Se tudo falhar, fazer logout
      console.log('❌ Não foi possível recuperar sessão - fazendo logout')
      await this.clearSession()
      return false
    } catch (error) {
      console.error('❌ Erro na recuperação:', error)
      await this.clearSession()
      return false
    }
  }

  async handleSessionExpiry(): Promise<void> {
    console.log('⏰ Sessão expirada - fazendo logout automático')
    
    this.logSessionEvent({
      type: 'error',
      timestamp: new Date(),
      details: { action: 'handleSessionExpiry', reason: 'session_expired' }
    })

    await this.clearSession()
    
    // Redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?message=session-expired'
    }
  }

  // Monitoring
  getSessionHealth(): SessionHealth {
    return { ...this.sessionHealth }
  }

  logSessionEvent(event: SessionEvent): void {
    this.eventLog.push(event)
    
    // Manter apenas os últimos 100 eventos
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100)
    }

    // Log no console para debugging
    console.log(`🔐 Session Event [${event.type}]:`, {
      userId: event.userId,
      details: event.details,
      error: event.error?.message
    })
  }

  getEventLog(): SessionEvent[] {
    return [...this.eventLog]
  }

  // Helpers privados
  private updateSessionHealth(isValid: boolean, error?: Error): void {
    this.sessionHealth = {
      isValid,
      lastValidated: new Date(),
      errorCount: error ? this.sessionHealth.errorCount + 1 : 0,
      lastError: error
    }
  }

  // Método para retry com backoff exponencial
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        this.logSessionEvent({
          type: 'error',
          timestamp: new Date(),
          details: { 
            context, 
            attempt, 
            maxRetries: this.maxRetries 
          },
          error: lastError
        })

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Se todas as tentativas falharam
    this.updateSessionHealth(false, lastError!)
    return null
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()