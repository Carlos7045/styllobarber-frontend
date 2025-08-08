/**
 * Hook otimizado para gerenciamento de agendamentos
 * Inclui cache, debounce e otimizações de performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from './utils/use-debounce'
import { useAppointmentCache } from '@/shared/utils/appointment-cache'
import {
  checkSlotAvailability,
  calculateBlockedSlots,
  type AppointmentSlot,
  type SlotAvailability,
} from '@/shared/utils/appointment-utils'
import { supabase } from '@/lib/api/supabase'

interface UseOptimizedAppointmentsOptions {
  date: string
  barbeiroId?: string
  serviceDuration?: number
  enableCache?: boolean
  preloadDays?: number
}

interface UseOptimizedAppointmentsReturn {
  appointments: AppointmentSlot[]
  blockedSlots: Set<string>
  loading: boolean
  error: string | null

  // Funções otimizadas
  checkAvailability: (time: string, duration?: number) => SlotAvailability
  getAvailabilityBatch: (times: string[], duration?: number) => Map<string, SlotAvailability>
  preloadWeek: () => Promise<void>

  // Cache management
  invalidateCache: () => void
  getCacheStats: () => any

  // Performance metrics
  metrics: {
    cacheHitRate: number
    averageResponseTime: number
    totalQueries: number
  }
}

export function useOptimizedAppointments(
  options: UseOptimizedAppointmentsOptions
): UseOptimizedAppointmentsReturn {
  const { date, barbeiroId, serviceDuration = 30, enableCache = true, preloadDays = 7 } = options

  const [appointments, setAppointments] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalQueries: 0,
  })

  const cache = useAppointmentCache()
  const debouncedDate = useDebounce(date, 300)

  // Buscar agendamentos com cache
  const fetchAppointments = useCallback(
    async (targetDate: string) => {
      const startTime = performance.now()

      try {
        // Tentar buscar do cache primeiro
        if (enableCache) {
          const cached = cache.getAppointments(targetDate)
          if (cached) {
            setAppointments(cached)
            setLoading(false)

            // Atualizar métricas
            const responseTime = performance.now() - startTime
            setMetrics((prev) => ({
              ...prev,
              averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
              totalQueries: prev.totalQueries + 1,
              cacheHitRate: (prev.cacheHitRate * prev.totalQueries + 1) / (prev.totalQueries + 1),
            }))

            return cached
          }
        }

        // Buscar da base de dados
        const startOfDay = `${targetDate} 00:00:00`
        const endOfDay = `${targetDate} 23:59:59`

        let query = supabase
          .from('appointments')
          .select(
            `
          id,
          data_agendamento,
          barbeiro_id,
          service:services(duracao_minutos)
        `
          )
          .gte('data_agendamento', startOfDay)
          .lte('data_agendamento', endOfDay)
          .neq('status', 'cancelado')

        if (barbeiroId && barbeiroId !== 'any') {
          query = query.eq('barbeiro_id', barbeiroId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw fetchError
        }

        // Converter para formato de slots
        const appointmentSlots: AppointmentSlot[] = (data || []).map((apt) => {
          const startTime = new Date(apt.data_agendamento)
          const duration = apt.service?.duracao_minutos || 30

          return {
            inicio: startTime,
            fim: new Date(startTime.getTime() + duration * 60 * 1000),
            barbeiroId: apt.barbeiro_id,
            servicoId: apt.id,
            duracaoMinutos: duration,
          }
        })

        setAppointments(appointmentSlots)

        // Salvar no cache
        if (enableCache) {
          cache.setAppointments(targetDate, appointmentSlots)
        }

        // Atualizar métricas
        const responseTime = performance.now() - startTime
        setMetrics((prev) => ({
          ...prev,
          averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
          totalQueries: prev.totalQueries + 1,
          cacheHitRate: (prev.cacheHitRate * prev.totalQueries) / (prev.totalQueries + 1),
        }))

        return appointmentSlots
      } catch (err) {
        console.error('Erro ao buscar agendamentos:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        return []
      } finally {
        setLoading(false)
      }
    },
    [barbeiroId, enableCache, cache]
  )

  // Buscar horários de funcionamento com cache
  const fetchWorkingHours = useCallback(async (targetDate: string) => {
    const dayOfWeek = new Date(targetDate).getDay()

    const { data: horarioConfig } = await supabase
      .from('horarios_funcionamento')
      .select('intervalo_inicio, intervalo_fim')
      .eq('dia_semana', dayOfWeek)
      .eq('ativo', true)
      .single()

    return horarioConfig?.intervalo_inicio && horarioConfig?.intervalo_fim
      ? {
          inicio: horarioConfig.intervalo_inicio,
          fim: horarioConfig.intervalo_fim,
        }
      : undefined
  }, [])

  // Calcular slots bloqueados (memoizado)
  const blockedSlots = useMemo(() => {
    if (!appointments.length) return new Set<string>()

    return calculateBlockedSlots(appointments, date, 30)
  }, [appointments, date])

  // Função otimizada para verificar disponibilidade
  const checkAvailability = useCallback(
    (time: string, duration = serviceDuration): SlotAvailability => {
      return checkSlotAvailability(
        date,
        time,
        duration,
        appointments,
        undefined, // intervalConfig seria buscado separadamente
        barbeiroId === 'any' ? undefined : barbeiroId
      )
    },
    [date, appointments, barbeiroId, serviceDuration]
  )

  // Verificação em lote para múltiplos horários
  const getAvailabilityBatch = useCallback(
    (times: string[], duration = serviceDuration): Map<string, SlotAvailability> => {
      const results = new Map<string, SlotAvailability>()

      times.forEach((time) => {
        const availability = checkAvailability(time, duration)
        results.set(time, availability)
      })

      return results
    },
    [checkAvailability, serviceDuration]
  )

  // Pré-carregar semana
  const preloadWeek = useCallback(async () => {
    const dates: string[] = []
    const currentDate = new Date(date)

    for (let i = 0; i < preloadDays; i++) {
      const targetDate = new Date(currentDate)
      targetDate.setDate(currentDate.getDate() + i)
      dates.push(targetDate.toISOString().split('T')[0])
    }

    await cache.preloadDates(dates, fetchAppointments)
  }, [date, preloadDays, cache, fetchAppointments])

  // Invalidar cache
  const invalidateCache = useCallback(() => {
    cache.invalidateDate(date)
    if (barbeiroId) {
      cache.invalidateBarber(barbeiroId)
    }
  }, [cache, date, barbeiroId])

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return cache.getStats()
  }, [cache])

  // Efeito para buscar agendamentos quando a data muda
  useEffect(() => {
    if (debouncedDate) {
      setLoading(true)
      setError(null)
      fetchAppointments(debouncedDate)
    }
  }, [debouncedDate, fetchAppointments])

  // Pré-carregar dados ao montar
  useEffect(() => {
    if (enableCache && preloadDays > 0) {
      preloadWeek()
    }
  }, [enableCache, preloadDays, preloadWeek])

  return {
    appointments,
    blockedSlots,
    loading,
    error,
    checkAvailability,
    getAvailabilityBatch,
    preloadWeek,
    invalidateCache,
    getCacheStats,
    metrics,
  }
}

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
