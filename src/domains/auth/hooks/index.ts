/**
 * Barrel exports para hooks de autenticação
 */

export { useAuth } from './use-auth'
export { usePermissions } from './use-permissions'
export { useMinimalSessionManager } from './use-minimal-session-manager'

// React Query hooks
export { 
  useAuthQueries,
  useCurrentUser,
  useCurrentUserProfile,
  useCurrentSession,
  usePermission,
  useAuthMutations,
  useEmailValidation
} from './use-auth-queries'

// Re-export types
export type {
  LoginData,
  SignUpData,
  ResetPasswordData,
  UserProfile,
  AuthResult
} from './use-auth'
