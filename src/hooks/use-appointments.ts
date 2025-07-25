/**
 * Hook para gerenciar agendamentos
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Appointment, 
  CalendarFilters, 
  CreateAppointmentData, 
  UpdateAppointmentData,
  CalendarStats 
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
  createAppointment: (data: CreateAppointmentData) => Promise<{ success: boolean; error?: string; data?: Appointment }>
  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<{ success: boolean; error?: string }>
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

      let query = supabase
        .from('appointments')
        .select(`
          *,
          cliente:profiles!appointments_cliente_id_fkey(id, nome, telefone, email),
          barbeiro:profiles!appointments_barbeiro_id_fkey(id, nome),
          service:services(id, nome, preco, duracao_minutos)
        `)
        .order('data_agendamento', { ascending: true })

      // Aplicar filtros
      if (filters?.barbeiro_id) {
        query = query.eq('barbeiro_id', filters.barbeiro_id)
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.date_start) {
        query = query.gte('data_agendamento', filters.date_start)
      }

      if (filters?.date_end) {
        query = query.lte('data_agendamento', filters.date_end)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setAppointments(data || [])
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Função para buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar estatísticas básicas
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('*')
        .gte('data_agendamento', `${today}T00:00:00`)
        .lt('data_agendamento', `${today}T23:59:59`)

      const { data: pendingAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'pendente')

      const { data: completedToday } = await supabase
        .from('appointments')
        .select('preco_final')
        .eq('status', 'concluido')
        .gte('data_agendamento', `${today}T00:00:00`)
        .lt('data_agendamento', `${today}T23:59:59`)

      const receita_dia = completedToday?.reduce((sum, apt) => sum + (apt.preco_final || 0), 0) || 0

      const statsData: CalendarStats = {
        total_agendamentos: appointments.length,
        agendamentos_hoje: todayAppointments?.length || 0,
        agendamentos_pendentes: pendingAppointments?.length || 0,
        receita_dia,
        taxa_ocupacao: 0, // Calcular baseado nos slots disponíveis
      }

      setStats(statsData)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
    }
  }, [appointments.length])

  // Função para criar agendamento
  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert([data])
        .select(`
          *,
          cliente:profiles!appointments_cliente_id_fkey(id, nome, telefone, email),
          barbeiro:profiles!appointments_barbeiro_id_fkey(id, nome),
          service:services(id, nome, preco, duracao_minutos)
        `)
        .single()

      if (createError) {
        throw createError
      }

      // Atualizar lista local
      setAppointments(prev => [...prev, newAppointment])

      return { success: true, data: newAppointment }
    } catch (err) {
      console.error('Erro ao criar agendamento:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar agendamento' 
      }
    }
  }

  // Função para atualizar agendamento
  const updateAppointment = async (id: string, data: UpdateAppointmentData) => {
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id 
            ? { ...apt, ...data, updated_at: new Date().toISOString() }
            : apt
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao atualizar agendamento' 
      }
    }
  }

  // Função para deletar agendamento
  const deleteAppointment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Remover da lista local
      setAppointments(prev => prev.filter(apt => apt.id !== id))

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar agendamento' 
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
            setAppointments(prev => 
              prev.filter(apt => apt.id !== payload.old.id)
            )
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