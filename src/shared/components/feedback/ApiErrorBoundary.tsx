
'use client'
/**
 * Error Boundary específico para operações de API
 * Fornece tratamento especializado para erros de API e rede
 */


import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui'
import { errorHandler, ErrorType } from '@/shared/services/base/ErrorHandler'
import { logger } from '@/lib/monitoring/logger'

interface Props {
  children: ReactNode
  apiName?: string
  endpoint?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onRetry?: () => void
  fallback?: ReactNode
  maxRetries?: number
  showNetworkStatus?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
  retryCount: number
  isRetrying: boolean
  isOnline: boolean
}

/**
 * Error Boundary especializado para operações de API
 * 
 * @description
 * Captura erros específicos de API e fornece uma interface
 * de recuperação adequada para problemas de rede e API.
 * 
 * @example
 * ```typescript
 * <ApiErrorBoundary
 *   apiName="UserService"
 *   endpoint="/api/users"
 *   onRetry={() => refetchUsers()}
 *   maxRetries={3}
 * >
 *   <UserList />
 * </ApiErrorBoundary>
 * ```
 */
export class ApiErrorBoundary extends Component<Props, State> {
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
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const apiName = this.props.apiName || 'UnknownAPI'
    const endpoint = this.props.endpoint || 'unknown'
    
    // Criar erro estruturado
    const structuredError = errorHandler.handle(error, {
      service: 'ApiErrorBoundary',
      method: apiName,
      additionalData: {
        componentStack: errorInfo.componentStack,
        apiName,
        endpoint,
        retryCount: this.state.retryCount,
        isOnline: this.state.isOnline,
      },
    })

    // Log específico para APIs
    logger.logApiError(endpoint, 'unknown', 0, error, {
      component: 'ApiErrorBoundary',
      apiName,
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
  }

  componentDidMount() {
    // Monitorar status da rede
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true })
    
    // Se estava offline e agora está online, tentar novamente automaticamente
    if (this.state.hasError && !this.state.isRetrying) {
      logger.info('Network restored, attempting automatic retry', {
        component: 'ApiErrorBoundary',
        apiName: this.props.apiName,
      })
      
      this.handleRetry()
    }
  }

  private handleOffline = () => {
    this.setState({ isOnline: false })
  }

  /**
   * Tenta recuperar do erro
   */
  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount >= maxRetries) {
      return
    }

    this.setState({ isRetrying: true })

    const apiName = this.props.apiName || 'UnknownAPI'
    
    logger.logUserAction('api_error_retry', apiName, {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
      maxRetries,
    })

    // Callback de retry se fornecido
    if (this.props.onRetry) {
      this.props.onRetry()
    }

    // Delay progressivo para retry
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
      })
    }, delay)
  }

  /**
   * Determina o tipo de erro para mostrar UI apropriada
   */
  private getErrorType(): 'network' | 'server' | 'timeout' | 'unknown' {
    if (!this.state.error) return 'unknown'

    const message = this.state.error.message.toLowerCase()
    
    if (!this.state.isOnline || message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    
    if (message.includes('timeout')) {
      return 'timeout'
    }
    
    if (message.includes('500') || message.includes('server')) {
      return 'server'
    }
    
    return 'unknown'
  }

  /**
   * Obtém mensagem e ícone baseado no tipo de erro
   */
  private getErrorDisplay() {
    const errorType = this.getErrorType()
    
    switch (errorType) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Problema de Conexão',
          message: 'Verifique sua conexão com a internet e tente novamente.',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
        }
      
      case 'timeout':
        return {
          icon: AlertTriangle,
          title: 'Tempo Esgotado',
          message: 'A operação demorou mais que o esperado. Tente novamente.',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        }
      
      case 'server':
        return {
          icon: AlertTriangle,
          title: 'Erro do Servidor',
          message: 'Problema temporário no servidor. Tente novamente em alguns minutos.',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
        }
      
      default:
        return {
          icon: AlertTriangle,
          title: 'Erro Inesperado',
          message: 'Algo deu errado. Tente novamente ou contate o suporte.',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
        }
    }
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const apiName = this.props.apiName || 'API'
      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries
      const errorDisplay = this.getErrorDisplay()
      const IconComponent = errorDisplay.icon

      return (
        <Card className={`mx-auto w-full max-w-md ${errorDisplay.borderColor} ${errorDisplay.bgColor}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${errorDisplay.bgColor}`}>
                <IconComponent className={`h-5 w-5 ${errorDisplay.color}`} />
              </div>
              <div>
                <CardTitle className={`text-sm font-medium ${errorDisplay.color}`}>
                  {errorDisplay.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  Erro na operação: {apiName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Status da rede */}
            {this.props.showNetworkStatus !== false && (
              <div className="flex items-center gap-2 text-xs">
                {this.state.isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
            )}

            {/* Mensagem de erro */}
            <div className={`rounded-md p-3 ${errorDisplay.bgColor}`}>
              <p className={`text-sm ${errorDisplay.color}`}>
                {errorDisplay.message}
              </p>
              
              {this.state.errorId && (
                <p className="mt-1 text-xs opacity-75">
                  ID: {this.state.errorId}
                </p>
              )}
            </div>

            {/* Informações de retry */}
            {canRetry && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tentativa {this.state.retryCount + 1} de {maxRetries + 1}
              </div>
            )}

            {/* Detalhes técnicos em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">
                  Detalhes Técnicos
                </summary>
                <div className="mt-2 space-y-1">
                  <p><strong>Endpoint:</strong> {this.props.endpoint || 'N/A'}</p>
                  <p><strong>Erro:</strong> {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying || !this.state.isOnline}
                  size="sm"
                  className="flex-1"
                >
                  {this.state.isRetrying ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Tentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
              >
                Recarregar Página
              </Button>
            </div>

            {/* Dica baseada no tipo de erro */}
            <div className={`rounded-md p-2 ${errorDisplay.bgColor}`}>
              <p className={`text-xs ${errorDisplay.color}`}>
                {this.getErrorType() === 'network' && (
                  <>💡 <strong>Dica:</strong> Verifique se você está conectado à internet.</>
                )}
                {this.getErrorType() === 'timeout' && (
                  <>⏱️ <strong>Dica:</strong> Sua conexão pode estar lenta. Aguarde um momento.</>
                )}
                {this.getErrorType() === 'server' && (
                  <>🔧 <strong>Dica:</strong> Problema temporário. Nosso time foi notificado.</>
                )}
                {this.getErrorType() === 'unknown' && (
                  <>🤔 <strong>Dica:</strong> Se o problema persistir, contate o suporte.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * HOC para adicionar ApiErrorBoundary a um componente
 */
export function withApiErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    apiName?: string
    endpoint?: string
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    onRetry?: () => void
    maxRetries?: number
  }
) {
  const WrappedComponent = (props: P) => (
    <ApiErrorBoundary
      apiName={options?.apiName || Component.displayName || Component.name}
      endpoint={options?.endpoint}
      onError={options?.onError}
      onRetry={options?.onRetry}
      maxRetries={options?.maxRetries}
    >
      <Component {...props} />
    </ApiErrorBoundary>
  )

  WrappedComponent.displayName = `withApiErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}