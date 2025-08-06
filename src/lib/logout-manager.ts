'use client'

import { supabase } from './api/supabase'

/**
 * Gerenciador de logout robusto que evita loops
 */
export class LogoutManager {
  private static instance: LogoutManager
  private isLoggingOut = false
  private logoutPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): LogoutManager {
    if (!LogoutManager.instance) {
      LogoutManager.instance = new LogoutManager()
    }
    return LogoutManager.instance
  }

  /**
   * Executa logout de forma segura, evitando múltiplas execuções
   */
  async performLogout(): Promise<void> {
    // Se já está fazendo logout, retornar a promise existente
    if (this.isLoggingOut && this.logoutPromise) {
      console.log('🔄 Logout já em andamento, aguardando...')
      return this.logoutPromise
    }

    // Marcar que logout está em andamento
    this.isLoggingOut = true
    
    // Criar nova promise de logout
    this.logoutPromise = this.executeLogout()
    
    try {
      await this.logoutPromise
    } finally {
      // Reset do estado
      this.isLoggingOut = false
      this.logoutPromise = null
    }
  }

  /**
   * Execução interna do logout
   */
  private async executeLogout(): Promise<void> {
    try {
      console.log('🚪 LogoutManager: Iniciando logout...')
      
      // Marcar no sessionStorage que logout está em andamento
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout-in-progress', 'true')
      }

      // Logout no Supabase
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn('⚠️ Erro no logout Supabase:', error)
        } else {
          console.log('✅ Logout Supabase realizado')
        }
      } catch (supabaseError) {
        console.warn('⚠️ Erro inesperado no logout Supabase:', supabaseError)
      }

      // Limpar dados locais
      this.clearLocalData()

      // Aguardar um pouco para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 200))

      console.log('✅ LogoutManager: Logout concluído')

    } catch (error) {
      console.error('❌ Erro no LogoutManager:', error)
      
      // Mesmo com erro, limpar dados locais
      this.clearLocalData()
    } finally {
      // Sempre remover a flag de logout em andamento
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('logout-in-progress')
      }
    }
  }

  /**
   * Limpa dados locais de autenticação
   */
  private clearLocalData(): void {
    try {
      console.log('🧹 Limpando dados locais...')

      if (typeof window === 'undefined') return

      // Lista de chaves para limpar
      const keysToRemove = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb-access-token',
        'sb-refresh-token',
        'user-preferences',
        'app-cache',
        'temp-data',
        'draft-data',
        'form-cache',
        'search-history'
      ]

      // Limpar localStorage
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Erro ao remover ${key}:`, error)
        }
      })

      // Limpar sessionStorage (exceto a flag de logout)
      const logoutFlag = sessionStorage.getItem('logout-in-progress')
      sessionStorage.clear()
      if (logoutFlag) {
        sessionStorage.setItem('logout-in-progress', logoutFlag)
      }

      // Limpar cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'auth-session',
        'user-session'
      ]

      cookiesToClear.forEach(cookieName => {
        try {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
        } catch (error) {
          console.warn(`Erro ao limpar cookie ${cookieName}:`, error)
        }
      })

      console.log('✅ Dados locais limpos')
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error)
    }
  }

  /**
   * Redireciona para login de forma segura
   */
  redirectToLogin(): void {
    try {
      console.log('🔄 Redirecionando para login...')
      
      // Usar replace para evitar histórico
      window.location.replace('/login')
    } catch (error) {
      console.error('❌ Erro no redirecionamento:', error)
      
      // Fallback
      try {
        window.location.href = '/login'
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de redirecionamento:', fallbackError)
      }
    }
  }

  /**
   * Logout completo com redirecionamento
   */
  async logoutAndRedirect(): Promise<void> {
    await this.performLogout()
    this.redirectToLogin()
  }

  /**
   * Verifica se logout está em andamento
   */
  isLogoutInProgress(): boolean {
    return this.isLoggingOut || 
           (typeof window !== 'undefined' && sessionStorage.getItem('logout-in-progress') === 'true')
  }

  /**
   * Força logout em caso de emergência
   */
  forceLogout(): void {
    console.log('🚨 Forçando logout...')
    
    // Reset do estado interno
    this.isLoggingOut = false
    this.logoutPromise = null
    
    // Limpar dados
    this.clearLocalData()
    
    // Remover flag
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('logout-in-progress')
    }
    
    // Redirecionar
    this.redirectToLogin()
  }
}

// Export da instância singleton
export const logoutManager = LogoutManager.getInstance()
