/**
 * Barrel exports para componentes de feedback compartilhados
 */

export { ErrorBoundary } from './ErrorBoundary'
export { ApiErrorBoundary, withApiErrorBoundary } from './ApiErrorBoundary'
export { NoSSR } from './NoSSR'
export { LoadingSpinner } from './LoadingSpinner'

// Re-export types (interfaces are not exported, using component types instead)
