/**
 * Tipos para o sistema de agendamentos
 */

// Status possíveis de um agendamento
export type AppointmentStatus =
  | 'pendente'
  | 'confirmado'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'

// Tipo de visualização do calendário
export type CalendarView = 'day' | 'week' | 'month'

// Status de pagamento
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// Método de pagamento
export type PaymentMethod = 'advance' | 'cash' | 'card' | 'pix' | 'local'

// Interface para um agendamento
export interface Appointment {
  id: string
  cliente_id: string
  barbeiro_id: string | null
  service_id: string
  data_agendamento: string // ISO string
  status: AppointmentStatus
  observacoes?: string
  preco_final?: number
  created_at: string
  updated_at: string

  // Campos de pagamento
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  payment_date?: string
  asaas_payment_id?: string
  discount_applied?: number

  // Dados relacionados (joins)
  cliente?: {
    id: string
    nome: string
    telefone?: string
    email: string
  }
  barbeiro?: {
    id: string
    nome: string
  }
  service?: {
    id: string
    nome: string
    preco: number
    duracao_minutos: number
  }
}

// Interface para um slot de horário no calendário
export interface TimeSlot {
  time: string // HH:mm format
  date: string // YYYY-MM-DD format
  datetime: Date
  available: boolean
  appointment?: Appointment
  blocked?: boolean
  reason?: 'occupied' | 'interval' | 'insufficient_time' | 'outside_hours'
  message?: string
  occupiedUntil?: string
}

// Configuração do calendário
export interface CalendarConfig {
  startHour: number
  endHour: number
  slotInterval: number // em minutos
  workDays: number[] // 0 = domingo, 1 = segunda, etc.
}

// Configuração padrão do calendário
export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  startHour: 8,
  endHour: 18,
  slotInterval: 30,
  workDays: [1, 2, 3, 4, 5, 6], // Segunda a sábado
}

// Interface para dados do calendário
export interface CalendarData {
  date: Date
  view: CalendarView
  appointments: Appointment[]
  timeSlots: TimeSlot[]
  config: CalendarConfig
}

// Interface para filtros do calendário
export interface CalendarFilters {
  barbeiro_id?: string
  status?: AppointmentStatus[]
  date_start?: string
  date_end?: string
}

// Interface para criação de agendamento
export interface CreateAppointmentData {
  cliente_id: string
  barbeiro_id?: string
  service_id: string
  data_agendamento: string
  observacoes?: string
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  payment_type?: 'pix' | 'card' | 'cash'
  asaas_payment_id?: string
  discount_applied?: number
}

// Interface para atualização de agendamento
export interface UpdateAppointmentData {
  barbeiro_id?: string
  service_id?: string
  data_agendamento?: string
  status?: AppointmentStatus
  observacoes?: string
  preco_final?: number
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  payment_date?: string
  asaas_payment_id?: string
}

// Interface para estatísticas do calendário
export interface CalendarStats {
  total_agendamentos: number
  agendamentos_hoje: number
  agendamentos_pendentes: number
  receita_dia: number
  taxa_ocupacao: number
}

// Cores para diferentes status
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pendente: 'bg-warning text-warning-foreground',
  confirmado: 'bg-info text-info-foreground',
  em_andamento: 'bg-primary text-primary-foreground',
  concluido: 'bg-success text-success-foreground',
  cancelado: 'bg-error text-error-foreground',
}

// Labels para status
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

// Interface para agendamento com funcionalidades específicas do cliente
export interface ClientAppointment extends Appointment {
  canCancel: boolean
  canReschedule: boolean
  timeUntilAppointment?: string
  isUpcoming: boolean
  isPast: boolean
  canPay?: boolean // Se pode efetuar pagamento
  needsPayment?: boolean // Se precisa de pagamento
}

// Interface para política de cancelamento
export interface CancellationPolicy {
  allowCancellation: boolean
  minHoursBeforeAppointment: number
  maxCancellationsPerMonth: number
  requireReason: boolean
}

// Interface para política de reagendamento
export interface ReschedulingPolicy {
  allowRescheduling: boolean
  minHoursBeforeAppointment: number
  maxReschedulesPerAppointment: number
  requireReason: boolean
}

// Política padrão de cancelamento
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  allowCancellation: true,
  minHoursBeforeAppointment: 2, // 2 horas antes
  maxCancellationsPerMonth: 3,
  requireReason: false,
}

// Política padrão de reagendamento
export const DEFAULT_RESCHEDULING_POLICY: ReschedulingPolicy = {
  allowRescheduling: true,
  minHoursBeforeAppointment: 2, // 2 horas antes
  maxReschedulesPerAppointment: 2,
  requireReason: false,
}

// Cores para diferentes status de pagamento
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
}

// Labels para status de pagamento
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
}

// Labels para métodos de pagamento
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  advance: 'Pagamento Antecipado',
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  local: 'No Local',
}
