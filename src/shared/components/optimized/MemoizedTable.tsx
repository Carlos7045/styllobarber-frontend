import React, { memo, useMemo, useCallback } from 'react'
import { useStableCallback, useFilteredList } from '@/shared/utils/memoization'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, item: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface MemoizedTableProps<T extends Record<string, any>> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  className?: string
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T, index: number) => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  filter?: (item: T) => boolean
}

/**
 * Tabela memoizada otimizada para performance
 */
function MemoizedTableComponent<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  className = '',
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  onRowClick,
  sortBy,
  sortDirection = 'asc',
  onSort,
  filter
}: MemoizedTableProps<T>) {
  // Filtrar dados se necessário
  const filteredData = useFilteredList(
    data,
    filter || (() => true)
  )

  // Memoizar o renderizador de célula
  const renderCell = useCallback((column: Column<T>, item: T, index: number) => {
    const value = typeof column.key === 'string' && column.key.includes('.') 
      ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
      : item[column.key as keyof T]

    if (column.render) {
      return column.render(value, item, index)
    }

    return value?.toString() || '-'
  }, [])

  // Memoizar o handler de clique na linha
  const handleRowClick = useStableCallback((item: T, index: number) => {
    onRowClick?.(item, index)
  }, [onRowClick])

  // Memoizar o handler de ordenação
  const handleSort = useStableCallback((key: string) => {
    if (!onSort) return
    
    const newDirection = sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }, [onSort, sortBy, sortDirection])

  // Loading skeleton
  const loadingSkeleton = useMemo(() => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          {columns.map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ))}
    </div>
  ), [columns])

  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        {loadingSkeleton}
      </div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key.toString()}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                } ${column.className || ''}`}
                onClick={column.sortable ? () => handleSort(column.key.toString()) : undefined}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && sortBy === column.key && (
                    <span className="text-primary-gold">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredData.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => handleRowClick(item, index)}
            >
              {columns.map((column) => (
                <td
                  key={column.key.toString()}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                    column.className || ''
                  }`}
                >
                  {renderCell(column, item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const MemoizedTable = memo(MemoizedTableComponent) as <T extends Record<string, any>>(
  props: MemoizedTableProps<T>
) => JSX.Element