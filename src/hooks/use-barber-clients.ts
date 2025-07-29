/**
 * Hook para gerenciar clientes específicos do barbeiro
 * Mostra apenas clientes que têm histórico ou agendamentos futuros com o barbeiro
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export interface BarberClient {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar_url?: string
  status: 'ativo' | 'inativo'
  ultimoAgendamento?: string
  proximoAgendamento?: string
  totalAgendamentos: number
  valorTotalGasto: number
  servicoFavorito?: string
  pontosFidelidade: number
  // Dados específicos da relação com o barbeiro
  primeiroAtendimento: string
  frequenciaMedia: number // dias entre agendamentos
  agendamentosCancelados: number
  agendamentosConcluidos: number
}

export interface BarberClientFilters {
  busca?: string
  status?: 'ativo' | 'inativo' | 'all'
  periodo?: 'mes' | 'trimestre' | 'ano' | 'todos'
}

interface UseBarberClientsReturn {
  clientes: BarberClient[]
  loading: boolean
  error: string | null
  filters: BarberClientFilters
  totalClientes: number
  clientesAtivos: number
  clientesInativos: number
  receitaTotal: number

  // Ações
  setFilters: (filters: BarberClientFilters) => void
  clearFilters: () => void
  refetch: () => Promise<void>
  getClientById: (id: string) => BarberClient | undefined
}

export function useBarberClients(): UseBarberClientsReturn {
  const { profile } = useAuth()
  const [clientes, setClientes] = useState<BarberClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<BarberClientFilters>({})

  const fetchBarberClients = useCallback(async () => {
    if (!profile?.id) {
      setError('Barbeiro não identificado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const barbeiroId = profile.id

      // Buscar todos os agendamentos do barbeiro para identificar clientes
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          cliente_id,
          data_agendamento,
          status,
          preco_final,
          created_at,
          cliente:profiles!appointments_cliente_id_fkey(id, nome, email, telefone, avatar_url, ativo),
          service:services!appointments_service_id_fkey(nome, preco)
        `
        )
        .eq('barbeiro_id', barbeiroId)
        .order('data_agendamento', { ascending: false })

      if (agendamentosError) {
        throw agendamentosError
      }

      if (!agendamentos || agendamentos.length === 0) {
        setClientes([])
        setLoading(false)
        return
      }

      // Agrupar agendamentos por cliente
      const clientesMap = new Map<
        string,
        {
          cliente: any
          agendamentos: any[]
        }
      >()

      agendamentos.forEach((apt) => {
        const clienteId = apt.cliente_id
        if (!clienteId || !apt.cliente) return

        if (clientesMap.has(clienteId)) {
          clientesMap.get(clienteId)!.agendamentos.push(apt)
        } else {
          clientesMap.set(clienteId, {
            cliente: apt.cliente,
            agendamentos: [apt],
          })
        }
      })

      // Processar dados de cada cliente
      const clientesProcessados: BarberClient[] = []

      for (const [clienteId, { cliente, agendamentos: agendamentosCliente }] of clientesMap) {
        // Filtrar agendamentos por período se especificado
        let agendamentosFiltrados = agendamentosCliente
        if (filters.periodo && filters.periodo !== 'todos') {
          const dataLimite = getDateLimit(filters.periodo)
          agendamentosFiltrados = agendamentosCliente.filter(
            (apt) => new Date(apt.data_agendamento) >= dataLimite
          )
        }

        // Calcular estatísticas
        const agendamentosConcluidos = agendamentosFiltrados.filter(
          (apt) => apt.status === 'concluido'
        )
        const agendamentosCancelados = agendamentosFiltrados.filter(
          (apt) => apt.status === 'cancelado'
        )
        const agendamentosFuturos = agendamentosFiltrados.filter(
          (apt) => new Date(apt.data_agendamento) > new Date() && apt.status !== 'cancelado'
        )

        // Valor total gasto
        const valorTotalGasto = agendamentosConcluidos.reduce((sum, apt) => {
          const preco = apt.preco_final || apt.service?.preco || 0
          return sum + preco
        }, 0)

        // Último agendamento
        const agendamentosOrdenados = agendamentosFiltrados
          .filter((apt) => apt.status === 'concluido')
          .sort(
            (a, b) =>
              new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime()
          )

        const ultimoAgendamento = agendamentosOrdenados[0]?.data_agendamento

        // Próximo agendamento
        const proximoAgendamento = agendamentosFuturos.sort(
          (a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime()
        )[0]?.data_agendamento

        // Primeiro atendimento
        const primeiroAtendimento = agendamentosCliente.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0]?.created_at

        // Serviço favorito
        const servicosCount: Record<string, number> = {}
        agendamentosConcluidos.forEach((apt) => {
          const servico = apt.service?.nome || 'Não identificado'
          servicosCount[servico] = (servicosCount[servico] || 0) + 1
        })

        const servicoFavorito = Object.entries(servicosCount).sort(([, a], [, b]) => b - a)[0]?.[0]

        // Frequência média (dias entre agendamentos)
        let frequenciaMedia = 0
        if (agendamentosConcluidos.length > 1) {
          const datasAgendamentos = agendamentosConcluidos
            .map((apt) => new Date(apt.data_agendamento))
            .sort((a, b) => a.getTime() - b.getTime())

          const intervalos = []
          for (let i = 1; i < datasAgendamentos.length; i++) {
            const intervalo =
              (datasAgendamentos[i].getTime() - datasAgendamentos[i - 1].getTime()) /
              (1000 * 60 * 60 * 24)
            intervalos.push(intervalo)
          }
          frequenciaMedia = intervalos.reduce((sum, i) => sum + i, 0) / intervalos.length
        }

        // Pontos de fidelidade (baseado no valor gasto)
        const pontosFidelidade = Math.floor(valorTotalGasto / 10) // 1 ponto a cada R$ 10

        // Status do cliente (ativo se teve agendamento nos últimos 90 dias ou tem agendamento futuro)
        const ultimaAtividade = ultimoAgendamento ? new Date(ultimoAgendamento) : null
        const temAgendamentoFuturo = agendamentosFuturos.length > 0
        const diasSemAtividade = ultimaAtividade
          ? (new Date().getTime() - ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24)
          : 999

        const status: 'ativo' | 'inativo' =
          cliente.ativo && (diasSemAtividade <= 90 || temAgendamentoFuturo) ? 'ativo' : 'inativo'

        const clienteProcessado: BarberClient = {
          id: clienteId,
          nome: cliente.nome || 'Nome não informado',
          email: cliente.email || '',
          telefone: cliente.telefone,
          avatar_url: cliente.avatar_url,
          status,
          ultimoAgendamento,
          proximoAgendamento,
          totalAgendamentos: agendamentosFiltrados.length,
          valorTotalGasto,
          servicoFavorito,
          pontosFidelidade,
          primeiroAtendimento,
          frequenciaMedia: Math.round(frequenciaMedia),
          agendamentosCancelados: agendamentosCancelados.length,
          agendamentosConcluidos: agendamentosConcluidos.length,
        }

        clientesProcessados.push(clienteProcessado)
      }

      // Aplicar filtros
      let clientesFiltrados = clientesProcessados

      if (filters.busca) {
        const termo = filters.busca.toLowerCase()
        clientesFiltrados = clientesFiltrados.filter(
          (cliente) =>
            cliente.nome.toLowerCase().includes(termo) ||
            cliente.email.toLowerCase().includes(termo) ||
            (cliente.telefone && cliente.telefone.includes(termo))
        )
      }

      if (filters.status && filters.status !== 'all') {
        clientesFiltrados = clientesFiltrados.filter((cliente) => cliente.status === filters.status)
      }

      // Ordenar por último agendamento (mais recente primeiro)
      clientesFiltrados.sort((a, b) => {
        const dataA = a.ultimoAgendamento ? new Date(a.ultimoAgendamento).getTime() : 0
        const dataB = b.ultimoAgendamento ? new Date(b.ultimoAgendamento).getTime() : 0
        return dataB - dataA
      })

      setClientes(clientesFiltrados)
    } catch (err) {
      // console.error('Erro ao buscar clientes do barbeiro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar clientes')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, filters])

  const getClientById = useCallback(
    (id: string) => {
      return clientes.find((cliente) => cliente.id === id)
    },
    [clientes]
  )

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Estatísticas calculadas
  const totalClientes = clientes.length
  const clientesAtivos = clientes.filter((c) => c.status === 'ativo').length
  const clientesInativos = clientes.filter((c) => c.status === 'inativo').length
  const receitaTotal = clientes.reduce((sum, c) => sum + c.valorTotalGasto, 0)

  // Buscar clientes quando filtros mudarem
  useEffect(() => {
    fetchBarberClients()
  }, [fetchBarberClients])

  return {
    clientes,
    loading,
    error,
    filters,
    totalClientes,
    clientesAtivos,
    clientesInativos,
    receitaTotal,
    setFilters,
    clearFilters,
    refetch: fetchBarberClients,
    getClientById,
  }
}

// Função para calcular data limite baseada no período
function getDateLimit(periodo: string): Date {
  const hoje = new Date()

  switch (periodo) {
    case 'mes':
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    case 'trimestre':
      const trimestreAtual = Math.floor(hoje.getMonth() / 3)
      return new Date(hoje.getFullYear(), trimestreAtual * 3, 1)
    case 'ano':
      return new Date(hoje.getFullYear(), 0, 1)
    default:
      return new Date(0) // Todos os períodos
  }
}
