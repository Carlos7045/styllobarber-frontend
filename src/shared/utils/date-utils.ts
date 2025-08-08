/**
 * Utilitários para manipulação de datas e horários
 */

import {
  format,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isBefore,
  isAfter,
  addMinutes,
  setHours,
  setMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CalendarConfig, TimeSlot } from '@/types/appointments'

/**
 * Formatar data para exibição
 */
export function formatDate(date: Date, pattern: string = 'dd/MM/yyyy'): string {
  return format(date, pattern, { locale: ptBR })
}

/**
 * Formatar hora para exibição
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: ptBR })
}

/**
 * Formatar data e hora para exibição
 */
export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

/**
 * Formatar data para o formato do banco (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Formatar datetime para o formato do banco (ISO string)
 * Considera o fuso horário brasileiro
 */
export function formatDateTimeForDB(date: Date): string {
  return date.toISOString()
}

/**
 * Criar data com fuso horário brasileiro
 */
export function createBrazilianDate(dateString: string, timeString: string): Date {
  // Combinar data e hora no formato brasileiro
  const dateTimeString = `${dateString}T${timeString}:00`

  // Criar data assumindo fuso horário brasileiro (UTC-3)
  const date = new Date(dateTimeString)

  // Ajustar para UTC considerando o offset brasileiro
  const brazilOffset = -3 * 60 // -3 horas em minutos
  const localOffset = date.getTimezoneOffset() // offset local em minutos
  const adjustedDate = new Date(date.getTime() + (brazilOffset - localOffset) * 60 * 1000)

  return adjustedDate
}

/**
 * Converter data UTC para fuso horário brasileiro
 */
export function convertUTCToBrazilian(utcDate: Date): Date {
  const brazilOffset = -3 * 60 * 60 * 1000 // -3 horas em millisegundos
  return new Date(utcDate.getTime() + brazilOffset)
}

/**
 * Formatar data considerando fuso horário brasileiro
 */
export function formatBrazilianDateTime(dateString: string): string {
  const utcDate = new Date(dateString)
  const brazilDate = convertUTCToBrazilian(utcDate)
  return format(brazilDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

/**
 * Formatar apenas a hora considerando fuso horário brasileiro
 */
export function formatBrazilianTime(dateString: string): string {
  const utcDate = new Date(dateString)
  const brazilDate = convertUTCToBrazilian(utcDate)
  return format(brazilDate, 'HH:mm', { locale: ptBR })
}

/**
 * Converter string de data do banco para Date
 */
export function parseDBDate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Formatar string de data para exibição
 */
export function formatDateString(dateString: string, pattern: string = 'dd/MM/yyyy'): string {
  const date = new Date(dateString)
  return format(date, pattern, { locale: ptBR })
}

/**
 * Formatar string de hora para exibição (HH:mm)
 */
export function formatTimeString(timeString: string): string {
  // Se já está no formato HH:mm, retorna como está
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString
  }

  // Se está no formato HH:mm:ss, remove os segundos
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeString.substring(0, 5)
  }

  // Tenta converter para Date e formatar
  try {
    const date = new Date(`1970-01-01T${timeString}`)
    return format(date, 'HH:mm', { locale: ptBR })
  } catch {
    return timeString
  }
}

/**
 * Verificar se uma data é hoje
 */
export function isDateToday(date: Date): boolean {
  return isToday(date)
}

/**
 * Verificar se uma data é no passado
 */
export function isDatePast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return isBefore(compareDate, today)
}

/**
 * Obter os dias da semana para uma data específica
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Domingo = 0
  const days: Date[] = []

  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i))
  }

  return days
}

/**
 * Obter os dias do mês para uma data específica
 */
export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const startWeek = startOfWeek(start, { weekStartsOn: 0 }) // Domingo = 0
  const endWeek = endOfWeek(end, { weekStartsOn: 0 })

  const days: Date[] = []
  let current = startWeek

  while (current <= endWeek) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }

  return days
}

/**
 * Obter range de uma semana
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  }
}

/**
 * Obter range de um mês
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

/**
 * Interface para horários específicos de funcionamento
 */
export interface HorarioFuncionamentoDia {
  horario_inicio: string // formato "HH:mm"
  horario_fim: string // formato "HH:mm"
  intervalo_inicio?: string
  intervalo_fim?: string
  ativo: boolean
}

/**
 * Interface para agendamentos existentes (para verificação de conflitos)
 */
export interface ExistingAppointment {
  data_agendamento: string
  barbeiro_id?: string
  service?: {
    duracao_minutos: number
  }
}

/**
 * Gerar slots de horário para uma data
 */
export function generateTimeSlots(
  date: Date,
  config: CalendarConfig,
  horarioEspecifico?: HorarioFuncionamentoDia,
  existingAppointments?: ExistingAppointment[],
  serviceDuration?: number
): TimeSlot[] {
  const slots: TimeSlot[] = []

  // Se há horário específico e está inativo, retorna array vazio
  if (horarioEspecifico && !horarioEspecifico.ativo) {
    return slots
  }

  // Usar horário específico se disponível, senão usar config padrão
  let startHour: number
  let endHour: number

  if (horarioEspecifico) {
    const [startH, startM] = horarioEspecifico.horario_inicio.split(':').map(Number)
    const [endH, endM] = horarioEspecifico.horario_fim.split(':').map(Number)
    startHour = startH + startM / 60
    endHour = endH + endM / 60
  } else {
    startHour = config.startHour || 8
    endHour = config.endHour || 18
  }

  const interval = config.slotInterval || 30

  let current = setMinutes(setHours(new Date(date), Math.floor(startHour)), (startHour % 1) * 60)
  const end = setMinutes(setHours(new Date(date), Math.floor(endHour)), (endHour % 1) * 60)

  // Calcular slots bloqueados por intervalos
  const intervalBlockedSlots = new Set<string>()
  if (horarioEspecifico?.intervalo_inicio && horarioEspecifico?.intervalo_fim) {
    const { calculateIntervalBlockedSlots } = require('@/shared/utils/appointment-utils')
    const blocked = calculateIntervalBlockedSlots(
      horarioEspecifico.intervalo_inicio,
      horarioEspecifico.intervalo_fim,
      formatDateForDB(date),
      interval
    )
    blocked.forEach((slot) => intervalBlockedSlots.add(slot))
  }

  // Calcular slots bloqueados por agendamentos existentes
  const appointmentBlockedSlots = new Set<string>()
  if (existingAppointments) {
    const { calculateBlockedSlots } = require('@/shared/utils/appointment-utils')
    const appointmentSlots = existingAppointments.map((apt) => ({
      inicio: new Date(apt.data_agendamento),
      fim: new Date(
        new Date(apt.data_agendamento).getTime() + (apt.service?.duracao_minutos || 30) * 60 * 1000
      ),
      barbeiroId: apt.barbeiro_id,
      servicoId: apt.data_agendamento,
      duracaoMinutos: apt.service?.duracao_minutos || 30,
    }))

    const blocked = calculateBlockedSlots(appointmentSlots, formatDateForDB(date), interval)
    blocked.forEach((slot) => appointmentBlockedSlots.add(slot))
  }

  while (current < end) {
    const timeString = formatTime(current)

    // Verificar se está bloqueado por intervalo
    const isInInterval = intervalBlockedSlots.has(timeString)

    // Verificar se está bloqueado por agendamento
    const isOccupied = appointmentBlockedSlots.has(timeString)

    // Verificar se há tempo suficiente para o serviço (se duração especificada)
    let hasEnoughTime = true
    if (serviceDuration && serviceDuration > interval) {
      const { hasEnoughTimeForService } = require('@/shared/utils/appointment-utils')
      const serviceEnd = addMinutes(current, serviceDuration)

      // Verificar se o serviço terminaria após o horário de funcionamento
      if (serviceEnd > end) {
        hasEnoughTime = false
      }

      // Verificar se conflitaria com intervalo
      if (
        hasEnoughTime &&
        horarioEspecifico?.intervalo_inicio &&
        horarioEspecifico?.intervalo_fim
      ) {
        const { conflictsWithInterval } = require('@/shared/utils/appointment-utils')
        hasEnoughTime = !conflictsWithInterval(
          current,
          serviceEnd,
          horarioEspecifico.intervalo_inicio,
          horarioEspecifico.intervalo_fim,
          formatDateForDB(date)
        )
      }
    }

    // Só adicionar slot se não estiver bloqueado
    if (!isInInterval) {
      slots.push({
        time: timeString,
        date: formatDateForDB(date),
        datetime: new Date(current),
        available: !isOccupied && hasEnoughTime,
        blocked: isOccupied,
        reason: isOccupied ? 'occupied' : !hasEnoughTime ? 'insufficient_time' : undefined,
      })
    }

    current = addMinutes(current, interval)
  }

  return slots
}

// Re-exportar funções do date-fns para compatibilidade
export { addDays, subDays, addMonths, subMonths, isToday, isBefore, isAfter }
