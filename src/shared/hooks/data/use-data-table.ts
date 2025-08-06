import { useState, useCallback, useEffect, useMemo } from 'react'
import { useCrudBase, type CrudConfig, type BaseEntity } from './use-crud-base'
import { usePagination, type PaginationConfig } from './use-pagination'
import { useFilters, type FiltersConfig, type FilterDefinition } from './use-filters'

/**
 * Configuração do hook de tabela de dados
 */
export interface DataTableConfig<T extends BaseEntity> 
  extends CrudConfig<T>, PaginationConfig, FiltersConfig<T> {
  /** Se deve buscar dados automaticamente */
  autoFetch?: boolean
  /** Filtros de busca rápida */
  searchFields?: (keyof T)[]
  /** Se busca deve ser case sensitive */
  caseSensitive?: boolean
}

/**
 * Estado de ordenação
 */
export interface SortState<T> {
  /** Campo de ordenação */
  field: keyof T | null
  /** Direção da ordenação */
  direction: 'asc' | 'desc'
}

/**
 * Ações de ordenação
 */
export interface SortActions<T> {
  /** Definir ordenação */
  setSort: (field: keyof T, direction?: 'asc' | 'desc') => void
  /** Alternar ordenação de um campo */
  toggleSort: (field: keyof T) => void
  /** Limpar ordenação */
  clearSort: () => void
}

/**
 * Resultado completo do hook de tabela de dados
 */
export interface UseDataTableResult<T extends BaseEntity> {
  // Dados
  /** Dados originais */
  data: T[]
  /** Dados filtrados */
  filteredData: T[]
  /** Dados paginados (página atual) */
  paginatedData: T[]
  /** Dados processados (filtrados + ordenados + paginados) */
  processedData: T[]
  
  // Estados
  loading: boolean
  error: string | null
  creating: boolean
  updating: boolean
  deleting: boolean
  createError: string | null
  updateError: string | null
  deleteError: string | null
  
  // CRUD
  refetch: () => Promise<void>
  invalidate: () => void
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T | null>
  update: (id: string, data: Partial<T>) => Promise<T | null>
  delete: (id: string) => Promise<boolean>
  findById: (id: string) => T | undefined
  addItem: (item: T) => void
  updateItem: (id: string, updates: Partial<T>) => void
  removeItem: (id: string) => void
  setData: (data: T[]) => void
  clearError: () => void
  clear: () => void
  
  // Paginação
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    startIndex: number
    endIndex: number
    hasPrevious: boolean
    hasNext: boolean
    displayInfo: string
    goToPage: (page: number) => void
    nextPage: () => void
    previousPage: () => void
    firstPage: () => void
    lastPage: () => void
    setPageSize: (size: number) => void
    reset: () => void
    getPageRange: (maxPages?: number) => number[]
  }
  
  // Filtros
  filters: {
    filters: FilterDefinition<T>[]
    hasActiveFilters: boolean
    activeFiltersCount: number
    addFilter: (filter: FilterDefinition<T>) => void
    removeFilter: (field: keyof T) => void
    updateFilter: (field: keyof T, updates: Partial<FilterDefinition<T>>) => void
    toggleFilter: (field: keyof T, active?: boolean) => void
    clearFilters: () => void
    setFilters: (filters: FilterDefinition<T>[]) => void
    getFilter: (field: keyof T) => FilterDefinition<T> | undefined
    hasFilter: (field: keyof T) => boolean
  }
  
  // Busca
  search: {
    searchTerm: string
    setSearchTerm: (term: string) => void
    clearSearch: () => void
  }
  
  // Ordenação
  sort: SortState<T> & SortActions<T>
  
  // Utilitários
  /** Selecionar todos os itens da página atual */
  selectAll: () => string[]
  /** Obter estatísticas dos dados */
  getStats: () => {
    total: number
    filtered: number
    selected: number
  }
}

/**
 * Hook completo para tabelas de dados com CRUD, paginação, filtros e busca
 * 
 * @description
 * Hook que combina todas as funcionalidades necessárias para uma tabela de dados
 * completa, incluindo operações CRUD, paginação, filtros, busca e ordenação.
 * 
 * @example
 * ```tsx
 * interface User extends BaseEntity {
 *   name: string
 *   email: string
 *   status: 'active' | 'inactive'
 * }
 * 
 * const table = useDataTable<User>({
 *   tableName: 'users',
 *   pageSize: 20,
 *   searchFields: ['name', 'email'],
 *   defaultOrder: { column: 'created_at', ascending: false }
 * })
 * 
 * return (
 *   <div>
 *     <input 
 *       value={table.search.searchTerm}
 *       onChange={(e) => table.search.setSearchTerm(e.target.value)}
 *       placeholder="Buscar usuários..."
 *     />
 *     
 *     <table>
 *       <thead>
 *         <tr>
 *           <th onClick={() => table.sort.toggleSort('name')}>
 *             Nome {table.sort.field === 'name' && (table.sort.direction === 'asc' ? '↑' : '↓')}
 *           </th>
 *           <th onClick={() => table.sort.toggleSort('email')}>Email</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {table.processedData.map(user => (
 *           <tr key={user.id}>
 *             <td>{user.name}</td>
 *             <td>{user.email}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *     
 *     <div className="pagination">
 *       <button onClick={table.pagination.previousPage} disabled={!table.pagination.hasPrevious}>
 *         Anterior
 *       </button>
 *       <span>{table.pagination.displayInfo}</span>
 *       <button onClick={table.pagination.nextPage} disabled={!table.pagination.hasNext}>
 *         Próxima
 *       </button>
 *     </div>
 *   </div>
 * )
 * ```
 */
export function useDataTable<T extends BaseEntity>(
  config: DataTableConfig<T>
): UseDataTableResult<T> {
  const {
    autoFetch = true,
    searchFields = [],
    caseSensitive = false,
    ...restConfig
  } = config

  // Hooks base
  const crud = useCrudBase<T>(restConfig)
  const pagination = usePagination(restConfig)
  const filters = useFilters<T>(restConfig)

  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('')

  // Estado de ordenação
  const [sortState, setSortState] = useState<SortState<T>>({
    field: null,
    direction: 'asc'
  })

  // Aplicar busca textual
  const searchedData = useMemo(() => {
    if (!searchTerm.trim() || searchFields.length === 0) {
      return crud.data
    }

    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase()

    return crud.data.filter(item => {
      return searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          const searchValue = caseSensitive ? value : value.toLowerCase()
          return searchValue.includes(term)
        }
        return false
      })
    })
  }, [crud.data, searchTerm, searchFields, caseSensitive])

  // Aplicar filtros
  const filteredData = useMemo(() => {
    return filters.applyFilters(searchedData)
  }, [searchedData, filters])

  // Aplicar ordenação
  const sortedData = useMemo(() => {
    if (!sortState.field) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.field!]
      const bValue = b[sortState.field!]

      let comparison = 0

      if (aValue < bValue) {
        comparison = -1
      } else if (aValue > bValue) {
        comparison = 1
      }

      return sortState.direction === 'desc' ? -comparison : comparison
    })
  }, [filteredData, sortState])

  // Aplicar paginação
  const paginatedData = useMemo(() => {
    return pagination.paginateData(sortedData)
  }, [sortedData, pagination])

  // Atualizar total de itens na paginação quando dados filtrados mudarem
  useEffect(() => {
    pagination.setTotalItems(sortedData.length)
  }, [sortedData.length, pagination])

  // Buscar dados automaticamente
  useEffect(() => {
    if (autoFetch) {
      crud.refetch()
    }
  }, [autoFetch, crud])

  // Ações de busca
  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  // Ações de ordenação
  const setSort = useCallback((field: keyof T, direction: 'asc' | 'desc' = 'asc') => {
    setSortState({ field, direction })
  }, [])

  const toggleSort = useCallback((field: keyof T) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const clearSort = useCallback(() => {
    setSortState({ field: null, direction: 'asc' })
  }, [])

  // Utilitários
  const selectAll = useCallback(() => {
    return paginatedData.map(item => item.id)
  }, [paginatedData])

  const getStats = useCallback(() => {
    return {
      total: crud.data.length,
      filtered: sortedData.length,
      selected: 0, // Pode ser implementado com estado de seleção
    }
  }, [crud.data.length, sortedData.length])

  return {
    // Dados
    data: crud.data,
    filteredData,
    paginatedData,
    processedData: paginatedData,
    
    // Estados CRUD
    loading: crud.loading,
    error: crud.error,
    creating: crud.creating,
    updating: crud.updating,
    deleting: crud.deleting,
    createError: crud.createError,
    updateError: crud.updateError,
    deleteError: crud.deleteError,
    
    // Ações CRUD
    refetch: crud.refetch,
    invalidate: crud.invalidate,
    create: crud.create,
    update: crud.update,
    delete: crud.delete,
    findById: crud.findById,
    addItem: crud.addItem,
    updateItem: crud.updateItem,
    removeItem: crud.removeItem,
    setData: crud.setData,
    clearError: crud.clearError,
    clear: crud.clear,
    
    // Paginação
    pagination,
    
    // Filtros
    filters,
    
    // Busca
    search: {
      searchTerm,
      setSearchTerm,
      clearSearch,
    },
    
    // Ordenação
    sort: {
      ...sortState,
      setSort,
      toggleSort,
      clearSort,
    },
    
    // Utilitários
    selectAll,
    getStats,
  }
}
