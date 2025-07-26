/**
 * Utilitários para autenticação e gerenciamento de sessão
 */

/**
 * Lista de chaves do localStorage que devem ser limpas no logout
 */
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
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

/**
 * Lista de cookies que devem ser limpos no logout
 */
const COOKIES_TO_CLEAR = [
  'sb-access-token',
  'sb-refresh-token',
  'auth-session',
  'user-session',
  'remember-me',
  'session-id',
  'csrf-token'
]

/**
 * Limpa todos os dados locais relacionados à autenticação
 */
export function clearAuthLocalData(): void {
  try {
    console.log('🧹 Iniciando limpeza de dados locais...')

    // Limpar localStorage
    LOCAL_STORAGE_KEYS_TO_CLEAR.forEach(key => {
      try {
        localStorage.removeItem(key)
        console.log(`✅ Removido do localStorage: ${key}`)
      } catch (error) {
        console.warn(`⚠️ Erro ao remover ${key} do localStorage:`, error)
      }
    })

    // Limpar sessionStorage completamente
    try {
      sessionStorage.clear()
      console.log('✅ SessionStorage limpo')
    } catch (error) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', error)
    }

    // Limpar cookies
    COOKIES_TO_CLEAR.forEach(cookieName => {
      try {
        // Limpar para o domínio atual
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        
        // Limpar para subdomínios
        const hostname = window.location.hostname
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`
        
        console.log(`✅ Cookie removido: ${cookieName}`)
      } catch (error) {
        console.warn(`⚠️ Erro ao remover cookie ${cookieName}:`, error)
      }
    })

    console.log('✅ Limpeza de dados locais concluída')
  } catch (error) {
    console.error('❌ Erro na limpeza de dados locais:', error)
  }
}

/**
 * Verifica se há dados de sessão residuais
 */
export function hasResidualSessionData(): boolean {
  try {
    // Verificar localStorage
    const hasLocalStorageData = LOCAL_STORAGE_KEYS_TO_CLEAR.some(key => {
      return localStorage.getItem(key) !== null
    })

    // Verificar sessionStorage
    const hasSessionStorageData = sessionStorage.length > 0

    // Verificar cookies (básico)
    const hasCookieData = COOKIES_TO_CLEAR.some(cookieName => {
      return document.cookie.includes(`${cookieName}=`)
    })

    return hasLocalStorageData || hasSessionStorageData || hasCookieData
  } catch (error) {
    console.warn('Erro ao verificar dados residuais:', error)
    return false
  }
}

/**
 * Força limpeza completa (para casos extremos)
 */
export function forceCleanup(): void {
  try {
    console.log('🚨 Iniciando limpeza forçada...')

    // Limpar todo o localStorage
    localStorage.clear()

    // Limpar todo o sessionStorage
    sessionStorage.clear()

    // Tentar limpar todos os cookies possíveis
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
      }
    })

    console.log('✅ Limpeza forçada concluída')
  } catch (error) {
    console.error('❌ Erro na limpeza forçada:', error)
  }
}

/**
 * Salva dados temporários antes do logout (se necessário)
 */
export function saveTemporaryData(data: Record<string, any>): void {
  try {
    const tempData = {
      timestamp: Date.now(),
      data
    }
    
    localStorage.setItem('temp-logout-data', JSON.stringify(tempData))
    console.log('💾 Dados temporários salvos')
  } catch (error) {
    console.warn('⚠️ Erro ao salvar dados temporários:', error)
  }
}

/**
 * Recupera dados temporários após login (se existirem)
 */
export function getTemporaryData(): Record<string, any> | null {
  try {
    const tempDataStr = localStorage.getItem('temp-logout-data')
    if (!tempDataStr) return null

    const tempData = JSON.parse(tempDataStr)
    
    // Verificar se os dados não são muito antigos (1 hora)
    const oneHour = 60 * 60 * 1000
    if (Date.now() - tempData.timestamp > oneHour) {
      localStorage.removeItem('temp-logout-data')
      return null
    }

    return tempData.data
  } catch (error) {
    console.warn('⚠️ Erro ao recuperar dados temporários:', error)
    return null
  }
}

/**
 * Remove dados temporários
 */
export function clearTemporaryData(): void {
  try {
    localStorage.removeItem('temp-logout-data')
    console.log('🗑️ Dados temporários removidos')
  } catch (error) {
    console.warn('⚠️ Erro ao remover dados temporários:', error)
  }
}

/**
 * Configurações de logout
 */
export interface LogoutOptions {
  clearLocalData?: boolean
  forceCleanup?: boolean
  saveTemporaryData?: Record<string, any>
  redirectTo?: string
  showConfirmation?: boolean
}

/**
 * Configurações padrão de logout
 */
export const DEFAULT_LOGOUT_OPTIONS: LogoutOptions = {
  clearLocalData: true,
  forceCleanup: false,
  redirectTo: '/login',
  showConfirmation: false
}

/**
 * Verifica se o logout deve mostrar confirmação baseado no contexto
 */
export function shouldShowLogoutConfirmation(): boolean {
  try {
    // Verificar se há dados não salvos (formulários, rascunhos, etc.)
    const hasUnsavedData = localStorage.getItem('draft-data') !== null ||
                          sessionStorage.getItem('form-data') !== null

    // Verificar se há operações em andamento
    const hasOngoingOperations = sessionStorage.getItem('ongoing-operations') !== null

    return hasUnsavedData || hasOngoingOperations
  } catch (error) {
    console.warn('Erro ao verificar necessidade de confirmação:', error)
    return false
  }
}

/**
 * Prepara o ambiente para logout seguro
 */
export function prepareForLogout(): Promise<void> {
  return new Promise((resolve) => {
    try {
      console.log('🔧 Preparando ambiente para logout...')
      
      // Marcar que logout está em andamento
      sessionStorage.setItem('logout-in-progress', 'true')
      
      // Cancelar requisições pendentes (se houver um sistema de cancelamento)
      if (window.AbortController) {
        // Implementar cancelamento de requisições se necessário
      }

      // Salvar dados importantes temporariamente
      const importantData = {
        lastRoute: window.location.pathname,
        timestamp: Date.now()
      }
      
      saveTemporaryData(importantData)

      // Aguardar um pouco para garantir que operações assíncronas terminem
      setTimeout(() => {
        console.log('✅ Ambiente preparado para logout')
        resolve()
      }, 100)
    } catch (error) {
      console.warn('Erro na preparação para logout:', error)
      resolve()
    }
  })
}

/**
 * Finaliza o processo de logout
 */
export function finalizeLogout(): void {
  try {
    console.log('🏁 Finalizando processo de logout...')
    
    // Limpar dados locais
    clearAuthLocalData()
    
    // Remover flag de logout em andamento
    sessionStorage.removeItem('logout-in-progress')
    
    console.log('✅ Logout finalizado')
  } catch (error) {
    console.warn('Erro na finalização do logout:', error)
  }
}

/**
 * Verifica se logout está em andamento
 */
export function isLogoutInProgress(): boolean {
  try {
    return sessionStorage.getItem('logout-in-progress') === 'true'
  } catch (error) {
    return false
  }
}

/**
 * Força logout completo (para casos de emergência)
 */
export function forceLogout(): void {
  try {
    console.log('🚨 Forçando logout completo...')
    
    // Limpar tudo
    forceCleanup()
    
    // Remover flags
    sessionStorage.removeItem('logout-in-progress')
    
    // Redirecionar imediatamente
    window.location.replace('/login?forced=true')
  } catch (error) {
    console.error('Erro no logout forçado:', error)
    // Último recurso
    window.location.href = '/login'
  }
}