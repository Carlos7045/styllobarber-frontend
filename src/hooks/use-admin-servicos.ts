/**
 * Hook para gerenciamento administrativo de serviços
 * Fornece CRUD completo para serviços com histórico de preços
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { Service } from '@/types/services'

export interface ServicoAdmin extends Service {
  historico_precos?: HistoricoPreco[]
  agendamentos_futuros?: number
  receita_mes?: number
  total_agendamentos?: number
}

export interface HistoricoPreco {
  id: string
  service_id: string
  preco_anterior: number | null
  preco_novo: number
  motivo: string | null
  alterado_por: string | null
  created_at: string
  alterado_por_profile?: {
    nome: string
  }
}

export interface CreateServicoData {
  nome: string
  descricao?: string
  preco: number
  duracao_minutos: number
  categoria?: string
  ordem?: number
  ativo?: boolean
}

export interface UpdateServicoData {
  nome?: string
  descricao?: string
  preco?: number
  duracao_minutos?: number
  categoria?: string
  ordem?: number
  ativo?: boolean
}

interface UseAdminServicosReturn {
  servicos: ServicoAdmin[]
  loading: boolean
  error: string | null
  createServico: (data: CreateServicoData) => Promise<{ success: boolean; error?: string; data?: ServicoAdmin }>
  updateServico: (id: string, data: UpdateServicoData) => Promise<{ success: boolean; error?: string }>
  deleteServico: (id: string) => Promise<{ success: boolean; error?: string }>
  toggleServicoStatus: (id: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>
  getServicoById: (id: string) => ServicoAdmin | undefined
  getHistoricoPrecos: (serviceId: string) => Promise<HistoricoPreco[]>
  updateOrdem: (servicosOrdenados: { id: string; ordem: number }[]) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

export function useAdminServicos(): UseAdminServicosReturn {
  const [servicos, setServicos] = useState<ServicoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasRole } = useAuth()

  // Verificar se usuário tem permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Função para buscar serviços com estatísticas
  const fetchServicos = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar serviços básicos
      const { data: servicosData, error: servicosError } = await supabase
        .from('services')
        .select('*')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })

      if (servicosError) {
        throw servicosError
      }

      // Buscar estatísticas para cada serviço
      const servicosComStats = await Promise.all(
        (servicosData || []).map(async (servico) => {
          // Contar agendamentos futuros
          const { count: agendamentosFuturos } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', servico.id)
            .gte('data_agendamento', new Date().toISOString())
            .neq('status', 'cancelado')

          // Calcular receita do mês atual
          const inicioMes = new Date()
          inicioMes.setDate(1)
          inicioMes.setHours(0, 0, 0, 0)

          const { data: agendamentosMes } = await supabase
            .from('appointments')
            .select('preco_final')
            .eq('service_id', servico.id)
            .eq('status', 'concluido')
            .gte('data_agendamento', inicioMes.toISOString())

          const receitaMes = agendamentosMes?.reduce((sum, apt) => sum + (apt.preco_final || servico.preco), 0) || 0

          // Contar total de agendamentos
          const { count: totalAgendamentos } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', servico.id)

          return {
            ...servico,
            agendamentos_futuros: agendamentosFuturos || 0,
            receita_mes: receitaMes,
            total_agendamentos: totalAgendamentos || 0
          }
        })
      )

      setServicos(servicosComStats)
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar serviços')
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  // Função para criar serviço
  const createServico = useCallback(async (data: CreateServicoData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      const { data: newServico, error: createError } = await supabase
        .from('services')
        .insert([{
          ...data,
          ativo: data.ativo ?? true
        }])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Adicionar à lista local com estatísticas zeradas
      const servicoComStats = {
        ...newServico,
        agendamentos_futuros: 0,
        receita_mes: 0,
        total_agendamentos: 0
      }

      setServicos(prev => [servicoComStats, ...prev])

      return { success: true, data: servicoComStats }
    } catch (err) {
      console.error('Erro ao criar serviço:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao criar serviço'
      }
    }
  }, [hasPermission])

  // Função para atualizar serviço
  const updateServico = useCallback(async (id: string, data: UpdateServicoData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      const { error: updateError } = await supabase
        .from('services')
        .update(data)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setServicos(prev =>
        prev.map(servico =>
          servico.id === id
            ? { ...servico, ...data, updated_at: new Date().toISOString() }
            : servico
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar serviço'
      }
    }
  }, [hasPermission])

  // Função para deletar serviço
  const deleteServico = useCallback(async (id: string) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Verificar se serviço tem agendamentos futuros
      const { data: agendamentosFuturos, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('service_id', id)
        .gte('data_agendamento', new Date().toISOString())
        .neq('status', 'cancelado')

      if (checkError) {
        throw checkError
      }

      if (agendamentosFuturos && agendamentosFuturos.length > 0) {
        return {
          success: false,
          error: `Serviço possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Desative ao invés de deletar.`
        }
      }

      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Remover da lista local
      setServicos(prev => prev.filter(servico => servico.id !== id))

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar serviço:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao deletar serviço'
      }
    }
  }, [hasPermission])

  // Função para ativar/desativar serviço
  const toggleServicoStatus = useCallback(async (id: string, ativo: boolean) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      if (!ativo) {
        // Verificar se serviço tem agendamentos futuros
        const { data: agendamentosFuturos, error: checkError } = await supabase
          .from('appointments')
          .select('id')
          .eq('service_id', id)
          .gte('data_agendamento', new Date().toISOString())
          .neq('status', 'cancelado')

        if (checkError) {
          throw checkError
        }

        if (agendamentosFuturos && agendamentosFuturos.length > 0) {
          return {
            success: false,
            error: `Serviço possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Cancele-os primeiro.`
          }
        }
      }

      const { error: updateError } = await supabase
        .from('services')
        .update({ ativo })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setServicos(prev =>
        prev.map(servico =>
          servico.id === id
            ? { ...servico, ativo, updated_at: new Date().toISOString() }
            : servico
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao alterar status do serviço:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao alterar status do serviço'
      }
    }
  }, [hasPermission])

  // Função para buscar serviço por ID
  const getServicoById = useCallback((id: string) => {
    return servicos.find(servico => servico.id === id)
  }, [servicos])

  // Função para buscar histórico de preços
  const getHistoricoPrecos = useCallback(async (serviceId: string): Promise<HistoricoPreco[]> => {
    if (!hasPermission) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('historico_precos')
        .select(`
          *,
          alterado_por_profile:profiles!historico_precos_alterado_por_fkey(nome)
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (err) {
      console.error('Erro ao buscar histórico de preços:', err)
      return []
    }
  }, [hasPermission])

  // Função para atualizar ordem dos serviços
  const updateOrdem = useCallback(async (servicosOrdenados: { id: string; ordem: number }[]) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Atualizar ordem de cada serviço
      const updates = servicosOrdenados.map(({ id, ordem }) =>
        supabase
          .from('services')
          .update({ ordem })
          .eq('id', id)
      )

      const results = await Promise.all(updates)
      
      // Verificar se alguma atualização falhou
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error('Erro ao atualizar ordem dos serviços')
      }

      // Atualizar lista local
      setServicos(prev =>
        prev.map(servico => {
          const novaOrdem = servicosOrdenados.find(s => s.id === servico.id)
          return novaOrdem ? { ...servico, ordem: novaOrdem.ordem } : servico
        }).sort((a, b) => (a.ordem || 999) - (b.ordem || 999))
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar ordem:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar ordem'
      }
    }
  }, [hasPermission])

  // Buscar serviços na inicialização
  useEffect(() => {
    if (hasPermission) {
      fetchServicos()
    }
  }, [hasPermission])

  return {
    servicos,
    loading,
    error,
    createServico,
    updateServico,
    deleteServico,
    toggleServicoStatus,
    getServicoById,
    getHistoricoPrecos,
    updateOrdem,
    refetch: fetchServicos
  }
}