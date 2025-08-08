import React, { memo, useMemo, useCallback } from 'react'
import { useStableKeys, useFilteredList } from '@/shared/utils/memoization'

interface MemoizedListProps<T extends { id: string | number }> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T) => string | number
  filter?: (item: T) => boolean
  sort?: (a: T, b: T) => number
  className?: string
  emptyMessage?: string
  loading?: boolean
  loadingCount?: number
  renderSkeleton?: () => React.ReactNode
}

/**
 * Lista memoizada otimizada para performance
 */
function MemoizedListComponent<T extends { id: string | number }>({
  items,
  renderItem,
  keyExtractor = (item) => item.id,
  filter,
  sort,
  className,
  emptyMessage = 'Nenhum item encontrado',
  loading = false,
  loadingCount = 3,
  renderSkeleton
}: MemoizedListProps<T>) {
  // Filtrar e ordenar items de forma memoizada
  const processedItems = useFilteredList(
    items,
    filter || (() => true),
    sort
  )

  // Memoizar o renderizador de item
  const memoizedRenderItem = useCallback((item: T, index: number) => {
    return renderItem(item, index)
  }, [renderItem])

  // Skeleton padrão
  const defaultSkeleton = useMemo(() => (
    <div className="space-y-3">
      {Array.from({ length: loadingCount }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  ), [loadingCount])

  if (loading) {
    return (
      <div className={className}>
        {renderSkeleton ? renderSkeleton() : defaultSkeleton}
      </div>
    )
  }

  if (processedItems.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={className}>
      {processedItems.map((item, index) => (
        <React.Fragment key={keyExtractor(item)}>
          {memoizedRenderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  )
}

export const MemoizedList = memo(MemoizedListComponent) as <T extends { id: string | number }>(
  props: MemoizedListProps<T>
) => JSX.Element