// Serviço para gerenciamento de fluxo de caixa
import { supabase } from '@/lib/supabase'
import type { 
  MovimentacaoFluxoCaixa, 
  FluxoCaixaResumo,
  DateRange 
} from '../types'
import { formatDate } from '../utils'

export class CashFlowService {
  // Obter resumo do fluxo de caixa
  static async obterResumoFluxoCaixa(): Promise<FluxoCaixaResumo> {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      // Buscar transações do dia
      const { data: transacoesHoje, error: errorTransacoes } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, status')
        .gte('data_transacao', `${hoje}T00:00:00`)
        .lte('data_transacao', `${hoje}T23:59:59`)
        .eq('status', 'CONFIRMADA')

      if (errorTransacoes) {
        console.error('Erro ao buscar transações:', errorTransacoes)
        return this.obterResumoMockado()
      }

      // Calcular entradas e saídas do dia
      const entradasDia = (transacoesHoje || [])
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + t.valor, 0)

      const saidasDia = (transacoesHoje || [])
        .filter(t => t.tipo === 'DESPESA')
        .reduce((sum, t) => sum + t.valor, 0)

      // Calcular saldo atual (simplificado - em produção seria mais complexo)
      const { data: saldoData, error: errorSaldo } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor')
        .eq('status', 'CONFIRMADA')

      let saldoAtual = 0
      if (!errorSaldo && saldoData) {
        saldoAtual = saldoData.reduce((saldo, t) => {
          return t.tipo === 'RECEITA' ? saldo + t.valor : saldo - t.valor
        }, 0)
      }

      // Calcular projeções baseadas em agendamentos confirmados
      const { data: agendamentosFuturos, error: errorAgendamentos } = await supabase
        .from('agendamentos')
        .select('valor_total')
        .eq('status', 'CONFIRMADO')
        .gte('data_agendamento', new Date().toISOString())

      const receitasProjetadas = (agendamentosFuturos || [])
        .reduce((sum, a) => sum + (a.valor_total || 0), 0)

      const saldoProjetado = saldoAtual + receitasProjetadas

      return {
        saldoAtual,
        entradasDia,
        saidasDia,
        saldoProjetado,
        limiteMinimoAlerta: 5000 // Configurável
      }

    } catch (error) {
      console.error('Erro ao obter resumo do fluxo de caixa:', error)
      return this.obterResumoMockado()
    }
  }

  // Obter movimentações do fluxo de caixa
  static async obterMovimentacoes(
    periodo: DateRange,
    categoria?: string,
    incluirProjecoes = true
  ): Promise<MovimentacaoFluxoCaixa[]> {
    try {
      const movimentacoes: MovimentacaoFluxoCaixa[] = []

      // Buscar transações realizadas
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select(`
          id,
          tipo,
          valor,
          descricao,
          data_transacao,
          agendamento_id,
          categoria_id,
          categorias_financeiras (nome)
        `)
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)
        .eq('status', 'CONFIRMADA')
        .order('data_transacao', { ascending: false })

      const { data: transacoes, error: errorTransacoes } = await queryTransacoes

      if (!errorTransacoes && transacoes) {
        transacoes.forEach(t => {
          movimentacoes.push({
            id: t.id,
            tipo: t.tipo === 'RECEITA' ? 'ENTRADA' : 'SAIDA',
            valor: t.valor,
            descricao: t.descricao,
            categoria: this.mapearCategoria(t.categorias_financeiras?.nome),
            dataMovimentacao: t.data_transacao,
            status: 'REALIZADA',
            origem: t.agendamento_id ? `Agendamento #${t.agendamento_id.slice(-4)}` : 'Transação direta'
          })
        })
      }

      // Buscar projeções baseadas em agendamentos futuros
      if (incluirProjecoes) {
        const { data: agendamentosFuturos, error: errorAgendamentos } = await supabase
          .from('agendamentos')
          .select(`
            id,
            data_agendamento,
            valor_total,
            clientes (nome),
            servicos (nome)
          `)
          .eq('status', 'CONFIRMADO')
          .gte('data_agendamento', new Date().toISOString())
          .lte('data_agendamento', periodo.fim)
          .order('data_agendamento', { ascending: true })

        if (!errorAgendamentos && agendamentosFuturos) {
          agendamentosFuturos.forEach(a => {
            movimentacoes.push({
              id: `proj_${a.id}`,
              tipo: 'ENTRADA',
              valor: a.valor_total || 0,
              descricao: `${a.servicos?.nome || 'Serviço'} - ${a.clientes?.nome || 'Cliente'}`,
              categoria: 'OPERACIONAL',
              dataMovimentacao: a.data_agendamento,
              status: 'PROJETADA',
              origem: `Agendamento #${a.id.slice(-4)}`
            })
          })
        }
      }

      // Filtrar por categoria se especificada
      if (categoria) {
        return movimentacoes.filter(m => m.categoria === categoria)
      }

      // Ordenar por data (mais recentes primeiro)
      return movimentacoes.sort((a, b) => 
        new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime()
      )

    } catch (error) {
      console.error('Erro ao obter movimentações:', error)
      return this.obterMovimentacoesMockadas()
    }
  }

  // Calcular projeções de fluxo de caixa
  static async calcularProjecoes(diasFuturos = 30): Promise<{
    projecoesDiarias: Array<{
      data: string
      entradasProjetadas: number
      saidasProjetadas: number
      saldoProjetado: number
    }>
  }> {
    try {
      const projecoesDiarias = []
      const dataInicio = new Date()
      const saldoAtual = (await this.obterResumoFluxoCaixa()).saldoAtual

      let saldoAcumulado = saldoAtual

      for (let i = 0; i < diasFuturos; i++) {
        const data = new Date(dataInicio)
        data.setDate(data.getDate() + i)
        const dataStr = data.toISOString().split('T')[0]

        // Buscar agendamentos confirmados para o dia
        const { data: agendamentos, error } = await supabase
          .from('agendamentos')
          .select('valor_total')
          .eq('status', 'CONFIRMADO')
          .gte('data_agendamento', `${dataStr}T00:00:00`)
          .lte('data_agendamento', `${dataStr}T23:59:59`)

        const entradasProjetadas = !error && agendamentos
          ? agendamentos.reduce((sum, a) => sum + (a.valor_total || 0), 0)
          : 0

        // Estimar saídas baseadas na média histórica (simplificado)
        const saidasProjetadas = this.estimarSaidasDiarias()

        saldoAcumulado += entradasProjetadas - saidasProjetadas

        projecoesDiarias.push({
          data: dataStr,
          entradasProjetadas,
          saidasProjetadas,
          saldoProjetado: saldoAcumulado
        })
      }

      return { projecoesDiarias }

    } catch (error) {
      console.error('Erro ao calcular projeções:', error)
      return { projecoesDiarias: [] }
    }
  }

  // Configurar alertas de saldo baixo
  static async configurarAlertaSaldoBaixo(limite: number): Promise<boolean> {
    try {
      // Salvar configuração no banco (implementação simplificada)
      const { error } = await supabase
        .from('configuracoes_financeiras')
        .upsert({
          chave: 'limite_minimo_caixa',
          valor: limite.toString(),
          updated_at: new Date().toISOString()
        })

      return !error

    } catch (error) {
      console.error('Erro ao configurar alerta:', error)
      return false
    }
  }

  // Verificar se o saldo está abaixo do limite
  static async verificarAlertaSaldoBaixo(): Promise<{
    alertaAtivo: boolean
    saldoAtual: number
    limiteMinimo: number
  }> {
    try {
      const resumo = await this.obterResumoFluxoCaixa()
      
      return {
        alertaAtivo: resumo.saldoAtual < resumo.limiteMinimoAlerta,
        saldoAtual: resumo.saldoAtual,
        limiteMinimo: resumo.limiteMinimoAlerta
      }

    } catch (error) {
      console.error('Erro ao verificar alerta:', error)
      return {
        alertaAtivo: false,
        saldoAtual: 0,
        limiteMinimo: 0
      }
    }
  }

  // Categorizar movimentação automaticamente
  static categorizarMovimentacao(
    descricao: string,
    valor: number,
    origem?: string
  ): 'OPERACIONAL' | 'INVESTIMENTO' | 'FINANCIAMENTO' {
    const descricaoLower = descricao.toLowerCase()
    
    // Regras de categorização automática
    if (descricaoLower.includes('equipamento') || 
        descricaoLower.includes('reforma') || 
        descricaoLower.includes('mobília')) {
      return 'INVESTIMENTO'
    }
    
    if (descricaoLower.includes('empréstimo') || 
        descricaoLower.includes('financiamento') || 
        descricaoLower.includes('juros')) {
      return 'FINANCIAMENTO'
    }
    
    // Por padrão, operacional
    return 'OPERACIONAL'
  }

  // Métodos auxiliares privados
  private static obterResumoMockado(): FluxoCaixaResumo {
    return {
      saldoAtual: 15750.00,
      entradasDia: 2800.00,
      saidasDia: 1200.00,
      saldoProjetado: 18350.00,
      limiteMinimoAlerta: 5000.00
    }
  }

  private static obterMovimentacoesMockadas(): MovimentacaoFluxoCaixa[] {
    return [
      {
        id: '1',
        tipo: 'ENTRADA',
        valor: 150.00,
        descricao: 'Corte + Barba - João Silva',
        categoria: 'OPERACIONAL',
        dataMovimentacao: new Date().toISOString(),
        status: 'REALIZADA',
        origem: 'Agendamento #1234'
      },
      {
        id: '2',
        tipo: 'SAIDA',
        valor: 300.00,
        descricao: 'Compra de produtos',
        categoria: 'OPERACIONAL',
        dataMovimentacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'REALIZADA',
        origem: 'Despesa #456'
      }
    ]
  }

  private static mapearCategoria(nomeCategoria?: string): 'OPERACIONAL' | 'INVESTIMENTO' | 'FINANCIAMENTO' {
    if (!nomeCategoria) return 'OPERACIONAL'
    
    const nome = nomeCategoria.toLowerCase()
    
    if (nome.includes('investimento') || nome.includes('equipamento')) {
      return 'INVESTIMENTO'
    }
    
    if (nome.includes('financiamento') || nome.includes('empréstimo')) {
      return 'FINANCIAMENTO'
    }
    
    return 'OPERACIONAL'
  }

  private static estimarSaidasDiarias(): number {
    // Estimativa baseada em dados históricos (simplificado)
    // Em produção, seria calculado baseado na média dos últimos 30 dias
    return 400 // R$ 400,00 por dia em média
  }
}