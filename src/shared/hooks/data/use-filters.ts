import { useState, useCallback, useMemo } from 'react'

/**
 * Operadores de filtro
 */
export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith'
  | 'greaterThan' 
  | 'lessThan' 
  | 'greaterThanOrEqual' 
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'

/**
 * Definição de um filtro
 */
export interface FilterDefinition<T = any> {
  /** Campo a ser filtrado */
  field: keyof T
  /** Operador de comparação */
  operator: FilterOperator
  /** Valor(es) para comparação */
  value: any
  /** Se o filtro está ativo */
  active?: boolean
  /** Label para exibição */
  label?: string
}

/**
 * Configuração de filtros
 */
export interface FiltersConfig<T> {
  /** Filtros iniciais */
  initialFilters?: FilterDefinition<T>[]
  /** Se deve aplicar filtros automaticamente */
  autoApply?: boolean
  /** Função de transformação customizada */
  customFilter?: (item: T, filters: FilterDefinition<T>[]) => boolean
}

/**
 * Estado dos filtros
 */
export interface FiltersState<T> {
  /** Filtros ativos */
  filters: FilterDefinition<T>[]
  /** Se há filtros ativos */
  hasActiveFilters: boolean
  /** Contagem de filtros ativos */
  activeFiltersCount: number
}

/**
 * Ações dos filtros
 */
export interface FiltersActions<T> {
  /** Adicionar filtro */
  addFilter: (filter: FilterDefinition<T>) => void
  /** Remover filtro */
  removeFilter: (field: keyof T) => void
  /** Atualizar filtro existente */
  updateFilter: (field: keyof T, updates: Partial<FilterDefinition<T>>) => void
  /** Ativar/desativar filtro */
  toggleFilter: (field: keyof T, active?: boolean) => void
  /** Limpar todos os filtros */
  clearFilters: () => void
  /** Definir filtros */
  setFilters: (filters: FilterDefinition<T>[]) => void
  /** Aplicar filtros aos dados */
  applyFilters: <D extends T>(data: D[]) => D[]
  /** Obter filtro por campo */
  getFilter: (field: keyof T) => FilterDefinition<T> | undefined
  /** Verificar se campo tem filtro ativo */
  hasFilter: (field: keyof T) => boolean
}

/**
 * Resultado do hook de filtros
 */
export interface UseFiltersResult<T> extends FiltersState<T>, FiltersActions<T> {}

/**
 * Hook para gerenciamento de filtros de dados
 * 
 * @description
 * Hook reutilizável para filtrar dados com suporte a múltiplos operadores,
 * filtros customizados e aplicação automática.
 * 
 * @example
 * ```tsx
 * interface User {
 *   id: string
 *   name: string
 *   email: string
 *   age: number
 *   status: 'active' | 'inactive'
 * }
 * 
 * const filters = useFilters<User>({
 *   initialFilters: [
 *     { field: 'status', operator: 'equals', value: 'active', active: true }
 *   ]
 * })
 * 
 * const filteredUsers = filters.applyFilters(users)
 * 
 * // Adicionar filtro de busca
 * filters.addFilter({
 *   field: 'name',
 *   operator: 'contains',
 *   value: searchTerm,
 *   active: true
 * })
 * ```
 */
export function useFilters<T>(config: FiltersConfig<T> = {}): UseFiltersResult<T> {
  const {
    initialFilters = [],
    autoApply = true,
    customFilter,
  } = config

  // Estado
  const [filters, setFilters] = useState<FilterDefinition<T>[]>(initialFilters)

  // Valores calculados
  const hasActiveFilters = useMemo(() => {
    return filters.some(filter => filter.active !== false)
  }, [filters])

  const activeFiltersCount = useMemo(() => {
    return filters.filter(filter => filter.active !== false).length
  }, [filters])

  // Função para aplicar um filtro específico
  const applyFilter = useCallback(<D extends T>(item: D, filter: FilterDefinition<T>): boolean => {
    if (filter.active === false) return true

    const fieldValue = item[filter.field]
    const filterValue = filter.value

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filterValue

      case 'contains':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().includes(filterValue.toLowerCase())
        }
        return false

      case 'startsWith':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().startsWith(filterValue.toLowerCase())
        }
        return false

      case 'endsWith':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().endsWith(filterValue.toLowerCase())
        }
        return false

      case 'greaterThan':
        return fieldValue > filterValue

      case 'lessThan':
        return fieldValue < filterValue

      case 'greaterThanOrEqual':
        return fieldValue >= filterValue

      case 'lessThanOrEqual':
        return fieldValue <= filterValue

      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          return fieldValue >= filterValue[0] && fieldValue <= filterValue[1]
        }
        return false

      case 'in':
        if (Array.isArray(filterValue)) {
          return filterValue.includes(fieldValue)
        }
        return false

      case 'notIn':
        if (Array.isArray(filterValue)) {
          return !filterValue.includes(fieldValue)
        }
        return true

      case 'isNull':
        return fieldValue == null

      case 'isNotNull':
        return fieldValue != null

      default:
        return true
    }
  }, [])

  // Aplicar filtros aos dados
  const applyFilters = useCallback(<D extends T>(data: D[]): D[] => {
    if (!hasActiveFilters) return data

    return data.filter(item => {
      // Usar filtro customizado se fornecido
      if (customFilter) {
        return customFilter(item, filters)
      }

      // Aplicar todos os filtros ativos
      return filters.every(filter => applyFilter(item, filter))
    })
  }, [filters, hasActiveFilters, customFilter, applyFilter])

  // Ações
  const addFilter = useCallback((filter: FilterDefinition<T>) => {
    setFilters(prev => {
      // Remover filtro existente para o mesmo campo
      const filtered = prev.filter(f => f.field !== filter.field)
      return [...filtered, filter]
    })
  }, [])

  const removeFilter = useCallback((field: keyof T) => {
    setFilters(prev => prev.filter(f => f.field !== field))
  }, [])

  const updateFilter = useCallback((
    field: keyof T, 
    updates: Partial<FilterDefinition<T>>
  ) => {
    setFilters(prev => prev.map(filter => 
      filter.field === field 
        ? { ...filter, ...updates }
        : filter
    ))
  }, [])

  const toggleFilter = useCallback((field: keyof T, active?: boolean) => {
    setFilters(prev => prev.map(filter => 
      filter.field === field 
        ? { ...filter, active: active ?? !filter.active }
        : filter
    ))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters([])
  }, [])

  const handleSetFilters = useCallback((newFilters: FilterDefinition<T>[]) => {
    setFilters(newFilters)
  }, [])

  const getFilter = useCallback((field: keyof T): FilterDefinition<T> | undefined => {
    return filters.find(f => f.field === field)
  }, [filters])

  const hasFilter = useCallback((field: keyof T): boolean => {
    return filters.some(f => f.field === field && f.active !== false)
  }, [filters])

  return {
    // Estado
    filters,
    hasActiveFilters,
    activeFiltersCount,
    
    // Ações
    addFilter,
    removeFilter,
    updateFilter,
    toggleFilter,
    clearFilters,
    setFilters: handleSetFilters,
    applyFilters,
    getFilter,
    hasFilter,
  }
}

/**
 * Hook para filtros de busca textual simples
 * 
 * @description
 * Versão simplificada do useFilters focada em busca textual.
 * 
 * @example
 * ```tsx
 * const search = useSearchFilter<User>({
 *   fields: ['name', 'email'],
 *   caseSensitive: false
 * })
 * 
 * const filteredUsers = search.filter(users, searchTerm)
 * ```
 */
export function useSearchFilter<T>(config: {
  fields: (keyof T)[]
  caseSensitive?: boolean
}) {
  const { fields, caseSensitive = false } = config

  const filter = useCallback((data: T[], searchTerm: string): T[] => {
    if (!searchTerm.trim()) return data

    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase()

    return data.filter(item => {
      return fields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          const searchValue = caseSensitive ? value : value.toLowerCase()
          return searchValue.includes(term)
        }
        return false
      })
    })
  }, [fields, caseSensitive])

  return { filter }
}
