import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

/**
 * Hook para memoização de valores computados pesados
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.time(`[Memo] ${debugName}`)
    }
    
    const result = factory()
    
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.timeEnd(`[Memo] ${debugName}`)
    }
    
    return result
  }, deps)
}

/**
 * Hook para memoização de callbacks com debug
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useCallback((...args: Parameters<T>) => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.log(`[Callback] ${debugName} called with:`, args)
    }
    return callback(...args)
  }, deps) as T
}

/**
 * Hook para memoização de objetos complexos
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>()
  
  if (!ref.current || !areEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory()
    }
  }
  
  return ref.current.value
}

/**
 * Comparação profunda simples para arrays
 */
function areEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  
  return true
}

/**
 * Hook para debounce de valores
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para throttle de funções
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(Date.now())
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay]) as T
}

/**
 * Hook para memoização de listas com keys estáveis
 */
export function useStableKeys<T extends { id: string | number }>(
  items: T[]
): T[] {
  return useMemo(() => {
    return items.map(item => ({
      ...item,
      key: `${item.id}-${JSON.stringify(item).slice(0, 50)}`
    }))
  }, [items])
}

/**
 * Hook para memoização de filtros de lista
 */
export function useFilteredList<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
): T[] {
  return useMemo(() => {
    let filtered = items.filter(filterFn)
    
    if (sortFn) {
      filtered = filtered.sort(sortFn)
    }
    
    return filtered
  }, [items, filterFn, sortFn])
}

/**
 * Hook para memoização de computações de agregação
 */
export function useAggregation<T, R>(
  items: T[],
  aggregateFn: (items: T[]) => R
): R {
  return useMemo(() => {
    return aggregateFn(items)
  }, [items, aggregateFn])
}