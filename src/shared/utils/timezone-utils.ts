/**
 * Utilitários para manipulação de fuso horário
 * Garante que todas as datas sejam tratadas consistentemente no fuso brasileiro
 */

import { LOCALE_CONFIG } from '@/lib/config/constants'

/**
 * Offset do fuso horário brasileiro em relação ao UTC
 */
export const BRAZIL_UTC_OFFSET = LOCALE_CONFIG.utcOffset

/**
 * Combinar data e hora considerando o fuso horário brasileiro
 */
export function combineDateTimeForBrazil(dateString: string, timeString: string): string {
  // Formato: YYYY-MM-DD HH:mm:ss-03:00
  return `${dateString}T${timeString}:00-03:00`
}

/**
 * Converter timestamp UTC para horário brasileiro
 */
export function convertUTCToBrazilTime(utcTimestamp: string): Date {
  const utcDate = new Date(utcTimestamp)

  // Criar nova data ajustada para o fuso brasileiro
  const brazilTime = new Date(utcDate.getTime() + BRAZIL_UTC_OFFSET * 60 * 60 * 1000)

  return brazilTime
}

/**
 * Extrair apenas a hora de um timestamp considerando fuso brasileiro
 */
export function extractBrazilTime(utcTimestamp: string): string {
  const brazilDate = convertUTCToBrazilTime(utcTimestamp)

  return brazilDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Extrair apenas a data de um timestamp considerando fuso brasileiro
 */
export function extractBrazilDate(utcTimestamp: string): string {
  const brazilDate = convertUTCToBrazilTime(utcTimestamp)

  return brazilDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Formatar timestamp completo para exibição brasileira
 */
export function formatBrazilDateTime(utcTimestamp: string): string {
  const date = new Date(utcTimestamp)

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Verificar se um horário está no passado considerando fuso brasileiro
 */
export function isTimeInPast(utcTimestamp: string): boolean {
  const appointmentTime = new Date(utcTimestamp)
  const now = new Date()

  // Converter ambos para o mesmo fuso horário para comparação
  const appointmentBrazil = new Date(
    appointmentTime.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))

  return appointmentBrazil < nowBrazil
}

/**
 * Obter data/hora atual no fuso brasileiro
 */
export function getCurrentBrazilTime(): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

/**
 * Converter data local para formato que o Supabase aceita
 */
export function formatForSupabase(date: Date, time: string): string {
  const dateStr = date.toISOString().split('T')[0]
  return combineDateTimeForBrazil(dateStr, time)
}
