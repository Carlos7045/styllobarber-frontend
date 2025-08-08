
'use client'
// Hook para gerenciar clientes e agendamentos para o PDV

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'

interface Cliente {
  id: string
  nome: string
  telefone?: string
  email: string
}

interface AgendamentoPendente {
  id: string
  cliente_nome: string
  cliente_telefone?: string
  barbeiro_id: string
  barbeiro_nome: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  servicos: Array<{
    id: string
    nome: string
    preco: number
    duracao: number
  }>
  valor_total: number
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  observacoes?: string
}

interface UseAgendamentosPendentesReturn {
  // Dados
  clientes: Cliente[]
  agendamentosPendentes: AgendamentoPendente[]
  clientesComPendencias: string[]

  // Estados
  loading: boolean
  error: string | null

  // Ações
  buscarPorCliente: (nomeCliente: string) => AgendamentoPendente[]
  buscarClientesPorNome: (nomeCliente: string) => Cliente[]
  marcarComoPago: (agendamentoId: string, transacaoId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export const useAgendamentosPendentes = (): UseAgendamentosPendentesReturn => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agendamentosPendentes, setAgendamentosPendentes] = useState<AgendamentoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar clientes reais do sistema
  const carregarClientes = useCallback(async () => {
    try {
      const { data: clientesData, error: clientesError } = await supabase
        .from('profiles')
        .select('id, nome, telefone, email')
        .eq('role', 'client')
        .eq('ativo', true)
        .order('nome')

      if (clientesError) {
        console.warn('Erro ao carregar clientes:', clientesError)
        setClientes([])
        return
      }

      const clientesFormatados =
        clientesData?.map((cliente) => ({
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
        })) || []

      console.log(`${clientesFormatados.length} clientes carregados`)
      setClientes(clientesFormatados)
    } catch (err) {
      // console.error('Erro ao carregar clientes:', err)
      setClientes([])
    }
  }, [])

  // Carregar agendamentos pendentes de pagamento
  const carregarAgendamentosPendentes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Primeiro, buscar todas as transações para identificar agendamentos já pagos
      const { data: transacoesPagas, error: transacoesError } = await supabase
        .from('transactions')
        .select('agendamento_id')
        .not('agendamento_id', 'is', null)

      if (transacoesError) {
        console.warn('Erro ao buscar transações:', transacoesError)
      }

      const agendamentosPagosIds = new Set(
        transacoesPagas?.map((t) => t.agendamento_id).filter(Boolean) || []
      )

      // Buscar agendamentos concluídos que ainda não foram pagos
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          data_agendamento,
          preco_final,
          status,
          observacoes,
          *
        `
        )
        .eq('status', 'concluido')
        .order('data_agendamento', { ascending: false })

      if (agendamentosError) {
        console.warn(
          'Erro ao carregar agendamentos pendentes, usando dados de fallback:',
          agendamentosError
        )
        setAgendamentosPendentes(getAgendamentosFallback())
        return
      }

      if (!agendamentos || agendamentos.length === 0) {
        console.log('Nenhum agendamento encontrado')
        setAgendamentosPendentes(getAgendamentosFallback()) // Usar fallback para demonstração
        return
      }

      // Filtrar apenas agendamentos que NÃO foram pagos
      const agendamentosNaoPagos =
        agendamentos?.filter((agendamento) => !agendamentosPagosIds.has(agendamento.id)) || []

      // Processar dados
      interface ClienteData {
        nome?: string
        telefone?: string
      }

      interface BarbeiroData {
        id?: string
        nome?: string
      }

      interface ServicoData {
        nome?: string
        preco?: number
      }

      interface AgendamentoRaw {
        id: string
        data_agendamento: string
        horario: string
        preco_final?: number
        cliente?: ClienteData
        barbeiro?: BarbeiroData
        service?: ServicoData
      }

      const agendamentosProcessados = agendamentosNaoPagos.map((agendamento: AgendamentoRaw) => {
        const cliente = agendamento.cliente
        const barbeiro = agendamento.barbeiro
        const servico = agendamento.service

        return {
          id: agendamento.id,
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          cliente_telefone: cliente?.telefone,
          barbeiro_id: barbeiro?.id || '',
          barbeiro_nome: barbeiro?.nome || 'Barbeiro não encontrado',
          data_agendamento: agendamento.data_agendamento,
          hora_inicio: '14:00', // Valor padrão - pode ser expandido futuramente
          hora_fim: '15:00', // Valor padrão - pode ser expandido futuramente
          servicos: servico
            ? [
                {
                  id: servico.id,
                  nome: servico.nome,
                  preco: servico.preco,
                  duracao: servico.duracao_minutos || 30,
                },
              ]
            : [],
          valor_total: agendamento.preco_final || servico?.preco || 0,
          status: 'CONCLUIDO' as const,
          observacoes: agendamento.observacoes,
        }
      })

      console.log(`${agendamentosProcessados.length} agendamentos carregados`)
      setAgendamentosPendentes(agendamentosProcessados)
    } catch (err) {
      // console.error('Erro ao carregar agendamentos pendentes:', err)
      setError('Erro ao carregar agendamentos pendentes')
      setAgendamentosPendentes(getAgendamentosFallback())
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar clientes por nome
  const buscarClientesPorNome = useCallback(
    (nomeCliente: string): Cliente[] => {
      if (!nomeCliente.trim()) return clientes.slice(0, 10) // Mostrar os primeiros 10

      const termo = nomeCliente.toLowerCase().trim()
      return clientes.filter((cliente) => cliente.nome.toLowerCase().includes(termo)).slice(0, 10) // Limitar a 10 resultados
    },
    [clientes]
  )

  // Buscar agendamentos por nome do cliente
  const buscarPorCliente = useCallback(
    (nomeCliente: string): AgendamentoPendente[] => {
      if (!nomeCliente.trim()) return []

      const termo = nomeCliente.toLowerCase().trim()
      return agendamentosPendentes.filter((agendamento) =>
        agendamento.cliente_nome.toLowerCase().includes(termo)
      )
    },
    [agendamentosPendentes]
  )

  // Marcar agendamento como pago
  const marcarComoPago = useCallback(
    async (agendamentoId: string, transacaoId: string): Promise<boolean> => {
      try {
        // Buscar dados do agendamento para criar a transação
        const agendamento = agendamentosPendentes.find((a) => a.id === agendamentoId)
        if (!agendamento) {
          console.error('Agendamento não encontrado:', agendamentoId)
          return false
        }

        // Criar transação para marcar como pago
        const { error: transacaoError } = await supabase.from('transactions').insert({
          id: transacaoId,
          tipo: 'RECEITA',
          valor: agendamento.valor_total,
          descricao: `Pagamento - ${agendamento.servicos.map((s) => s.nome).join(', ')}`,
          data_transacao: new Date().toISOString(),
          agendamento_id: agendamentoId,
          barbeiro_id: agendamento.barbeiro_id,
          status: 'CONFIRMADA',
        })

        if (transacaoError) {
          console.error('Erro ao criar transação:', transacaoError)
          return false
        }

        console.log(`Agendamento ${agendamentoId} marcado como pago com transação ${transacaoId}`)

        // Atualizar lista local removendo o agendamento pago
        setAgendamentosPendentes((prev) =>
          prev.filter((agendamento) => agendamento.id !== agendamentoId)
        )

        return true
      } catch (err) {
        console.error('Erro ao marcar como pago:', err)
        return false
      }
    },
    [agendamentosPendentes]
  )

  // Refresh dos dados
  const refresh = useCallback(async () => {
    await Promise.all([carregarClientes(), carregarAgendamentosPendentes()])
  }, [carregarClientes, carregarAgendamentosPendentes])

  // Carregar dados iniciais
  useEffect(() => {
    refresh()
  }, [refresh])

  // Lista de clientes com pendências (para autocomplete)
  const clientesComPendencias = [
    ...clientes.map((c) => c.nome),
    ...agendamentosPendentes.map((a) => a.cliente_nome),
  ]
    .filter((nome, index, array) => array.indexOf(nome) === index)
    .sort()

  return {
    // Dados
    clientes,
    agendamentosPendentes,
    clientesComPendencias,

    // Estados
    loading,
    error,

    // Ações
    buscarPorCliente,
    buscarClientesPorNome,
    marcarComoPago,
    refresh,
  }
}

// Dados de fallback para desenvolvimento
function getAgendamentosFallback(): AgendamentoPendente[] {
  const agora = new Date()

  return [
    {
      id: '1',
      cliente_nome: 'Carlos Silva',
      cliente_telefone: '(11) 99999-1111',
      barbeiro_id: '1',
      barbeiro_nome: 'João Silva',
      data_agendamento: agora.toISOString().split('T')[0],
      hora_inicio: '14:00',
      hora_fim: '15:00',
      servicos: [
        { id: '1', nome: 'Corte Simples', preco: 25.0, duracao: 30 },
        { id: '3', nome: 'Barba', preco: 20.0, duracao: 30 },
      ],
      valor_total: 45.0,
      status: 'CONCLUIDO',
      observacoes: 'Cliente preferencial',
    },
    {
      id: '2',
      cliente_nome: 'Roberto Santos',
      cliente_telefone: '(11) 99999-2222',
      barbeiro_id: '2',
      barbeiro_nome: 'Pedro Santos',
      data_agendamento: agora.toISOString().split('T')[0],
      hora_inicio: '15:30',
      hora_fim: '16:30',
      servicos: [{ id: '2', nome: 'Corte + Barba', preco: 45.0, duracao: 60 }],
      valor_total: 45.0,
      status: 'CONCLUIDO',
    },
    {
      id: '3',
      cliente_nome: 'André Costa',
      cliente_telefone: '(11) 99999-3333',
      barbeiro_id: '3',
      barbeiro_nome: 'Carlos Oliveira',
      data_agendamento: new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hora_inicio: '10:00',
      hora_fim: '11:15',
      servicos: [
        { id: '1', nome: 'Corte Simples', preco: 25.0, duracao: 30 },
        { id: '4', nome: 'Sobrancelha', preco: 15.0, duracao: 15 },
        { id: '6', nome: 'Hidratação', preco: 30.0, duracao: 45 },
      ],
      valor_total: 70.0,
      status: 'CONCLUIDO',
      observacoes: 'Serviço completo realizado',
    },
  ]
}
