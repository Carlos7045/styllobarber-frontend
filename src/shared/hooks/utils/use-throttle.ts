import { useCallback, useRef, useEffect, useState } from 'react'

/**
 * Configuração do hook useThrottle
 */
export interface UseThrottleConfig {
  /** Delay em milissegundos (padrão: 300) */
  delay?: number
  /** Se deve executar na primeira chamada (padrão: true) */
  leading?: boolean
  /** Se deve executar na última chamada após o delay (padrão: true) */
  trailing?: boolean
}

/**
 * Hook para throttling de funções
 * 
 * @description
 * Hook que limita a execução de uma função a uma vez por período de tempo.
 * Útil para otimizar performance em eventos que disparam frequentemente
 * como scroll, resize, input, etc.
 * 
 * @example
 * ```tsx
 * // Throttle básico
 * const throttledSearch = useThrottle((query: string) => {
 *   searchAPI(query)
 * }, { delay: 500 })
 * 
 * // Throttle para scroll
 * const throttledScroll = useThrottle(() => {
 *   console.log('Scroll event')
 * }, { delay: 100 })
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', throttledScroll)
 *   return () => window.removeEventListener('scroll', throttledScroll)
 * }, [throttledScroll])
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  config: UseThrottleConfig = {}
): T {
  const {
    delay = 300,
    leading = true,
    trailing = true,
  } = config

  const lastCallTime = useRef<number>(0)
  const lastArgs = useRef<Parameters<T> | undefined>(undefined)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Atualizar callback ref quando callback muda
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledFunction = useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current
    
    lastArgs.current = args

    // Primeira chamada ou tempo suficiente passou
    if (lastCallTime.current === 0 || timeSinceLastCall >= delay) {
      if (leading) {
        lastCallTime.current = now
        return callbackRef.current(...args)
      }
    }

    // Cancelar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Agendar execução trailing se habilitado
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now()
        if (lastArgs.current) {
          callbackRef.current(...lastArgs.current)
        }
        timeoutRef.current = null
      }, delay - timeSinceLastCall)
    }
  }, [delay, leading, trailing]) as T

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledFunction
}

/**
 * Hook para throttling de valores (não funções)
 * 
 * @description
 * Similar ao useThrottle, mas para valores em vez de funções.
 * Retorna o valor throttled que só muda após o delay especificado.
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const throttledSearchTerm = useThrottleValue(searchTerm, { delay: 500 })
 * 
 * useEffect(() => {
 *   if (throttledSearchTerm) {
 *     searchAPI(throttledSearchTerm)
 *   }
 * }, [throttledSearchTerm])
 * ```
 */
export function useThrottleValue<T>(
  value: T,
  config: UseThrottleConfig = {}
): T {
  const {
    delay = 300,
    leading = true,
    trailing = true,
  } = config

  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdateTime = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTime.current

    // Primeira atualização ou tempo suficiente passou
    if (lastUpdateTime.current === 0 || timeSinceLastUpdate >= delay) {
      if (leading) {
        lastUpdateTime.current = now
        setThrottledValue(value)
        return
      }
    }

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Agendar atualização trailing
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        lastUpdateTime.current = Date.now()
        setThrottledValue(value)
        timeoutRef.current = null
      }, delay - timeSinceLastUpdate)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, leading, trailing])

  return throttledValue
}
