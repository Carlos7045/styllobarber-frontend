import { useState, useEffect, useCallback } from 'react'

interface DynamicImportState<T> {
  component: T | null
  loading: boolean
  error: Error | null
}

/**
 * Hook para importação dinâmica de componentes
 */
export function useDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  shouldLoad: boolean = true
): DynamicImportState<T> & { loadComponent: () => void } {
  const [state, setState] = useState<DynamicImportState<T>>({
    component: null,
    loading: false,
    error: null
  })

  const loadComponent = useCallback(async () => {
    if (state.component || state.loading) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const importedModule = await importFn()
      setState({
        component: importedModule.default,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        component: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to load component')
      })
    }
  }, [importFn, state.component, state.loading])

  useEffect(() => {
    if (shouldLoad) {
      loadComponent()
    }
  }, [shouldLoad, loadComponent])

  return {
    ...state,
    loadComponent
  }
}

/**
 * Hook para pré-carregamento de componentes
 */
export function usePreloadComponents(
  imports: Array<() => Promise<any>>,
  delay: number = 1000
) {
  const [preloaded, setPreloaded] = useState<Set<number>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      imports.forEach((importFn, index) => {
        if (!preloaded.has(index)) {
          importFn().then(() => {
            setPreloaded(prev => new Set(prev).add(index))
          }).catch(error => {
            console.warn(`Failed to preload component ${index}:`, error)
          })
        }
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [imports, delay, preloaded])

  return preloaded
}