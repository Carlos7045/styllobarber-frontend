/**
 * Hook para gerenciamento administrativo de clientes
 * Fornece visualização e gestão da base de clientes
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export interface ClienteAdmin {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar_url?: string
  role: string
  ativo: boolean
  data_cadastro: string
  ultimo_agendamento?: string
  total_agendamentos: number
  valor_total_gasto: number
  servicos_favoritos: string[]
  status: 'ativo' | 'inativo' | 'bloqueado'
  // Estatísticas adicionais
  agendamentos_cancelados?: number
  agendamentos_concluidos?: number
  frequencia_media_dias?: number
}

export interface ClienteFilters {
  busca?: string
  status?: 'ativo' | 'inativo' | 'bloqueado' | 'all'
  periodo_cadastro?: {
    inicio: string
    fim: string
  }
  valor_gasto_min?: number
  valor_gasto_max?: number
  servico_favorito?: string
}

export interface UpdateClienteData {
  nome?: string
  telefone?: string
  ativo?: boolean
  observacoes?: string
}

interface UseAdminClientesReturn {
  clientes: ClienteAdmin[]
  loading: boolean
  error: string | null
  filters: ClienteFilters
  totalClientes: number
  clientesAtivos: number
  clientesInativos: number

  // Ações
  updateCliente: (
    id: string,
    data: UpdateClienteData
  ) => Promise<{ success: boolean; error?: string }>
  toggleClienteStatus: (id: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>
  getClienteById: (id: string) => ClienteAdmin | undefined
  getClienteStats: (id: string) => Promise<unknown>
  exportClientes: (
    filtros?: ClienteFilters
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>

  // Filtros
  setFilters: (filters: ClienteFilters) => void
  clearFilters: () => void

  refetch: () => Promise<void>
}

export function useAdminClientes(): UseAdminClientesReturn {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ClienteFilters>({})
  const { hasRole } = useAuth()

  // Verificar se usuário tem permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Função para buscar clientes com estatísticas
  const fetchClientes = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar perfis de clientes
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.busca) {
        query = query.or(
          `nome.ilike.%${filters.busca}%,email.ilike.%${filters.busca}%,telefone.ilike.%${filters.busca}%`
        )
      }

      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'ativo') {
          query = query.eq('ativo', true)
        } else if (filters.status === 'inativo') {
          query = query.eq('ativo', false)
        }
      }

      if (filters.periodo_cadastro) {
        query = query
          .gte('created_at', filters.periodo_cadastro.inicio)
          .lte('created_at', filters.periodo_cadastro.fim)
      }

      const { data: clientesData, error: clientesError } = await query

      if (clientesError) {
        throw clientesError
      }

      // Buscar estatísticas para cada cliente
      const clientesComStats = await Promise.all(
        (clientesData || []).map(async (cliente) => {
          // Buscar agendamentos do cliente
          const { data: agendamentos } = await supabase
            .from('appointments')
            .select(
              `
              id,
              data_agendamento,
              status,
              preco_final,
              service:services(nome, preco)
            `
            )
            .eq('cliente_id', cliente.id)

          const totalAgendamentos = agendamentos?.length || 0
          const agendamentosConcluidos =
            agendamentos?.filter((a) => a.status === 'concluido').length || 0
          const agendamentosCancelados =
            agendamentos?.filter((a) => a.status === 'cancelado').length || 0

          // Calcular valor total gasto
          const valorTotalGasto =
            agendamentos
              ?.filter((a) => a.status === 'concluido')
              .reduce((sum, a) => sum + (a.preco_final || a.service?.preco || 0), 0) || 0

          // Encontrar último agendamento
          const ultimoAgendamento = agendamentos?.sort(
            (a, b) =>
              new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime()
          )[0]

          // Calcular serviços favoritos
          const servicosCount =
            agendamentos?.reduce(
              (acc, a) => {
                if (a.service?.nome) {
                  acc[a.service.nome] = (acc[a.service.nome] || 0) + 1
                }
                return acc
              },
              {} as Record<string, number>
            ) || {}

          const servicosFavoritos = Object.entries(servicosCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([nome]) => nome)

          // Calcular frequência média
          let frequenciaMediaDias = 0
          if (agendamentosConcluidos > 1) {
            const datasAgendamentos =
              agendamentos
                ?.filter((a) => a.status === 'concluido')
                .map((a) => new Date(a.data_agendamento))
                .sort((a, b) => a.getTime() - b.getTime()) || []

            if (datasAgendamentos.length > 1) {
              const intervalos = []
              for (let i = 1; i < datasAgendamentos.length; i++) {
                const intervalo =
                  (datasAgendamentos[i].getTime() - datasAgendamentos[i - 1].getTime()) /
                  (1000 * 60 * 60 * 24)
                intervalos.push(intervalo)
              }
              frequenciaMediaDias = intervalos.reduce((sum, i) => sum + i, 0) / intervalos.length
            }
          }

          // Determinar status
          let status: 'ativo' | 'inativo' | 'bloqueado' = 'ativo'
          if (!cliente.ativo) {
            status = 'inativo'
          }
          // TODO: Implementar lógica para status 'bloqueado' se necessário

          return {
            ...cliente,
            data_cadastro: cliente.created_at,
            ultimo_agendamento: ultimoAgendamento?.data_agendamento,
            total_agendamentos: totalAgendamentos,
            valor_total_gasto: valorTotalGasto,
            servicos_favoritos: servicosFavoritos,
            agendamentos_cancelados: agendamentosCancelados,
            agendamentos_concluidos: agendamentosConcluidos,
            frequencia_media_dias: Math.round(frequenciaMediaDias),
            status,
          }
        })
      )

      // Aplicar filtros adicionais que precisam dos dados calculados
      let clientesFiltrados = clientesComStats

      if (filters.valor_gasto_min !== undefined) {
        clientesFiltrados = clientesFiltrados.filter(
          (c) => c.valor_total_gasto >= filters.valor_gasto_min!
        )
      }

      if (filters.valor_gasto_max !== undefined) {
        clientesFiltrados = clientesFiltrados.filter(
          (c) => c.valor_total_gasto <= filters.valor_gasto_max!
        )
      }

      if (filters.servico_favorito) {
        clientesFiltrados = clientesFiltrados.filter((c) =>
          c.servicos_favoritos.includes(filters.servico_favorito!)
        )
      }

      setClientes(clientesFiltrados)
    } catch (err) {
      // console.error('Erro ao buscar clientes:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar clientes')
    } finally {
      setLoading(false)
    }
  }, [hasPermission, filters])

  // Função para atualizar cliente
  const updateCliente = useCallback(
    async (id: string, data: UpdateClienteData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        const { error: updateError } = await supabase.from('profiles').update(data).eq('id', id)

        if (updateError) {
          throw updateError
        }

        // Atualizar lista local
        setClientes((prev) =>
          prev.map((cliente) => (cliente.id === id ? { ...cliente, ...data } : cliente))
        )

        return { success: true }
      } catch (err) {
        // console.error('Erro ao atualizar cliente:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao atualizar cliente',
        }
      }
    },
    [hasPermission]
  )

  // Função para ativar/desativar cliente
  const toggleClienteStatus = useCallback(
    async (id: string, ativo: boolean) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        if (!ativo) {
          // Verificar se cliente tem agendamentos futuros
          const { data: agendamentosFuturos, error: checkError } = await supabase
            .from('appointments')
            .select('id')
            .eq('cliente_id', id)
            .gte('data_agendamento', new Date().toISOString())
            .neq('status', 'cancelado')

          if (checkError) {
            throw checkError
          }

          if (agendamentosFuturos && agendamentosFuturos.length > 0) {
            return {
              success: false,
              error: `Cliente possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Cancele-os primeiro.`,
            }
          }
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ ativo })
          .eq('id', id)

        if (updateError) {
          throw updateError
        }

        // Atualizar lista local
        setClientes((prev) =>
          prev.map((cliente) =>
            cliente.id === id ? { ...cliente, ativo, status: ativo ? 'ativo' : 'inativo' } : cliente
          )
        )

        return { success: true }
      } catch (err) {
        // console.error('Erro ao alterar status do cliente:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao alterar status do cliente',
        }
      }
    },
    [hasPermission]
  )

  // Função para buscar cliente por ID
  const getClienteById = useCallback(
    (id: string) => {
      return clientes.find((cliente) => cliente.id === id)
    },
    [clientes]
  )

  // Função para buscar estatísticas detalhadas do cliente
  const getClienteStats = useCallback(
    async (id: string) => {
      if (!hasPermission) {
        return null
      }

      try {
        // Buscar todos os agendamentos do cliente
        const { data: agendamentos } = await supabase
          .from('appointments')
          .select(
            `
          *,
          service:services(nome, preco),
          barbeiro:profiles!appointments_barbeiro_id_fkey(nome)
        `
          )
          .eq('cliente_id', id)
          .order('data_agendamento', { ascending: false })

        // Calcular estatísticas detalhadas
        const stats = {
          total_agendamentos: agendamentos?.length || 0,
          agendamentos_concluidos:
            agendamentos?.filter((a) => a.status === 'concluido').length || 0,
          agendamentos_cancelados:
            agendamentos?.filter((a) => a.status === 'cancelado').length || 0,
          valor_total_gasto:
            agendamentos
              ?.filter((a) => a.status === 'concluido')
              .reduce((sum, a) => sum + (a.preco_final || a.service?.preco || 0), 0) || 0,
          servico_mais_usado: null,
          barbeiro_preferido: null,
          historico_agendamentos: agendamentos || [],
        }

        // Encontrar serviço mais usado
        const servicosCount =
          agendamentos?.reduce(
            (acc, a) => {
              if (a.service?.nome) {
                acc[a.service.nome] = (acc[a.service.nome] || 0) + 1
              }
              return acc
            },
            {} as Record<string, number>
          ) || {}

        if (Object.keys(servicosCount).length > 0) {
          stats.servico_mais_usado = Object.entries(servicosCount).sort(
            ([, a], [, b]) => b - a
          )[0][0]
        }

        // Encontrar barbeiro preferido
        const barbeirosCount =
          agendamentos?.reduce(
            (acc, a) => {
              if (a.barbeiro?.nome) {
                acc[a.barbeiro.nome] = (acc[a.barbeiro.nome] || 0) + 1
              }
              return acc
            },
            {} as Record<string, number>
          ) || {}

        if (Object.keys(barbeirosCount).length > 0) {
          stats.barbeiro_preferido = Object.entries(barbeirosCount).sort(
            ([, a], [, b]) => b - a
          )[0][0]
        }

        return stats
      } catch (err) {
        // console.error('Erro ao buscar estatísticas do cliente:', err)
        return null
      }
    },
    [hasPermission]
  )

  // Função para exportar clientes
  const exportClientes = useCallback(
    async (filtros?: ClienteFilters) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        // Buscar dados para exportação (sem aplicar paginação)
        // Nota: filtros podem ser usados no futuro para filtrar dados de exportação
        const clientesParaExport = clientes.map((cliente) => ({
          Nome: cliente.nome,
          Email: cliente.email,
          Telefone: cliente.telefone || '',
          'Data de Cadastro': new Date(cliente.data_cadastro).toLocaleDateString('pt-BR'),
          'Total de Agendamentos': cliente.total_agendamentos,
          'Valor Total Gasto': `R$ ${cliente.valor_total_gasto.toFixed(2)}`,
          'Último Agendamento': cliente.ultimo_agendamento
            ? new Date(cliente.ultimo_agendamento).toLocaleDateString('pt-BR')
            : 'Nunca',
          'Serviços Favoritos': cliente.servicos_favoritos.join(', '),
          'Frequência Média (dias)': cliente.frequencia_media_dias || 'N/A',
          Status: cliente.status,
        }))

        return { success: true, data: clientesParaExport }
      } catch (err) {
        // console.error('Erro ao exportar clientes:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao exportar clientes',
        }
      }
    },
    [hasPermission, clientes, filters]
  )

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Estatísticas calculadas
  const totalClientes = clientes.length
  const clientesAtivos = clientes.filter((c) => c.status === 'ativo').length
  const clientesInativos = clientes.filter((c) => c.status === 'inativo').length

  // Buscar clientes quando filtros mudarem
  useEffect(() => {
    if (hasPermission) {
      fetchClientes()
    }
  }, [hasPermission, filters])

  return {
    clientes,
    loading,
    error,
    filters,
    totalClientes,
    clientesAtivos,
    clientesInativos,
    updateCliente,
    toggleClienteStatus,
    getClienteById,
    getClienteStats,
    exportClientes,
    setFilters,
    clearFilters,
    refetch: fetchClientes,
  }
}
