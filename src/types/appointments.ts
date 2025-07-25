/**
 * Tipos para o sistema de agendamentos
 */

// Status possíveis de um agendamento
export type AppointmentStatus = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'

// Tipo de visualização do calendário
export type CalendarView = 'day' | 'week' | 'month'

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
  reason?: string // Motivo do bloqueio
}

// Interface para configuração do calendário
export interface CalendarConfig {
  startHour: number // Hora de início (ex: 8)
  endHour: number // Hora de fim (ex: 18)
  slotDuration: number // Duração do slot em minutos (ex: 30)
  workDays: number[] // Dias da semana que funciona (0=domingo, 1=segunda, etc)
  holidays: string[] // Datas de feriados (YYYY-MM-DD)
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
}

// Interface para atualização de agendamento
export interface UpdateAppointmentData {
  barbeiro_id?: string
  service_id?: string
  data_agendamento?: string
  status?: AppointmentStatus
  observacoes?: string
  preco_final?: number
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

// Configuração padrão do calendário
export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  startHour: 8,
  endHour: 18,
  slotDuration: 30,
  workDays: [1, 2, 3, 4, 5, 6], // Segunda a sábado
  holidays: [],
}