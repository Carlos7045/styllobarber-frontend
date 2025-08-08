/**
 * Barrel exports para componentes de autenticação
 */

export { AuthFeedback, useAuthFeedback, AuthMessage } from './AuthFeedback'
export { AuthFeedbackEnhanced, AuthFeedbackProvider } from './AuthFeedbackEnhanced'
export { AuthLoadingState, FullPageLoading } from './AuthLoadingState'
export {
  AuthLoading,
  LoginLoading,
  LogoutLoading,
  SignupLoading,
  PasswordRecoveryLoading,
} from './AuthLoadingStates'
export {
  AuthValidation,
  useFieldValidation,
  validationRules,
  ValidationDisplay,
} from './AuthValidation'
export { LogoutButton } from './LogoutButton'
export { LogoutPage } from './LogoutPage'
export {
  PermissionGuard,
  AdminOnly,
  BarberOnly,
  AdminOrBarber,
  ClientOnly,
  PDVGuard,
} from './PermissionGuard'
export { RouteGuard, PermissionGate, usePermissions } from './route-guard'
export { SessionErrorBoundary } from './SessionErrorBoundary'
export { SessionProvider } from './SessionProvider'
export { SessionStatus } from './SessionStatus'
export { SimpleRouteGuard } from './SimpleRouteGuard'

// Re-export types
export type { FeedbackType, AuthFeedbackProps } from './AuthFeedback'
export type { LoadingState, AuthLoadingProps } from './AuthLoadingStates'
