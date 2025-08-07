/**
 * Barrel exports para services de autenticação
 */

export { AuthService, authService } from './AuthService'

// Re-export types
export type {
  LoginData,
  RegisterData,
  PasswordResetData,
  PasswordUpdateData,
  AuthResult,
} from './AuthService'