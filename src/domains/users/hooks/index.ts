/**
 * Barrel exports para hooks de usuários
 */

// Admin hooks
export { useAdminAgendamentos } from './use-admin-agendamentos'
export { useAdminClientes } from './use-admin-clientes'
export { useFuncionariosAdmin } from './use-funcionarios-admin'
export { useAdminHorarios } from './use-admin-horarios'
export { useAdminNotificacoes } from './use-admin-notificacoes'
export { useAdminServicos } from './use-admin-servicos'

// Barber hooks
export { useBarberClients } from './use-barber-clients'
export { useBarberFinancialData } from './use-barber-financial-data'
export { useBarberPermissions } from './use-barber-permissions'

// Profile hooks
export { useProfileSync } from './use-profile-sync'
// Hook unificado substituiu useFuncionariosEspecialidades
// export { useFuncionariosEspecialidades } from './use-funcionarios-especialidades-simple'

// Public hooks (for clients)
export { useFuncionariosPublicos } from './use-funcionarios-publicos'

// React Query hooks
export { 
  useUserQueries,
  useUser,
  useUsers,
  useActiveUsersByRole
} from './use-user-queries'
