'use client'

import { useState, useEffect } from 'react'
import { Shield, RefreshCw, Clock, AlertTriangle, X, ShieldAlert, ShieldCheck } from 'lucide-react'

import { Button } from '@/shared/components/ui'
import { useMinimalSessionManager } from '../hooks/use-minimal-session-manager'
import { cn } from '@/shared/utils'

interface SessionStatusProps {
  className?: string
  showDetails?: boolean
  autoHide?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function SessionStatus({ 
  className,
  showDetails = false,
  autoHide = true,
  position = 'top-right'
}: SessionStatusProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

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

  // Estados derivados
  const sessionState = {
    isValid: isSessionValid,
    expiresAt,
    timeUntilExpiry,
  }
  const isRefreshing = false // Simplificado

  // Lógica de warning
  useEffect(() => {
    if (timeUntilExpiry && timeUntilExpiry <= 300000 && isSessionValid) { // 5 minutos
      setShowWarning(true)
      setIsVisible(true)
      
      // Auto-hide warning após 10 segundos se autoHide estiver ativo
      if (autoHide) {
        setTimeout(() => {
          setShowWarning(false)
          setIsVisible(false)
        }, 10000)
      }
    } else {
      setShowWarning(false)
      if (autoHide) {
        setIsVisible(false)
      }
    }
  }, [timeUntilExpiry, isSessionValid, autoHide])

  // Mostrar componente se não for auto-hide ou se houver warning
  useEffect(() => {
    if (!autoHide || showWarning || !isSessionValid) {
      setIsVisible(true)
    }
  }, [autoHide, showWarning, isSessionValid])

  // Função para obter ícone baseado no estado
  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (!isSessionValid) {
      return <ShieldAlert className="h-4 w-4 text-error" />
    }
    
    if (showWarning) {
      return <AlertTriangle className="h-4 w-4 text-warning" />
    }
    
    return <ShieldCheck className="h-4 w-4 text-success" />
  }

  // Função para obter cor baseada no estado
  const getStatusColor = () => {
    if (!isSessionValid) return 'border-error bg-error/10'
    if (showWarning) return 'border-warning bg-warning/10'
    if (isRefreshing) return 'border-info bg-info/10'
    return 'border-success bg-success/10'
  }

  // Função para obter mensagem de status
  const getStatusMessage = () => {
    if (isRefreshing) {
      return 'Renovando sessão...'
    }
    
    if (!isSessionValid) {
      return 'Sessão inválida'
    }
    
    if (showWarning && timeUntilExpiry) {
      return `Sessão expira em ${formatTimeUntilExpiry(timeUntilExpiry)}`
    }
    
    return 'Sessão ativa'
  }

  // Função para lidar com renovação manual
  const handleRefresh = async () => {
    const success = await forceRefresh()
    if (success) {
      setShowWarning(false)
    }
  }

  // Função para fechar warning
  const handleClose = () => {
    setShowWarning(false)
    if (autoHide) {
      setIsVisible(false)
    }
  }

  // Posicionamento
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={cn(
      'fixed z-50 max-w-sm',
      getPositionClasses(),
      className
    )}>
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border shadow-lg backdrop-blur-sm',
        getStatusColor()
      )}>
        {/* Ícone de status */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {getStatusMessage()}
          </p>
          
          {showDetails && (
            <div className="mt-1 text-xs text-text-muted space-y-1">
              <div>Status: {isSessionValid ? 'Válida' : 'Inválida'}</div>
              {sessionState.expiresAt && (
                <div>
                  Expira: {new Date(sessionState.expiresAt * 1000).toLocaleTimeString()}
                </div>
              )}
              {sessionState.lastRefresh && (
                <div>
                  Última renovação: {new Date(sessionState.lastRefresh).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {/* Botão de renovar (apenas se warning ou erro) */}
          {(showWarning || !isSessionValid) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
              title="Renovar sessão"
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}

          {/* Botão de fechar (apenas se autoHide) */}
          {autoHide && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
              title="Fechar"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente compacto para mostrar apenas o ícone
export function SessionStatusIcon({ className }: { className?: string }) {
  const { isSessionValid } = useMinimalSessionManager()
  const isRefreshing = false // Simplificado

  const getIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-info" />
    }
    
    if (!isSessionValid) {
      return <ShieldAlert className="h-4 w-4 text-error" />
    }
    
    return <ShieldCheck className="h-4 w-4 text-success" />
  }

  return (
    <div className={cn('flex items-center', className)} title="Status da sessão">
      {getIcon()}
    </div>
  )
}

// Hook para usar status da sessão em outros componentes
export function useSessionStatus() {
  const sessionManager = useMinimalSessionManager()
  
  return {
    ...sessionManager,
    
    // Helpers adicionais
    isExpiringSoon: (threshold: number = 300000) => {
      return sessionManager.timeUntilExpiry !== null && 
             sessionManager.timeUntilExpiry <= threshold
    },
    
    getStatusText: () => {
      if (sessionManager.isRefreshing) return 'Renovando'
      if (!sessionManager.isSessionValid) return 'Inválida'
      if (sessionManager.timeUntilExpiry && sessionManager.timeUntilExpiry <= 300000) return 'Expirando'
      return 'Ativa'
    },
    
    getStatusColor: () => {
      if (!sessionManager.isSessionValid) return 'error'
      if (sessionManager.timeUntilExpiry && sessionManager.timeUntilExpiry <= 300000) return 'warning'
      if (sessionManager.isRefreshing) return 'info'
      return 'success'
    }
  }
}
