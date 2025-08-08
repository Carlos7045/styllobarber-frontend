/**
 * Hook para buscar horários disponíveis
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'
import type { TimeSlot } from '@/shared/components/ui/time-picker'

interface UseAvailableTimesOptions {
  barbeiroId?: string
  serviceId?: string
  date?: Date
  enabled?: boolean
}

interface UseAvailableTimesReturn {
  timeSlots: TimeSlot[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAvailableTimes(options: UseAvailableTimesOptions): UseAvailableTimesReturn {
  const { barbeiroId, serviceId, date, enabled = true } = options

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug das opções recebidas
  console.log('🎯 useAvailableTimes chamado com:', {
    barbeiroId,
    serviceId,
    date: date?.toISOString(),
    enabled,
    hasAllRequired: !!(barbeiroId && serviceId && date),
  })

  // Função para limpar prefixo "profile-" do barbeiroId
  const cleanBarbeiroId = useCallback((id: string): string => {
    return id.replace(/^profile-/, '')
  }, [])

  // Função para buscar horários disponíveis
  const fetchAvailableTimes = useCallback(async () => {
    if (!enabled || !barbeiroId || !serviceId || !date) {
      console.log('⏭️ Busca de horários desabilitada:', { enabled, barbeiroId, serviceId, date })
      setTimeSlots([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dateString = date.toISOString().split('T')[0]
      const cleanedBarbeiroId = cleanBarbeiroId(barbeiroId)

      console.log('🔍 Buscando horários disponíveis:', {
        barbeiroId,
        cleanedBarbeiroId,
        serviceId,
        date: dateString,
        enabled,
      })

      // Testar conectividade primeiro
      const { data: testData, error: testError } = await supabase
        .from('services')
        .select('id')
        .eq('id', serviceId)
        .single()

      if (testError) {
        console.error('❌ Erro de conectividade:', testError)
        throw new Error(`Erro de conectividade: ${testError.message}`)
      }

      if (!testData) {
        throw new Error('Serviço não encontrado')
      }

      // Usar a função do banco para obter horários disponíveis
      const { data, error: fetchError } = await supabase.rpc('get_available_times', {
        p_barbeiro_id: cleanedBarbeiroId,
        p_date: dateString,
        p_service_id: serviceId,
      })

      console.log('📡 Resposta do banco:', { data, fetchError })

      if (fetchError) {
        console.error('❌ Erro detalhado do banco:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        })
        throw new Error(`Erro do banco: ${fetchError.message || 'Erro desconhecido'}`)
      }

      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Dados inválidos recebidos:', data)
        throw new Error('Dados inválidos recebidos do banco')
      }

      console.log('✅ Horários disponíveis recebidos:', data.length)

      // Transformar dados do banco em TimeSlots
      const slots: TimeSlot[] = data.map((slot: any, index: number) => {
        try {
          const timeSlot = new Date(slot.time_slot)
          const timeString = timeSlot.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
          })

          return {
            time: timeString,
            available: Boolean(slot.is_available),
            label: slot.is_available ? undefined : 'Ocupado',
          }
        } catch (slotError) {
          console.error(`❌ Erro ao processar slot ${index}:`, slot, slotError)
          return {
            time: '00:00',
            available: false,
            label: 'Erro',
          }
        }
      })

      // Filtrar slots válidos e dentro do horário comercial
      const validSlots = slots.filter((slot) => {
        if (slot.time === '00:00') return false // Remover slots com erro

        const [hours] = slot.time.split(':').map(Number)
        return hours >= 8 && hours < 18
      })

      console.log('📅 Slots processados:', {
        total: validSlots.length,
        available: validSlots.filter((s) => s.available).length,
        unavailable: validSlots.filter((s) => !s.available).length,
        sample: validSlots.slice(0, 3),
      })

      setTimeSlots(validSlots)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido ao buscar horários'
      console.error('❌ Erro final ao buscar horários disponíveis:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      })

      setError(errorMessage)

      // Em caso de erro, gerar slots básicos para não bloquear o usuário
      const fallbackSlots = generateFallbackTimeSlots()
      console.log('🔄 Usando slots de fallback:', fallbackSlots.length)
      setTimeSlots(fallbackSlots)
    } finally {
      setLoading(false)
    }
  }, [barbeiroId, serviceId, date, enabled, cleanBarbeiroId])

  // Função para gerar slots de fallback em caso de erro
  const generateFallbackTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = []

    console.log('🔄 Gerando slots de fallback...')

    // Gerar slots de 30 em 30 minutos das 8h às 18h
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          available: true, // Assumir disponível em caso de erro
          label: 'Verificar disponibilidade',
        })
      }
    }

    console.log('✅ Slots de fallback gerados:', slots.length)
    return slots
  }, [])

  // Buscar horários quando dependências mudarem
  useEffect(() => {
    fetchAvailableTimes()
  }, [fetchAvailableTimes])

  return {
    timeSlots,
    loading,
    error,
    refetch: fetchAvailableTimes,
  }
}
