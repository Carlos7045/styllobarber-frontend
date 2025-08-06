/**
 * Barrel exports para hooks - DEPRECATED
 * Use os novos paths: @/domains/[domain]/hooks ou @/shared/hooks
 */

// Auth hooks - moved to @/domains/auth/hooks
export { useAuth } from '@/domains/auth/hooks/use-auth'

// Appointments hooks - moved to @/domains/appointments/hooks
export { useAppointments } from '@/domains/appointments/hooks/use-appointments'
export { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'

// Shared hooks - moved to @/shared/hooks
export { useServices } from '@/shared/hooks/data/use-services'
export { useDebounce } from '@/shared/hooks/utils/use-debounce'

// Admin hooks - moved to @/domains/users/hooks
export { useAdminNotificacoes } from '@/domains/users/hooks/use-admin-notificacoes'

// Re-export types
export type {
  LoginData,
  SignUpData,
  ResetPasswordData,
  UserProfile,
  AuthResult
} from '@/domains/auth/hooks/use-auth'
