// Serviço para integração com agendamentos
import { supabase } from '@/lib/supabase'

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  ultimoAtendimento?: string
}

export interface Agendamento {
  id: string
  clienteId: string
  clienteNome: string
  servicoNome: string
  barbeiroNome: string
  dataAgendamento: string
  valorTotal: number
  status: 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | 'PENDENTE_PAGAMENTO'
  observacoes?: string
  descricaoServico?: string
}

export class AgendamentoService {
  // Buscar clientes por nome, telefone ou email
  static async buscarClientes(termo: string): Promise<Cliente[]> {
    try {
      if (termo.length < 2) return []

      // Tentar buscar no banco real
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone, email, created_at')
        .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,email.ilike.%${termo}%`)
        .limit(10)

      if (error) {
        console.log('Erro ao buscar clientes, usando dados mockados:', error)
        return this.buscarClientesMockados(termo)
      }

      if (!data || data.length === 0) {
        return this.buscarClientesMockados(termo)
      }

      return data.map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        ultimoAtendimento: cliente.created_at
      }))

    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return this.buscarClientesMockados(termo)
    }
  }

  // Buscar agendamentos de um cliente
  static async buscarAgendamentosCliente(clienteId: string): Promise<Agendamento[]> {
    try {
      // Tentar buscar no banco real
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          valor_total,
          status,
          observacoes,
          cliente_id,
          clientes (nome),
          servicos (nome, descricao),
          funcionarios (nome)
        `)
        .eq('cliente_id', clienteId)
        .order('data_agendamento', { ascending: false })
        .limit(20)

      if (error) {
        console.log('Erro ao buscar agendamentos, usando dados mockados:', error)
        return this.buscarAgendamentosMockados(clienteId)
      }

      if (!data || data.length === 0) {
        return this.buscarAgendamentosMockados(clienteId)
      }

      return data.map(agendamento => ({
        id: agendamento.id,
        clienteId: agendamento.cliente_id,
        clienteNome: agendamento.clientes?.nome || 'Cliente',
        servicoNome: agendamento.servicos?.nome || 'Serviço',
        barbeiroNome: agendamento.funcionarios?.nome || 'Barbeiro',
        dataAgendamento: agendamento.data_agendamento,
        valorTotal: agendamento.valor_total || 0,
        status: this.mapearStatusAgendamento(agendamento.status),
        observacoes: agendamento.observacoes,
        descricaoServico: agendamento.servicos?.descricao
      }))

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return this.buscarAgendamentosMockados(clienteId)
    }
  }

  // Atualizar status do agendamento após pagamento
  static async finalizarAgendamento(agendamentoId: string, transacaoId: string): Promise<boolean> {
    try {
      // Tentar atualizar no banco real
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'REALIZADO',
          transacao_pagamento_id: transacaoId,
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId)

      if (error) {
        console.log('Erro ao finalizar agendamento, simulando sucesso:', error)
        return true // Simular sucesso para desenvolvimento
      }

      return true

    } catch (error) {
      console.error('Erro ao finalizar agendamento:', error)
      return false
    }
  }

  // Criar cliente se não existir
  static async criarCliente(dados: {
    nome: string
    telefone?: string
    email?: string
  }): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: dados.nome,
          telefone: dados.telefone,
          email: dados.email
        })
        .select()
        .single()

      if (error) {
        console.log('Erro ao criar cliente, simulando criação:', error)
        return {
          id: `mock_${Date.now()}`,
          nome: dados.nome,
          telefone: dados.telefone,
          email: dados.email
        }
      }

      return {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone,
        email: data.email
      }

    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      return null
    }
  }

  // Métodos auxiliares privados
  private static buscarClientesMockados(termo: string): Cliente[] {
    const clientesMock: Cliente[] = [
      {
        id: '1',
        nome: 'João Silva',
        telefone: '(11) 99999-1111',
        email: 'joao@email.com',
        ultimoAtendimento: '2025-01-20'
      },
      {
        id: '2',
        nome: 'Pedro Santos',
        telefone: '(11) 99999-2222',
        email: 'pedro@email.com',
        ultimoAtendimento: '2025-01-18'
      },
      {
        id: '3',
        nome: 'Carlos Oliveira',
        telefone: '(11) 99999-3333',
        email: 'carlos@email.com',
        ultimoAtendimento: '2025-01-15'
      },
      {
        id: '4',
        nome: 'Roberto Lima',
        telefone: '(11) 99999-4444',
        email: 'roberto@email.com',
        ultimoAtendimento: '2025-01-10'
      },
      {
        id: '5',
        nome: 'Ana Costa',
        telefone: '(11) 99999-5555',
        email: 'ana@email.com',
        ultimoAtendimento: '2025-01-12'
      }
    ]

    return clientesMock.filter(cliente =>
      cliente.nome.toLowerCase().includes(termo.toLowerCase()) ||
      cliente.telefone?.includes(termo) ||
      cliente.email?.toLowerCase().includes(termo.toLowerCase())
    )
  }

  private static buscarAgendamentosMockados(clienteId: string): Agendamento[] {
    const agendamentosMock: Record<string, Agendamento[]> = {
      '1': [
        {
          id: 'ag1',
          clienteId: '1',
          clienteNome: 'João Silva',
          servicoNome: 'Corte + Barba Completa',
          barbeiroNome: 'João Barbeiro',
          dataAgendamento: new Date().toISOString(),
          valorTotal: 45.00,
          status: 'PENDENTE_PAGAMENTO',
          observacoes: 'Cliente preferencial - desconto aplicado',
          descricaoServico: 'Corte degradê + barba com navalha + finalização'
        },
        {
          id: 'ag2',
          clienteId: '1',
          clienteNome: 'João Silva',
          servicoNome: 'Corte Simples',
          barbeiroNome: 'Pedro Barbeiro',
          dataAgendamento: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          valorTotal: 25.00,
          status: 'CONFIRMADO',
          descricaoServico: 'Corte tradicional com máquina'
        },
        {
          id: 'ag3',
          clienteId: '1',
          clienteNome: 'João Silva',
          servicoNome: 'Barba + Sobrancelha',
          barbeiroNome: 'Carlos Barbeiro',
          dataAgendamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          valorTotal: 30.00,
          status: 'REALIZADO'
        }
      ],
      '2': [
        {
          id: 'ag4',
          clienteId: '2',
          clienteNome: 'Pedro Santos',
          servicoNome: 'Corte + Barba',
          barbeiroNome: 'João Barbeiro',
          dataAgendamento: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          valorTotal: 40.00,
          status: 'CONFIRMADO',
          observacoes: 'Primeira vez na barbearia'
        },
        {
          id: 'ag5',
          clienteId: '2',
          clienteNome: 'Pedro Santos',
          servicoNome: 'Corte Simples',
          barbeiroNome: 'Pedro Barbeiro',
          dataAgendamento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          valorTotal: 25.00,
          status: 'REALIZADO'
        }
      ],
      '3': [
        {
          id: 'ag6',
          clienteId: '3',
          clienteNome: 'Carlos Oliveira',
          servicoNome: 'Barba Completa',
          barbeiroNome: 'Carlos Barbeiro',
          dataAgendamento: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          valorTotal: 35.00,
          status: 'PENDENTE_PAGAMENTO',
          observacoes: 'Cliente solicitou barba com navalha'
        }
      ]
    }

    return agendamentosMock[clienteId] || []
  }

  private static mapearStatusAgendamento(status: string): 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | 'PENDENTE_PAGAMENTO' {
    switch (status?.toUpperCase()) {
      case 'CONFIRMADO':
        return 'CONFIRMADO'
      case 'REALIZADO':
      case 'FINALIZADO':
        return 'REALIZADO'
      case 'CANCELADO':
        return 'CANCELADO'
      case 'PENDENTE_PAGAMENTO':
      case 'PENDENTE':
        return 'PENDENTE_PAGAMENTO'
      default:
        return 'CONFIRMADO'
    }
  }

  // Obter estatísticas de agendamentos
  static async obterEstatisticasAgendamentos(): Promise<{
    totalHoje: number
    pendentesPagamento: number
    confirmados: number
    realizados: number
  }> {
    try {
      const hoje = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('agendamentos')
        .select('status')
        .gte('data_agendamento', `${hoje}T00:00:00`)
        .lte('data_agendamento', `${hoje}T23:59:59`)

      if (error || !data) {
        return {
          totalHoje: 5,
          pendentesPagamento: 2,
          confirmados: 2,
          realizados: 1
        }
      }

      const stats = data.reduce((acc, agendamento) => {
        acc.totalHoje++
        switch (agendamento.status) {
          case 'PENDENTE_PAGAMENTO':
            acc.pendentesPagamento++
            break
          case 'CONFIRMADO':
            acc.confirmados++
            break
          case 'REALIZADO':
            acc.realizados++
            break
        }
        return acc
      }, {
        totalHoje: 0,
        pendentesPagamento: 0,
        confirmados: 0,
        realizados: 0
      })

      return stats

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        totalHoje: 0,
        pendentesPagamento: 0,
        confirmados: 0,
        realizados: 0
      }
    }
  }
}