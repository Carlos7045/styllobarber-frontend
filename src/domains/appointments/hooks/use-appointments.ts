/**
 * Hook para gerenciar agendamentos
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'
import type {
  Appointment,
  CalendarFilters,
  CreateAppointmentData,
  UpdateAppointmentData,
  CalendarStats,
} from '@/types/appointments'

interface UseAppointmentsOptions {
  filters?: CalendarFilters
  realtime?: boolean
}

interface UseAppointmentsReturn {
  appointments: Appointment[]
  loading: boolean
  error: string | null
  stats: CalendarStats | null
  createAppointment: (
    data: CreateAppointmentData
  ) => Promise<{ success: boolean; error?: string; data?: Appointment }>
  updateAppointment: (
    id: string,
    data: UpdateAppointmentData
  ) => Promise<{ success: boolean; error?: string }>
  deleteAppointment: (id: string) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const { filters, realtime = false } = options

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CalendarStats | null>(null)

  // Função para buscar agendamentos
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Iniciando busca de agendamentos com filtros:', filters)

      // Primeiro, buscar agendamentos básicos
      let query = supabase
        .from('appointments')
        .select('*')
        .order('data_agendamento', { ascending: true })

      // Aplicar filtros
      if (filters?.barbeiro_id) {
        console.log('🔍 Aplicando filtro barbeiro_id:', filters.barbeiro_id)
        query = query.eq('barbeiro_id', filters.barbeiro_id)
      }

      if (filters?.status && filters.status.length > 0) {
        console.log('🔍 Aplicando filtro status:', filters.status)
        query = query.in('status', filters.status)
      }

      if (filters?.date_start) {
        console.log('🔍 Aplicando filtro date_start:', filters.date_start)
        const dateStart = filters.date_start.includes('T')
          ? filters.date_start
          : `${filters.date_start}T00:00:00`
        query = query.gte('data_agendamento', dateStart)
      }

      if (filters?.date_end) {
        console.log('🔍 Aplicando filtro date_end:', filters.date_end)
        const dateEnd = filters.date_end.includes('T')
          ? filters.date_end
          : `${filters.date_end}T23:59:59`
        query = query.lte('data_agendamento', dateEnd)
      }

      console.log('🔍 Executando query básica...')
      const { data: appointmentsData, error: fetchError } = await query

      if (fetchError) {
        console.error('❌ Erro na query básica:', fetchError)
        throw fetchError
      }

      console.log('✅ Query básica executada com sucesso:', appointmentsData?.length || 0)

      // Se não há agendamentos, retornar array vazio
      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('📅 Nenhum agendamento encontrado')
        setAppointments([])
        return
      }

      // Buscar dados relacionados separadamente para evitar problemas com joins
      const clienteIds = [...new Set(appointmentsData.map((apt) => apt.cliente_id).filter(Boolean))]
      const barbeiroIds = [
        ...new Set(appointmentsData.map((apt) => apt.barbeiro_id).filter(Boolean)),
      ]
      const serviceIds = [...new Set(appointmentsData.map((apt) => apt.service_id).filter(Boolean))]

      console.log('🔍 Buscando dados relacionados...', {
        clienteIds: clienteIds.length,
        barbeiroIds: barbeiroIds.length,
        serviceIds: serviceIds.length,
      })

      // Buscar clientes
      const { data: clientesData } = await supabase
        .from('profiles')
        .select('id, nome, telefone, email')
        .in('id', clienteIds)

      // Buscar barbeiros
      const { data: barbeirosData } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', barbeiroIds)

      // Buscar serviços
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, nome, preco, duracao_minutos')
        .in('id', serviceIds)

      console.log('✅ Dados relacionados carregados:', {
        clientes: clientesData?.length || 0,
        barbeiros: barbeirosData?.length || 0,
        services: servicesData?.length || 0,
      })

      // Combinar dados
      const appointmentsWithRelations = appointmentsData.map((apt) => ({
        ...apt,
        cliente: clientesData?.find((c) => c.id === apt.cliente_id) || null,
        barbeiro: barbeirosData?.find((b) => b.id === apt.barbeiro_id) || null,
        service: servicesData?.find((s) => s.id === apt.service_id) || null,
      }))

      console.log('📅 Agendamentos processados:', {
        total: appointmentsWithRelations.length,
        filtros: filters,
        sample: appointmentsWithRelations.slice(0, 3).map((apt) => ({
          id: apt.id,
          cliente: apt.cliente?.nome,
          barbeiro: apt.barbeiro?.nome,
          service: apt.service?.nome,
          data: apt.data_agendamento,
          status: apt.status,
        })),
      })

      setAppointments(appointmentsWithRelations)
    } catch (err) {
      console.error('❌ Erro ao buscar agendamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Função para buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Buscar estatísticas básicas com tratamento de erro
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('*')
        .gte('data_agendamento', `${today}T00:00:00`)
        .lt('data_agendamento', `${today}T23:59:59`)

      if (todayError) {
        console.error('Erro ao buscar agendamentos de hoje:', todayError)
      }

      console.log('🔍 Buscando agendamentos pendentes...')
      const { data: pendingAppointments, error: pendingError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'pendente')

      if (pendingError) {
        console.error('❌ Erro ao buscar agendamentos pendentes:', pendingError)
      } else {
        console.log(
          '✅ Agendamentos pendentes encontrados:',
          pendingAppointments?.length || 0,
          pendingAppointments
        )
      }

      const { data: completedToday, error: completedError } = await supabase
        .from('appointments')
        .select('preco_final')
        .eq('status', 'concluido')
        .gte('data_agendamento', `${today}T00:00:00`)
        .lt('data_agendamento', `${today}T23:59:59`)

      if (completedError) {
        console.error('Erro ao buscar agendamentos concluídos:', completedError)
      }

      const receita_dia = completedToday?.reduce((sum, apt) => sum + (apt.preco_final || 0), 0) || 0

      const statsData: CalendarStats = {
        total_agendamentos: appointments.length,
        agendamentos_hoje: todayAppointments?.length || 0,
        agendamentos_pendentes: pendingError ? 0 : pendingAppointments?.length || 0,
        receita_dia,
        taxa_ocupacao: 0, // Calcular baseado nos slots disponíveis
      }

      console.log('📊 Estatísticas calculadas:', {
        ...statsData,
        debug: {
          pendingError: !!pendingError,
          pendingData: pendingAppointments?.length,
          todayData: todayAppointments?.length,
          completedData: completedToday?.length,
        },
      })
      setStats(statsData)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      // Definir estatísticas padrão em caso de erro
      setStats({
        total_agendamentos: appointments.length,
        agendamentos_hoje: 0,
        agendamentos_pendentes: 0,
        receita_dia: 0,
        taxa_ocupacao: 0,
      })
    }
  }, [appointments.length])

  // Função para verificar disponibilidade
  const checkAvailability = async (
    barbeiroId: string | null | undefined,
    dataAgendamento: string,
    serviceId: string,
    excludeAppointmentId?: string
  ) => {
    try {
      // Se não há barbeiro especificado, não pode verificar disponibilidade
      if (!barbeiroId) {
        console.warn('Barbeiro não especificado para verificação de disponibilidade')
        return false
      }

      const { data, error } = await supabase.rpc('check_time_availability', {
        p_barbeiro_id: barbeiroId,
        p_data_agendamento: dataAgendamento,
        p_service_id: serviceId,
        p_exclude_appointment_id: excludeAppointmentId || null,
      })

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error)
        return false
      }

      return data === true
    } catch (err) {
      console.error('Erro ao verificar disponibilidade:', err)
      return false
    }
  }

  // Função para criar agendamento
  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      console.log('🔄 Tentando criar agendamento:', data)

      // Verificar se barbeiro_id está presente (obrigatório para verificação de disponibilidade)
      if (!data.barbeiro_id) {
        return {
          success: false,
          error: 'Barbeiro deve ser selecionado para criar o agendamento.',
        }
      }

      // Verificar disponibilidade antes de criar
      const isAvailable = await checkAvailability(
        data.barbeiro_id,
        data.data_agendamento,
        data.service_id
      )

      if (!isAvailable) {
        return {
          success: false,
          error: 'Este horário não está disponível. Por favor, escolha outro horário.',
        }
      }

      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert([data])
        .select('*')
        .single()

      if (createError) {
        console.error('❌ Erro do banco ao criar agendamento:', createError)

        // Se for erro de conflito, mostrar mensagem mais amigável
        if (createError.code === '23505' && createError.message.includes('Conflito de horário')) {
          throw new Error(
            'Este horário não está mais disponível. Por favor, escolha outro horário.'
          )
        }
        throw createError
      }

      console.log('✅ Agendamento criado com sucesso:', newAppointment)

      // Atualizar lista local
      setAppointments((prev) => [...prev, newAppointment])

      return { success: true, data: newAppointment }
    } catch (err) {
      console.error('❌ Erro ao criar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao criar agendamento',
      }
    }
  }

  // Função para atualizar agendamento
  const updateAppointment = async (id: string, data: UpdateAppointmentData) => {
    try {
      const { error: updateError } = await supabase.from('appointments').update(data).eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, ...data, updated_at: new Date().toISOString() } : apt
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar agendamento',
      }
    }
  }

  // Função para deletar agendamento
  const deleteAppointment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('appointments').delete().eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Remover da lista local
      setAppointments((prev) => prev.filter((apt) => apt.id !== id))

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao deletar agendamento',
      }
    }
  }

  // Configurar realtime se habilitado
  useEffect(() => {
    if (!realtime) return

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          console.log('Mudança em agendamentos:', payload)

          if (payload.eventType === 'INSERT') {
            // Buscar dados completos do novo agendamento
            fetchAppointments()
          } else if (payload.eventType === 'UPDATE') {
            // Atualizar agendamento existente
            fetchAppointments()
          } else if (payload.eventType === 'DELETE') {
            // Remover agendamento deletado
            setAppointments((prev) => prev.filter((apt) => apt.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realtime, fetchAppointments])

  // Buscar dados iniciais
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Atualizar estatísticas quando agendamentos mudarem
  useEffect(() => {
    if (appointments.length > 0) {
      fetchStats()
    }
  }, [appointments, fetchStats])

  return {
    appointments,
    loading,
    error,
    stats,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  }
}
