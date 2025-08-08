import React, { memo, useMemo } from 'react'
import { useFilteredList } from '@/shared/utils/memoization'

interface MemoizedGridProps<T extends { id: string | number }> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T) => string | number
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
  loading?: boolean
  loadingCount?: number
  emptyMessage?: string
  filter?: (item: T) => boolean
  sort?: (a: T, b: T) => number
}

/**
 * Grid memoizado para exibição de itens em grade
 */
function MemoizedGridComponent<T extends { id: string | number }>({
  items,
  renderItem,
  keyExtractor = (item) => item.id,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = '',
  loading = false,
  loadingCount = 8,
  emptyMessage = 'Nenhum item encontrado',
  filter,
  sort
}: MemoizedGridProps<T>) {
  // Processar itens com filtro e ordenação
  const processedItems = useFilteredList(
    items,
    filter || (() => true),
    sort
  )

  // Gerar classes CSS para o grid
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid'
    const columnClasses = [
      columns.sm && `grid-cols-${columns.sm}`,
      columns.md && `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`,
      columns.xl && `xl:grid-cols-${columns.xl}`
    ].filter(Boolean).join(' ')
    
    const gapClass = `gap-${gap}`
    
    return `${baseClasses} ${columnClasses} ${gapClass} ${className}`
  }, [columns, gap, className])

  // Skeleton para loading
  const loadingSkeleton = useMemo(() => (
    <div className={gridClasses}>
      {Array.from({ length: loadingCount }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
        />
      ))}
    </div>
  ), [gridClasses, loadingCount])

  if (loading) {
    return loadingSkeleton
  }

  if (processedItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-lg font-medium mb-2">{emptyMessage}</div>
        <p className="text-sm">Tente ajustar os filtros ou adicionar novos itens.</p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {processedItems.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

export const MemoizedGrid = memo(MemoizedGridComponent) as <T extends { id: string | number }>(
  props: MemoizedGridProps<T>
) => JSX.Element