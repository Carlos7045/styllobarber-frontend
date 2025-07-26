'use client'

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useMinimalSessionManager } from '@/hooks/use-minimal-session-manager'
// import { useAuthInterceptor } from '@/lib/auth-interceptor' // Removido temporariamente
import { SessionStatus } from './SessionStatus'
import { SessionErrorBoundary } from './SessionErrorBoundary'

interface SessionContextType {
  showSessionWarning: boolean
  dismissWarning: () => void
  forceRefresh: () => Promise<boolean>
  sessionTimeLeft: number | null
  isSessionValid: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
  showStatusIndicator?: boolean
  autoRefreshTokens?: boolean
  warningThreshold?: number // em ms
  checkInterval?: number // em ms
}

export function SessionProvider({
  children,
  showStatusIndicator = true,
  autoRefreshTokens = true,
  warningThreshold = 300000, // 5 minutos
  checkInterval = 30000, // 30 segundos
}: SessionProviderProps) {
  const router = useRouter()
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string>('')

  // Gerenciador de sessão minimal
  const {
    isSessionValid,
    expiresAt,
    timeUntilExpiry,
    forceRefresh,
  } = useMinimalSessionManager()

  // Função para formatar tempo
  const formatTimeUntilExpiry = (ms: number | null): string => {
    if (!ms) return 'Desconhecido'
    
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // Verificar se deve mostrar aviso de sessão (com debounce)
  useEffect(() => {
    if (timeUntilExpiry && timeUntilExpiry <= warningThreshold && isSessionValid) {
      const message = `Sua sessão expira em ${formatTimeUntilExpiry(timeUntilExpiry)}`
      setWarningMessage(message)
      setShowSessionWarning(true)
    } else if (showSessionWarning) {
      setShowSessionWarning(false)
    }
  }, [timeUntilExpiry, warningThreshold, isSessionValid, formatTimeUntilExpiry, showSessionWarning])

  // AuthInterceptor removido temporariamente para evitar conflitos

  // Função para dispensar aviso
  const dismissWarning = () => {
    setShowSessionWarning(false)
  }

  // Valor do contexto (memoizado para estabilidade)
  const contextValue: SessionContextType = useMemo(() => ({
    showSessionWarning,
    dismissWarning,
    forceRefresh,
    sessionTimeLeft: timeUntilExpiry,
    isSessionValid,
  }), [
    showSessionWarning,
    dismissWarning,
    forceRefresh,
    timeUntilExpiry,
    isSessionValid,
  ])

  return (
    <SessionErrorBoundary>
      <SessionContext.Provider value={contextValue}>
        {children}
        
        {/* Indicador de status da sessão */}
        {showStatusIndicator && (
          <SessionStatus
            showDetails={false}
            autoHide={true}
            position="top-right"
          />
        )}
        
        {/* Modal de aviso de sessão */}
        {showSessionWarning && (
          <SessionWarningModal
            message={warningMessage}
            onDismiss={dismissWarning}
            onRefresh={async () => {
              const success = await forceRefresh()
              if (success) {
                dismissWarning()
              }
            }}
            timeLeft={timeUntilExpiry}
            formatTime={formatTimeUntilExpiry}
          />
        )}
      </SessionContext.Provider>
    </SessionErrorBoundary>
  )
}

// Modal de aviso de sessão
interface SessionWarningModalProps {
  message: string
  onDismiss: () => void
  onRefresh: () => Promise<void>
  timeLeft: number | null
  formatTime: (ms: number | null) => string
}

function SessionWarningModal({
  message,
  onDismiss,
  onRefresh,
  timeLeft,
  formatTime,
}: SessionWarningModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Aviso de Sessão
            </h3>
            {timeLeft && (
              <p className="text-sm text-text-muted">
                Tempo restante: {formatTime(timeLeft)}
              </p>
            )}
          </div>
        </div>
        
        <p className="text-text-muted mb-6">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Renovando...' : 'Renovar Sessão'}
          </button>
          <button
            onClick={onDismiss}
            disabled={isRefreshing}
            className="flex-1 bg-transparent border border-border-default hover:bg-background-secondary text-text-primary font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o contexto de sessão
export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider')
  }
  return context
}

// Componente para mostrar status da sessão em qualquer lugar
export function SessionIndicator({ className }: { className?: string }) {
  const { isSessionValid, sessionTimeLeft } = useSession()
  
  if (!isSessionValid) {
    return (
      <div className={`flex items-center gap-2 text-error ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm">Sessão inválida</span>
      </div>
    )
  }

  if (sessionTimeLeft && sessionTimeLeft <= 300000) { // 5 minutos
    return (
      <div className={`flex items-center gap-2 text-warning ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span className="text-sm">
          Expira em {Math.round(sessionTimeLeft / 60000)}min
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-success ${className}`}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-sm">Sessão ativa</span>
    </div>
  )
}