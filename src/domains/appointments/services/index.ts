/**
 * Barrel exports para services de agendamentos
 */

export { AppointmentService, appointmentService } from './AppointmentService'

// Re-export types
export type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentFilters,
} from './AppointmentService'