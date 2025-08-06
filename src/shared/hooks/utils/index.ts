/**
 * Barrel exports para hooks utilitários compartilhados
 */

// Hooks existentes
export { useDebounce } from './use-debounce'
export { useErrorRecovery } from './use-error-recovery'
export { useErrorToast } from './use-error-toast'

// Novos hooks utilitários otimizados
export { 
  useLocalStorage,
  useSimpleLocalStorage
} from './use-local-storage'

export { 
  useThrottle,
  useThrottleValue
} from './use-throttle'

export { 
  useLoadingStates,
  useAsyncOperation
} from './use-loading-states'

export { 
  usePerformance,
  usePerformanceMeasure
} from './use-performance'

// Re-export types
export type {
  UseLocalStorageConfig
} from './use-local-storage'

export type {
  UseThrottleConfig
} from './use-throttle'

export type {
  LoadingState,
  LoadingStateData,
  UseLoadingStatesConfig
} from './use-loading-states'

export type {
  PerformanceMetrics,
  UsePerformanceConfig
} from './use-performance'
