/**
 * Utilitários para manipulação de datas e horários
 */

import { format, addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isBefore, isAfter, addMinutes, setHours, setMinutes } from 'date-fns'
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
 */
export function formatDateTimeForDB(date: Date): string {
  return date.toISOString()
}

/**
 * Converter string de data do banco para Date
 */
export function parseDBDate(dateString: string): Date {
  return new Date(dateString)
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
  return isBefore(date, new Date())
}

/**
 * Verificar se uma data é no futuro
 */
export function isDateFuture(date: Date): boolean {
  return isAfter(date, new Date())
}

/**
 * Obter próximo dia útil
 */
export function getNextWorkDay(date: Date, workDays: number[]): Date {
  let nextDay = addDays(date, 1)
  
  while (!workDays.includes(nextDay.getDay())) {
    nextDay = addDays(nextDay, 1)
  }
  
  return nextDay
}

/**
 * Obter dia útil anterior
 */
export function getPreviousWorkDay(date: Date, workDays: number[]): Date {
  let prevDay = subDays(date, 1)
  
  while (!workDays.includes(prevDay.getDay())) {
    prevDay = subDays(prevDay, 1)
  }
  
  return prevDay
}

/**
 * Gerar slots de horário para um dia
 */
export function generateTimeSlots(date: Date, config: CalendarConfig): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayOfWeek = date.getDay()
  
  // Verificar se é dia útil
  if (!config.workDays.includes(dayOfWeek)) {
    return slots
  }
  
  // Verificar se é feriado
  const dateString = formatDateForDB(date)
  if (config.holidays.includes(dateString)) {
    return slots
  }
  
  // Gerar slots de horário
  for (let hour = config.startHour; hour < config.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += config.slotDuration) {
      const slotTime = setMinutes(setHours(date, hour), minute)
      
      // Não criar slots no passado
      if (isBefore(slotTime, new Date())) {
        continue
      }
      
      const slot: TimeSlot = {
        time: formatTime(slotTime),
        date: dateString,
        datetime: slotTime,
        available: true,
        blocked: false,
      }
      
      slots.push(slot)
    }
  }
  
  return slots
}

/**
 * Obter range de datas para visualização semanal
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Segunda-feira
    end: endOfWeek(date, { weekStartsOn: 1 }), // Domingo
  }
}

/**
 * Obter range de datas para visualização mensal
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

/**
 * Obter array de datas para uma semana
 */
export function getWeekDays(date: Date): Date[] {
  const { start } = getWeekRange(date)
  const days: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i))
  }
  
  return days
}

/**
 * Obter array de datas para um mês
 */
export function getMonthDays(date: Date): Date[] {
  const { start, end } = getMonthRange(date)
  const days: Date[] = []
  
  let currentDate = start
  while (!isAfter(currentDate, end)) {
    days.push(currentDate)
    currentDate = addDays(currentDate, 1)
  }
  
  return days
}

/**
 * Calcular duração entre dois horários em minutos
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

/**
 * Adicionar minutos a uma data
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  return addMinutes(date, minutes)
}

// Re-exportar funções do date-fns para uso direto
export { addDays, subDays, addMonths, subMonths }

/**
 * Verificar se dois horários se sobrepõem
 */
export function timeSlotsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2)
}

/**
 * Obter nome do dia da semana
 */
export function getDayName(date: Date, short: boolean = false): string {
  return format(date, short ? 'EEE' : 'EEEE', { locale: ptBR })
}

/**
 * Obter nome do mês
 */
export function getMonthName(date: Date, short: boolean = false): string {
  return format(date, short ? 'MMM' : 'MMMM', { locale: ptBR })
}

/**
 * Verificar se é fim de semana
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Domingo ou sábado
}

/**
 * Obter horário de início e fim de um agendamento
 */
export function getAppointmentTimeRange(
  startTime: Date,
  durationMinutes: number
): { start: Date; end: Date } {
  return {
    start: startTime,
    end: addMinutes(startTime, durationMinutes),
  }
}