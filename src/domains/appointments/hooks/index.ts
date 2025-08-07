/**
 * Barrel exports para hooks de agendamentos
 */

export { useAppointments } from './use-appointments'
export { useClientAppointments } from './use-client-appointments'
export { useAppointmentReports } from './use-appointment-reports'
export { useAgendamentosPendentes } from './use-agendamentos-pendentes'

// React Query hooks
export { 
  useAppointmentQueries,
  useAppointment,
  useAppointmentsByDate,
  useAppointmentsByBarber,
  useAppointmentsByClient,
  useAvailableSlots,
  useAppointmentStats,
  useAppointmentStatusMutations
} from './use-appointment-queries'
