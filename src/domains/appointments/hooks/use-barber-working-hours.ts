/**
 * Hook para gerenciar horários de funcionamento dos barbeiros
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'

export interface WorkingHours {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
  break_start_time?: string
  break_end_time?: string
  source: 'barber' | 'business'
}

export interface BusinessHours {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
  break_start_time?: string
  break_end_time?: string
}

interface UseBarberWorkingHoursReturn {
  workingHours: WorkingHours[]
  businessHours: BusinessHours[]
  loading: boolean
  error: string | null

  // Ações
  updateWorkingHours: (dayOfWeek: number, hours: Partial<WorkingHours>) => Promise<boolean>
  resetToDefault: (dayOfWeek: number) => Promise<boolean>
  isBarberAvailable: (barberId: string, datetime: Date) => Promise<boolean>
  getAvailableTimeSlots: (barberId: string, date: Date, duration: number) => Promise<string[]>
  refetch: () => Promise<void>
}

export function useBarberWorkingHours(barberId?: string): UseBarberWorkingHoursReturn {
  const { user } = useAuth()
  const targetBarberId = barberId || user?.id

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar horários de funcionamento
  const fetchWorkingHours = useCallback(async () => {
    if (!targetBarberId) return

    try {
      setLoading(true)
      setError(null)

      // Buscar horários efetivos do barbeiro
      const { data: barberHours, error: barberError } = await supabase.rpc(
        'get_barber_effective_hours',
        { p_barber_id: targetBarberId }
      )

      if (barberError) {
        throw barberError
      }

      // Buscar horários gerais da barbearia
      const { data: generalHours, error: generalError } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week')

      if (generalError) {
        throw generalError
      }

      setWorkingHours(barberHours || [])
      setBusinessHours(generalHours || [])
    } catch (err) {
      console.error('Erro ao buscar horários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar horários')
    } finally {
      setLoading(false)
    }
  }, [targetBarberId])

  // Atualizar horários de funcionamento
  const updateWorkingHours = useCallback(
    async (dayOfWeek: number, hours: Partial<WorkingHours>): Promise<boolean> => {
      if (!targetBarberId) return false

      try {
        setError(null)

        const currentDay = workingHours.find((h) => h.day_of_week === dayOfWeek)
        if (!currentDay) return false

        const updatedHours = { ...currentDay, ...hours }

        // Validações
        if (updatedHours.is_open) {
          if (updatedHours.open_time >= updatedHours.close_time) {
            throw new Error('Horário de abertura deve ser anterior ao de fechamento')
          }

          if (updatedHours.break_start_time && updatedHours.break_end_time) {
            if (updatedHours.break_start_time >= updatedHours.break_end_time) {
              throw new Error('Horário de início da pausa deve ser anterior ao fim')
            }
            if (
              updatedHours.break_start_time <= updatedHours.open_time ||
              updatedHours.break_end_time >= updatedHours.close_time
            ) {
              throw new Error('Pausa deve estar dentro do horário de funcionamento')
            }
          }
        }

        // Salvar no banco
        const { error: upsertError } = await supabase.from('barber_working_hours').upsert(
          {
            barber_id: targetBarberId,
            day_of_week: dayOfWeek,
            is_open: updatedHours.is_open,
            open_time: updatedHours.open_time,
            close_time: updatedHours.close_time,
            break_start_time: updatedHours.break_start_time || null,
            break_end_time: updatedHours.break_end_time || null,
          },
          {
            onConflict: 'barber_id,day_of_week',
          }
        )

        if (upsertError) {
          throw upsertError
        }

        // Atualizar estado local
        setWorkingHours((prev) =>
          prev.map((h) =>
            h.day_of_week === dayOfWeek ? { ...h, ...hours, source: 'barber' as const } : h
          )
        )

        return true
      } catch (err) {
        console.error('Erro ao atualizar horários:', err)
        setError(err instanceof Error ? err.message : 'Erro ao atualizar horários')
        return false
      }
    },
    [targetBarberId, workingHours]
  )

  // Resetar para horários padrão
  const resetToDefault = useCallback(
    async (dayOfWeek: number): Promise<boolean> => {
      if (!targetBarberId) return false

      try {
        setError(null)

        // Deletar horário personalizado
        const { error: deleteError } = await supabase
          .from('barber_working_hours')
          .delete()
          .eq('barber_id', targetBarberId)
          .eq('day_of_week', dayOfWeek)

        if (deleteError) {
          throw deleteError
        }

        // Buscar horário padrão
        const { data, error: fetchError } = await supabase.rpc('get_barber_effective_hours', {
          p_barber_id: targetBarberId,
          p_day_of_week: dayOfWeek,
        })

        if (fetchError) {
          throw fetchError
        }

        if (data && data.length > 0) {
          setWorkingHours((prev) =>
            prev.map((h) =>
              h.day_of_week === dayOfWeek ? { ...data[0], source: 'business' as const } : h
            )
          )
        }

        return true
      } catch (err) {
        console.error('Erro ao resetar horários:', err)
        setError(err instanceof Error ? err.message : 'Erro ao resetar horários')
        return false
      }
    },
    [targetBarberId]
  )

  // Verificar se barbeiro está disponível
  const isBarberAvailable = useCallback(
    async (barberId: string, datetime: Date): Promise<boolean> => {
      try {
        const { data, error } = await supabase.rpc('is_barber_available', {
          p_barber_id: barberId,
          p_datetime: datetime.toISOString(),
        })

        if (error) {
          throw error
        }

        return data || false
      } catch (err) {
        console.error('Erro ao verificar disponibilidade:', err)
        return false
      }
    },
    []
  )

  // Gerar slots de tempo disponíveis
  const getAvailableTimeSlots = useCallback(
    async (barberId: string, date: Date, duration: number = 30): Promise<string[]> => {
      try {
        const dayOfWeek = date.getDay()
        const barberHours = workingHours.find((h) => h.day_of_week === dayOfWeek)

        if (!barberHours || !barberHours.is_open) {
          return []
        }

        const slots: string[] = []
        const startTime = new Date(`${date.toDateString()} ${barberHours.open_time}`)
        const endTime = new Date(`${date.toDateString()} ${barberHours.close_time}`)

        let currentTime = new Date(startTime)

        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5)

          // Verificar se não está no horário de pausa
          let isInBreak = false
          if (barberHours.break_start_time && barberHours.break_end_time) {
            const breakStart = new Date(`${date.toDateString()} ${barberHours.break_start_time}`)
            const breakEnd = new Date(`${date.toDateString()} ${barberHours.break_end_time}`)

            if (currentTime >= breakStart && currentTime < breakEnd) {
              isInBreak = true
            }
          }

          if (!isInBreak) {
            // Verificar se há agendamentos conflitantes
            const { data: conflicts } = await supabase
              .from('appointments')
              .select('id')
              .eq('barbeiro_id', barberId)
              .gte('data_agendamento', currentTime.toISOString())
              .lt(
                'data_agendamento',
                new Date(currentTime.getTime() + duration * 60000).toISOString()
              )
              .neq('status', 'cancelado')

            if (!conflicts || conflicts.length === 0) {
              slots.push(timeString)
            }
          }

          currentTime = new Date(currentTime.getTime() + duration * 60000)
        }

        return slots
      } catch (err) {
        console.error('Erro ao gerar slots:', err)
        return []
      }
    },
    [workingHours]
  )

  // Recarregar dados
  const refetch = useCallback(async () => {
    await fetchWorkingHours()
  }, [fetchWorkingHours])

  // Carregar dados iniciais
  useEffect(() => {
    fetchWorkingHours()
  }, [fetchWorkingHours])

  return {
    workingHours,
    businessHours,
    loading,
    error,
    updateWorkingHours,
    resetToDefault,
    isBarberAvailable,
    getAvailableTimeSlots,
    refetch,
  }
}
