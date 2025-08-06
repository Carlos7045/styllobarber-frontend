/**
 * Hook para capturar eventos de erro e exibir toasts
 */

import { useEffect } from 'react'
import { useToast } from '@/shared/components/ui/toast'

export function useErrorToast() {
  const { addToast } = useToast()

  useEffect(() => {
    const handleErrorToast = (event: CustomEvent) => {
      const { type, title, description } = event.detail

      addToast({
        type,
        title,
        description,
      })
    }

    // Escutar eventos de erro
    window.addEventListener('show-error-toast', handleErrorToast as EventListener)

    return () => {
      window.removeEventListener('show-error-toast', handleErrorToast as EventListener)
    }
  }, [addToast])
}
