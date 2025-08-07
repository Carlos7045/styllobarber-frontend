/**
 * Barrel exports para componentes otimizados com memoização
 */

// Componentes memoizados
export { MemoizedList } from './MemoizedList'
export { MemoizedCard } from './MemoizedCard'
export { MemoizedTable } from './MemoizedTable'
export { MemoizedGrid } from './MemoizedGrid'
export { 
  MemoizedListItem, 
  MemoizedListItemWithCustomCompare 
} from './MemoizedListItem'

// Re-export de utilitários de memoização
export {
  useExpensiveMemo,
  useStableCallback,
  useDeepMemo,
  useDebounce,
  useThrottle,
  useStableKeys,
  useFilteredList,
  useAggregation
} from '@/shared/utils/memoization'

// Re-export de hooks memoizados
export {
  useMemoizedForm,
  useMemoizedOptions,
  useMemoizedGroupBy
} from '@/shared/hooks/use-memoized-form'

export {
  useMemoizedDashboardMetrics,
  useMemoizedChartData,
  useMemoizedServiceStats,
  useMemoizedBarberPerformance,
  useMemoizedDashboardFilters,
  useMemoizedTrends
} from '@/shared/hooks/use-memoized-dashboard'