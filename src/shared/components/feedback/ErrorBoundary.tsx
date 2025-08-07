
'use client'
/**
 * Error Boundary robusto com integração completa do sistema de erros
 * Captura erros não tratados e fornece interface de recuperação
 */


import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler'
import { logger } from '@/lib/monitoring/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  enableRetry?: boolean
  enableReporting?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
  retryCount: number
  isRetrying: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualizar state para mostrar UI de erro
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Criar erro estruturado
    const structuredError = errorHandler.createStructuredError(error, {
      component: 'ErrorBoundary',
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
      retryCount: this.state.retryCount,
    })

    // Log do erro
    logger.critical('React Error Boundary triggered', error, {
      component: 'ErrorBoundary',
      errorInfo,
      errorId: structuredError.id,
    })

    // Atualizar state
    this.setState({
      errorInfo,
      errorId: structuredError.id,
    })

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Reportar erro se habilitado
    if (this.props.enableReporting !== false) {
      this.reportError(structuredError.id, error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Reportar erro para serviços externos
   */
  private reportError(errorId: string, error: Error, errorInfo: React.ErrorInfo) {
    // Implementar integração com serviços de monitoramento
    // Por exemplo: Sentry, LogRocket, Bugsnag, etc.

    if (typeof window !== 'undefined') {
      // Enviar para analytics
      try {
        // window.gtag?.('event', 'exception', {
        //   description: error.message,
        //   fatal: true,
        //   error_id: errorId
        // })

        console.log('Error reported:', { errorId, error: error.message })
      } catch (reportingError) {
        logger.error('Failed to report error', reportingError as Error)
      }
    }
  }

  /**
   * Tentar recuperar do erro
   */
  private handleRetry = () => {
    if (this.state.isRetrying) return

    this.setState({ isRetrying: true })

    logger.info('Attempting error recovery', {
      component: 'ErrorBoundary',
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
    })

    // Delay antes de tentar novamente
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
      })
    }, 1000)
  }

  /**
   * Recarregar página
   */
  private handleReload = () => {
    logger.info('Reloading page due to error', {
      component: 'ErrorBoundary',
      errorId: this.state.errorId,
    })

    window.location.reload()
  }

  /**
   * Navegar para home
   */
  private handleGoHome = () => {
    logger.info('Navigating to home due to error', {
      component: 'ErrorBoundary',
      errorId: this.state.errorId,
    })

    window.location.href = '/'
  }

  /**
   * Copiar detalhes do erro
   */
  private handleCopyError = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Mostrar feedback de sucesso
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('show-error-toast', {
              detail: {
                type: 'success',
                title: 'Copiado',
                description: 'Detalhes do erro copiados para a área de transferência',
              },
            })
          )
        }
      })
      .catch(() => {
        logger.warn('Failed to copy error details to clipboard')
      })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI padrão de erro
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Oops! Algo deu errado
              </CardTitle>

              <CardDescription className="text-lg">
                Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para
                resolver o problema.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Informações do erro */}
              {this.state.errorId && (
                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>ID do Erro:</strong> {this.state.errorId}
                  </p>
                  {this.state.retryCount > 0 && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Tentativas:</strong> {this.state.retryCount}
                    </p>
                  )}
                </div>
              )}

              {/* Detalhes técnicos (apenas em desenvolvimento ou se habilitado) */}
              {(this.props.showDetails || process.env.NODE_ENV === 'development') &&
                this.state.error && (
                  <details className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
                    <summary className="mb-2 cursor-pointer text-sm font-medium text-red-800 dark:text-red-200">
                      Detalhes Técnicos
                    </summary>

                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <strong>Mensagem:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-red-700 dark:text-red-300">
                          {this.state.error.message}
                        </pre>
                      </div>

                      {this.state.error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-red-700 dark:text-red-300">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

              {/* Ações */}
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Retry */}
                {this.props.enableRetry !== false && this.state.retryCount < 3 && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="flex-1"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Tentando novamente...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tentar Novamente
                      </>
                    )}
                  </Button>
                )}

                {/* Recarregar */}
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar Página
                </Button>

                {/* Ir para Home */}
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Ir para Início
                </Button>
              </div>

              {/* Ações secundárias */}
              <div className="flex justify-center">
                <Button
                  onClick={this.handleCopyError}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Copiar Detalhes do Erro
                </Button>
              </div>

              {/* Informações de contato */}
              <div className="border-t pt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Se o problema persistir, entre em contato com o suporte técnico
                  {this.state.errorId && (
                    <>
                      {' '}
                      informando o ID do erro:{' '}
                      <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                        {this.state.errorId}
                      </code>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar Error Boundary programaticamente
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Componente wrapper para facilitar uso
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
