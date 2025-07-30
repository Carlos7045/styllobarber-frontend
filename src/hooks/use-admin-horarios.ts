/**
 * Hook para gerenciamento administrativo de horários
 * Fornece CRUD para horários de funcionamento e bloqueios
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export interface HorarioFuncionamento {
  id: string
  dia_semana: number | null // 0-6 (domingo-sábado)
  horario_inicio: string
  horario_fim: string
  intervalo_inicio?: string
  intervalo_fim?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface BloqueioHorario {
  id: string
  data_inicio: string
  data_fim: string
  horario_inicio?: string
  horario_fim?: string
  motivo: string
  funcionario_id?: string
  created_by?: string
  created_at: string
  // Dados relacionados
  funcionario?: {
    id: string
    profile: {
      nome: string
    }
  }
  created_by_profile?: {
    nome: string
  }
}

export interface CreateHorarioFuncionamentoData {
  dia_semana: number
  horario_inicio: string
  horario_fim: string
  intervalo_inicio?: string
  intervalo_fim?: string
  ativo?: boolean
}

export interface UpdateHorarioFuncionamentoData {
  horario_inicio?: string
  horario_fim?: string
  intervalo_inicio?: string
  intervalo_fim?: string
  ativo?: boolean
}

export interface CreateBloqueioHorarioData {
  data_inicio: string
  data_fim: string
  horario_inicio?: string
  horario_fim?: string
  motivo: string
  funcionario_id?: string
}

export interface UpdateBloqueioHorarioData {
  data_inicio?: string
  data_fim?: string
  horario_inicio?: string
  horario_fim?: string
  motivo?: string
  funcionario_id?: string
}

interface UseAdminHorariosReturn {
  horariosFuncionamento: HorarioFuncionamento[]
  bloqueiosHorario: BloqueioHorario[]
  loading: boolean
  error: string | null

  // Horários de funcionamento
  createHorarioFuncionamento: (
    data: CreateHorarioFuncionamentoData
  ) => Promise<{ success: boolean; error?: string }>
  updateHorarioFuncionamento: (
    id: string,
    data: UpdateHorarioFuncionamentoData
  ) => Promise<{ success: boolean; error?: string }>
  deleteHorarioFuncionamento: (id: string) => Promise<{ success: boolean; error?: string }>

  // Bloqueios de horário
  createBloqueioHorario: (
    data: CreateBloqueioHorarioData
  ) => Promise<{ success: boolean; error?: string }>
  updateBloqueioHorario: (
    id: string,
    data: UpdateBloqueioHorarioData
  ) => Promise<{ success: boolean; error?: string }>
  deleteBloqueioHorario: (id: string) => Promise<{ success: boolean; error?: string }>

  // Utilitários
  getHorarioByDiaSemana: (diaSemana: number) => HorarioFuncionamento | undefined
  getBloqueiosAtivos: () => BloqueioHorario[]
  isHorarioDisponivel: (data: string, horario: string, funcionarioId?: string) => Promise<boolean>

  refetch: () => Promise<void>
}

export function useAdminHorarios(): UseAdminHorariosReturn {
  const [horariosFuncionamento, setHorariosFuncionamento] = useState<HorarioFuncionamento[]>([])
  const [bloqueiosHorario, setBloqueiosHorario] = useState<BloqueioHorario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasRole, user } = useAuth()

  // Verificar se usuário tem permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Função para buscar horários de funcionamento
  const fetchHorariosFuncionamento = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .order('dia_semana', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setHorariosFuncionamento(data || [])
    } catch (err) {
      console.error('Erro ao buscar horários de funcionamento:', err)
      throw err
    }
  }, [])

  // Função para buscar bloqueios de horário
  const fetchBloqueiosHorario = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bloqueios_horario')
        .select(
          `
          *,
          funcionario:funcionarios(
            id,
            profile:profiles(nome)
          ),
          created_by_profile:profiles!bloqueios_horario_created_by_fkey(nome)
        `
        )
        .order('data_inicio', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setBloqueiosHorario(data || [])
    } catch (err) {
      console.error('Erro ao buscar bloqueios de horário:', err)
      throw err
    }
  }, [])

  // Função para buscar todos os dados
  const fetchData = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      await Promise.all([fetchHorariosFuncionamento(), fetchBloqueiosHorario()])
    } catch (err) {
      console.error('Erro ao buscar dados de horários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados de horários')
    } finally {
      setLoading(false)
    }
  }, [hasPermission, fetchHorariosFuncionamento, fetchBloqueiosHorario])

  // Função para criar horário de funcionamento
  const createHorarioFuncionamento = useCallback(
    async (data: CreateHorarioFuncionamentoData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { data: newHorario, error: createError } = await supabase
          .from('horarios_funcionamento')
          .insert([
            {
              ...data,
              ativo: data.ativo ?? true,
            },
          ])
          .select()
          .single()

        if (createError) {
          throw createError
        }

        setHorariosFuncionamento((prev) =>
          [...prev, newHorario].sort((a, b) => (a.dia_semana || 0) - (b.dia_semana || 0))
        )

        return { success: true }
      } catch (err) {
        console.error('Erro ao criar horário de funcionamento:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao criar horário de funcionamento',
        }
      }
    },
    [hasPermission]
  )

  // Função para atualizar horário de funcionamento
  const updateHorarioFuncionamento = useCallback(
    async (id: string, data: UpdateHorarioFuncionamentoData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      // Atualização otimista - atualizar o estado local imediatamente
      const previousState = horariosFuncionamento
      setHorariosFuncionamento((prev) =>
        prev.map((horario) =>
          horario.id === id
            ? { ...horario, ...data, updated_at: new Date().toISOString() }
            : horario
        )
      )

      try {
        const { data: updatedData, error: updateError } = await supabase
          .from('horarios_funcionamento')
          .update(data)
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          // Reverter o estado em caso de erro
          setHorariosFuncionamento(previousState)
          throw updateError
        }

        // Sincronizar com os dados reais do banco
        setHorariosFuncionamento((prev) =>
          prev.map((horario) => (horario.id === id ? updatedData : horario))
        )

        return { success: true }
      } catch (err) {
        console.error('Erro ao atualizar horário de funcionamento:', err)
        // Estado já foi revertido acima
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao atualizar horário de funcionamento',
        }
      }
    },
    [hasPermission, horariosFuncionamento]
  )

  // Função para deletar horário de funcionamento
  const deleteHorarioFuncionamento = useCallback(
    async (id: string) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { error: deleteError } = await supabase
          .from('horarios_funcionamento')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw deleteError
        }

        setHorariosFuncionamento((prev) => prev.filter((horario) => horario.id !== id))

        return { success: true }
      } catch (err) {
        console.error('Erro ao deletar horário de funcionamento:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao deletar horário de funcionamento',
        }
      }
    },
    [hasPermission]
  )

  // Função para criar bloqueio de horário
  const createBloqueioHorario = useCallback(
    async (data: CreateBloqueioHorarioData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { data: newBloqueio, error: createError } = await supabase
          .from('bloqueios_horario')
          .insert([
            {
              ...data,
              created_by: user?.id,
            },
          ])
          .select(
            `
          *,
          funcionario:funcionarios(
            id,
            profile:profiles(nome)
          ),
          created_by_profile:profiles!bloqueios_horario_created_by_fkey(nome)
        `
          )
          .single()

        if (createError) {
          throw createError
        }

        setBloqueiosHorario((prev) =>
          [newBloqueio, ...prev].sort(
            (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
          )
        )

        return { success: true }
      } catch (err) {
        console.error('Erro ao criar bloqueio de horário:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao criar bloqueio de horário',
        }
      }
    },
    [hasPermission, user?.id]
  )

  // Função para atualizar bloqueio de horário
  const updateBloqueioHorario = useCallback(
    async (id: string, data: UpdateBloqueioHorarioData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { error: updateError } = await supabase
          .from('bloqueios_horario')
          .update(data)
          .eq('id', id)

        if (updateError) {
          throw updateError
        }

        setBloqueiosHorario((prev) =>
          prev.map((bloqueio) => (bloqueio.id === id ? { ...bloqueio, ...data } : bloqueio))
        )

        return { success: true }
      } catch (err) {
        console.error('Erro ao atualizar bloqueio de horário:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao atualizar bloqueio de horário',
        }
      }
    },
    [hasPermission]
  )

  // Função para deletar bloqueio de horário
  const deleteBloqueioHorario = useCallback(
    async (id: string) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { error: deleteError } = await supabase
          .from('bloqueios_horario')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw deleteError
        }

        setBloqueiosHorario((prev) => prev.filter((bloqueio) => bloqueio.id !== id))

        return { success: true }
      } catch (err) {
        console.error('Erro ao deletar bloqueio de horário:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao deletar bloqueio de horário',
        }
      }
    },
    [hasPermission]
  )

  // Função para buscar horário por dia da semana
  const getHorarioByDiaSemana = useCallback(
    (diaSemana: number) => {
      return horariosFuncionamento.find(
        (horario) => horario.dia_semana === diaSemana && horario.ativo
      )
    },
    [horariosFuncionamento]
  )

  // Função para buscar bloqueios ativos
  const getBloqueiosAtivos = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0]
    return bloqueiosHorario.filter((bloqueio) => bloqueio.data_fim >= hoje)
  }, [bloqueiosHorario])

  // Função para verificar se horário está disponível
  const isHorarioDisponivel = useCallback(
    async (data: string, horario: string, funcionarioId?: string) => {
      try {
        const dataObj = new Date(data)
        const diaSemana = dataObj.getDay()

        // Verificar se está dentro do horário de funcionamento
        const horarioFuncionamento = getHorarioByDiaSemana(diaSemana)
        if (!horarioFuncionamento) {
          return false
        }

        // Verificar se está dentro do horário de funcionamento
        if (
          horario < horarioFuncionamento.horario_inicio ||
          horario > horarioFuncionamento.horario_fim
        ) {
          return false
        }

        // Verificar se está no intervalo (se houver)
        if (horarioFuncionamento.intervalo_inicio && horarioFuncionamento.intervalo_fim) {
          if (
            horario >= horarioFuncionamento.intervalo_inicio &&
            horario <= horarioFuncionamento.intervalo_fim
          ) {
            return false
          }
        }

        // Verificar bloqueios
        const bloqueiosAtivos = getBloqueiosAtivos()
        const temBloqueio = bloqueiosAtivos.some((bloqueio) => {
          // Verificar se a data está no período do bloqueio
          if (data < bloqueio.data_inicio || data > bloqueio.data_fim) {
            return false
          }

          // Se é bloqueio específico de funcionário
          if (bloqueio.funcionario_id && bloqueio.funcionario_id !== funcionarioId) {
            return false
          }

          // Se tem horário específico no bloqueio
          if (bloqueio.horario_inicio && bloqueio.horario_fim) {
            return horario >= bloqueio.horario_inicio && horario <= bloqueio.horario_fim
          }

          // Bloqueio do dia inteiro
          return true
        })

        if (temBloqueio) {
          return false
        }

        // Verificar se já existe agendamento neste horário
        const { data: agendamentoExistente, error } = await supabase
          .from('appointments')
          .select('id')
          .eq('data_agendamento', `${data} ${horario}:00`)
          .neq('status', 'cancelado')

        if (error) {
          console.error('Erro ao verificar agendamento existente:', error)
          return false
        }

        // Se é para funcionário específico, verificar apenas para ele
        if (funcionarioId && agendamentoExistente) {
          const { data: agendamentoFuncionario } = await supabase
            .from('appointments')
            .select('id')
            .eq('data_agendamento', `${data} ${horario}:00`)
            .eq('barbeiro_id', funcionarioId)
            .neq('status', 'cancelado')

          return !agendamentoFuncionario || agendamentoFuncionario.length === 0
        }

        return !agendamentoExistente || agendamentoExistente.length === 0
      } catch (err) {
        console.error('Erro ao verificar disponibilidade:', err)
        return false
      }
    },
    [getHorarioByDiaSemana, getBloqueiosAtivos]
  )

  // Buscar dados na inicialização
  useEffect(() => {
    if (hasPermission) {
      fetchData()
    }
  }, [hasPermission])

  return {
    horariosFuncionamento,
    bloqueiosHorario,
    loading,
    error,
    createHorarioFuncionamento,
    updateHorarioFuncionamento,
    deleteHorarioFuncionamento,
    createBloqueioHorario,
    updateBloqueioHorario,
    deleteBloqueioHorario,
    getHorarioByDiaSemana,
    getBloqueiosAtivos,
    isHorarioDisponivel,
    refetch: fetchData,
  }
}
