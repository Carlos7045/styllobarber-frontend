/**
 * Hook especializado para funcionalidades do cliente
 * Estende o hook useAppointments com funcionalidades específicas do cliente
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAppointments } from '@/hooks/use-appointments'
import { supabase } from '@/lib/supabase'
import type { 
  Appointment,
  ClientAppointment,
  CalendarFilters,
  CancellationPolicy,
  ReschedulingPolicy
} from '@/types/appointments'
import { 
  DEFAULT_CANCELLATION_POLICY,
  DEFAULT_RESCHEDULING_POLICY
} from '@/types/appointments'

interface UseClientAppointmentsOptions {
  realtime?: boolean
  cancellationPolicy?: CancellationPolicy
  reschedulingPolicy?: ReschedulingPolicy
}

interface UseClientAppointmentsReturn {
  // Dados básicos
  appointments: ClientAppointment[]
  upcomingAppointments: ClientAppointment[]
  pastAppointments: ClientAppointment[]
  loading: boolean
  error: string | null
  
  // Funções de verificação
  canCancelAppointment: (id: string) => boolean
  canRescheduleAppointment: (id: string) => boolean
  checkAvailability: (date: string, time: string, barbeiroId?: string) => Promise<boolean>
  
  // Ações
  createAppointment: (data: any) => Promise<any>
  cancelAppointment: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  rescheduleAppointment: (id: string, newDateTime: string) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

export function useClientAppointments(options: UseClientAppointmentsOptions = {}): UseClientAppointmentsReturn {
  const { 
    realtime = true,
    cancellationPolicy = DEFAULT_CANCELLATION_POLICY,
    reschedulingPolicy = DEFAULT_RESCHEDULING_POLICY
  } = options
  
  const { user, profile } = useAuth()
  const [rescheduleCount, setRescheduleCount] = useState<number>(0)

  // Configurar filtros para buscar apenas agendamentos do cliente logado
  const clientFilters: CalendarFilters = useMemo(() => {
    if (!user?.id) return {}
    
    return {
      // Filtrar por cliente_id seria ideal, mas o hook atual não suporta
      // Por enquanto, vamos filtrar no lado do cliente
    }
  }, [user?.id])

  // Usar o hook base de agendamentos
  const appointmentsHook = useAppointments({
    filters: clientFilters,
    realtime
  })
  
  const {
    appointments: allAppointments,
    loading,
    error,
    updateAppointment,
    refetch: baseRefetch
  } = appointmentsHook

  // Buscar contagem de reagendamentos do mês atual
  const fetchRescheduleCount = useCallback(async () => {
    if (!user?.id) return

    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      // Buscar agendamentos reagendados no mês atual
      // Assumindo que existe um campo para rastrear reagendamentos ou logs
      const { data, error } = await supabase
        .from('appointment_logs')
        .select('*')
        .eq('cliente_id', user.id)
        .eq('action', 'reschedule')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)

      if (!error && data) {
        setRescheduleCount(data.length)
      }
    } catch (err) {
      console.warn('Erro ao buscar contagem de reagendamentos:', err)
    }
  }, [user?.id])

  // Função para calcular tempo até o agendamento
  const calculateTimeUntilAppointment = useCallback((appointmentDate: string): string => {
    const now = new Date()
    const appointment = new Date(appointmentDate)
    const diffMs = appointment.getTime() - now.getTime()
    
    if (diffMs <= 0) return ''
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
    }
  }, [])

  // Função para verificar se um agendamento pode ser cancelado
  const canCancelAppointment = useCallback((id: string): boolean => {
    if (!cancellationPolicy.allowCancellation) return false
    
    const appointment = allAppointments.find(apt => apt.id === id)
    if (!appointment) return false
    
    // Não pode cancelar agendamentos já cancelados ou concluídos
    if (['cancelado', 'concluido'].includes(appointment.status)) return false
    
    // Verificar se está dentro do prazo mínimo
    const now = new Date()
    const appointmentDate = new Date(appointment.data_agendamento)
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilAppointment >= cancellationPolicy.minHoursBeforeAppointment
  }, [allAppointments, cancellationPolicy])

  // Função para verificar se um agendamento pode ser reagendado
  const canRescheduleAppointment = useCallback((id: string): boolean => {
    if (!reschedulingPolicy.allowRescheduling) return false
    
    const appointment = allAppointments.find(apt => apt.id === id)
    if (!appointment) return false
    
    // Não pode reagendar agendamentos já cancelados ou concluídos
    if (['cancelado', 'concluido'].includes(appointment.status)) return false
    
    // Verificar se está dentro do prazo mínimo
    const now = new Date()
    const appointmentDate = new Date(appointment.data_agendamento)
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilAppointment < reschedulingPolicy.minHoursBeforeAppointment) return false
    
    // Verificar limite de reagendamentos por mês
    return rescheduleCount < reschedulingPolicy.maxReschedulesPerMonth
  }, [allAppointments, reschedulingPolicy, rescheduleCount])

  // Transformar agendamentos em ClientAppointments
  const appointments: ClientAppointment[] = useMemo(() => {
    if (!user?.id) return []
    
    // Filtrar apenas agendamentos do cliente logado
    const clientAppointments = allAppointments.filter(apt => apt.cliente_id === user.id)
    
    return clientAppointments.map(appointment => {
      const now = new Date()
      const appointmentDate = new Date(appointment.data_agendamento)
      const isUpcoming = appointmentDate > now && !['cancelado', 'concluido'].includes(appointment.status)
      const isPast = appointmentDate <= now || ['cancelado', 'concluido'].includes(appointment.status)
      
      return {
        ...appointment,
        canCancel: canCancelAppointment(appointment.id),
        canReschedule: canRescheduleAppointment(appointment.id),
        timeUntilAppointment: isUpcoming ? calculateTimeUntilAppointment(appointment.data_agendamento) : undefined,
        isUpcoming,
        isPast
      }
    })
  }, [allAppointments, user?.id, canCancelAppointment, canRescheduleAppointment, calculateTimeUntilAppointment])

  // Separar agendamentos futuros e histórico
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.isUpcoming)
      .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())
  }, [appointments])

  const pastAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.isPast)
      .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime())
  }, [appointments])

  // Função para cancelar agendamento
  const cancelAppointment = useCallback(async (id: string, reason?: string) => {
    try {
      if (!canCancelAppointment(id)) {
        return {
          success: false,
          error: 'Agendamento não pode ser cancelado devido às políticas de cancelamento'
        }
      }

      const result = await updateAppointment(id, {
        status: 'cancelado',
        observacoes: reason ? `Cancelado: ${reason}` : 'Cancelado pelo cliente'
      })

      if (result.success) {
        // Log do cancelamento (se necessário)
        try {
          await supabase
            .from('appointment_logs')
            .insert({
              appointment_id: id,
              cliente_id: user?.id,
              action: 'cancel',
              reason: reason || 'Cancelado pelo cliente',
              created_at: new Date().toISOString()
            })
        } catch (logError) {
          console.warn('Erro ao registrar log de cancelamento:', logError)
        }

        // TODO: Enviar notificação ao barbeiro
        console.log('Agendamento cancelado, notificação ao barbeiro deve ser enviada')
      }

      return result
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar agendamento'
      }
    }
  }, [canCancelAppointment, updateAppointment, user?.id])

  // Função para reagendar agendamento
  const rescheduleAppointment = useCallback(async (id: string, newDateTime: string) => {
    try {
      if (!canRescheduleAppointment(id)) {
        return {
          success: false,
          error: 'Agendamento não pode ser reagendado devido às políticas de reagendamento'
        }
      }

      // Verificar se o novo horário está disponível
      // TODO: Implementar verificação de conflitos de horário
      
      const result = await updateAppointment(id, {
        data_agendamento: newDateTime,
        status: 'pendente' // Resetar para pendente após reagendamento
      })

      if (result.success) {
        // Log do reagendamento
        try {
          await supabase
            .from('appointment_logs')
            .insert({
              appointment_id: id,
              cliente_id: user?.id,
              action: 'reschedule',
              details: `Reagendado para ${newDateTime}`,
              created_at: new Date().toISOString()
            })
        } catch (logError) {
          console.warn('Erro ao registrar log de reagendamento:', logError)
        }

        // Atualizar contagem de reagendamentos
        setRescheduleCount(prev => prev + 1)

        // TODO: Enviar notificação ao barbeiro
        console.log('Agendamento reagendado, notificação ao barbeiro deve ser enviada')
      }

      return result
    } catch (error) {
      console.error('Erro ao reagendar agendamento:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reagendar agendamento'
      }
    }
  }, [canRescheduleAppointment, updateAppointment, user?.id])

  // Função para verificar disponibilidade de horário
  const checkAvailability = useCallback(async (date: string, time: string, barbeiroId?: string): Promise<boolean> => {
    try {
      const dateTime = `${date} ${time}:00`
      
      // Buscar agendamentos conflitantes
      let query = supabase
        .from('appointments')
        .select('id')
        .eq('data_agendamento', dateTime)
        .neq('status', 'cancelado')

      // Se barbeiro específico foi selecionado, verificar apenas para ele
      if (barbeiroId) {
        query = query.eq('barbeiro_id', barbeiroId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error)
        return false
      }

      // Se não há agendamentos conflitantes, está disponível
      return !data || data.length === 0
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      return false
    }
  }, [])

  // Função para criar novo agendamento
  const createAppointment = useCallback(async (appointmentData: any) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          cliente_id: user.id,
          status: 'pendente',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Atualizar lista de agendamentos usando baseRefetch diretamente
      await baseRefetch()

      return data
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      throw error
    }
  }, [user?.id, baseRefetch])

  // Buscar contagem de reagendamentos na inicialização
  useEffect(() => {
    if (user?.id) {
      fetchRescheduleCount()
    }
  }, [user?.id, fetchRescheduleCount])

  // Função de refetch personalizada
  const refetch = useCallback(async () => {
    try {
      await Promise.all([
        baseRefetch(),
        fetchRescheduleCount()
      ])
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
    }
  }, [baseRefetch, fetchRescheduleCount])

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    loading,
    error,
    canCancelAppointment,
    canRescheduleAppointment,
    checkAvailability,
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    refetch
  }
}