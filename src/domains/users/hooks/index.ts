/**
 * Barrel exports para hooks de usuários
 */

// Admin hooks
export { useAdminAgendamentos } from './use-admin-agendamentos'
export { useAdminClientes } from './use-admin-clientes'
export { useAdminFuncionarios } from './use-admin-funcionarios'
export { useAdminHorarios } from './use-admin-horarios'
export { useAdminNotificacoes } from './use-admin-notificacoes'
export { useAdminServicos } from './use-admin-servicos'

// Barber hooks
export { useBarberClients } from './use-barber-clients'
export { useBarberFinancialData } from './use-barber-financial-data'
export { useBarberPermissions } from './use-barber-permissions'

// Profile hooks
export { useProfileSync } from './use-profile-sync'
export { useFuncionariosEspecialidades } from './use-funcionarios-especialidades-simple'

// React Query hooks
export { 
  useUserQueries,
  useUser,
  useUsers,
  useActiveUsersByRole
} from './use-user-queries'
