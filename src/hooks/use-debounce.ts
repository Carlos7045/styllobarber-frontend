import { useEffect, useRef } from 'react'

/**
 * Hook para debounce de funções
 */
export function useDebounce(callback: () => void, delay: number, deps: any[]) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(callback, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}