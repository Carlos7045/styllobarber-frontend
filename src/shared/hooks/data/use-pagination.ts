import { useState, useCallback, useMemo } from 'react'

/**
 * Configuração de paginação
 */
export interface PaginationConfig {
  /** Itens por página (padrão: 10) */
  pageSize?: number
  /** Página inicial (padrão: 1) */
  initialPage?: number
  /** Total de itens */
  totalItems?: number
}

/**
 * Estado da paginação
 */
export interface PaginationState {
  /** Página atual (1-based) */
  currentPage: number
  /** Itens por página */
  pageSize: number
  /** Total de itens */
  totalItems: number
  /** Total de páginas */
  totalPages: number
  /** Índice do primeiro item da página atual */
  startIndex: number
  /** Índice do último item da página atual */
  endIndex: number
  /** Se tem página anterior */
  hasPrevious: boolean
  /** Se tem próxima página */
  hasNext: boolean
  /** Informações de exibição */
  displayInfo: string
}

/**
 * Ações de paginação
 */
export interface PaginationActions {
  /** Ir para página específica */
  goToPage: (page: number) => void
  /** Ir para próxima página */
  nextPage: () => void
  /** Ir para página anterior */
  previousPage: () => void
  /** Ir para primeira página */
  firstPage: () => void
  /** Ir para última página */
  lastPage: () => void
  /** Alterar tamanho da página */
  setPageSize: (size: number) => void
  /** Definir total de itens */
  setTotalItems: (total: number) => void
  /** Resetar paginação */
  reset: () => void
}

/**
 * Resultado do hook de paginação
 */
export interface UsePaginationResult extends PaginationState, PaginationActions {
  /** Paginar array de dados */
  paginateData: <T>(data: T[]) => T[]
  /** Obter range de páginas para exibição */
  getPageRange: (maxPages?: number) => number[]
}

/**
 * Hook para gerenciamento de paginação
 *
 * @description
 * Hook reutilizável para paginação de dados com funcionalidades completas
 * incluindo navegação, informações de estado e utilitários.
 *
 * @example
 * ```tsx
 * const pagination = usePagination({
 *   pageSize: 20,
 *   totalItems: users.length
 * })
 *
 * const paginatedUsers = pagination.paginateData(users)
 *
 * return (
 *   <div>
 *     {paginatedUsers.map(user => <UserCard key={user.id} user={user} />)}
 *
 *     <div className="pagination">
 *       <button
 *         onClick={pagination.previousPage}
 *         disabled={!pagination.hasPrevious}
 *       >
 *         Anterior
 *       </button>
 *
 *       <span>{pagination.displayInfo}</span>
 *
 *       <button
 *         onClick={pagination.nextPage}
 *         disabled={!pagination.hasNext}
 *       >
 *         Próxima
 *       </button>
 *     </div>
 *   </div>
 * )
 * ```
 */
export function usePagination(config: PaginationConfig = {}): UsePaginationResult {
  const {
    pageSize: initialPageSize = 10,
    initialPage = 1,
    totalItems: initialTotalItems = 0,
  } = config

  // Estado
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(initialTotalItems)

  // Valores calculados
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1
  }, [totalItems, pageSize])

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize
  }, [currentPage, pageSize])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalItems - 1)
  }, [startIndex, pageSize, totalItems])

  const hasPrevious = useMemo(() => {
    return currentPage > 1
  }, [currentPage])

  const hasNext = useMemo(() => {
    return currentPage < totalPages
  }, [currentPage, totalPages])

  const displayInfo = useMemo(() => {
    if (totalItems === 0) {
      return 'Nenhum item encontrado'
    }

    const start = startIndex + 1
    const end = endIndex + 1

    return `${start}-${end} de ${totalItems} itens`
  }, [startIndex, endIndex, totalItems])

  // Ações
  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
    },
    [totalPages]
  )

  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasNext])

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [hasPrevious])

  const firstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [totalPages])

  const handleSetPageSize = useCallback(
    (size: number) => {
      const newSize = Math.max(1, size)
      setPageSize(newSize)

      // Ajustar página atual se necessário
      const newTotalPages = Math.ceil(totalItems / newSize) || 1
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages)
      }
    },
    [totalItems, currentPage]
  )

  const handleSetTotalItems = useCallback(
    (total: number) => {
      const newTotal = Math.max(0, total)
      setTotalItems(newTotal)

      // Ajustar página atual se necessário
      const newTotalPages = Math.ceil(newTotal / pageSize) || 1
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages)
      }
    },
    [pageSize, currentPage]
  )

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setPageSize(initialPageSize)
    setTotalItems(initialTotalItems)
  }, [initialPage, initialPageSize, initialTotalItems])

  // Utilitários
  const paginateData = useCallback(
    <T>(data: T[]): T[] => {
      const start = startIndex
      const end = start + pageSize
      return data.slice(start, end)
    },
    [startIndex, pageSize]
  )

  const getPageRange = useCallback(
    (maxPages: number = 5): number[] => {
      const range: number[] = []

      if (totalPages <= maxPages) {
        // Mostrar todas as páginas
        for (let i = 1; i <= totalPages; i++) {
          range.push(i)
        }
      } else {
        // Calcular range centrado na página atual
        const half = Math.floor(maxPages / 2)
        let start = Math.max(1, currentPage - half)
        const end = Math.min(totalPages, start + maxPages - 1)

        // Ajustar se estamos no final
        if (end - start + 1 < maxPages) {
          start = Math.max(1, end - maxPages + 1)
        }

        for (let i = start; i <= end; i++) {
          range.push(i)
        }
      }

      return range
    },
    [currentPage, totalPages]
  )

  return {
    // Estado
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPrevious,
    hasNext,
    displayInfo,

    // Ações
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize: handleSetPageSize,
    setTotalItems: handleSetTotalItems,
    reset,

    // Utilitários
    paginateData,
    getPageRange,
  }
}
