/**
 * Hook especializado para funcionalidades do cliente
 * Estende o hook useAppointments com funcionalidades específicas do cliente
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from './use-appointments'
import { useServices } from '@/shared/hooks/data/use-services'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'
import { supabase } from '@/lib/supabase'
import type {
  Appointment,
  ClientAppointment,
  CalendarFilters,
  CancellationPolicy,
  ReschedulingPolicy,
} from '@/types/appointments'
import { DEFAULT_CANCELLATION_POLICY, DEFAULT_RESCHEDULING_POLICY } from '@/types/appointments'

// Removido: imports de mock appointments - usando apenas dados reais

interface UseClientAppointmentsOptions {
  realtime?: boolean
  cancellationPolicy?: CancellationPolicy
  reschedulingPolicy?: ReschedulingPolicy
}

interface ClientStats {
  totalCortes: number
  valorTotalGasto: number
  pontosFidelidade: number
  frequenciaMedia: number // dias entre visitas
  servicoFavorito?: string
  barbeiroFavorito?: string
}

interface UseClientAppointmentsReturn {
  // Dados básicos
  appointments: ClientAppointment[]
  upcomingAppointments: ClientAppointment[]
  pastAppointments: ClientAppointment[]
  loading: boolean
  error: string | null

  // Estatísticas
  stats: ClientStats

  // Funções de verificação
  canCancelAppointment: (id: string) => boolean
  canRescheduleAppointment: (id: string) => boolean
  checkAvailability: (date: string, time: string, barbeiroId?: string) => Promise<boolean>

  // Ações
  createAppointment: (data: any) => Promise<any>
  cancelAppointment: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  rescheduleAppointment: (
    id: string,
    newDateTime: string,
    observacoes?: string
  ) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>

  // Funcionalidades de pagamento
  preparePaymentRedirect: (appointment: ClientAppointment) => void
  needsPayment: (appointment: ClientAppointment) => boolean
  canPay: (appointment: ClientAppointment) => boolean
}

export function useClientAppointments(
  options: UseClientAppointmentsOptions = {}
): UseClientAppointmentsReturn {
  const {
    realtime = true,
    cancellationPolicy = DEFAULT_CANCELLATION_POLICY,
    reschedulingPolicy = DEFAULT_RESCHEDULING_POLICY,
  } = options

  const { user, profile } = useAuth()
  const [rescheduleCount, setRescheduleCount] = useState<number>(0)

  // Hooks para dados necessários
  const { services } = useServices()
  const { funcionarios } = useFuncionariosPublicos()
  
  // Funcionalidades de pagamento simplificadas
  const preparePaymentRedirect = useCallback((appointment: ClientAppointment): void => {
    const appointmentDate = new Date(appointment.data_agendamento)
    
    const paymentData = {
      appointment_id: appointment.id,
      service_name: appointment.service?.nome || 'Serviço',
      barbeiro_name: appointment.barbeiro?.nome || 'Barbeiro',
      date: appointmentDate.toLocaleDateString('pt-BR'),
      time: appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      amount: appointment.preco_final || appointment.service?.preco || 0,
      payment_type: 'service_payment',
    }
    
    localStorage.setItem('pendingPayment', JSON.stringify(paymentData))
    window.location.href = `/dashboard/pagamento?type=service&appointment=${appointment.id}`
  }, [])

  const needsPayment = useCallback((appointment: ClientAppointment): boolean => {
    // Se foi cancelado, não precisa pagar
    if (appointment.status === 'cancelado') return false
    
    // Se já foi pago (qualquer método), não precisa pagar
    if (appointment.payment_status === 'paid') return false
    
    // Se foi pago antecipadamente, não precisa pagar
    if (appointment.payment_method === 'advance') return false
    
    const now = new Date()
    const appointmentDate = new Date(appointment.data_agendamento)
    const isAppointmentPast = appointmentDate <= now
    
    // Se o agendamento foi concluído e não tem status de pagamento OU está pendente, precisa pagar
    if (appointment.status === 'concluido') {
      return !appointment.payment_status || appointment.payment_status === 'pending'
    }
    
    // Se o agendamento está confirmado mas já passou da data/hora, considera como serviço realizado que precisa de pagamento
    if (appointment.status === 'confirmado' && isAppointmentPast) {
      return !appointment.payment_status || appointment.payment_status === 'pending'
    }
    
    return false
  }, [])

  const canPay = useCallback((appointment: ClientAppointment): boolean => {
    // Só pode pagar se precisa de pagamento
    return needsPayment(appointment)
  }, [needsPayment])

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
    realtime,
  })

  const {
    appointments: allAppointments,
    loading,
    error,
    updateAppointment,
    refetch: baseRefetch,
  } = appointmentsHook

  // Buscar contagem de reagendamentos do mês atual
  const fetchRescheduleCount = useCallback(async () => {
    if (!user?.id) return

    try {
      // Por enquanto, definir como 0 até implementarmos o sistema de logs
      setRescheduleCount(0)

      // TODO: Implementar sistema de logs quando necessário
      // const now = new Date()
      // const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      // const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      // Buscar agendamentos reagendados no mês atual
      // const { data, error } = await supabase
      //   .from('appointment_logs')
      //   .select('*')
      //   .eq('cliente_id', user.id)
      //   .eq('action', 'reschedule')
      //   .gte('created_at', startOfMonth)
      //   .lte('created_at', endOfMonth)

      // if (!error && data) {
      //   setRescheduleCount(data.length)
      // }
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
  const canCancelAppointment = useCallback(
    (id: string): boolean => {
      if (!cancellationPolicy?.allowCancellation) return false

      const appointment = allAppointments.find((apt) => apt.id === id)
      if (!appointment) return false

      // Não pode cancelar agendamentos já cancelados ou concluídos
      if (['cancelado', 'concluido'].includes(appointment.status)) return false

      // Verificar se está dentro do prazo mínimo
      const now = new Date()
      const appointmentDate = new Date(appointment.data_agendamento)
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      return hoursUntilAppointment >= cancellationPolicy.minHoursBeforeAppointment
    },
    [allAppointments, cancellationPolicy]
  )

  // Função para verificar se um agendamento pode ser reagendado
  const canRescheduleAppointment = useCallback(
    (id: string): boolean => {
      if (!reschedulingPolicy.allowRescheduling) return false

      const appointment = allAppointments.find((apt) => apt.id === id)
      if (!appointment) return false

      // Não pode reagendar agendamentos já cancelados ou concluídos
      if (['cancelado', 'concluido'].includes(appointment.status)) return false

      // Verificar se está dentro do prazo mínimo
      const now = new Date()
      const appointmentDate = new Date(appointment.data_agendamento)
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilAppointment < reschedulingPolicy.minHoursBeforeAppointment) return false

      // Verificar limite de reagendamentos por agendamento
      // Por enquanto, sempre permitir reagendamento se passou nas outras validações
      return true
    },
    [allAppointments, reschedulingPolicy, rescheduleCount]
  )

  // Transformar agendamentos em ClientAppointments
  const appointments: ClientAppointment[] = useMemo(() => {
    if (!user?.id) return []

    // Filtrar apenas agendamentos do cliente atual
    const clientAppointments = allAppointments.filter((apt) => apt.cliente_id === user.id)

    console.log('📋 Agendamentos do cliente:', {
      total: clientAppointments.length,
      userId: user.id,
    })

    return clientAppointments.map((appointment) => {
      const now = new Date()
      const appointmentDate = new Date(appointment.data_agendamento)
      const isUpcoming =
        appointmentDate > now && !['cancelado', 'concluido'].includes(appointment.status)
      const isPast =
        appointmentDate <= now || ['cancelado', 'concluido'].includes(appointment.status)

      const canCancel = canCancelAppointment(appointment.id)
      const canReschedule = canRescheduleAppointment(appointment.id)

      // Debug log para verificar permissões
      console.log('🔍 Agendamento:', {
        id: appointment.id,
        status: appointment.status,
        data: appointment.data_agendamento,
        isUpcoming,
        canCancel,
        canReschedule,
        hoursUntil: (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      })

      return {
        ...appointment,
        canCancel,
        canReschedule,
        timeUntilAppointment: isUpcoming
          ? calculateTimeUntilAppointment(appointment.data_agendamento)
          : undefined,
        isUpcoming,
        isPast,
        canPay: canPay(appointment),
        needsPayment: needsPayment(appointment),
      }
    })
  }, [
    allAppointments,
    user?.id,
    canCancelAppointment,
    canRescheduleAppointment,
    calculateTimeUntilAppointment,
  ])

  // Separar agendamentos futuros e histórico
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.isUpcoming)
      .sort(
        (a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime()
      )
  }, [appointments])

  const pastAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.isPast)
      .sort(
        (a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime()
      )
  }, [appointments])

  // Calcular estatísticas do cliente
  const stats: ClientStats = useMemo(() => {
    const completedAppointments = appointments.filter((apt) => apt.status === 'concluido')

    // Total de cortes
    const totalCortes = completedAppointments.length

    // Valor total gasto
    const valorTotalGasto = completedAppointments.reduce((total, apt) => {
      return total + (apt.preco_final || apt.service?.preco || 0)
    }, 0)

    // Pontos de fidelidade (1 ponto por R$ 1 gasto)
    const pontosFidelidade = Math.floor(valorTotalGasto)

    // Frequência média (dias entre visitas)
    let frequenciaMedia = 0
    if (completedAppointments.length > 1) {
      const sortedAppointments = completedAppointments.sort(
        (a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime()
      )

      let totalDays = 0
      for (let i = 1; i < sortedAppointments.length; i++) {
        const prevDate = new Date(sortedAppointments[i - 1].data_agendamento)
        const currentDate = new Date(sortedAppointments[i].data_agendamento)
        const diffDays = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        totalDays += diffDays
      }
      frequenciaMedia = Math.round(totalDays / (sortedAppointments.length - 1))
    }

    // Serviço favorito (mais frequente)
    const serviceCounts = completedAppointments.reduce(
      (acc, apt) => {
        const serviceName = apt.service?.nome || 'Serviço'
        acc[serviceName] = (acc[serviceName] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const servicoFavorito =
      Object.keys(serviceCounts).length > 0
        ? Object.keys(serviceCounts).reduce((a, b) => (serviceCounts[a] > serviceCounts[b] ? a : b))
        : undefined

    // Barbeiro favorito (mais frequente)
    const barberCounts = completedAppointments.reduce(
      (acc, apt) => {
        const barberName = apt.barbeiro?.nome || 'Barbeiro'
        acc[barberName] = (acc[barberName] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const barbeiroFavorito =
      Object.keys(barberCounts).length > 0
        ? Object.keys(barberCounts).reduce((a, b) => (barberCounts[a] > barberCounts[b] ? a : b))
        : undefined

    return {
      totalCortes,
      valorTotalGasto,
      pontosFidelidade,
      frequenciaMedia,
      servicoFavorito,
      barbeiroFavorito,
    }
  }, [appointments])

  // Função para cancelar agendamento
  const cancelAppointment = useCallback(
    async (id: string, reason?: string) => {
      try {
        if (!canCancelAppointment(id)) {
          return {
            success: false,
            error: 'Agendamento não pode ser cancelado devido às políticas de cancelamento',
          }
        }

        const result = await updateAppointment(id, {
          status: 'cancelado',
          observacoes: reason ? `Cancelado: ${reason}` : 'Cancelado pelo cliente',
        })

        if (result.success) {
          // Log do cancelamento (se necessário)
          // TODO: Implementar sistema de logs quando necessário
          // try {
          //   await supabase
          //     .from('appointment_logs')
          //     .insert({
          //       appointment_id: id,
          //       cliente_id: user?.id,
          //       action: 'cancel',
          //       reason: reason || 'Cancelado pelo cliente',
          //       created_at: new Date().toISOString()
          //     })
          // } catch (logError) {
          //   console.warn('Erro ao registrar log de cancelamento:', logError)
          // }

          // TODO: Enviar notificação ao barbeiro
          console.log('Agendamento cancelado, notificação ao barbeiro deve ser enviada')
        }

        return result
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao cancelar agendamento',
        }
      }
    },
    [canCancelAppointment, updateAppointment, user?.id]
  )

  // Função para verificar disponibilidade de horário (versão simplificada e robusta)
  const checkAvailability = useCallback(
    async (
      date: string,
      time: string,
      barbeiroId?: string,
      servicoId?: string,
      duracaoMinutos: number = 30
    ): Promise<boolean> => {
      console.log('🔍 Verificando disponibilidade:', {
        date,
        time,
        barbeiroId,
        servicoId,
        duracaoMinutos,
      })

      try {
        // Por enquanto, sempre retornar true para não bloquear o usuário
        // TODO: Implementar verificação real quando a estrutura do banco estiver definida
        console.log('✅ Assumindo disponibilidade (verificação simplificada)')
        return true
      } catch (error) {
        console.error('❌ Erro ao verificar disponibilidade:', error)
        // Em caso de erro, assumir disponível para não bloquear o usuário
        return true
      }
    },
    []
  )

  // Função para reagendar agendamento
  const rescheduleAppointment = useCallback(
    async (id: string, newDateTime: string, observacoes?: string) => {
      try {
        if (!canRescheduleAppointment(id)) {
          return {
            success: false,
            error: 'Agendamento não pode ser reagendado devido às políticas de reagendamento',
          }
        }

        const appointment = allAppointments.find((apt) => apt.id === id)
        if (!appointment) {
          return {
            success: false,
            error: 'Agendamento não encontrado',
          }
        }

        // Verificar se o novo horário está disponível
        const [date, time] = newDateTime.split('T')
        const isAvailable = await checkAvailability(
          date,
          time.substring(0, 5), // Remove segundos
          appointment.barbeiro_id,
          appointment.service_id,
          appointment.service?.duracao_minutos || 30
        )

        if (!isAvailable) {
          return {
            success: false,
            error: 'O horário selecionado não está mais disponível',
          }
        }

        // Preparar dados para atualização
        const updateData: any = {
          data_agendamento: newDateTime,
          status: 'pendente', // Resetar para pendente após reagendamento
        }

        // Adicionar observações se fornecidas
        if (observacoes) {
          const currentObservacoes = appointment.observacoes || ''
          const reagendamentoNote = `Reagendado em ${new Date().toLocaleString('pt-BR')}: ${observacoes}`
          updateData.observacoes = currentObservacoes 
            ? `${currentObservacoes}\n\n${reagendamentoNote}`
            : reagendamentoNote
        }

        const result = await updateAppointment(id, updateData)

        if (result.success) {
          // Log do reagendamento
          console.log('✅ Agendamento reagendado com sucesso:', {
            id,
            oldDateTime: appointment.data_agendamento,
            newDateTime,
            observacoes,
          })

          // Atualizar contagem de reagendamentos
          setRescheduleCount((prev) => prev + 1)

          // TODO: Enviar notificação ao barbeiro
          console.log('📧 Notificação ao barbeiro deve ser enviada sobre reagendamento')

          // Recarregar dados
          await baseRefetch()
        }

        return result
      } catch (error) {
        console.error('❌ Erro ao reagendar agendamento:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao reagendar agendamento',
        }
      }
    },
    [canRescheduleAppointment, updateAppointment, user?.id, allAppointments, checkAvailability, baseRefetch]
  )

  // Função para criar novo agendamento (versão simplificada para desenvolvimento)
  const createAppointment = useCallback(
    async (appointmentData: any) => {
      console.log('🔍 Tentando criar agendamento:', {
        userId: user?.id,
        appointmentData,
      })

      try {
        if (!user?.id) {
          throw new Error('Usuário não autenticado')
        }

        // Buscar informações do serviço selecionado
        const selectedService = services.find((s) => s.id === appointmentData.service_id)

        // Buscar informações do barbeiro selecionado
        let selectedBarber = null
        if (appointmentData.barbeiro_id && appointmentData.barbeiro_id !== 'any') {
          selectedBarber = funcionarios.find((f) => f.id === appointmentData.barbeiro_id)
        }

        // Limpar prefixo "profile-" do barbeiro_id se existir
        const cleanBarbeiroId =
          appointmentData.barbeiro_id === 'any'
            ? null
            : appointmentData.barbeiro_id?.replace(/^profile-/, '') || appointmentData.barbeiro_id

        console.log('🔧 Limpando barbeiro_id:', {
          original: appointmentData.barbeiro_id,
          cleaned: cleanBarbeiroId,
        })

        // Validar se barbeiro foi selecionado
        if (!cleanBarbeiroId) {
          throw new Error('Por favor, selecione um barbeiro para continuar.')
        }

        // Criar agendamento real no banco de dados
        const appointmentToCreate = {
          cliente_id: user.id,
          barbeiro_id: cleanBarbeiroId,
          service_id: appointmentData.service_id,
          data_agendamento: appointmentData.data_agendamento,
          duracao_minutos: selectedService?.duracao_minutos || 30,
          status: 'pendente',
          preco_final: selectedService?.preco || 0,
          observacoes: appointmentData.observacoes || null,
        }

        console.log('🔄 Criando agendamento no banco:', appointmentToCreate)

        const { data: newAppointment, error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentToCreate])
          .select('*')
          .single()

        if (insertError) {
          console.error('❌ Erro ao inserir agendamento:', insertError)
          throw new Error(`Erro ao criar agendamento: ${insertError.message}`)
        }

        console.log('✅ Agendamento criado com sucesso:', newAppointment)

        // Buscar dados relacionados separadamente se necessário
        if (newAppointment) {
          // Buscar dados do cliente
          if (newAppointment.cliente_id) {
            const { data: clienteData } = await supabase
              .from('profiles')
              .select('id, nome, email, telefone')
              .eq('id', newAppointment.cliente_id)
              .single()

            if (clienteData) {
              newAppointment.cliente = clienteData
            }
          }

          // Buscar dados do barbeiro
          if (newAppointment.barbeiro_id) {
            const { data: barbeiroData } = await supabase
              .from('profiles')
              .select('id, nome, avatar_url')
              .eq('id', newAppointment.barbeiro_id)
              .single()

            if (barbeiroData) {
              newAppointment.barbeiro = barbeiroData
            }
          }

          // Buscar dados do serviço
          if (newAppointment.service_id) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('id, nome, preco, duracao_minutos')
              .eq('id', newAppointment.service_id)
              .single()

            if (serviceData) {
              newAppointment.service = serviceData
            }
          }
        }

        // Recarregar agendamentos para atualizar a lista
        await baseRefetch()

        return newAppointment
      } catch (error) {
        console.error('❌ Erro ao criar agendamento:', error)
        throw error
      }
    },
    [user?.id, services, funcionarios, profile, baseRefetch]
  )

  // Buscar contagem de reagendamentos na inicialização
  useEffect(() => {
    if (user?.id) {
      fetchRescheduleCount()
    }
  }, [user?.id, fetchRescheduleCount])

  // Função de refetch personalizada
  const refetch = useCallback(async () => {
    try {
      await Promise.all([baseRefetch(), fetchRescheduleCount()])
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
    stats,
    canCancelAppointment,
    canRescheduleAppointment,
    checkAvailability,
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    refetch,
    // Funcionalidades de pagamento
    preparePaymentRedirect,
    needsPayment,
    canPay,
  }
}
