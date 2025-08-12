/**
 * Hook para gerenciamento administrativo de funcionários
 * Fornece CRUD completo para funcionários/barbeiros
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'

export interface Funcionario {
  id: string
  profile_id: string
  especialidades: string[]
  horario_trabalho: Record<string, any>
  comissao_percentual: number
  data_admissao: string
  ativo: boolean
  created_at: string
  updated_at: string
  // Dados do perfil relacionado
  profile?: {
    id: string
    nome: string
    email: string
    telefone?: string
    avatar_url?: string
    role: string
  }
}

export interface CreateFuncionarioData {
  profile_id: string
  especialidades: string[]
  horario_trabalho?: Record<string, any>
  comissao_percentual?: number
  data_admissao?: string
}

export interface UpdateFuncionarioData {
  especialidades?: string[]
  horario_trabalho?: Record<string, any>
  comissao_percentual?: number
  data_admissao?: string
  ativo?: boolean
}

interface UseAdminFuncionariosReturn {
  funcionarios: Funcionario[]
  loading: boolean
  error: string | null
  createFuncionario: (data: CreateFuncionarioData) => Promise<{ success: boolean; error?: string; data?: Funcionario }>
  updateFuncionario: (id: string, data: UpdateFuncionarioData) => Promise<{ success: boolean; error?: string }>
  deleteFuncionario: (id: string) => Promise<{ success: boolean; error?: string }>
  toggleFuncionarioStatus: (id: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>
  getFuncionarioById: (id: string) => Funcionario | undefined
  refetch: () => Promise<void>
}

export function useAdminFuncionarios(): UseAdminFuncionariosReturn {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasRole } = useAuth()

  // Verificar se usuário tem permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Função para buscar funcionários
  const fetchFuncionarios = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('funcionarios')
        .select(`
          *,
          profile:profiles!funcionarios_profile_id_fkey(
            id,
            nome,
            email,
            telefone,
            avatar_url,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setFuncionarios(data || [])
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar funcionários')
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  // Função para criar funcionário
  const createFuncionario = useCallback(async (data: CreateFuncionarioData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Primeiro, atualizar o role do perfil para 'barber'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'barber' })
        .eq('id', data.profile_id)

      if (profileError) {
        throw profileError
      }

      // Criar registro de funcionário
      const { data: newFuncionario, error: createError } = await supabase
        .from('funcionarios')
        .insert([{
          profile_id: data.profile_id,
          especialidades: data.especialidades,
          horario_trabalho: data.horario_trabalho || {},
          comissao_percentual: data.comissao_percentual || 0,
          data_admissao: data.data_admissao || new Date().toISOString().split('T')[0]
        }])
        .select(`
          *,
          profile:profiles!funcionarios_profile_id_fkey(
            id,
            nome,
            email,
            telefone,
            avatar_url,
            role
          )
        `)
        .single()

      if (createError) {
        throw createError
      }

      // Atualizar lista local
      setFuncionarios(prev => [newFuncionario, ...prev])

      return { success: true, data: newFuncionario }
    } catch (err) {
      console.error('Erro ao criar funcionário:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao criar funcionário'
      }
    }
  }, [hasPermission])

  // Função para atualizar funcionário
  const updateFuncionario = useCallback(async (id: string, data: UpdateFuncionarioData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update(data)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setFuncionarios(prev =>
        prev.map(funcionario =>
          funcionario.id === id
            ? { ...funcionario, ...data, updated_at: new Date().toISOString() }
            : funcionario
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar funcionário'
      }
    }
  }, [hasPermission])

  // Função para deletar funcionário
  const deleteFuncionario = useCallback(async (id: string) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Verificar se funcionário tem agendamentos futuros
      const { data: agendamentosFuturos, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barbeiro_id', id)
        .gte('data_agendamento', new Date().toISOString())
        .neq('status', 'cancelado')

      if (checkError) {
        throw checkError
      }

      if (agendamentosFuturos && agendamentosFuturos.length > 0) {
        return {
          success: false,
          error: `Funcionário possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Desative ao invés de deletar.`
        }
      }

      const { error: deleteError } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Remover da lista local
      setFuncionarios(prev => prev.filter(funcionario => funcionario.id !== id))

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar funcionário:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao deletar funcionário'
      }
    }
  }, [hasPermission])

  // Função para ativar/desativar funcionário
  const toggleFuncionarioStatus = useCallback(async (id: string, ativo: boolean) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      if (!ativo) {
        // Verificar se funcionário tem agendamentos futuros
        const { data: agendamentosFuturos, error: checkError } = await supabase
          .from('appointments')
          .select('id')
          .eq('barbeiro_id', id)
          .gte('data_agendamento', new Date().toISOString())
          .neq('status', 'cancelado')

        if (checkError) {
          throw checkError
        }

        if (agendamentosFuturos && agendamentosFuturos.length > 0) {
          return {
            success: false,
            error: `Funcionário possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Cancele-os primeiro.`
          }
        }
      }

      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({ ativo })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setFuncionarios(prev =>
        prev.map(funcionario =>
          funcionario.id === id
            ? { ...funcionario, ativo, updated_at: new Date().toISOString() }
            : funcionario
        )
      )

      return { success: true }
    } catch (err) {
      console.error('Erro ao alterar status do funcionário:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao alterar status do funcionário'
      }
    }
  }, [hasPermission])

  // Função para buscar funcionário por ID
  const getFuncionarioById = useCallback((id: string) => {
    return funcionarios.find(funcionario => funcionario.id === id)
  }, [funcionarios])

  // Buscar funcionários na inicialização
  useEffect(() => {
    if (hasPermission) {
      fetchFuncionarios()
    }
  }, [hasPermission])

  return {
    funcionarios,
    loading,
    error,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario,
    toggleFuncionarioStatus,
    getFuncionarioById,
    refetch: fetchFuncionarios
  }
}
