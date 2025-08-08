/**
 * Utilitários para gerenciamento de agendamentos
 * Inclui lógica para verificação de conflitos considerando duração dos serviços
 */

import { addMinutes, parseISO, format } from 'date-fns'

export interface AppointmentSlot {
  inicio: Date
  fim: Date
  barbeiroId?: string
  servicoId: string
  duracaoMinutos: number
}

export interface ConflictCheck {
  data: string // YYYY-MM-DD
  horario: string // HH:mm
  duracaoMinutos: number
  barbeiroId?: string
}

export interface IntervalConfig {
  inicio: string // HH:mm
  fim: string // HH:mm
}

/**
 * Converte string de horário para Date
 */
export function parseTimeToDate(date: string, time: string): Date {
  return parseISO(`${date}T${time}:00`)
}

/**
 * Verifica se dois períodos de tempo se sobrepõem
 */
export function hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Calcula o horário de fim baseado no início e duração
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  return addMinutes(startTime, durationMinutes)
}

/**
 * Verifica se um horário está dentro de um intervalo (ex: almoço)
 */
export function isTimeInInterval(
  checkTime: Date,
  intervalStart: string,
  intervalEnd: string,
  date: string
): boolean {
  const intervalStartTime = parseTimeToDate(date, intervalStart)
  const intervalEndTime = parseTimeToDate(date, intervalEnd)

  return checkTime >= intervalStartTime && checkTime <= intervalEndTime
}

/**
 * Verifica se um agendamento conflitaria com um intervalo
 */
export function conflictsWithInterval(
  appointmentStart: Date,
  appointmentEnd: Date,
  intervalStart: string,
  intervalEnd: string,
  date: string
): boolean {
  const intervalStartTime = parseTimeToDate(date, intervalStart)
  const intervalEndTime = parseTimeToDate(date, intervalEnd)

  return hasTimeOverlap(appointmentStart, appointmentEnd, intervalStartTime, intervalEndTime)
}

/**
 * Verifica se dois agendamentos conflitam
 */
export function appointmentsConflict(
  appointment1: AppointmentSlot,
  appointment2: AppointmentSlot
): boolean {
  // Se são barbeiros diferentes, não há conflito
  if (
    appointment1.barbeiroId &&
    appointment2.barbeiroId &&
    appointment1.barbeiroId !== appointment2.barbeiroId
  ) {
    return false
  }

  return hasTimeOverlap(
    appointment1.inicio,
    appointment1.fim,
    appointment2.inicio,
    appointment2.fim
  )
}

/**
 * Gera lista de slots ocupados por um agendamento
 */
export function getOccupiedSlots(
  startTime: Date,
  durationMinutes: number,
  slotInterval: number = 30
): string[] {
  const slots: string[] = []
  const endTime = calculateEndTime(startTime, durationMinutes)

  let currentTime = new Date(startTime)

  // Incluir o slot de início
  slots.push(format(currentTime, 'HH:mm'))

  // Adicionar slots intermediários
  while (currentTime < endTime) {
    currentTime = addMinutes(currentTime, slotInterval)
    if (currentTime <= endTime) {
      slots.push(format(currentTime, 'HH:mm'))
    }
  }

  return slots
}

/**
 * Verifica se há tempo suficiente para um serviço em um slot
 */
export function hasEnoughTimeForService(
  slotStart: Date,
  serviceDuration: number,
  nextAppointment?: Date,
  intervalStart?: string,
  intervalEnd?: string,
  date?: string
): boolean {
  const serviceEnd = calculateEndTime(slotStart, serviceDuration)

  // Verificar se conflita com próximo agendamento
  if (nextAppointment && serviceEnd > nextAppointment) {
    return false
  }

  // Verificar se conflita com intervalo
  if (intervalStart && intervalEnd && date) {
    if (conflictsWithInterval(slotStart, serviceEnd, intervalStart, intervalEnd, date)) {
      return false
    }
  }

  return true
}

/**
 * Calcula slots bloqueados por agendamentos existentes (com cache)
 */
export function calculateBlockedSlots(
  appointments: AppointmentSlot[],
  date: string,
  slotInterval: number = 30
): Set<string> {
  // Tentar buscar do cache primeiro
  const { appointmentCache } = require('./appointment-cache')
  const cached = appointmentCache.getBlockedSlots(date, appointments, slotInterval)

  if (cached) {
    return cached
  }

  // Calcular se não estiver em cache
  const blockedSlots = new Set<string>()

  appointments.forEach((appointment) => {
    const occupiedSlots = getOccupiedSlots(
      appointment.inicio,
      appointment.duracaoMinutos,
      slotInterval
    )

    occupiedSlots.forEach((slot) => blockedSlots.add(slot))
  })

  // Salvar no cache
  appointmentCache.setBlockedSlots(date, appointments, slotInterval, blockedSlots)

  return blockedSlots
}

/**
 * Calcula slots bloqueados por intervalos
 */
export function calculateIntervalBlockedSlots(
  intervalStart: string,
  intervalEnd: string,
  date: string,
  slotInterval: number = 30
): Set<string> {
  const blockedSlots = new Set<string>()

  const startTime = parseTimeToDate(date, intervalStart)
  const endTime = parseTimeToDate(date, intervalEnd)

  let currentTime = new Date(startTime)

  while (currentTime <= endTime) {
    blockedSlots.add(format(currentTime, 'HH:mm'))
    currentTime = addMinutes(currentTime, slotInterval)
  }

  return blockedSlots
}

/**
 * Motivos pelos quais um slot pode estar indisponível
 */
export enum SlotUnavailableReason {
  OCCUPIED = 'occupied',
  INTERVAL = 'interval',
  INSUFFICIENT_TIME = 'insufficient_time',
  OUTSIDE_HOURS = 'outside_hours',
  BARBER_UNAVAILABLE = 'barber_unavailable',
}

export interface SlotAvailability {
  available: boolean
  reason?: SlotUnavailableReason
  message?: string
  occupiedUntil?: string
}

/**
 * Verifica disponibilidade de um slot específico (com cache)
 */
export function checkSlotAvailability(
  date: string,
  time: string,
  serviceDuration: number,
  appointments: AppointmentSlot[],
  intervalConfig?: IntervalConfig,
  barbeiroId?: string
): SlotAvailability {
  // Tentar buscar do cache primeiro
  const { appointmentCache } = require('./appointment-cache')
  const cached = appointmentCache.getAvailability(
    date,
    time,
    serviceDuration,
    barbeiroId,
    intervalConfig
  )

  if (cached) {
    return cached
  }

  // Calcular se não estiver em cache
  const slotStart = parseTimeToDate(date, time)
  const slotEnd = calculateEndTime(slotStart, serviceDuration)

  let result: SlotAvailability

  // Verificar se está no intervalo
  if (intervalConfig) {
    if (
      conflictsWithInterval(slotStart, slotEnd, intervalConfig.inicio, intervalConfig.fim, date)
    ) {
      result = {
        available: false,
        reason: SlotUnavailableReason.INTERVAL,
        message: `Horário de intervalo (${intervalConfig.inicio}-${intervalConfig.fim})`,
      }

      // Salvar no cache e retornar
      appointmentCache.setAvailability(
        date,
        time,
        serviceDuration,
        result,
        barbeiroId,
        intervalConfig
      )
      return result
    }
  }

  // Verificar conflitos com agendamentos existentes
  const newAppointment: AppointmentSlot = {
    inicio: slotStart,
    fim: slotEnd,
    barbeiroId,
    servicoId: 'temp',
    duracaoMinutos: serviceDuration,
  }

  for (const existingAppointment of appointments) {
    if (appointmentsConflict(newAppointment, existingAppointment)) {
      const occupiedUntil = format(existingAppointment.fim, 'HH:mm')

      result = {
        available: false,
        reason: SlotUnavailableReason.OCCUPIED,
        message: `Ocupado até ${occupiedUntil}`,
        occupiedUntil,
      }

      // Salvar no cache e retornar
      appointmentCache.setAvailability(
        date,
        time,
        serviceDuration,
        result,
        barbeiroId,
        intervalConfig
      )
      return result
    }
  }

  result = { available: true }

  // Salvar no cache
  appointmentCache.setAvailability(date, time, serviceDuration, result, barbeiroId, intervalConfig)

  return result
}
