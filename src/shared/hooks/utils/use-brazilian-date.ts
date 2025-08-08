/**
 * Hook para formatação de datas considerando o fuso horário brasileiro
 */

import { useMemo } from 'react'
import {
  formatBrazilDateTime,
  extractBrazilTime,
  extractBrazilDate,
  isTimeInPast,
} from '@/shared/utils/timezone-utils'

export function useBrazilianDate(utcTimestamp?: string | null) {
  return useMemo(() => {
    if (!utcTimestamp) {
      return {
        fullDateTime: '',
        date: '',
        time: '',
        isPast: false,
        isValid: false,
      }
    }

    try {
      return {
        fullDateTime: formatBrazilDateTime(utcTimestamp),
        date: extractBrazilDate(utcTimestamp),
        time: extractBrazilTime(utcTimestamp),
        isPast: isTimeInPast(utcTimestamp),
        isValid: true,
      }
    } catch (error) {
      console.error('Erro ao formatar data brasileira:', error)
      return {
        fullDateTime: '',
        date: '',
        time: '',
        isPast: false,
        isValid: false,
      }
    }
  }, [utcTimestamp])
}

/**
 * Hook para formatação de múltiplas datas
 */
export function useBrazilianDates(utcTimestamps: (string | null)[]) {
  return useMemo(() => {
    return utcTimestamps.map((timestamp) => {
      if (!timestamp) return null

      try {
        return {
          fullDateTime: formatBrazilDateTime(timestamp),
          date: extractBrazilDate(timestamp),
          time: extractBrazilTime(timestamp),
          isPast: isTimeInPast(timestamp),
          isValid: true,
        }
      } catch (error) {
        console.error('Erro ao formatar data brasileira:', error)
        return null
      }
    })
  }, [utcTimestamps])
}
