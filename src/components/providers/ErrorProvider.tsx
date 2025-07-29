/**
 * Provider global para sistema de tratamento de erros
 * Integra Error Boundary, Toast, Logging e Network Retry
 */

'use client'

import React, { ReactNode, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useErrorToast } from '@/hooks/use-error-toast'
import { logger } from '@/lib/logger'
import { networkRetry } from '@/lib/network-retry'

interface ErrorProviderProps {
  children: ReactNode
  enableGlobalErrorHandling?: boolean
  enableUnhandledRejectionHandling?: boolean
  enableNetworkErrorHandling?: boolean
  enablePerformanceMonitoring?: boolean
}

// Componente interno que usa os hooks
function ErrorProviderInner({
  children,
  enableGlobalErrorHandling = true,
  enableUnhandledRejectionHandling = true,
  enableNetworkErrorHandling = true,
  enablePerformanceMonitoring = true,
}: ErrorProviderProps) {
  // Integrar sistema de toast com erros
  useErrorToast()

  useEffect(() => {
    // Handler para erros JavaScript não capturados
    const handleGlobalError = (event: ErrorEvent) => {
      if (!enableGlobalErrorHandling) return

      logger.critical('Uncaught JavaScript error', event.error, {
        component: 'GlobalErrorHandler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message,
      })

      // Mostrar toast de erro
      window.dispatchEvent(
        new CustomEvent('show-error-toast', {
          detail: {
            type: 'error',
            title: 'Erro Inesperado',
            description: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
          },
        })
      )
    }

    // Handler para promises rejeitadas não capturadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!enableUnhandledRejectionHandling) return

      logger.critical('Unhandled promise rejection', event.reason, {
        component: 'GlobalErrorHandler',
        reason: event.reason,
      })

      // Mostrar toast de erro
      window.dispatchEvent(
        new CustomEvent('show-error-toast', {
          detail: {
            type: 'error',
            title: 'Erro de Conexão',
            description: 'Problema de conectividade detectado. Tentando reconectar...',
          },
        })
      )

      // Prevenir que o erro apareça no console (opcional)
      event.preventDefault()
    }

    // Handler para erros de rede
    const handleNetworkError = () => {
      if (!enableNetworkErrorHandling) return

      logger.warn('Network connectivity issue detected', undefined, {
        component: 'NetworkMonitor',
        online: navigator.onLine,
      })

      if (!navigator.onLine) {
        window.dispatchEvent(
          new CustomEvent('show-error-toast', {
            detail: {
              type: 'warning',
              title: 'Sem Conexão',
              description: 'Você está offline. Algumas funcionalidades podem não funcionar.',
            },
          })
        )
      }
    }

    // Handler para volta da conexão
    const handleNetworkOnline = () => {
      if (!enableNetworkErrorHandling) return

      logger.info('Network connectivity restored', undefined, {
        component: 'NetworkMonitor',
      })

      window.dispatchEvent(
        new CustomEvent('show-error-toast', {
          detail: {
            type: 'success',
            title: 'Conexão Restaurada',
            description: 'Você está online novamente!',
          },
        })
      )
    }

    // Monitoramento de performance
    const performanceObserver = enablePerformanceMonitoring
      ? new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Log de navegação lenta
            if (entry.entryType === 'navigation' && entry.duration > 3000) {
              logger.warn('Slow page load detected', undefined, {
                component: 'PerformanceMonitor',
                duration: entry.duration,
                type: entry.entryType,
                name: entry.name,
              })
            }

            // Log de recursos lentos
            if (entry.entryType === 'resource' && entry.duration > 2000) {
              logger.warn('Slow resource load detected', undefined, {
                component: 'PerformanceMonitor',
                duration: entry.duration,
                resource: entry.name,
                type: entry.entryType,
              })
            }
          }
        })
      : null

    // Registrar event listeners
    if (enableGlobalErrorHandling) {
      window.addEventListener('error', handleGlobalError)
    }

    if (enableUnhandledRejectionHandling) {
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
    }

    if (enableNetworkErrorHandling) {
      window.addEventListener('offline', handleNetworkError)
      window.addEventListener('online', handleNetworkOnline)
    }

    // Iniciar observador de performance
    if (performanceObserver) {
      try {
        performanceObserver.observe({ entryTypes: ['navigation', 'resource'] })
      } catch (error) {
        logger.warn('Performance observer not supported', error as Error)
      }
    }

    // Log de inicialização
    logger.info('Error handling system initialized', undefined, {
      component: 'ErrorProvider',
      features: {
        globalErrorHandling: enableGlobalErrorHandling,
        unhandledRejectionHandling: enableUnhandledRejectionHandling,
        networkErrorHandling: enableNetworkErrorHandling,
        performanceMonitoring: enablePerformanceMonitoring,
      },
    })

    // Cleanup
    return () => {
      if (enableGlobalErrorHandling) {
        window.removeEventListener('error', handleGlobalError)
      }

      if (enableUnhandledRejectionHandling) {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }

      if (enableNetworkErrorHandling) {
        window.removeEventListener('offline', handleNetworkError)
        window.removeEventListener('online', handleNetworkOnline)
      }

      if (performanceObserver) {
        performanceObserver.disconnect()
      }

      // Cancelar todas as operações de rede pendentes
      networkRetry.cancelAllOperations()
    }
  }, [
    enableGlobalErrorHandling,
    enableUnhandledRejectionHandling,
    enableNetworkErrorHandling,
    enablePerformanceMonitoring,
  ])

  // Monitorar mudanças de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logger.info('Page hidden - pausing operations', undefined, {
          component: 'VisibilityMonitor',
        })
        // Pausar operações não críticas
      } else {
        logger.info('Page visible - resuming operations', undefined, {
          component: 'VisibilityMonitor',
        })
        // Retomar operações
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return <>{children}</>
}

// Provider principal
export function ErrorProvider(props: ErrorProviderProps) {
  return (
    <ErrorBoundary
      enableRetry={true}
      enableReporting={true}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <ToastProvider>
        <ErrorProviderInner {...props} />
      </ToastProvider>
    </ErrorBoundary>
  )
}

// Hook para acessar funcionalidades do sistema de erro
export function useErrorSystem() {
  return {
    // Logging
    logger,

    // Network retry
    networkRetry,

    // Funções utilitárias
    reportError: (error: Error, context?: Record<string, any>) => {
      logger.error('Manual error report', error, context)
    },

    logUserAction: (action: string, component: string, context?: Record<string, any>) => {
      logger.logUserAction(action, component, context)
    },

    startPerformanceTracking: (operationId: string) => {
      logger.startPerformance(operationId)
    },

    endPerformanceTracking: (operationId: string, context?: Record<string, any>) => {
      return logger.endPerformance(operationId, context)
    },

    showToast: (
      type: 'success' | 'error' | 'warning' | 'info',
      title: string,
      description?: string
    ) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('show-error-toast', {
            detail: { type, title, description },
          })
        )
      }
    },
  }
}

// HOC para componentes que precisam de tratamento de erro robusto
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string
    enablePerformanceTracking?: boolean
    enableUserActionLogging?: boolean
  }
) {
  const WrappedComponent = (props: P) => {
    const { logUserAction, startPerformanceTracking, endPerformanceTracking } = useErrorSystem()

    useEffect(() => {
      const componentName = options?.componentName || Component.displayName || Component.name

      // Log de montagem do componente
      logger.debug(`Component mounted: ${componentName}`, {
        component: componentName,
      })

      // Tracking de performance se habilitado
      if (options?.enablePerformanceTracking) {
        startPerformanceTracking(`component-${componentName}`)

        return () => {
          endPerformanceTracking(`component-${componentName}`)
        }
      }
    }, [])

    return <Component {...props} />
  }

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`

  return WrappedComponent
}
