/**
 * Hook para dados financeiros específicos do barbeiro
 * Filtra apenas transações e dados relacionados ao barbeiro logado
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/api/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'

export interface BarberFinancialMetrics {
  receitaGerada: number
  comissaoAcumulada: number
  clientesAtendidos: number
  servicosRealizados: number
  ticketMedio: number
  metaMensal: number
  progressoMeta: number
}

export interface BarberEvolutionData {
  dia: string
  receita: number
  comissao: number
  clientes: number
}

export interface BarberServiceData {
  nome: string
  quantidade: number
  receita: number
}

export interface BarberAppointmentData {
  cliente: string
  servico: string
  horario: string
  valor: number
  data: string
}

export interface BarberFinancialData {
  metricas: BarberFinancialMetrics
  evolucaoSemanal: BarberEvolutionData[]
  servicosPopulares: BarberServiceData[]
  proximosAgendamentos: BarberAppointmentData[]
  loading: boolean
  error: string | null
}

export function useBarberFinancialData(periodo: string = 'mes') {
  const { profile } = useAuth()
  const [data, setData] = useState<BarberFinancialData>({
    metricas: {
      receitaGerada: 0,
      comissaoAcumulada: 0,
      clientesAtendidos: 0,
      servicosRealizados: 0,
      ticketMedio: 0,
      metaMensal: 5000,
      progressoMeta: 0,
    },
    evolucaoSemanal: [],
    servicosPopulares: [],
    proximosAgendamentos: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!profile?.id) return

    const fetchBarberFinancialData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }))

        const barbeiroId = profile.id
        const { inicioAtual, fimAtual } = getDateRanges(periodo)

        // Buscar dados em paralelo
        const [
          agendamentosResult,
          transacoesResult,
          evolucaoResult,
          servicosResult,
          proximosResult,
        ] = await Promise.all([
          // Agendamentos do barbeiro no período
          supabase
            .from('appointments')
            .select(
              `
              id,
              preco_final,
              data_agendamento,
              status,
              cliente:profiles!appointments_cliente_id_fkey(nome),
              service:services!appointments_service_id_fkey(nome, preco)
            `
            )
            .eq('barbeiro_id', barbeiroId)
            .eq('status', 'concluido')
            .gte('data_agendamento', inicioAtual.toISOString())
            .lte('data_agendamento', fimAtual.toISOString()),

          // Transações financeiras do barbeiro (PDV)
          supabase
            .from('transacoes_financeiras')
            .select('tipo, valor, data_transacao, descricao')
            .eq('barbeiro_id', barbeiroId)
            .eq('status', 'CONFIRMADA')
            .gte('data_transacao', inicioAtual.toISOString().split('T')[0])
            .lte('data_transacao', fimAtual.toISOString().split('T')[0]),

          // Evolução semanal
          getBarberWeeklyEvolution(barbeiroId),

          // Serviços mais realizados
          getBarberPopularServices(barbeiroId, inicioAtual, fimAtual),

          // Próximos agendamentos
          getBarberUpcomingAppointments(barbeiroId),
        ])

        // Processar dados dos agendamentos
        const agendamentos = agendamentosResult.data || []
        const transacoes = transacoesResult.data || []

        // Calcular receita dos agendamentos
        const receitaAgendamentos = agendamentos.reduce((sum, apt) => {
          const preco = apt.preco_final || apt.service?.[0]?.preco || 0
          return sum + preco
        }, 0)

        // Calcular receita das transações PDV
        const receitaTransacoes = transacoes
          .filter((t) => t.tipo === 'RECEITA')
          .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0)

        // Receita total gerada pelo barbeiro
        const receitaGerada = receitaAgendamentos + receitaTransacoes

        // Calcular comissão (assumindo 40% da receita)
        const comissaoAcumulada = receitaGerada * 0.4

        // Clientes únicos atendidos
        const clientesUnicos = new Set(agendamentos.map((apt) => apt.cliente?.[0]?.nome).filter(Boolean))
        const clientesAtendidos = clientesUnicos.size

        // Total de serviços realizados
        const servicosRealizados =
          agendamentos.length + transacoes.filter((t) => t.tipo === 'RECEITA').length

        // Ticket médio
        const ticketMedio = servicosRealizados > 0 ? receitaGerada / servicosRealizados : 0

        // Progresso da meta
        const metaMensal = 5000 // Pode ser configurável no futuro
        const progressoMeta = (receitaGerada / metaMensal) * 100

        setData({
          metricas: {
            receitaGerada,
            comissaoAcumulada,
            clientesAtendidos,
            servicosRealizados,
            ticketMedio,
            metaMensal,
            progressoMeta: Math.min(progressoMeta, 100),
          },
          evolucaoSemanal: evolucaoResult,
          servicosPopulares: servicosResult,
          proximosAgendamentos: proximosResult,
          loading: false,
          error: null,
        })
      } catch (error) {
        // console.error('Erro ao buscar dados financeiros do barbeiro:', error)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar dados financeiros',
        }))
      }
    }

    fetchBarberFinancialData()
  }, [profile?.id, periodo])

  return data
}

// Função para calcular intervalos de datas
function getDateRanges(periodo: string) {
  const hoje = new Date()
  let inicioAtual: Date, fimAtual: Date

  switch (periodo) {
    case 'hoje':
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      fimAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
      break

    case 'semana':
      const inicioSemana = hoje.getDate() - hoje.getDay()
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), inicioSemana)
      fimAtual = new Date(inicioAtual)
      fimAtual.setDate(fimAtual.getDate() + 6)
      break

    case 'trimestre':
      const trimestreAtual = Math.floor(hoje.getMonth() / 3)
      inicioAtual = new Date(hoje.getFullYear(), trimestreAtual * 3, 1)
      fimAtual = new Date(hoje.getFullYear(), trimestreAtual * 3 + 3, 0)
      break

    case 'ano':
      inicioAtual = new Date(hoje.getFullYear(), 0, 1)
      fimAtual = new Date(hoje.getFullYear(), 11, 31)
      break

    default: // 'mes'
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      fimAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  }

  return { inicioAtual, fimAtual }
}

// Função para buscar evolução semanal do barbeiro
async function getBarberWeeklyEvolution(barbeiroId: string): Promise<BarberEvolutionData[]> {
  try {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const evolucao: BarberEvolutionData[] = []

    // Buscar dados dos últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      const diaStr = data.toISOString().split('T')[0]
      const inicioDay = `${diaStr}T00:00:00`
      const fimDay = `${diaStr}T23:59:59`

      const [agendamentosResult, transacoesResult] = await Promise.all([
        supabase
          .from('appointments')
          .select(
            `
            preco_final,
            cliente:profiles!appointments_cliente_id_fkey(nome),
            service:services!appointments_service_id_fkey(preco)
          `
          )
          .eq('barbeiro_id', barbeiroId)
          .eq('status', 'concluido')
          .gte('data_agendamento', inicioDay)
          .lte('data_agendamento', fimDay),

        supabase
          .from('transacoes_financeiras')
          .select('tipo, valor')
          .eq('barbeiro_id', barbeiroId)
          .eq('status', 'CONFIRMADA')
          .eq('data_transacao', diaStr),
      ])

      const agendamentos = agendamentosResult.data || []
      const transacoes = transacoesResult.data || []

      // Calcular receita dos agendamentos
      const receitaAgendamentos = agendamentos.reduce((sum, apt) => {
        const preco = apt.preco_final || apt.service?.[0]?.preco || 0
        return sum + preco
      }, 0)

      // Calcular receita das transações
      const receitaTransacoes = transacoes
        .filter((t) => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0)

      const receita = receitaAgendamentos + receitaTransacoes
      const comissao = receita * 0.4 // 40% de comissão

      // Contar clientes únicos
      const clientesUnicos = new Set(agendamentos.map((apt) => apt.cliente?.nome).filter(Boolean))

      evolucao.push({
        dia: diasSemana[data.getDay()],
        receita,
        comissao,
        clientes: clientesUnicos.size,
      })
    }

    return evolucao
  } catch (error) {
    // console.error('Erro ao buscar evolução semanal do barbeiro:', error)
    return []
  }
}

// Função para buscar serviços mais populares do barbeiro
async function getBarberPopularServices(
  barbeiroId: string,
  inicio: Date,
  fim: Date
): Promise<BarberServiceData[]> {
  try {
    const { data: agendamentos } = await supabase
      .from('appointments')
      .select(
        `
        preco_final,
        service:services!appointments_service_id_fkey(nome, preco)
      `
      )
      .eq('barbeiro_id', barbeiroId)
      .eq('status', 'concluido')
      .gte('data_agendamento', inicio.toISOString())
      .lte('data_agendamento', fim.toISOString())

    if (!agendamentos) return []

    // Agrupar por serviço
    const servicosMap = new Map<string, { quantidade: number; receita: number }>()

    agendamentos.forEach((apt) => {
      const nomeServico = apt.service?.[0]?.nome || 'Serviço não identificado'
      const preco = apt.preco_final || apt.service?.[0]?.preco || 0

      if (servicosMap.has(nomeServico)) {
        const existing = servicosMap.get(nomeServico)!
        existing.quantidade += 1
        existing.receita += preco
      } else {
        servicosMap.set(nomeServico, { quantidade: 1, receita: preco })
      }
    })

    // Converter para array e ordenar por quantidade
    return Array.from(servicosMap.entries())
      .map(([nome, data]) => ({
        nome,
        quantidade: data.quantidade,
        receita: data.receita,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 4) // Top 4 serviços
  } catch (error) {
    // console.error('Erro ao buscar serviços populares do barbeiro:', error)
    return []
  }
}

// Função para buscar próximos agendamentos do barbeiro
async function getBarberUpcomingAppointments(barbeiroId: string): Promise<BarberAppointmentData[]> {
  try {
    const hoje = new Date().toISOString().split('T')[0]

    const { data: agendamentos } = await supabase
      .from('appointments')
      .select(
        `
        data_agendamento,
        preco_final,
        cliente:profiles!appointments_cliente_id_fkey(nome),
        service:services!appointments_service_id_fkey(nome, preco)
      `
      )
      .eq('barbeiro_id', barbeiroId)
      .gte('data_agendamento', `${hoje}T00:00:00`)
      .neq('status', 'cancelado')
      .order('data_agendamento', { ascending: true })
      .limit(5)

    if (!agendamentos) return []

    return agendamentos.map((apt) => ({
      cliente: apt.cliente?.[0]?.nome || 'Cliente não identificado',
      servico: apt.service?.[0]?.nome || 'Serviço não identificado',
      horario: new Date(apt.data_agendamento).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      valor: apt.preco_final || apt.service?.[0]?.preco || 0,
      data: apt.data_agendamento,
    }))
  } catch (error) {
    // console.error('Erro ao buscar próximos agendamentos do barbeiro:', error)
    return []
  }
}
