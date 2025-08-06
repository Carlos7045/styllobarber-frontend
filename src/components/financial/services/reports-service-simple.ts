// Serviço simplificado para geração de relatórios financeiros
import type { 
  ConfigRelatorio,
  RelatorioReceitas,
  RelatorioDespesas,
  RelatorioComissoes,
  DREData,
  DateRange
} from '../types'
import { formatCurrency, formatDate } from '../utils'

// Dados mockados para demonstração
const mockReceitas: RelatorioReceitas[] = [
  {
    id: '1',
    data: '15/01/2024',
    cliente: 'João Silva',
    barbeiro: 'Pedro Santos',
    servico: 'Corte + Barba',
    valor: 45.00,
    metodoPagamento: 'PIX',
    status: 'CONFIRMADA',
    comissao: 13.50
  },
  {
    id: '2',
    data: '15/01/2024',
    cliente: 'Carlos Lima',
    barbeiro: 'João Silva',
    servico: 'Corte Masculino',
    valor: 30.00,
    metodoPagamento: 'Dinheiro',
    status: 'CONFIRMADA',
    comissao: 9.00
  },
  {
    id: '3',
    data: '14/01/2024',
    cliente: 'Rafael Costa',
    barbeiro: 'Pedro Santos',
    servico: 'Barba',
    valor: 20.00,
    metodoPagamento: 'Cartão',
    status: 'CONFIRMADA',
    comissao: 6.00
  }
]

const mockDespesas: RelatorioDespesas[] = [
  {
    id: '1',
    data: '15/01/2024',
    categoria: 'Aluguel',
    descricao: 'Aluguel do salão - Janeiro 2024',
    valor: 1500.00,
    comprovante: 'comprovante-aluguel-jan.pdf',
    recorrente: true
  },
  {
    id: '2',
    data: '10/01/2024',
    categoria: 'Produtos',
    descricao: 'Shampoo e condicionador profissional',
    valor: 280.00,
    comprovante: 'nota-produtos-jan.pdf',
    recorrente: false
  }
]

const mockComissoes: RelatorioComissoes[] = [
  {
    id: '1',
    barbeiro: 'Pedro Santos',
    periodo: '01/01/2024 - 31/01/2024',
    servicosRealizados: 25,
    receitaGerada: 1125.00,
    percentualComissao: 30,
    valorComissao: 337.50,
    valorPago: 337.50,
    saldoPendente: 0
  },
  {
    id: '2',
    barbeiro: 'João Silva',
    periodo: '01/01/2024 - 31/01/2024',
    servicosRealizados: 20,
    receitaGerada: 900.00,
    percentualComissao: 30,
    valorComissao: 270.00,
    valorPago: 200.00,
    saldoPendente: 70.00
  }
]

export class ReportsServiceSimple {
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
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))

    const dados = mockReceitas
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const dados = mockDespesas
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
    await new Promise(resolve => setTimeout(resolve, 500))

    const dados = mockComissoes
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
  }

  // Gerar DRE
  static async gerarDRE(periodo: DateRange): Promise<DREData> {
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      receitaOperacional: 15000.00,
      custosVariaveis: 4500.00,
      margemContribuicao: 10500.00,
      despesasFixas: 3200.00,
      ebitda: 7300.00,
      depreciacoes: 200.00,
      lucroOperacional: 7100.00,
      lucroLiquido: 7100.00
    }
  }

  // Exportar relatório
  static async exportarRelatorio(
    tipo: ConfigRelatorio['tipo'],
    dados: any,
    formato: ConfigRelatorio['formato']
  ): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 300))

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

  // Exportar para Excel
  private static exportarExcel(dados: any[]): Blob {
    const csv = this.exportarCSV(dados)
    return new Blob([csv], { type: 'application/vnd.ms-excel' })
  }

  // Exportar para PDF
  private static exportarPDF(tipo: string, dados: any): Blob {
    const content = `Relatório ${tipo}\n\nDados: ${JSON.stringify(dados, null, 2)}`
    return new Blob([content], { type: 'application/pdf' })
  }
}
