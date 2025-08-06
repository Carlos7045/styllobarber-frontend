import { useState, useCallback, useRef } from 'react'

/**
 * Estados de loading possíveis
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Interface para o estado de loading
 */
export interface LoadingStateData {
  state: LoadingState
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  error: string | null
  data: any
}

/**
 * Configuração do hook useLoadingStates
 */
export interface UseLoadingStatesConfig {
  /** Timeout automático para loading (em ms) */
  timeout?: number
  /** Callback chamado quando o estado muda */
  onStateChange?: (state: LoadingState, data?: any, error?: string) => void
  /** Se deve resetar o erro automaticamente ao iniciar nova operação */
  autoResetError?: boolean
}

/**
 * Hook para gerenciamento consistente de estados de loading
 * 
 * @description
 * Hook que fornece uma interface padronizada para gerenciar estados
 * de loading, success, error e idle em operações assíncronas.
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   isLoading,
 *   isSuccess,
 *   isError,
 *   error,
 *   data,
 *   setLoading,
 *   setSuccess,
 *   setError,
 *   reset,
 *   execute
 * } = useLoadingStates()
 * 
 * // Uso com execute
 * const handleSubmit = () => {
 *   execute(async () => {
 *     const result = await api.submitForm(formData)
 *     return result
 *   })
 * }
 * 
 * // Uso manual
 * const handleManualSubmit = async () => {
 *   setLoading()
 *   try {
 *     const result = await api.submitForm(formData)
 *     setSuccess(result)
 *   } catch (err) {
 *     setError(err.message)
 *   }
 * }
 * ```
 */
export function useLoadingStates<T = any>(
  config: UseLoadingStatesConfig = {}
): LoadingStateData & {
  setLoading: () => void
  setSuccess: (data?: T) => void
  setError: (error: string) => void
  reset: () => void
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>
} {
  const {
    timeout,
    onStateChange,
    autoResetError = true
  } = config

  const [state, setState] = useState<LoadingState>('idle')
  const [error, setErrorState] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para limpar timeout
  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Função para definir estado de loading
  const setLoading = useCallback(() => {
    if (autoResetError) {
      setErrorState(null)
    }
    setState('loading')
    
    if (onStateChange) {
      onStateChange('loading')
    }

    // Configurar timeout se especificado
    if (timeout) {
      clearLoadingTimeout()
      timeoutRef.current = setTimeout(() => {
        setState('error')
        setErrorState('Operação expirou por timeout')
        if (onStateChange) {
          onStateChange('error', null, 'Operação expirou por timeout')
        }
      }, timeout)
    }
  }, [autoResetError, onStateChange, timeout, clearLoadingTimeout])

  // Função para definir estado de sucesso
  const setSuccess = useCallback((successData?: T) => {
    clearLoadingTimeout()
    setState('success')
    setErrorState(null)
    
    if (successData !== undefined) {
      setData(successData)
    }
    
    if (onStateChange) {
      onStateChange('success', successData)
    }
  }, [clearLoadingTimeout, onStateChange])

  // Função para definir estado de erro
  const setError = useCallback((errorMessage: string) => {
    clearLoadingTimeout()
    setState('error')
    setErrorState(errorMessage)
    
    if (onStateChange) {
      onStateChange('error', null, errorMessage)
    }
  }, [clearLoadingTimeout, onStateChange])

  // Função para resetar o estado
  const reset = useCallback(() => {
    clearLoadingTimeout()
    setState('idle')
    setErrorState(null)
    setData(null)
    
    if (onStateChange) {
      onStateChange('idle')
    }
  }, [clearLoadingTimeout, onStateChange])

  // Função para executar operação assíncrona
  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    setLoading()
    
    try {
      const result = await asyncFn()
      setSuccess(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return null
    }
  }, [setLoading, setSuccess, setError])

  // Cleanup no unmount
  useState(() => {
    return () => {
      clearLoadingTimeout()
    }
  })

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    error,
    data,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute
  }
}

/**
 * Hook simplificado para operações assíncronas
 * 
 * @description
 * Versão simplificada do useLoadingStates focada apenas em
 * executar operações assíncronas com estados de loading.
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useAsyncOperation()
 * 
 * const handleClick = () => {
 *   execute(async () => {
 *     await api.doSomething()
 *   })
 * }
 * ```
 */
export function useAsyncOperation<T = any>() {
  const {
    execute,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    reset
  } = useLoadingStates<T>()

  return {
    execute,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    reset
  }
}
