/**
 * Tipos para o domínio de agendamentos
 */

import { 
  BaseEntity, 
  AuditableEntity, 
  UUID, 
  Timestamp,
  Currency,
  DateRange,
  TimeRange,
  AsyncState,
  PaginatedResponse
} from '@/shared/types/base'

// Status do agendamento
export type AppointmentStatus = 
  | 'scheduled'    // Agendado
  | 'confirmed'    // Confirmado
  | 'in_progress'  // Em andamento
  | 'completed'    // Concluído
  | 'cancelled'    // Cancelado
  | 'no_show'      // Não compareceu
  | 'rescheduled'  // Reagendado

// Tipo de visualização do calendário
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

// Motivos de cancelamento
export type CancellationReason = 
  | 'client_request'
  | 'barber_unavailable'
  | 'emergency'
  | 'weather'
  | 'illness'
  | 'no_show'
  | 'other'

// Interface principal do agendamento
export interface Appointment extends BaseEntity, AuditableEntity {
  client_id: UUID
  barber_id: UUID
  service_id: UUID
  scheduled_at: Timestamp
  duration_minutes: number
  status: AppointmentStatus
  notes?: string
  internal_notes?: string
  price: Currency
  discount?: Currency
  final_price: Currency
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  cancellation_reason?: CancellationReason
  cancelled_at?: Timestamp
  cancelled_by?: UUID
  completed_at?: Timestamp
  no_show_at?: Timestamp
  reminder_sent_at?: Timestamp
  confirmation_sent_at?: Timestamp
  rating?: AppointmentRating
  metadata: AppointmentMetadata
}

// Status de pagamento
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'cancelled'

// Método de pagamento
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'bank_transfer' | 'credit'

// Avaliação do agendamento
export interface AppointmentRating {
  overall_rating: number // 1-5
  service_quality: number // 1-5
  punctuality: number // 1-5
  cleanliness: number // 1-5
  communication: number // 1-5
  comment?: string
  would_recommend: boolean
  rated_at: Timestamp
}

// Metadados do agendamento
export interface AppointmentMetadata {
  booking_source: 'web' | 'mobile' | 'phone' | 'walk_in' | 'admin'
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer?: string
  ip_address?: string
  user_agent?: string
  special_requests?: string[]
  accessibility_needs?: string[]
  is_first_visit: boolean
  is_recurring: boolean
  recurring_pattern?: RecurringPattern
}

// Padrão de recorrência
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly'
  interval: number // A cada X dias/semanas/meses
  days_of_week?: number[] // Para recorrência semanal (0=domingo, 1=segunda, etc)
  day_of_month?: number // Para recorrência mensal
  end_date?: string // YYYY-MM-DD
  max_occurrences?: number
}

// Dados expandidos do agendamento (com relacionamentos)
export interface AppointmentWithRelations extends Appointment {
  client: {
    id: UUID
    name: string
    email: string
    phone?: string
    avatar_url?: string
  }
  barber: {
    id: UUID
    name: string
    avatar_url?: string
    specialties: string[]
  }
  service: {
    id: UUID
    name: string
    description?: string
    duration_minutes: number
    price: Currency
    category: string
  }
}

// Slot de tempo no calendário
export interface TimeSlot {
  start_time: string // HH:mm
  end_time: string // HH:mm
  date: string // YYYY-MM-DD
  datetime: Date
  is_available: boolean
  is_blocked: boolean
  block_reason?: string
  appointment?: Appointment
  barber_id?: UUID
}

// Configuração do calendário
export interface CalendarConfig {
  business_hours: BusinessHours
  slot_duration_minutes: number
  advance_booking_days: number
  same_day_booking_cutoff_hours: number
  cancellation_policy: CancellationPolicy
  rescheduling_policy: ReschedulingPolicy
  buffer_time_minutes: number // Tempo entre agendamentos
  max_appointments_per_day: number
  holidays: Holiday[]
  special_hours: SpecialHours[]
}

export interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  is_open: boolean
  open_time: string // HH:mm
  close_time: string // HH:mm
  break_start?: string // HH:mm
  break_end?: string // HH:mm
}

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  is_recurring: boolean // Se repete anualmente
}

export interface SpecialHours {
  date: string // YYYY-MM-DD
  hours: DayHours
  reason: string
}

// Políticas de cancelamento e reagendamento
export interface CancellationPolicy {
  min_hours_before: number
  allow_cancellation: boolean
  cancellation_fee_percentage: number
  no_show_fee_percentage: number
  refund_policy: 'full' | 'partial' | 'none'
}

export interface ReschedulingPolicy {
  min_hours_before: number
  max_reschedules_per_month: number
  allow_rescheduling: boolean
  rescheduling_fee: Currency
}

// Dados para criação de agendamento
export interface CreateAppointmentData {
  client_id: UUID
  barber_id: UUID
  service_id: UUID
  scheduled_at: Timestamp
  notes?: string
  special_requests?: string[]
  is_recurring?: boolean
  recurring_pattern?: RecurringPattern
}

// Dados para atualização de agendamento
export interface UpdateAppointmentData {
  barber_id?: UUID
  service_id?: UUID
  scheduled_at?: Timestamp
  status?: AppointmentStatus
  notes?: string
  internal_notes?: string
  price?: Currency
  discount?: Currency
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
}

// Dados para cancelamento
export interface CancelAppointmentData {
  reason: CancellationReason
  notes?: string
  refund_amount?: Currency
  notify_client: boolean
}

// Dados para reagendamento
export interface RescheduleAppointmentData {
  new_scheduled_at: Timestamp
  new_barber_id?: UUID
  reason?: string
  notify_client: boolean
}

// Filtros para busca de agendamentos
export interface AppointmentFilters {
  client_id?: UUID
  barber_id?: UUID
  service_id?: UUID
  status?: AppointmentStatus[]
  date_range?: DateRange
  payment_status?: PaymentStatus[]
  booking_source?: string[]
  has_rating?: boolean
  is_first_visit?: boolean
}

// Estatísticas do calendário
export interface CalendarStats {
  total_appointments: number
  appointments_today: number
  appointments_this_week: number
  appointments_this_month: number
  pending_confirmations: number
  completed_today: number
  revenue_today: Currency
  revenue_this_week: Currency
  revenue_this_month: Currency
  occupancy_rate: number // Percentage
  average_appointment_value: Currency
  no_show_rate: number // Percentage
  cancellation_rate: number // Percentage
  client_satisfaction: number // Average rating
}

// Disponibilidade do barbeiro
export interface BarberAvailability {
  barber_id: UUID
  date: string // YYYY-MM-DD
  available_slots: TimeSlot[]
  total_slots: number
  booked_slots: number
  blocked_slots: number
  is_working: boolean
  working_hours: DayHours
}

// Bloqueio de horário
export interface TimeBlock extends BaseEntity {
  barber_id?: UUID // Se null, bloqueia para todos
  start_time: Timestamp
  end_time: Timestamp
  reason: string
  is_recurring: boolean
  recurring_pattern?: RecurringPattern
  created_by: UUID
}

// Notificações de agendamento
export interface AppointmentNotification extends BaseEntity {
  appointment_id: UUID
  type: NotificationType
  recipient_type: 'client' | 'barber' | 'admin'
  recipient_id: UUID
  channel: 'email' | 'sms' | 'push' | 'whatsapp'
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  scheduled_for: Timestamp
  sent_at?: Timestamp
  delivered_at?: Timestamp
  error_message?: string
  template_id: string
  template_data: Record<string, any>
}

export type NotificationType = 
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_completed'
  | 'no_show_notification'
  | 'rating_request'

// Estado do calendário
export interface CalendarState extends AsyncState<AppointmentWithRelations[]> {
  view: CalendarView
  selectedDate: Date
  selectedBarber?: UUID
  filters: AppointmentFilters
  stats: CalendarStats | null
  config: CalendarConfig | null
}

// Constantes para validação
export const APPOINTMENT_VALIDATION = {
  MIN_ADVANCE_BOOKING_MINUTES: 30,
  MAX_ADVANCE_BOOKING_DAYS: 90,
  MIN_APPOINTMENT_DURATION: 15,
  MAX_APPOINTMENT_DURATION: 480, // 8 horas
  MAX_NOTES_LENGTH: 500,
  MAX_SPECIAL_REQUESTS: 5
} as const

// Labels para status
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
  rescheduled: 'Reagendado'
}

// Cores para status
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  rescheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
}

// Configuração padrão
export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  business_hours: {
    monday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    tuesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    wednesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    thursday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    friday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    saturday: { is_open: true, open_time: '08:00', close_time: '16:00' },
    sunday: { is_open: false, open_time: '08:00', close_time: '18:00' }
  },
  slot_duration_minutes: 30,
  advance_booking_days: 30,
  same_day_booking_cutoff_hours: 2,
  buffer_time_minutes: 15,
  max_appointments_per_day: 20,
  holidays: [],
  special_hours: [],
  cancellation_policy: {
    min_hours_before: 24,
    allow_cancellation: true,
    cancellation_fee_percentage: 0,
    no_show_fee_percentage: 50,
    refund_policy: 'full'
  },
  rescheduling_policy: {
    min_hours_before: 12,
    max_reschedules_per_month: 3,
    allow_rescheduling: true,
    rescheduling_fee: 0
  }
}