import { useState, useEffect, useCallback } from 'react'

/**
 * Configuração do hook useLocalStorage
 */
export interface UseLocalStorageConfig<T> {
  /** Serializer customizado (padrão: JSON.stringify) */
  serializer?: (value: T) => string
  /** Deserializer customizado (padrão: JSON.parse) */
  deserializer?: (value: string) => T
  /** Se deve sincronizar entre abas (padrão: true) */
  syncAcrossTabs?: boolean
  /** Callback chamado quando o valor muda */
  onValueChange?: (newValue: T | null, oldValue: T | null) => void
}

/**
 * Hook para gerenciamento de localStorage com tipagem e sincronização
 * 
 * @description
 * Hook que fornece uma interface tipada para localStorage com sincronização
 * automática entre abas e serialização/deserialização customizável.
 * 
 * @example
 * ```tsx
 * // Uso básico
 * const [user, setUser] = useLocalStorage('user', null)
 * 
 * // Com configuração customizada
 * const [settings, setSettings] = useLocalStorage('settings', {
 *   theme: 'light',
 *   language: 'pt-BR'
 * }, {
 *   syncAcrossTabs: true,
 *   onValueChange: (newValue, oldValue) => {
 *     console.log('Settings changed:', { newValue, oldValue })
 *   }
 * })
 * 
 * // Com serialização customizada
 * const [date, setDate] = useLocalStorage('lastVisit', new Date(), {
 *   serializer: (date) => date.toISOString(),
 *   deserializer: (str) => new Date(str)
 * })
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  config: UseLocalStorageConfig<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncAcrossTabs = true,
    onValueChange,
  } = config

  // Estado interno
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return deserializer(item)
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Função para atualizar o valor
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const oldValue = storedValue
      const newValue = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(newValue)
      
      if (typeof window !== 'undefined') {
        if (newValue === null || newValue === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, serializer(newValue))
        }
      }

      // Chamar callback se fornecido
      if (onValueChange) {
        onValueChange(newValue, oldValue)
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, serializer, storedValue, onValueChange])

  // Função para remover o valor
  const removeValue = useCallback(() => {
    try {
      const oldValue = storedValue
      setStoredValue(initialValue)
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }

      // Chamar callback se fornecido
      if (onValueChange) {
        onValueChange(initialValue, oldValue)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue, storedValue, onValueChange])

  // Sincronização entre abas
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== localStorage) {
        return
      }

      try {
        const oldValue = storedValue
        let newValue: T

        if (e.newValue === null) {
          newValue = initialValue
        } else {
          newValue = deserializer(e.newValue)
        }

        setStoredValue(newValue)

        // Chamar callback se fornecido
        if (onValueChange) {
          onValueChange(newValue, oldValue)
        }
      } catch (error) {
        console.warn(`Error syncing localStorage key "${key}":`, error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, deserializer, initialValue, storedValue, syncAcrossTabs, onValueChange])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook simplificado para localStorage com valores primitivos
 * 
 * @description
 * Versão simplificada do useLocalStorage para valores primitivos
 * que não precisam de serialização customizada.
 * 
 * @example
 * ```tsx
 * const [theme, setTheme] = useSimpleLocalStorage('theme', 'light')
 * const [count, setCount] = useSimpleLocalStorage('count', 0)
 * const [isEnabled, setIsEnabled] = useSimpleLocalStorage('enabled', false)
 * ```
 */
export function useSimpleLocalStorage<T extends string | number | boolean>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(key, initialValue, {
    serializer: (value) => String(value),
    deserializer: (value) => {
      // Tentar converter para o tipo correto
      if (typeof initialValue === 'boolean') {
        return (value === 'true') as T
      }
      if (typeof initialValue === 'number') {
        return Number(value) as T
      }
      return value as T
    }
  })
}
