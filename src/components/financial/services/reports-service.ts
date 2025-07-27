// Serviço para geração de relatórios financeiros
import { supabase } from '@/lib/supabase'
import type { 
  ConfigRelatorio,
  RelatorioReceitas,
  RelatorioDespesas,
  RelatorioComissoes,
  DREData,
  DateRange
} from '../types'
import { formatCurrency, formatDate } from '../utils'

export class ReportsService {
  // Gerar relatório de receitas
  static async gerarRelatorioReceitas(
    config: ConfigRelatorio
  ): Promise<{
    dados: RelatorioReceitas[]
    resumo: {
      totalReceitas: number
      numeroTransacoes: number
      ticketMedio: number
      receitaPorBarbeiro: Record<string, number>
      receitaPorMetodo: Record<string, number>
    }
  }> {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          id,
          data_transacao,
          valor,
          descricao,
          metodo_pagamento,
          status,
          agendamento_id,
          barbeiro_id,
          agendamentos (
            cliente_id,
            servico_id,
            clientes (nome),
            servicos (nome)
          ),
          funcionarios (nome)
        `)
        .eq('tipo', 'RECEITA')
        .eq('status', 'CONFIRMADA')
        .gte('data_transacao', config.periodo.inicio)
        .lte('data_transacao', config.periodo.fim)
        .order('data_transacao', { ascending: false })

      // Aplicar filtros
      if (config.filtros.barbeiroId) {
        query = query.eq('barbeiro_id', config.filtros.barbeiroId)
      }

      if (config.filtros.statusPagamento) {
        query = query.eq('status', config.filtros.statusPagamento)
      }

      const { data: transacoes, error } = await query

      if (error) throw error

      // Processar dados
      const dados: RelatorioReceitas[] = (transacoes || []).map(t => ({
        id: t.id,
        data: formatDate(t.data_transacao),
        cliente: t.agendamentos?.clientes?.nome || 'Cliente não identificado',
        barbeiro: t.funcionarios?.nome || 'Barbeiro não identificado',
        servico: t.agendamentos?.servicos?.nome || t.descricao,
        valor: t.valor,
        metodoPagamento: t.metodo_pagamento || 'Não informado',
        status: t.status,
        comissao: 0 // Simplificado por enquanto
      }))

      // Calcular resumo
      const totalReceitas = dados.reduce((sum, item) => sum + item.valor, 0)
      const numeroTransacoes = dados.length
      const ticketMedio = numeroTransacoes > 0 ? totalReceitas / numeroTransacoes : 0

      const receitaPorBarbeiro = dados.reduce((acc, item) => {
        acc[item.barbeiro] = (acc[item.barbeiro] || 0) + item.valor
        return acc
      }, {} as Record<string, number>)

      const receitaPorMetodo = dados.reduce((acc, item) => {
        acc[item.metodoPagamento] = (acc[item.metodoPagamento] || 0) + item.valor
        return acc
      }, {} as Record<string, number>)

      return {
        dados,
        resumo: {
          totalReceitas,
          numeroTransacoes,
          ticketMedio,
          receitaPorBarbeiro,
          receitaPorMetodo
        }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de receitas:', error)
      throw error
    }
  }

  // Gerar relatório de despesas
  static async gerarRelatorioDespesas(
    config: ConfigRelatorio
  ): Promise<{
    dados: RelatorioDespesas[]
    resumo: {
      totalDespesas: number
      numeroDespesas: number
      despesaMedia: number
      despesasPorCategoria: Record<string, { total: number; quantidade: number }>
      despesasRecorrentes: number
    }
  }> {
    try {
      let query = supabase
        .from('despesas')
        .select(`
          id,
          data_despesa,
          descricao,
          valor,
          recorrente,
          comprovantes,
          categoria_id,
          categorias_financeiras (nome, cor)
        `)
        .gte('data_despesa', config.periodo.inicio)
        .lte('data_despesa', config.periodo.fim)
        .order('data_despesa', { ascending: false })

      // Aplicar filtros
      if (config.filtros.categoriaId) {
        query = query.eq('categoria_id', config.filtros.categoriaId)
      }

      const { data: despesas, error } = await query

      if (error) throw error

      // Processar dados
      const dados: RelatorioDespesas[] = (despesas || []).map(d => ({
        id: d.id,
        data: formatDate(d.data_despesa),
        categoria: d.categorias_financeiras?.nome || 'Categoria não identificada',
        descricao: d.descricao,
        valor: d.valor,
        comprovante: d.comprovantes?.[0],
        recorrente: d.recorrente
      }))

      // Calcular resumo
      const totalDespesas = dados.reduce((sum, item) => sum + item.valor, 0)
      const numeroDespesas = dados.length
      const despesaMedia = numeroDespesas > 0 ? totalDespesas / numeroDespesas : 0

      const despesasPorCategoria = dados.reduce((acc, item) => {
        if (!acc[item.categoria]) {
          acc[item.categoria] = { total: 0, quantidade: 0 }
        }
        acc[item.categoria].total += item.valor
        acc[item.categoria].quantidade += 1
        return acc
      }, {} as Record<string, { total: number; quantidade: number }>)

      const despesasRecorrentes = dados.filter(d => d.recorrente).length

      return {
        dados,
        resumo: {
          totalDespesas,
          numeroDespesas,
          despesaMedia,
          despesasPorCategoria,
          despesasRecorrentes
        }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de despesas:', error)
      throw error
    }
  }

  // Gerar relatório de comissões
  static async gerarRelatorioComissoes(
    config: ConfigRelatorio
  ): Promise<{
    dados: RelatorioComissoes[]
    resumo: {
      totalComissoes: number
      comissoesPagas: number
      comissoesPendentes: number
      numeroServicos: number
    }
  }> {
    try {
      const { data: comissoes, error } = await supabase
        .from('comissoes_calculadas')
        .select(`
          *,
          funcionarios (nome),
          agendamentos (
            data_agendamento,
            servicos (nome)
          )
        `)
        .gte('created_at', config.periodo.inicio)
        .lte('created_at', config.periodo.fim)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Agrupar por barbeiro
      const dadosAgrupados = new Map<string, {
        barbeiro: string
        servicosRealizados: number
        receitaGerada: number
        valorComissao: number
        valorPago: number
        saldoPendente: number
      }>()

      comissoes?.forEach(c => {
        const key = c.barbeiro_id
        const barbeiro = c.funcionarios?.nome || 'Barbeiro não identificado'
        
        if (!dadosAgrupados.has(key)) {
          dadosAgrupados.set(key, {
            barbeiro,
            servicosRealizados: 0,
            receitaGerada: 0,
            valorComissao: 0,
            valorPago: 0,
            saldoPendente: 0
          })
        }

        const dados = dadosAgrupados.get(key)!
        dados.servicosRealizados += 1
        dados.receitaGerada += c.valor_servico
        dados.valorComissao += c.valor_comissao
        
        if (c.status === 'PAGA') {
          dados.valorPago += c.valor_liquido
        } else {
          dados.saldoPendente += c.valor_liquido
        }
      })

      // Converter para array
      const dados: RelatorioComissoes[] = Array.from(dadosAgrupados.entries()).map(([id, dados]) => ({
        id,
        barbeiro: dados.barbeiro,
        periodo: `${formatDate(config.periodo.inicio)} - ${formatDate(config.periodo.fim)}`,
        servicosRealizados: dados.servicosRealizados,
        receitaGerada: dados.receitaGerada,
        percentualComissao: dados.receitaGerada > 0 ? (dados.valorComissao / dados.receitaGerada) * 100 : 0,
        valorComissao: dados.valorComissao,
        valorPago: dados.valorPago,
        saldoPendente: dados.saldoPendente
      }))

      // Calcular resumo
      const totalComissoes = dados.reduce((sum, item) => sum + item.valorComissao, 0)
      const comissoesPagas = dados.reduce((sum, item) => sum + item.valorPago, 0)
      const comissoesPendentes = dados.reduce((sum, item) => sum + item.saldoPendente, 0)
      const numeroServicos = dados.reduce((sum, item) => sum + item.servicosRealizados, 0)

      return {
        dados,
        resumo: {
          totalComissoes,
          comissoesPagas,
          comissoesPendentes,
          numeroServicos
        }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de comissões:', error)
      throw error
    }
  }

  // Gerar DRE (Demonstrativo de Resultado do Exercício)
  static async gerarDRE(periodo: DateRange): Promise<DREData> {
    try {
      // Buscar receitas
      const { data: receitas } = await supabase
        .from('transacoes_financeiras')
        .select('valor')
        .eq('tipo', 'RECEITA')
        .eq('status', 'CONFIRMADA')
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)

      // Buscar despesas operacionais
      const { data: despesasOperacionais } = await supabase
        .from('despesas')
        .select('valor, categorias_financeiras(nome)')
        .gte('data_despesa', periodo.inicio)
        .lte('data_despesa', periodo.fim)

      // Buscar comissões
      const { data: comissoes } = await supabase
        .from('transacoes_financeiras')
        .select('valor')
        .eq('tipo', 'COMISSAO')
        .eq('status', 'CONFIRMADA')
        .gte('data_transacao', periodo.inicio)
        .lte('data_transacao', periodo.fim)

      // Calcular valores
      const receitaOperacional = receitas?.reduce((sum, r) => sum + r.valor, 0) || 0
      const custosVariaveis = comissoes?.reduce((sum, c) => sum + c.valor, 0) || 0
      const margemContribuicao = receitaOperacional - custosVariaveis

      // Separar despesas fixas e variáveis
      const despesasFixas = despesasOperacionais?.filter(d => 
        ['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET'].includes(d.categorias_financeiras?.nome?.toUpperCase() || '')
      ).reduce((sum, d) => sum + d.valor, 0) || 0

      const ebitda = margemContribuicao - despesasFixas
      const depreciacoes = 0 // Placeholder - implementar se necessário
      const lucroOperacional = ebitda - depreciacoes
      const lucroLiquido = lucroOperacional // Sem impostos por enquanto

      return {
        receitaOperacional,
        custosVariaveis,
        margemContribuicao,
        despesasFixas,
        ebitda,
        depreciacoes,
        lucroOperacional,
        lucroLiquido
      }
    } catch (error) {
      console.error('Erro ao gerar DRE:', error)
      throw error
    }
  }

  // Exportar relatório
  static async exportarRelatorio(
    tipo: ConfigRelatorio['tipo'],
    dados: any,
    formato: ConfigRelatorio['formato']
  ): Promise<Blob> {
    switch (formato) {
      case 'CSV':
        return this.exportarCSV(dados)
      case 'EXCEL':
        return this.exportarExcel(dados)
      case 'PDF':
        return this.exportarPDF(tipo, dados)
      default:
        throw new Error(`Formato ${formato} não suportado`)
    }
  }

  // Exportar para CSV
  private static exportarCSV(dados: any[]): Blob {
    if (!dados.length) return new Blob([''], { type: 'text/csv' })

    const headers = Object.keys(dados[0]).join(',')
    const rows = dados.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  }

  // Exportar para Excel (placeholder)
  private static exportarExcel(dados: any[]): Blob {
    // TODO: Implementar exportação Excel usando biblioteca como xlsx
    const csv = this.exportarCSV(dados)
    return new Blob([csv], { type: 'application/vnd.ms-excel' })
  }

  // Exportar para PDF (placeholder)
  private static exportarPDF(tipo: string, dados: any): Blob {
    // TODO: Implementar exportação PDF usando biblioteca como jsPDF
    const content = `Relatório ${tipo}\n\n${JSON.stringify(dados, null, 2)}`
    return new Blob([content], { type: 'application/pdf' })
  }

  // Função auxiliar para calcular comissão de uma transação
  private static async calcularComissaoTransacao(transacaoId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('comissoes_calculadas')
        .select('valor_comissao')
        .eq('agendamento_id', transacaoId)
        .single()

      return data?.valor_comissao || 0
    } catch {
      return 0
    }
  }
}