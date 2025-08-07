/**
 * Tipos genéricos para hooks customizados
 */

import { DependencyList, MutableRefObject, RefObject } from 'react'
import { 
  AsyncState, 
  PaginationParams, 
  PaginatedResponse, 
  FilterOptions, 
  SortOptions,
  ValidationResult,
  UUID
} from './base'

// Tipos base para hooks
export interface UseAsyncOptions<T> {
  immediate?: boolean
  initialData?: T | null
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
  timeout?: number
  abortOnUnmount?: boolean
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  cancel: () => void
}

// Tipos para hooks de dados
export interface UseQueryOptions<T> extends UseAsyncOptions<T> {
  queryKey: string | string[]
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number
  select?: (data: any) => T
  placeholderData?: T
}

export interface UseQueryReturn<T> extends AsyncState<T> {
  refetch: () => Promise<T | null>
  invalidate: () => void
  remove: () => void
  isStale: boolean
  isFetching: boolean
  isRefetching: boolean
  dataUpdatedAt: number
  errorUpdatedAt: number
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
  retry?: number
  retryDelay?: number
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>
  mutateAsync: (variables: TVariables) => Promise<TData>
  reset: () => void
  data: TData | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
}

// Tipos para hooks de lista
export interface UseListOptions<T> {
  initialData?: T[]
  keyExtractor?: (item: T) => string | number
  compare?: (a: T, b: T) => boolean
  onAdd?: (item: T) => void
  onUpdate?: (item: T, index: number) => void
  onRemove?: (item: T, index: number) => void
  onChange?: (items: T[]) => void
}

export interface UseListReturn<T> {
  items: T[]
  add: (item: T) => void
  addAt: (index: number, item: T) => void
  update: (index: number, item: Partial<T>) => void
  updateWhere: (predicate: (item: T) => boolean, updates: Partial<T>) => void
  remove: (index: number) => void
  removeWhere: (predicate: (item: T) => boolean) => void
  clear: () => void
  set: (items: T[]) => void
  move: (fromIndex: number, toIndex: number) => void
  find: (predicate: (item: T) => boolean) => T | undefined
  findIndex: (predicate: (item: T) => boolean) => number
  filter: (predicate: (item: T) => boolean) => T[]
  sort: (compare?: (a: T, b: T) => number) => void
  reverse: () => void
  isEmpty: boolean
  length: number
}

// Tipos para hooks de paginação
export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface UsePaginationReturn {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  goToPage: (page: number) => void
  reset: () => void
}

// Tipos para hooks de filtros
export interface UseFiltersOptions<T> {
  initialFilters?: T
  onFiltersChange?: (filters: T) => void
  debounceMs?: number
}

export interface UseFiltersReturn<T> {
  filters: T
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  setFilters: (filters: Partial<T>) => void
  clearFilter: <K extends keyof T>(key: K) => void
  clearFilters: () => void
  resetFilters: () => void
  hasActiveFilters: boolean
  activeFiltersCount: number
}

// Tipos para hooks de ordenação
export interface UseSortOptions<T> {
  initialSort?: SortOptions
  onSortChange?: (sort: SortOptions) => void
  sortFunctions?: Record<string, (a: T, b: T) => number>
}

export interface UseSortReturn<T> {
  sort: SortOptions
  setSort: (field: string, direction?: 'asc' | 'desc') => void
  toggleSort: (field: string) => void
  clearSort: () => void
  sortedData: (data: T[]) => T[]
}

// Tipos para hooks de formulário
export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  validationSchema?: any
  validate?: (values: T) => Record<string, string>
  onSubmit: (values: T) => Promise<void> | void
  onSubmitSuccess?: (values: T) => void
  onSubmitError?: (error: Error) => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnMount?: boolean
  enableReinitialize?: boolean
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T
  errors: Record<keyof T, string>
  touched: Record<keyof T, boolean>
  dirty: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
  isValidating: boolean
  submitCount: number
  
  // Field methods
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldError: <K extends keyof T>(field: K, error: string) => void
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void
  
  // Form methods
  setValues: (values: Partial<T>) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  setTouched: (touched: Partial<Record<keyof T, boolean>>) => void
  setStatus: (status: any) => void
  
  // Actions
  handleSubmit: (e?: React.FormEvent) => void
  handleReset: () => void
  handleChange: (e: React.ChangeEvent<any>) => void
  handleBlur: (e: React.FocusEvent<any>) => void
  
  // Validation
  validateForm: () => Promise<Record<keyof T, string>>
  validateField: <K extends keyof T>(field: K) => Promise<string>
  
  // Utilities
  getFieldProps: <K extends keyof T>(field: K) => {
    name: K
    value: T[K]
    onChange: (value: T[K]) => void
    onBlur: () => void
    error: string
    touched: boolean
  }
  
  resetForm: (nextState?: Partial<T>) => void
  submitForm: () => Promise<void>
}

// Tipos para hooks de estado local
export interface UseLocalStorageOptions<T> {
  defaultValue?: T
  serializer?: {
    read: (value: string) => T
    write: (value: T) => string
  }
  syncAcrossTabs?: boolean
  onError?: (error: Error) => void
}

export interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
}

export interface UseSessionStorageOptions<T> extends UseLocalStorageOptions<T> {
  // Herda todas as opções de UseLocalStorageOptions
}

export interface UseSessionStorageReturn<T> extends UseLocalStorageReturn<T> {
  // Herda todos os retornos de UseLocalStorageReturn
}

// Tipos para hooks de UI
export interface UseDisclosureOptions {
  defaultOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
}

export interface UseDisclosureReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export interface UseClipboardOptions {
  timeout?: number
  onCopy?: (text: string) => void
  onError?: (error: Error) => void
}

export interface UseClipboardReturn {
  copy: (text: string) => Promise<void>
  copied: boolean
  error: Error | null
}

export interface UseHoverOptions {
  onEnter?: () => void
  onLeave?: () => void
  delay?: number
  delayLeave?: number
}

export interface UseHoverReturn {
  ref: RefObject<HTMLElement>
  isHovered: boolean
}

export interface UseFocusOptions {
  onFocus?: () => void
  onBlur?: () => void
}

export interface UseFocusReturn {
  ref: RefObject<HTMLElement>
  isFocused: boolean
}

// Tipos para hooks de performance
export interface UseDebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export interface UseThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

export interface UseMemoizedOptions {
  deps: DependencyList
  debugName?: string
}

// Tipos para hooks de rede
export interface UseOnlineReturn {
  isOnline: boolean
  isOffline: boolean
}

export interface UseFetchOptions<T> extends UseAsyncOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  credentials?: 'omit' | 'same-origin' | 'include'
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached'
  redirect?: 'follow' | 'error' | 'manual'
  referrer?: string
  referrerPolicy?: ReferrerPolicy
  integrity?: string
  keepalive?: boolean
  signal?: AbortSignal
}

export interface UseFetchReturn<T> extends UseAsyncReturn<T> {
  response: Response | null
}

// Tipos para hooks de mídia
export interface UseMediaQueryReturn {
  matches: boolean
}

export interface UseBreakpointReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLarge: boolean
  current: 'mobile' | 'tablet' | 'desktop' | 'large'
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
  onSuccess?: (position: GeolocationPosition) => void
  onError?: (error: GeolocationPositionError) => void
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null
  error: GeolocationPositionError | null
  loading: boolean
  getCurrentPosition: () => void
}

// Tipos para hooks de animação
export interface UseAnimationOptions {
  duration?: number
  easing?: string
  delay?: number
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
  onStart?: () => void
  onEnd?: () => void
  onCancel?: () => void
}

export interface UseAnimationReturn {
  ref: RefObject<HTMLElement>
  start: () => void
  pause: () => void
  cancel: () => void
  finish: () => void
  isRunning: boolean
  isPaused: boolean
}

// Tipos para hooks de observação
export interface UseIntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  triggerOnce?: boolean
  onIntersect?: (entry: IntersectionObserverEntry) => void
}

export interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLElement>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

export interface UseResizeObserverOptions {
  onResize?: (entry: ResizeObserverEntry) => void
}

export interface UseResizeObserverReturn {
  ref: RefObject<HTMLElement>
  width: number
  height: number
  entry: ResizeObserverEntry | null
}

// Tipos para hooks de eventos
export interface UseEventListenerOptions {
  target?: EventTarget | RefObject<EventTarget> | null
  passive?: boolean
  capture?: boolean
  once?: boolean
}

export interface UseKeyboardShortcutOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  target?: EventTarget | RefObject<EventTarget> | null
  enabled?: boolean
}

// Tipos para hooks de dados específicos do domínio
export interface UseCRUDOptions<T> {
  endpoint: string
  queryKey: string
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  transform?: (data: any) => T
}

export interface UseCRUDReturn<T> {
  // Query
  data: T[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  
  // Mutations
  create: (data: Omit<T, 'id'>) => Promise<T | null>
  update: (id: UUID, data: Partial<T>) => Promise<T | null>
  remove: (id: UUID) => Promise<boolean>
  
  // States
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Errors
  createError: Error | null
  updateError: Error | null
  deleteError: Error | null
}

export interface UseInfiniteQueryOptions<T> extends UseQueryOptions<T[]> {
  getNextPageParam?: (lastPage: T[], allPages: T[][]) => any
  getPreviousPageParam?: (firstPage: T[], allPages: T[][]) => any
  maxPages?: number
}

export interface UseInfiniteQueryReturn<T> extends Omit<UseQueryReturn<T[]>, 'data'> {
  data: {
    pages: T[][]
    pageParams: any[]
  } | null
  fetchNextPage: () => Promise<void>
  fetchPreviousPage: () => Promise<void>
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
}