import { useCallback } from 'react'
import { errorHandler } from '@/shared/services/base/ErrorHandler'
import { logger } from '@/lib/monitoring/logger'
import { useErrorBoundary } from '@/shared/components/feedback/ErrorBoundary'

/**
 * Configuração do hook de error handling
 */
export interface UseErrorHandlerConfig {
  /** Nome do componente para logging */
  componentName?: string
  /** Se deve mostrar toast de erro automaticamente */
  showToast?: boolean
  /** Se deve logar o erro */
  enableLogging?: boolean
  /** Callback customizado para tratamento de erro */
  onError?: (error: Error) => void
}

/**
 * Hook para facilitar o uso do sistema de error handling
 * 
 * @description
 * Hook que fornece funções utilitárias para captura e tratamento
 * de erros em componentes React, integrando com o sistema global
 * de error handling.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { handleError, handleAsyncError, captureError } = useErrorHandler({
 *     componentName: 'MyComponent',
 *     showToast: true,
 *     onError: (error) => {
 *       console.log('Custom error handling:', error)
 *     }
 *   })
 * 
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation()
 *     } catch (error) {
 *       handleError(error)
 *     }
 *   }
 * 
 *   const handleAsyncClick = handleAsyncError(async () => {
 *     await riskyOperation()
 *   })
 * 
 *   return (
 *     <div>
 *       <button onClick={handleClick}>Sync Operation</button>
 *       <button onClick={handleAsyncClick}>Async Operation</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useErrorHandler(config: UseErrorHandlerConfig = {}) {
  const {
    componentName = 'UnknownComponent',
    showToast = true,
    enableLogging = true,
    onError,
  } = config

  const { captureError: boundaryCapture } = useErrorBoundary()

  /**
   * Trata um erro capturado
   */
  const handleError = useCallback(
    (error: unknown, context?: Record<string, any>) => {
      const errorInstance = error instanceof Error ? error : new Error(String(error))

      // Log do erro se habilitado
      if (enableLogging) {
        logger.error(`Error in ${componentName}`, errorInstance, {
          component: componentName,
          ...context,
        })
      }

      // Usar o error handler global
      const structuredError = errorHandler.handle(errorInstance, {
        service: componentName,
        method: 'handleError',
        additionalData: context,
      })

      // Callback customizado
      if (onError) {
        try {
          onError(errorInstance)
        } catch (callbackError) {
          console.error('Error in custom error handler:', callbackError)
        }
      }

      return structuredError
    },
    [componentName, enableLogging, onError]
  )

  /**
   * Wrapper para operações assíncronas que podem falhar
   */
  const handleAsyncError = useCallback(
    <T extends any[], R>(
      asyncFn: (...args: T) => Promise<R>,
      context?: Record<string, any>
    ) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await asyncFn(...args)
        } catch (error) {
          handleError(error, context)
          return null
        }
      }
    },
    [handleError]
  )

  /**
   * Captura erro e força o Error Boundary a renderizar
   */
  const captureError = useCallback(
    (error: unknown, context?: Record<string, any>) => {
      const errorInstance = error instanceof Error ? error : new Error(String(error))
      
      // Primeiro, trata o erro normalmente
      handleError(errorInstance, context)
      
      // Depois, captura no boundary para mostrar UI de erro
      boundaryCapture(errorInstance)
    },
    [handleError, boundaryCapture]
  )

  /**
   * Wrapper para event handlers que podem falhar
   */
  const handleEventError = useCallback(
    <T extends any[]>(
      eventHandler: (...args: T) => void | Promise<void>,
      context?: Record<string, any>
    ) => {
      return async (...args: T) => {
        try {
          await eventHandler(...args)
        } catch (error) {
          handleError(error, {
            ...context,
            eventType: 'user_interaction',
          })
        }
      }
    },
    [handleError]
  )

  /**
   * Trata erros de validação de forma específica
   */
  const handleValidationError = useCallback(
    (error: unknown, fieldName?: string) => {
      const errorInstance = error instanceof Error ? error : new Error(String(error))
      
      return handleError(errorInstance, {
        type: 'validation',
        field: fieldName,
        userFriendly: true,
      })
    },
    [handleError]
  )

  /**
   * Trata erros de API de forma específica
   */
  const handleApiError = useCallback(
    (error: unknown, endpoint?: string, method?: string) => {
      const errorInstance = error instanceof Error ? error : new Error(String(error))
      
      return handleError(errorInstance, {
        type: 'api',
        endpoint,
        method,
        retryable: true,
      })
    },
    [handleError]
  )

  /**
   * Cria um wrapper de componente com error handling
   */
  const withErrorHandling = useCallback(
    <P extends object>(
      Component: React.ComponentType<P>,
      componentConfig?: Partial<UseErrorHandlerConfig>
    ) => {
      const WrappedComponent = (props: P) => {
        const errorHandler = useErrorHandler({
          ...config,
          ...componentConfig,
          componentName: componentConfig?.componentName || Component.displayName || Component.name,
        })

        try {
          return <Component {...props} />
        } catch (error) {
          errorHandler.handleError(error)
          return null
        }
      }

      WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`
      return WrappedComponent
    },
    [config]
  )

  /**
   * Utilitário para retry de operações
   */
  const retryOperation = useCallback(
    async (
      operation: () => Promise<any>,
      maxRetries: number = 3,
      delay: number = 1000,
      context?: Record<string, any>
    ): Promise<any> => {
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await operation()
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          
          if (attempt === maxRetries) {
            handleError(lastError, {
              ...context,
              type: 'retry_exhausted',
              attempts: attempt + 1,
              maxRetries,
            })
            break
          }

          // Log da tentativa
          if (enableLogging) {
            logger.warn(`Retry attempt ${attempt + 1}/${maxRetries + 1} failed`, lastError, {
              component: componentName,
              attempt: attempt + 1,
              maxRetries: maxRetries + 1,
              ...context,
            })
          }

          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
        }
      }

      return null
    },
    [handleError, enableLogging, componentName]
  )

  /**
   * Monitora performance e captura erros de performance
   */
  const monitorPerformance = useCallback(
    (operation: any, operationName: string, threshold = 1000) => {
      // Função temporariamente simplificada para resolver erro de build
      try {
        return operation()
      } catch (error) {
        handleError(error, { type: 'performance', operation: operationName })
        throw error
      }
    },
    [handleError]
  )

  return {
    // Funções principais
    handleError,
    handleAsyncError,
    captureError,
    
    // Funções especializadas
    handleEventError,
    handleValidationError,
    handleApiError,
    
    // Utilitários
    withErrorHandling,
    retryOperation,
    monitorPerformance,
    
    // Informações
    componentName,
  }
}

/**
 * Hook simplificado para casos básicos
 */
export function useSimpleErrorHandler(componentName?: string) {
  return useErrorHandler({
    componentName,
    showToast: true,
    enableLogging: true,
  })
}

/**
 * Hook para error handling em formulários
 */
export function useFormErrorHandler(formName?: string) {
  return useErrorHandler({
    componentName: `Form_${formName || 'Unknown'}`,
    showToast: true,
    enableLogging: true,
    onError: (error) => {
      // Log específico para erros de formulário
      logger.logUserAction('form_error', formName || 'unknown_form', {
        error: error.message,
      })
    },
  })
}

/**
 * Hook para error handling em operações de API
 */
export function useApiErrorHandler(serviceName?: string) {
  return useErrorHandler({
    componentName: `API_${serviceName || 'Unknown'}`,
    showToast: true,
    enableLogging: true,
    onError: (error) => {
      // Log específico para erros de API
      logger.logApiError(
        'unknown',
        'unknown',
        0,
        error,
        { service: serviceName }
      )
    },
  })
}