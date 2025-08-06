// Serviço para cálculo de métricas financeiras
import { supabase } from '@/lib/api/supabase'
import type { 
  MetricasFinanceiras, 
  PerformanceBarbeiro, 
  DateRange,
  TransacaoFinanceira 
} from '../types'
import { 
  formatCurrency, 
  calculateGrowthRate, 
  getMonthRange 
} from '../utils'

export class MetricsService {
  // Buscar métricas financeiras principais
  static async getMetricasFinanceiras(
    periodo: DateRange,
    barbeiroId?: string
  ): Promise<MetricasFinanceiras> {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('status', 'CONFIRMADA')
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)

      if (barbeiroId) {
        query = query.eq('barbeiro_id', barbeiroId)
      }

      const { data: transacoes, error } = await query

      if (error) throw error

      // Calcular métricas
      const receitas = transacoes?.filter(t => t.tipo === 'RECEITA') || []
      const despesas = transacoes?.filter(t => t.tipo === 'DESPESA') || []
      const comissoes = transacoes?.filter(t => t.tipo === 'COMISSAO') || []

      const receitaBruta = receitas.reduce((sum, t) => sum + t.valor, 0)
      const despesasTotal = despesas.reduce((sum, t) => sum + t.valor, 0)
      const comissoesPendentes = comissoes
        .filter(c => c.status === 'PENDENTE')
        .reduce((sum, c) => sum + c.valor, 0)

      const receitaLiquida = receitaBruta - despesasTotal
      const lucroLiquido = receitaLiquida - comissoesPendentes
      const numeroAtendimentos = receitas.length
      const ticketMedio = numeroAtendimentos > 0 ? receitaBruta / numeroAtendimentos : 0

      // Calcular taxa de crescimento comparando com período anterior
      const diasPeriodo = Math.ceil(
        (new Date(periodo.fim).getTime() - new Date(periodo.inicio).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const periodoAnterior: DateRange = {
        inicio: new Date(new Date(periodo.inicio).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        fim: new Date(new Date(periodo.fim).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      }

      const metricasAnteriores = await this.getReceitaBrutaPeriodo(periodoAnterior, barbeiroId)
      const taxaCrescimento = calculateGrowthRate(receitaBruta, metricasAnteriores)

      return {
        receitaBruta,
        receitaLiquida,
        despesasTotal,
        lucroLiquido,
        ticketMedio,
        numeroAtendimentos,
        taxaCrescimento,
        comissoesPendentes
      }
    } catch (error) {
      console.error('Erro ao buscar métricas financeiras:', error)
      throw error
    }
  }

  // Buscar apenas receita bruta de um período (para cálculo de crescimento)
  private static async getReceitaBrutaPeriodo(
    periodo: DateRange,
    barbeiroId?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select('valor')
        .eq('status', 'CONFIRMADA')
        .eq('tipo', 'RECEITA')
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)

      if (barbeiroId) {
        query = query.eq('barbeiro_id', barbeiroId)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.reduce((sum, t) => sum + t.valor, 0) || 0
    } catch (error) {
      console.error('Erro ao buscar receita bruta do período:', error)
      return 0
    }
  }

  // Buscar dados de evolução temporal para gráficos
  static async getEvolucaoTemporal(
    periodo: DateRange,
    barbeiroId?: string
  ): Promise<Array<{
    mes: string
    receitas: number
    despesas: number
    lucro: number
  }>> {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('status', 'CONFIRMADA')
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)
        .order('data_transacao', { ascending: true })

      if (barbeiroId) {
        query = query.eq('barbeiro_id', barbeiroId)
      }

      const { data: transacoes, error } = await query

      if (error) throw error

      // Agrupar por mês
      const dadosPorMes = new Map<string, {
        receitas: number
        despesas: number
        lucro: number
      }>()

      transacoes?.forEach(transacao => {
        const mes = new Date(transacao.data_transacao).toISOString().substring(0, 7) // YYYY-MM
        
        if (!dadosPorMes.has(mes)) {
          dadosPorMes.set(mes, { receitas: 0, despesas: 0, lucro: 0 })
        }

        const dados = dadosPorMes.get(mes)!
        
        if (transacao.tipo === 'RECEITA') {
          dados.receitas += transacao.valor
        } else if (transacao.tipo === 'DESPESA') {
          dados.despesas += transacao.valor
        }
        
        dados.lucro = dados.receitas - dados.despesas
      })

      // Converter para array ordenado
      return Array.from(dadosPorMes.entries())
        .map(([mes, dados]) => ({
          mes,
          ...dados
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes))
    } catch (error) {
      console.error('Erro ao buscar evolução temporal:', error)
      throw error
    }
  }

  // Buscar performance por barbeiro
  static async getPerformanceBarbeiros(
    periodo: DateRange
  ): Promise<PerformanceBarbeiro[]> {
    try {
      const { data, error } = await supabase
        .from('performance_barbeiros')
        .select('*')
        .gte('mes', periodo.inicio.substring(0, 7)) // YYYY-MM
        .lte('mes', periodo.fim.substring(0, 7))
        .order('receita_gerada', { ascending: false })

      if (error) throw error

      return data?.map(item => ({
        barbeiroId: item.barbeiro_id,
        nome: item.nome,
        mes: item.mes,
        receitaGerada: item.receita_gerada || 0,
        comissoesGanhas: item.comissoes_ganhas || 0,
        atendimentosRealizados: item.atendimentos_realizados || 0,
        ticketMedio: item.ticket_medio || 0
      })) || []
    } catch (error) {
      console.error('Erro ao buscar performance dos barbeiros:', error)
      throw error
    }
  }

  // Buscar indicadores de performance
  static async getIndicadoresPerformance(
    periodo: DateRange,
    barbeiroId?: string
  ): Promise<{
    ticketMedio: number
    crescimentoMensal: number
    eficienciaOperacional: number
    margemLucro: number
  }> {
    try {
      const metricas = await this.getMetricasFinanceiras(periodo, barbeiroId)
      
      // Calcular eficiência operacional (receita / despesas)
      const eficienciaOperacional = metricas.despesasTotal > 0 
        ? (metricas.receitaBruta / metricas.despesasTotal) * 100 
        : 100

      // Calcular margem de lucro
      const margemLucro = metricas.receitaBruta > 0 
        ? (metricas.lucroLiquido / metricas.receitaBruta) * 100 
        : 0

      return {
        ticketMedio: metricas.ticketMedio,
        crescimentoMensal: metricas.taxaCrescimento,
        eficienciaOperacional,
        margemLucro
      }
    } catch (error) {
      console.error('Erro ao buscar indicadores de performance:', error)
      throw error
    }
  }

  // Buscar dados para comparativo com períodos anteriores
  static async getComparativoPeriodos(
    periodoAtual: DateRange,
    barbeiroId?: string
  ): Promise<{
    atual: MetricasFinanceiras
    anterior: MetricasFinanceiras
    variacao: {
      receita: number
      despesas: number
      lucro: number
      atendimentos: number
    }
  }> {
    try {
      const diasPeriodo = Math.ceil(
        (new Date(periodoAtual.fim).getTime() - new Date(periodoAtual.inicio).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const periodoAnterior: DateRange = {
        inicio: new Date(new Date(periodoAtual.inicio).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        fim: new Date(new Date(periodoAtual.fim).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      }

      const [atual, anterior] = await Promise.all([
        this.getMetricasFinanceiras(periodoAtual, barbeiroId),
        this.getMetricasFinanceiras(periodoAnterior, barbeiroId)
      ])

      const variacao = {
        receita: calculateGrowthRate(atual.receitaBruta, anterior.receitaBruta),
        despesas: calculateGrowthRate(atual.despesasTotal, anterior.despesasTotal),
        lucro: calculateGrowthRate(atual.lucroLiquido, anterior.lucroLiquido),
        atendimentos: calculateGrowthRate(atual.numeroAtendimentos, anterior.numeroAtendimentos)
      }

      return {
        atual,
        anterior,
        variacao
      }
    } catch (error) {
      console.error('Erro ao buscar comparativo de períodos:', error)
      throw error
    }
  }

  // Buscar lista de barbeiros para filtros
  static async getBarbeiros(): Promise<Array<{ id: string; nome: string }>> {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('tipo', 'BARBEIRO')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error)
      return []
    }
  }
}
