
'use client'
/**
 * Error Boundary específico para formulários
 * Fornece tratamento especializado para erros em formulários
 */


import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui'
import { errorHandler } from '@/shared/services/base/ErrorHandler'
import { logger } from '@/lib/monitoring/logger'

interface Props {
  children: ReactNode
  formName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
  fallback?: ReactNode
  showRetry?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
  retryCount: number
}

/**
 * Error Boundary especializado para formulários
 * 
 * @description
 * Captura erros específicos de formulários e fornece uma interface
 * de recuperação adequada para o contexto de formulários.
 * 
 * @example
 * ```typescript
 * <FormErrorBoundary
 *   formName="LoginForm"
 *   onError={(error) => console.log('Form error:', error)}
 *   onReset={() => resetForm()}
 * >
 *   <LoginForm />
 * </FormErrorBoundary>
 * ```
 */
export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const formName = this.props.formName || 'UnknownForm'
    
    // Criar erro estruturado
    const structuredError = errorHandler.handle(error, {
      service: 'FormErrorBoundary',
      method: formName,
      additionalData: {
        componentStack: errorInfo.componentStack,
        formName,
        retryCount: this.state.retryCount,
      },
    })

    // Log específico para formulários
    logger.error(`Form Error in ${formName}`, error, {
      component: 'FormErrorBoundary',
      formName,
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

    // Log de ação do usuário
    logger.logUserAction('form_error_occurred', formName, {
      errorId: structuredError.id,
      errorMessage: error.message,
    })
  }

  /**
   * Tenta recuperar do erro
   */
  private handleRetry = () => {
    const formName = this.props.formName || 'UnknownForm'
    
    logger.logUserAction('form_error_retry', formName, {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
    })

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: this.state.retryCount + 1,
    })

    // Callback de reset se fornecido
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  /**
   * Fecha o erro (para formulários em modais)
   */
  private handleClose = () => {
    const formName = this.props.formName || 'UnknownForm'
    
    logger.logUserAction('form_error_dismissed', formName, {
      errorId: this.state.errorId,
    })

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const formName = this.props.formName || 'Formulário'
      const showRetry = this.props.showRetry !== false

      // UI específica para erros de formulário
      return (
        <Card className="mx-auto w-full max-w-md border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
                    Erro no {formName}
                  </CardTitle>
                  <CardDescription className="text-xs text-red-700 dark:text-red-300">
                    Algo deu errado ao processar o formulário
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleClose}
                className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            {/* Mensagem de erro */}
            <div className="rounded-md bg-red-100 p-3 dark:bg-red-900/20">
              <p className="text-xs text-red-800 dark:text-red-200">
                {this.state.error?.message || 'Erro inesperado no formulário'}
              </p>
              
              {this.state.errorId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  ID: {this.state.errorId}
                </p>
              )}
            </div>

            {/* Detalhes técnicos em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-red-800 dark:text-red-200">
                  Detalhes Técnicos
                </summary>
                <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-red-200 p-2 text-red-900 dark:bg-red-900/30 dark:text-red-100">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              {showRetry && (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Tentar Novamente
                </Button>
              )}
              
              <Button
                onClick={this.handleClose}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Fechar
              </Button>
            </div>

            {/* Dicas para o usuário */}
            <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/10">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                💡 <strong>Dica:</strong> Verifique se todos os campos estão preenchidos corretamente e tente novamente.
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
 * HOC para adicionar FormErrorBoundary a um formulário
 */
export function withFormErrorBoundary<P extends object>(
  FormComponent: React.ComponentType<P>,
  options?: {
    formName?: string
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    onReset?: () => void
    showRetry?: boolean
  }
) {
  const WrappedForm = (props: P) => (
    <FormErrorBoundary
      formName={options?.formName || FormComponent.displayName || FormComponent.name}
      onError={options?.onError}
      onReset={options?.onReset}
      showRetry={options?.showRetry}
    >
      <FormComponent {...props} />
    </FormErrorBoundary>
  )

  WrappedForm.displayName = `withFormErrorBoundary(${FormComponent.displayName || FormComponent.name})`
  
  return WrappedForm
}

/**
 * Hook para usar FormErrorBoundary programaticamente
 */
export function useFormErrorBoundary() {
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