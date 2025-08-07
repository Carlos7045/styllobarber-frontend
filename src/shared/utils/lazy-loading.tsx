import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'

/**
 * Utilitário para criar componentes lazy com loading personalizado
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  displayName?: string
): LazyExoticComponent<T> {
  const LazyComponent = lazy(importFn)
  
  if (displayName) {
    LazyComponent.displayName = `Lazy(${displayName})`
  }
  
  return LazyComponent
}

/**
 * Componente de loading padrão para lazy components
 */
export function LazyLoadingFallback({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}

/**
 * Loading específico para páginas do dashboard
 */
export function DashboardPageLoading({ title }: { title?: string }) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {title && (
            <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          )}
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading específico para modais
 */
export function ModalLoading() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Carregando modal...</p>
      </div>
    </div>
  )
}

/**
 * Loading específico para componentes financeiros
 */
export function FinancialComponentLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

/**
 * Loading específico para calendário
 */
export function CalendarLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}