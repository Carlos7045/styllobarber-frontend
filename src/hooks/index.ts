/**
 * Barrel exports para hooks
 */

export { useAuth } from './use-auth'
export { useAppointments } from './use-appointments'
export { useClientAppointments } from './use-client-appointments'
export { useServices } from './use-services'
export { useDebounce } from './use-debounce'
export { useAdminNotificacoes } from './use-admin-notificacoes'

// Re-export types
export type {
  LoginData,
  SignUpData,
  ResetPasswordData,
  UserProfile,
  AuthResult
} from './use-auth'