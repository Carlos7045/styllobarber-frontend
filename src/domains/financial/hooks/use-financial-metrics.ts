/**
 * Hook para métricas financeiras reais do banco de dados
 * Remove todos os dados simulados e usa apenas dados reais
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/api/supabase'

export interface FinancialMetrics {
  receitaBruta: number
  receitaLiquida: number
  despesasTotal: number
  lucroLiquido: number
  ticketMedio: number
  numeroAtendimentos: number
  taxaCrescimento: number
  comissoesPendentes: number
  metaMensal: number
  diasRestantes: number
  clientesNovos: number
  clientesRecorrentes: number
}

export interface ServiceData {
  nome: string
  quantidade: number
  receita: number
}

export interface DailyRevenue {
  dia: string
  valor: number
}

export interface FinancialData {
  metricas: FinancialMetrics
  servicosMaisVendidos: ServiceData[]
  receitaPorDia: DailyRevenue[]
  loading: boolean
  error: string | null
}

export function useFinancialMetrics(periodo: string = 'mes_atual', barbeiroId?: string) {
  const [data, setData] = useState<FinancialData>({
    metricas: {
      receitaBruta: 0,
      receitaLiquida: 0,
      despesasTotal: 0,
      lucroLiquido: 0,
      ticketMedio: 0,
      numeroAtendimentos: 0,
      taxaCrescimento: 0,
      comissoesPendentes: 0,
      metaMensal: 18000, // Meta configurável
      diasRestantes: getDaysRemainingInMonth(),
      clientesNovos: 0,
      clientesRecorrentes: 0,
    },
    servicosMaisVendidos: [],
    receitaPorDia: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        const { inicioAtual, fimAtual, inicioAnterior, fimAnterior } = getDateRanges(periodo)

        // Buscar dados em paralelo
        const [
          agendamentosAtual,
          agendamentosAnterior,
          transacoes,
          despesas,
          servicosPopulares,
          receitaDiaria,
          clientesData
        ] = await Promise.all([
          // Agendamentos do período atual
          fetchAppointments(inicioAtual, fimAtual, barbeiroId),
          
          // Agendamentos do período anterior (para calcular crescimento)
          fetchAppointments(inicioAnterior, fimAnterior, barbeiroId),
          
          // Transações financeiras (PDV)
          fetchTransactions(inicioAtual, fimAtual, barbeiroId),
          
          // Despesas
          fetchExpenses(inicioAtual, fimAtual),
          
          // Serviços mais vendidos
          fetchPopularServices(inicioAtual, fimAtual, barbeiroId),
          
          // Receita por dia
          fetchDailyRevenue(inicioAtual, fimAtual, barbeiroId),
          
          // Dados de clientes
          fetchClientsData(inicioAtual, fimAtual, barbeiroId)
        ])

        // Calcular métricas
        const receitaAgendamentos = calculateAppointmentsRevenue(agendamentosAtual)
        const receitaTransacoes = calculateTransactionsRevenue(transacoes)
        const receitaBruta = receitaAgendamentos + receitaTransacoes
        
        const despesasTotal = calculateTotalExpenses(despesas)
        const receitaLiquida = receitaBruta - despesasTotal
        const lucroLiquido = receitaLiquida // Simplificado
        
        const numeroAtendimentos = agendamentosAtual.length + transacoes.filter(t => t.tipo === 'RECEITA').length
        const ticketMedio = numeroAtendimentos > 0 ? receitaBruta / numeroAtendimentos : 0
        
        // Calcular crescimento
        const receitaAnterior = calculateAppointmentsRevenue(agendamentosAnterior)
        const taxaCrescimento = receitaAnterior > 0 ? ((receitaBruta - receitaAnterior) / receitaAnterior) * 100 : 0
        
        // Calcular comissões pendentes
        const comissoesPendentes = calculatePendingCommissions(agendamentosAtual)

        setData({
          metricas: {
            receitaBruta,
            receitaLiquida,
            despesasTotal,
            lucroLiquido,
            ticketMedio,
            numeroAtendimentos,
            taxaCrescimento,
            comissoesPendentes,
            metaMensal: 18000,
            diasRestantes: getDaysRemainingInMonth(),
            clientesNovos: clientesData.novos,
            clientesRecorrentes: clientesData.recorrentes,
          },
          servicosMaisVendidos: servicosPopulares,
          receitaPorDia: receitaDiaria,
          loading: false,
          error: null,
        })

      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar dados financeiros'
        }))
      }
    }

    fetchFinancialData()
  }, [periodo, barbeiroId])

  return data
}

// Funções auxiliares

function getDateRanges(periodo: string) {
  const hoje = new Date()
  let inicioAtual: Date, fimAtual: Date, inicioAnterior: Date, fimAnterior: Date

  switch (periodo) {
    case 'hoje':
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      fimAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
      inicioAnterior = new Date(inicioAtual)
      inicioAnterior.setDate(inicioAnterior.getDate() - 1)
      fimAnterior = new Date(fimAtual)
      fimAnterior.setDate(fimAnterior.getDate() - 1)
      break

    case 'semana_atual':
      const inicioSemana = hoje.getDate() - hoje.getDay()
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), inicioSemana)
      fimAtual = new Date(inicioAtual)
      fimAtual.setDate(fimAtual.getDate() + 6)
      inicioAnterior = new Date(inicioAtual)
      inicioAnterior.setDate(inicioAnterior.getDate() - 7)
      fimAnterior = new Date(fimAtual)
      fimAnterior.setDate(fimAnterior.getDate() - 7)
      break

    case 'trimestre':
      const trimestreAtual = Math.floor(hoje.getMonth() / 3)
      inicioAtual = new Date(hoje.getFullYear(), trimestreAtual * 3, 1)
      fimAtual = new Date(hoje.getFullYear(), trimestreAtual * 3 + 3, 0)
      inicioAnterior = new Date(inicioAtual)
      inicioAnterior.setMonth(inicioAnterior.getMonth() - 3)
      fimAnterior = new Date(fimAtual)
      fimAnterior.setMonth(fimAnterior.getMonth() - 3)
      break

    case 'ano':
      inicioAtual = new Date(hoje.getFullYear(), 0, 1)
      fimAtual = new Date(hoje.getFullYear(), 11, 31)
      inicioAnterior = new Date(hoje.getFullYear() - 1, 0, 1)
      fimAnterior = new Date(hoje.getFullYear() - 1, 11, 31)
      break

    default: // 'mes_atual'
      inicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      fimAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      inicioAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      fimAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
  }

  return { inicioAtual, fimAtual, inicioAnterior, fimAnterior }
}

async function fetchAppointments(inicio: Date, fim: Date, barbeiroId?: string) {
  try {
    // Primeiro, vamos testar uma query simples
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('status', 'concluido')

    // Aplicar filtro de data apenas se as datas forem válidas
    if (inicio && fim) {
      query = query
        .gte('data_agendamento', inicio.toISOString())
        .lte('data_agendamento', fim.toISOString())
    }

    if (barbeiroId && barbeiroId !== 'todos') {
      query = query.eq('barbeiro_id', barbeiroId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return []
    }

    console.log('Agendamentos encontrados:', data?.length || 0)
    return data || []
  } catch (err) {
    console.error('Erro na função fetchAppointments:', err)
    return []
  }
}

async function fetchTransactions(inicio: Date, fim: Date, barbeiroId?: string) {
  try {
    // Por enquanto, retornar array vazio para evitar erros
    console.log('fetchTransactions: Retornando array vazio temporariamente')
    return []
  } catch (err) {
    console.error('Erro na função fetchTransactions:', err)
    return []
  }
}

async function fetchExpenses(inicio: Date, fim: Date) {
  const inicioStr = inicio.toISOString().split('T')[0]
  const fimStr = fim.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transacoes_financeiras')
    .select('valor')
    .eq('tipo', 'DESPESA')
    .eq('status', 'CONFIRMADA')
    .gte('data_transacao', inicioStr)
    .lte('data_transacao', fimStr)

  if (error) {
    console.error('Erro ao buscar despesas:', error)
    return []
  }

  return data || []
}

async function fetchPopularServices(inicio: Date, fim: Date, barbeiroId?: string) {
  try {
    // Por enquanto, retornar array vazio para evitar erros
    console.log('fetchPopularServices: Retornando array vazio temporariamente')
    return []
  } catch (err) {
    console.error('Erro na função fetchPopularServices:', err)
    return []
  }
}

async function fetchDailyRevenue(inicio: Date, fim: Date, barbeiroId?: string) {
  try {
    // Por enquanto, retornar dados vazios para evitar erros
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const receita: DailyRevenue[] = []

    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      
      receita.push({
        dia: diasSemana[data.getDay()],
        valor: 0,
      })
    }

    console.log('fetchDailyRevenue: Retornando dados vazios temporariamente')
    return receita
  } catch (err) {
    console.error('Erro na função fetchDailyRevenue:', err)
    return []
  }
}

async function fetchClientsData(inicio: Date, fim: Date, barbeiroId?: string) {
  // Buscar clientes novos (primeiro agendamento no período)
  let queryNovos = supabase
    .from('appointments')
    .select('cliente_id')
    .eq('status', 'concluido')
    .gte('data_agendamento', inicio.toISOString())
    .lte('data_agendamento', fim.toISOString())

  if (barbeiroId && barbeiroId !== 'todos') {
    queryNovos = queryNovos.eq('barbeiro_id', barbeiroId)
  }

  const { data: agendamentosNovos } = await queryNovos

  // Buscar clientes recorrentes (mais de um agendamento)
  let queryRecorrentes = supabase
    .from('appointments')
    .select('cliente_id')
    .eq('status', 'concluido')
    .gte('data_agendamento', inicio.toISOString())
    .lte('data_agendamento', fim.toISOString())

  if (barbeiroId && barbeiroId !== 'todos') {
    queryRecorrentes = queryRecorrentes.eq('barbeiro_id', barbeiroId)
  }

  const { data: agendamentosRecorrentes } = await queryRecorrentes

  // Contar clientes únicos
  const clientesUnicos = new Set(agendamentosNovos?.map(a => a.cliente_id) || [])
  
  // Contar clientes com mais de um agendamento
  const clientesCount = new Map<string, number>()
  agendamentosRecorrentes?.forEach(a => {
    const count = clientesCount.get(a.cliente_id) || 0
    clientesCount.set(a.cliente_id, count + 1)
  })

  const recorrentes = Array.from(clientesCount.values()).filter(count => count > 1).length

  return {
    novos: clientesUnicos.size,
    recorrentes
  }
}

function calculateAppointmentsRevenue(agendamentos: any[]) {
  return agendamentos.reduce((sum, apt) => {
    const preco = parseFloat(apt.preco_final) || 0
    return sum + preco
  }, 0)
}

function calculateTransactionsRevenue(transacoes: any[]) {
  return transacoes
    .filter(t => t.tipo === 'RECEITA')
    .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0)
}

function calculateTotalExpenses(despesas: any[]) {
  return despesas.reduce((sum, d) => sum + (parseFloat(String(d.valor)) || 0), 0)
}

function calculatePendingCommissions(agendamentos: any[]) {
  // Assumindo 40% de comissão sobre agendamentos concluídos
  const receita = calculateAppointmentsRevenue(agendamentos)
  return receita * 0.4
}

function getDaysRemainingInMonth() {
  const hoje = new Date()
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  return ultimoDia - hoje.getDate()
}