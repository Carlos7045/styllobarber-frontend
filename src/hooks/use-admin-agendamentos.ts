/**
 * Hook para gerenciamento administrativo de agendamentos
 * Fornece agenda centralizada com controle total
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { Appointment } from '@/types/appointments'

export interface AgendamentoAdmin extends Appointment {
  pode_cancelar: boolean
  pode_reagendar: boolean
  tempo_para_agendamento?: string
  historico_alteracoes?: HistoricoAlteracao[]
  conflitos?: ConflitosAgendamento[]
}

export interface HistoricoAlteracao {
  id: string
  appointment_id: string
  acao: 'criado' | 'alterado' | 'cancelado' | 'reagendado' | 'confirmado'
  dados_anteriores?: any
  dados_novos?: any
  motivo?: string
  alterado_por: string
  created_at: string
  alterado_por_profile?: {
    nome: string
  }
}

export interface ConflitosAgendamento {
  tipo: 'horario_ocupado' | 'funcionario_indisponivel' | 'fora_horario_funcionamento'
  descricao: string
  sugestoes?: string[]
}

export interface CalendarioAdmin {
  view: 'day' | 'week' | 'month'
  data_selecionada: string
  funcionario_filter?: string
  servico_filter?: string
  status_filter?: string[]
  cliente_filter?: string
}

export interface CreateAgendamentoAdminData {
  cliente_id: string
  service_id: string
  barbeiro_id?: string
  data_agendamento: string
  horario_agendamento: string
  observacoes?: string
  preco_final?: number
  status?: 'pendente' | 'confirmado'
}

export interface UpdateAgendamentoAdminData {
  service_id?: string
  barbeiro_id?: string
  data_agendamento?: string
  horario_agendamento?: string
  status?: string
  observacoes?: string
  preco_final?: number
}

interface UseAdminAgendamentosReturn {
  agendamentos: AgendamentoAdmin[]
  loading: boolean
  error: string | null
  calendario: CalendarioAdmin
  
  // Estatísticas
  totalAgendamentos: number
  agendamentosHoje: number
  agendamentosPendentes: number
  taxaOcupacao: number
  
  // Ações de agendamento
  createAgendamento: (data: CreateAgendamentoAdminData) => Promise<{ success: boolean; error?: string; data?: AgendamentoAdmin }>
  updateAgendamento: (id: string, data: UpdateAgendamentoAdminData) => Promise<{ success: boolean; error?: string }>
  cancelAgendamento: (id: string, motivo?: string) => Promise<{ success: boolean; error?: string }>
  confirmarAgendamento: (id: string) => Promise<{ success: boolean; error?: string }>
  reagendarAgendamento: (id: string, novaData: string, novoHorario: string) => Promise<{ success: boolean; error?: string }>
  
  // Verificações
  verificarConflitos: (data: string, horario: string, barbeiroId?: string, agendamentoId?: string) => Promise<ConflitosAgendamento[]>
  verificarDisponibilidade: (data: string, horario: string, barbeiroId?: string) => Promise<boolean>
  
  // Histórico
  getHistoricoAlteracoes: (agendamentoId: string) => Promise<HistoricoAlteracao[]>
  
  // Calendário
  setCalendario: (calendario: Partial<CalendarioAdmin>) => void
  getAgendamentosPorPeriodo: (inicio: string, fim: string) => AgendamentoAdmin[]
  
  // Notificações
  enviarNotificacaoCliente: (agendamentoId: string, tipo: 'confirmacao' | 'cancelamento' | 'reagendamento' | 'lembrete') => Promise<{ success: boolean; error?: string }>
  
  refetch: () => Promise<void>
}

export function useAdminAgendamentos(): UseAdminAgendamentosReturn {
  const [agendamentos, setAgendamentos] = useState<AgendamentoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendario, setCalendario] = useState<CalendarioAdmin>({
    view: 'week',
    data_selecionada: new Date().toISOString().split('T')[0]
  })
  const { hasRole, user } = useAuth()

  // Verificar se usuário tem permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner') || hasRole('barber')

  // Função para calcular tempo até agendamento
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

  // Função para buscar agendamentos
  const fetchAgendamentos = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

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

      // Aplicar filtros do calendário
      if (calendario.funcionario_filter) {
        query = query.eq('barbeiro_id', calendario.funcionario_filter)
      }

      if (calendario.servico_filter) {
        query = query.eq('service_id', calendario.servico_filter)
      }

      if (calendario.status_filter && calendario.status_filter.length > 0) {
        query = query.in('status', calendario.status_filter)
      }

      if (calendario.cliente_filter) {
        query = query.eq('cliente_id', calendario.cliente_filter)
      }

      // Filtrar por período baseado na view
      const dataBase = new Date(calendario.data_selecionada)
      let dataInicio: Date
      let dataFim: Date

      switch (calendario.view) {
        case 'day':
          dataInicio = new Date(dataBase)
          dataFim = new Date(dataBase)
          dataFim.setDate(dataFim.getDate() + 1)
          break
        case 'week':
          dataInicio = new Date(dataBase)
          dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay())
          dataFim = new Date(dataInicio)
          dataFim.setDate(dataFim.getDate() + 7)
          break
        case 'month':
          dataInicio = new Date(dataBase.getFullYear(), dataBase.getMonth(), 1)
          dataFim = new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 0)
          break
        default:
          dataInicio = new Date(dataBase)
          dataFim = new Date(dataBase)
          dataFim.setDate(dataFim.getDate() + 7)
      }

      query = query
        .gte('data_agendamento', dataInicio.toISOString())
        .lt('data_agendamento', dataFim.toISOString())

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Processar agendamentos com informações adicionais
      const agendamentosProcessados = (data || []).map(agendamento => {
        const now = new Date()
        const appointmentDate = new Date(agendamento.data_agendamento)
        const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        return {
          ...agendamento,
          pode_cancelar: hoursUntilAppointment >= 2 && !['cancelado', 'concluido'].includes(agendamento.status),
          pode_reagendar: hoursUntilAppointment >= 12 && !['cancelado', 'concluido'].includes(agendamento.status),
          tempo_para_agendamento: appointmentDate > now ? calculateTimeUntilAppointment(agendamento.data_agendamento) : undefined
        }
      })

      setAgendamentos(agendamentosProcessados)
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar agendamentos')
    } finally {
      setLoading(false)
    }
  }, [hasPermission, calendario, calculateTimeUntilAppointment])

  // Função para criar agendamento
  const createAgendamento = useCallback(async (data: CreateAgendamentoAdminData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Verificar conflitos antes de criar
      const conflitos = await verificarConflitos(
        data.data_agendamento,
        data.horario_agendamento,
        data.barbeiro_id
      )

      if (conflitos.length > 0) {
        return {
          success: false,
          error: `Conflitos encontrados: ${conflitos.map(c => c.descricao).join(', ')}`
        }
      }

      const { data: newAgendamento, error: createError } = await supabase
        .from('appointments')
        .insert([{
          ...data,
          status: data.status || 'pendente',
          created_at: new Date().toISOString()
        }])
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

      // Registrar no histórico
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: newAgendamento.id,
          acao: 'criado',
          dados_novos: newAgendamento,
          alterado_por: user?.id,
          created_at: new Date().toISOString()
        })

      // Atualizar lista local
      const agendamentoProcessado = {
        ...newAgendamento,
        pode_cancelar: true,
        pode_reagendar: true,
        tempo_para_agendamento: calculateTimeUntilAppointment(newAgendamento.data_agendamento)
      }

      setAgendamentos(prev => [agendamentoProcessado, ...prev])

      return { success: true, data: agendamentoProcessado }
    } catch (err) {
      console.error('Erro ao criar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao criar agendamento'
      }
    }
  }, [hasPermission, user?.id, calculateTimeUntilAppointment])

  // Função para atualizar agendamento
  const updateAgendamento = useCallback(async (id: string, data: UpdateAgendamentoAdminData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Buscar dados atuais para histórico
      const { data: agendamentoAtual } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single()

      const { error: updateError } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Registrar no histórico
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: id,
          acao: 'alterado',
          dados_anteriores: agendamentoAtual,
          dados_novos: data,
          alterado_por: user?.id,
          created_at: new Date().toISOString()
        })

      // Atualizar lista local
      setAgendamentos(prev =>
        prev.map(agendamento =>
          agendamento.id === id
            ? { ...agendamento, ...data, updated_at: new Date().toISOString() }
            : agendamento
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
  }, [hasPermission, user?.id])

  // Função para cancelar agendamento
  const cancelAgendamento = useCallback(async (id: string, motivo?: string) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelado',
          observacoes: motivo ? `Cancelado: ${motivo}` : 'Cancelado pelo administrador'
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Registrar no histórico
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: id,
          acao: 'cancelado',
          motivo: motivo || 'Cancelado pelo administrador',
          alterado_por: user?.id,
          created_at: new Date().toISOString()
        })

      // Atualizar lista local
      setAgendamentos(prev =>
        prev.map(agendamento =>
          agendamento.id === id
            ? { 
                ...agendamento, 
                status: 'cancelado',
                pode_cancelar: false,
                pode_reagendar: false,
                updated_at: new Date().toISOString()
              }
            : agendamento
        )
      )

      // Enviar notificação ao cliente
      await enviarNotificacaoCliente(id, 'cancelamento')

      return { success: true }
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao cancelar agendamento'
      }
    }
  }, [hasPermission, user?.id])

  // Função para confirmar agendamento
  const confirmarAgendamento = useCallback(async (id: string) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmado' })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Registrar no histórico
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: id,
          acao: 'confirmado',
          alterado_por: user?.id,
          created_at: new Date().toISOString()
        })

      // Atualizar lista local
      setAgendamentos(prev =>
        prev.map(agendamento =>
          agendamento.id === id
            ? { ...agendamento, status: 'confirmado', updated_at: new Date().toISOString() }
            : agendamento
        )
      )

      // Enviar notificação ao cliente
      await enviarNotificacaoCliente(id, 'confirmacao')

      return { success: true }
    } catch (err) {
      console.error('Erro ao confirmar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao confirmar agendamento'
      }
    }
  }, [hasPermission, user?.id])

  // Função para reagendar agendamento
  const reagendarAgendamento = useCallback(async (id: string, novaData: string, novoHorario: string) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Verificar conflitos no novo horário
      const agendamento = agendamentos.find(a => a.id === id)
      const conflitos = await verificarConflitos(
        novaData,
        novoHorario,
        agendamento?.barbeiro_id,
        id
      )

      if (conflitos.length > 0) {
        return {
          success: false,
          error: `Conflitos encontrados: ${conflitos.map(c => c.descricao).join(', ')}`
        }
      }

      // Buscar dados atuais para histórico
      const { data: agendamentoAtual } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single()

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          data_agendamento: novaData,
          horario_agendamento: novoHorario,
          status: 'pendente' // Resetar para pendente após reagendamento
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Registrar no histórico
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: id,
          acao: 'reagendado',
          dados_anteriores: agendamentoAtual,
          dados_novos: { data_agendamento: novaData, horario_agendamento: novoHorario },
          alterado_por: user?.id,
          created_at: new Date().toISOString()
        })

      // Atualizar lista local
      setAgendamentos(prev =>
        prev.map(agendamento =>
          agendamento.id === id
            ? { 
                ...agendamento, 
                data_agendamento: novaData,
                horario_agendamento: novoHorario,
                status: 'pendente',
                tempo_para_agendamento: calculateTimeUntilAppointment(`${novaData} ${novoHorario}:00`),
                updated_at: new Date().toISOString()
              }
            : agendamento
        )
      )

      // Enviar notificação ao cliente
      await enviarNotificacaoCliente(id, 'reagendamento')

      return { success: true }
    } catch (err) {
      console.error('Erro ao reagendar agendamento:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao reagendar agendamento'
      }
    }
  }, [hasPermission, user?.id, agendamentos, calculateTimeUntilAppointment])

  // Função para verificar conflitos
  const verificarConflitos = useCallback(async (
    data: string, 
    horario: string, 
    barbeiroId?: string, 
    agendamentoId?: string
  ): Promise<ConflitosAgendamento[]> => {
    const conflitos: ConflitosAgendamento[] = []

    try {
      // Verificar se já existe agendamento no mesmo horário
      let query = supabase
        .from('appointments')
        .select('id, barbeiro_id')
        .eq('data_agendamento', `${data} ${horario}:00`)
        .neq('status', 'cancelado')

      if (agendamentoId) {
        query = query.neq('id', agendamentoId)
      }

      const { data: agendamentosConflitantes } = await query

      if (agendamentosConflitantes && agendamentosConflitantes.length > 0) {
        if (barbeiroId) {
          const conflitoBarbeiro = agendamentosConflitantes.find(a => a.barbeiro_id === barbeiroId)
          if (conflitoBarbeiro) {
            conflitos.push({
              tipo: 'funcionario_indisponivel',
              descricao: 'Barbeiro já possui agendamento neste horário',
              sugestoes: ['Escolher outro horário', 'Escolher outro barbeiro']
            })
          }
        } else {
          conflitos.push({
            tipo: 'horario_ocupado',
            descricao: 'Já existe agendamento neste horário',
            sugestoes: ['Escolher outro horário']
          })
        }
      }

      // Verificar horário de funcionamento
      const dataObj = new Date(data)
      const diaSemana = dataObj.getDay()

      const { data: horarioFuncionamento } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('ativo', true)
        .single()

      if (!horarioFuncionamento) {
        conflitos.push({
          tipo: 'fora_horario_funcionamento',
          descricao: 'Barbearia fechada neste dia',
          sugestoes: ['Escolher outro dia']
        })
      } else {
        if (horario < horarioFuncionamento.horario_inicio || horario > horarioFuncionamento.horario_fim) {
          conflitos.push({
            tipo: 'fora_horario_funcionamento',
            descricao: `Fora do horário de funcionamento (${horarioFuncionamento.horario_inicio} - ${horarioFuncionamento.horario_fim})`,
            sugestoes: [`Escolher horário entre ${horarioFuncionamento.horario_inicio} e ${horarioFuncionamento.horario_fim}`]
          })
        }

        // Verificar intervalo
        if (horarioFuncionamento.intervalo_inicio && horarioFuncionamento.intervalo_fim) {
          if (horario >= horarioFuncionamento.intervalo_inicio && horario <= horarioFuncionamento.intervalo_fim) {
            conflitos.push({
              tipo: 'fora_horario_funcionamento',
              descricao: `Horário de intervalo (${horarioFuncionamento.intervalo_inicio} - ${horarioFuncionamento.intervalo_fim})`,
              sugestoes: [`Escolher horário antes de ${horarioFuncionamento.intervalo_inicio} ou após ${horarioFuncionamento.intervalo_fim}`]
            })
          }
        }
      }

      // Verificar bloqueios
      const { data: bloqueios } = await supabase
        .from('bloqueios_horario')
        .select('*')
        .lte('data_inicio', data)
        .gte('data_fim', data)

      if (bloqueios && bloqueios.length > 0) {
        for (const bloqueio of bloqueios) {
          if (bloqueio.funcionario_id && bloqueio.funcionario_id !== barbeiroId) {
            continue
          }

          if (bloqueio.horario_inicio && bloqueio.horario_fim) {
            if (horario >= bloqueio.horario_inicio && horario <= bloqueio.horario_fim) {
              conflitos.push({
                tipo: 'funcionario_indisponivel',
                descricao: `Horário bloqueado: ${bloqueio.motivo}`,
                sugestoes: ['Escolher outro horário']
              })
            }
          } else {
            conflitos.push({
              tipo: 'funcionario_indisponivel',
              descricao: `Dia bloqueado: ${bloqueio.motivo}`,
              sugestoes: ['Escolher outro dia']
            })
          }
        }
      }

      return conflitos
    } catch (err) {
      console.error('Erro ao verificar conflitos:', err)
      return [{
        tipo: 'horario_ocupado',
        descricao: 'Erro ao verificar disponibilidade',
        sugestoes: ['Tentar novamente']
      }]
    }
  }, [])

  // Função para verificar disponibilidade
  const verificarDisponibilidade = useCallback(async (
    data: string, 
    horario: string, 
    barbeiroId?: string
  ): Promise<boolean> => {
    const conflitos = await verificarConflitos(data, horario, barbeiroId)
    return conflitos.length === 0
  }, [verificarConflitos])

  // Função para buscar histórico de alterações
  const getHistoricoAlteracoes = useCallback(async (agendamentoId: string): Promise<HistoricoAlteracao[]> => {
    if (!hasPermission) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('appointment_logs')
        .select(`
          *,
          alterado_por_profile:profiles!appointment_logs_alterado_por_fkey(nome)
        `)
        .eq('appointment_id', agendamentoId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
      return []
    }
  }, [hasPermission])

  // Função para buscar agendamentos por período
  const getAgendamentosPorPeriodo = useCallback((inicio: string, fim: string) => {
    return agendamentos.filter(agendamento => {
      const dataAgendamento = agendamento.data_agendamento.split('T')[0]
      return dataAgendamento >= inicio && dataAgendamento <= fim
    })
  }, [agendamentos])

  // Função para enviar notificação ao cliente
  const enviarNotificacaoCliente = useCallback(async (
    agendamentoId: string, 
    tipo: 'confirmacao' | 'cancelamento' | 'reagendamento' | 'lembrete'
  ) => {
    // TODO: Implementar sistema de notificações
    console.log(`Enviando notificação de ${tipo} para agendamento ${agendamentoId}`)
    return { success: true }
  }, [])

  // Estatísticas calculadas
  const totalAgendamentos = agendamentos.length
  const hoje = new Date().toISOString().split('T')[0]
  const agendamentosHoje = agendamentos.filter(a => a.data_agendamento.startsWith(hoje)).length
  const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente').length
  
  // Calcular taxa de ocupação (simplificado)
  const taxaOcupacao = agendamentosHoje > 0 ? Math.min((agendamentosHoje / 10) * 100, 100) : 0

  // Buscar agendamentos quando calendário mudar
  useEffect(() => {
    if (hasPermission) {
      fetchAgendamentos()
    }
  }, [hasPermission, calendario])

  return {
    agendamentos,
    loading,
    error,
    calendario,
    totalAgendamentos,
    agendamentosHoje,
    agendamentosPendentes,
    taxaOcupacao,
    createAgendamento,
    updateAgendamento,
    cancelAgendamento,
    confirmarAgendamento,
    reagendarAgendamento,
    verificarConflitos,
    verificarDisponibilidade,
    getHistoricoAlteracoes,
    setCalendario,
    getAgendamentosPorPeriodo,
    enviarNotificacaoCliente,
    refetch: fetchAgendamentos
  }
}