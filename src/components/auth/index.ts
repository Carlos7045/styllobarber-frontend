/**
 * Barrel exports para componentes de autenticação e proteção de rotas
 */

// Componentes de proteção de rota
export {
  RouteGuard,
  PermissionGate,
  usePermissions,
} from './route-guard'

// Componente de logout
export {
  LogoutButton,
  useLogout,
} from './LogoutButton'

// Gerenciamento de sessão
export {
  SessionProvider,
  useSession,
  SessionIndicator,
} from './SessionProvider'

export {
  SessionStatus,
  SessionStatusIcon,
  useSessionStatus,
} from './SessionStatus'

export {
  LogoutPage,
} from './LogoutPage'