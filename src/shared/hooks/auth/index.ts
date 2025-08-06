/**
 * Barrel exports para hooks de autenticação otimizados
 */

// Hooks otimizados
export { useAuthOptimized } from './use-auth-optimized'
export { useSessionManager } from './use-session-manager'

// Re-export types
export type {
  AuthConfig,
  AuthState,
  AuthStatus,
} from './use-auth-optimized'

export type {
  SessionManagerConfig,
  SessionState,
  SessionStatus,
} from './use-session-manager'
