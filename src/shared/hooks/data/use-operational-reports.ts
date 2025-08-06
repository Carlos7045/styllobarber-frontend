// Hook para gerenciar relatórios operacionais
import { useState, useCallback } from 'react'
import { getMonthRange } from '@/components/financial/utils'

// Tipos para relatórios operacionais
export interface ProdutividadeRelatorio {
  barbeiroId: string
  barbeiroNome: string
  totalAtendimentos: number
  horasTrabalhadasPlanejadas: number
  horasTrabalhadasReais: number
  eficienciaHoraria: number // atendimentos por hora
  tempoMedioAtendimento: number
  tempoMedioIntervalo: number
  produtividadeScore: number // 0-100
  metaMensal: number
  percentualMeta: number
  tendenciaProducao: 'Crescente' | 'Estável' | 'Decrescente'
}

export interface ServicosRelatorio {
  servicoId: string
  servicoNome: string
  categoria: string
  totalVendas: number
  receita: number
  tempoMedioExecucao: number
  margemLucro: number
  popularidade: number // % do total de serviços
  sazonalidade: string
  barbeiroEspecialista: string
  satisfacaoMedia: number
  tendencaVendas: 'Crescente' | 'Estável' | 'Decrescente'
}

export interface EficienciaRelatorio {
  barbeiroId: string
  barbeiroNome: string
  tempoMedioSetup: number // tempo para preparar
  tempoMedioLimpeza: number // tempo para limpar
  tempoMedioAtendimento: number
  tempoTotalProdutivo: number
  tempoTotalImprodutivo: number
  eficienciaOperacional: number // % tempo produtivo
  qualidadeServico: number // baseado em satisfação
  velocidadeExecucao: number // comparado com média
  consistencia: number // variação nos tempos
  scoreGeral: number
}

export interface AnaliseOperacional {
  data: string
  totalAtendimentos: number
  receitaTotal: number
  custoOperacional: number
  margemOperacional: number
  utilizacaoEspaco: number // % ocupação do espaço
  rotatividade: number // clientes por hora
  tempoMedioEspera: number
  satisfacaoGeral: number
  eficienciaGeral: number
  gargalosIdentificados: string[]
  recomendacoes: string[]
}

export interface DateRange {
  inicio: string
  fim: string
}

export interface ConfigRelatorioOperacional {
  tipo: 'PRODUTIVIDADE' | 'SERVICOS' | 'EFICIENCIA' | 'ANALISE'
  periodo: DateRange
  filtros: {
    barbeiroId?: string
    servicoId?: string
    categoriaId?: string
    metricaMinima?: number
  }
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

interface UseOperationalReportsReturn {
  // Estados
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Dados dos relatórios
  relatorioProdutividade: {
    dados: ProdutividadeRelatorio[]
    resumo: any
  } | null
  relatorioServicos: {
    dados: ServicosRelatorio[]
    resumo: any
  } | null
  relatorioEficiencia: {
    dados: EficienciaRelatorio[]
    resumo: any
  } | null
  relatorioAnalise: {
    dados: AnaliseOperacional[]
    resumo: any
  } | null

  // Ações
  gerarRelatorioProdutividade: (config: ConfigRelatorioOperacional) => Promise<void>
  gerarRelatorioServicos: (config: ConfigRelatorioOperacional) => Promise<void>
  gerarRelatorioEficiencia: (config: ConfigRelatorioOperacional) => Promise<void>
  gerarRelatorioAnalise: (config: ConfigRelatorioOperacional) => Promise<void>
  exportarRelatorio: (
    tipo: ConfigRelatorioOperacional['tipo'],
    formato: ConfigRelatorioOperacional['formato']
  ) => Promise<void>
  limparRelatorios: () => void
}

// Dados mockados para desenvolvimento
const mockProdutividadeData: ProdutividadeRelatorio[] = [
  {
    barbeiroId: '1',
    barbeiroNome: 'Carlos Santos',
    totalAtendimentos: 85,
    horasTrabalhadasPlanejadas: 160,
    horasTrabalhadasReais: 155,
    eficienciaHoraria: 0.55,
    tempoMedioAtendimento: 45,
    tempoMedioIntervalo: 10,
    produtividadeScore: 92,
    metaMensal: 80,
    percentualMeta: 106.25,
    tendenciaProducao: 'Crescente',
  },
  {
    barbeiroId: '2',
    barbeiroNome: 'Roberto Lima',
    totalAtendimentos: 72,
    horasTrabalhadasPlanejadas: 160,
    horasTrabalhadasReais: 158,
    eficienciaHoraria: 0.46,
    tempoMedioAtendimento: 50,
    tempoMedioIntervalo: 12,
    produtividadeScore: 85,
    metaMensal: 75,
    percentualMeta: 96.0,
    tendenciaProducao: 'Estável',
  },
]

const mockServicosData: ServicosRelatorio[] = [
  {
    servicoId: '1',
    servicoNome: 'Corte Masculino',
    categoria: 'Cortes',
    totalVendas: 120,
    receita: 3600.0,
    tempoMedioExecucao: 30,
    margemLucro: 75,
    popularidade: 45,
    sazonalidade: 'Estável',
    barbeiroEspecialista: 'Carlos Santos',
    satisfacaoMedia: 4.7,
    tendencaVendas: 'Estável',
  },
  {
    servicoId: '2',
    servicoNome: 'Corte + Barba',
    categoria: 'Combos',
    totalVendas: 85,
    receita: 4250.0,
    tempoMedioExecucao: 60,
    margemLucro: 80,
    popularidade: 32,
    sazonalidade: 'Crescente',
    barbeiroEspecialista: 'Roberto Lima',
    satisfacaoMedia: 4.9,
    tendencaVendas: 'Crescente',
  },
  {
    servicoId: '3',
    servicoNome: 'Barba',
    categoria: 'Barba',
    totalVendas: 45,
    receita: 1350.0,
    tempoMedioExecucao: 25,
    margemLucro: 70,
    popularidade: 17,
    sazonalidade: 'Sazonal',
    barbeiroEspecialista: 'Carlos Santos',
    satisfacaoMedia: 4.8,
    tendencaVendas: 'Decrescente',
  },
]

const mockEficienciaData: EficienciaRelatorio[] = [
  {
    barbeiroId: '1',
    barbeiroNome: 'Carlos Santos',
    tempoMedioSetup: 3,
    tempoMedioLimpeza: 5,
    tempoMedioAtendimento: 45,
    tempoTotalProdutivo: 420,
    tempoTotalImprodutivo: 60,
    eficienciaOperacional: 87.5,
    qualidadeServico: 94,
    velocidadeExecucao: 105,
    consistencia: 92,
    scoreGeral: 94,
  },
  {
    barbeiroId: '2',
    barbeiroNome: 'Roberto Lima',
    tempoMedioSetup: 4,
    tempoMedioLimpeza: 6,
    tempoMedioAtendimento: 50,
    tempoTotalProdutivo: 400,
    tempoTotalImprodutivo: 80,
    eficienciaOperacional: 83.3,
    qualidadeServico: 91,
    velocidadeExecucao: 95,
    consistencia: 88,
    scoreGeral: 89,
  },
]

const mockAnaliseData: AnaliseOperacional[] = [
  {
    data: '2024-01-15',
    totalAtendimentos: 45,
    receitaTotal: 2250.0,
    custoOperacional: 450.0,
    margemOperacional: 80,
    utilizacaoEspaco: 85,
    rotatividade: 5.6,
    tempoMedioEspera: 8,
    satisfacaoGeral: 4.7,
    eficienciaGeral: 88,
    gargalosIdentificados: ['Horário 14h-16h muito ocupado', 'Tempo de limpeza acima da média'],
    recomendacoes: ['Adicionar barbeiro no horário de pico', 'Otimizar processo de limpeza'],
  },
  {
    data: '2024-01-16',
    totalAtendimentos: 38,
    receitaTotal: 1900.0,
    custoOperacional: 380.0,
    margemOperacional: 80,
    utilizacaoEspaco: 72,
    rotatividade: 4.8,
    tempoMedioEspera: 6,
    satisfacaoGeral: 4.8,
    eficienciaGeral: 91,
    gargalosIdentificados: ['Baixa ocupação manhã'],
    recomendacoes: ['Promoções para horário matutino', 'Flexibilizar horários'],
  },
]

export const useOperationalReports = (): UseOperationalReportsReturn => {
  // Estados locais
  const [relatorioProdutividade, setRelatorioProdutividade] = useState<{
    dados: ProdutividadeRelatorio[]
    resumo: any
  } | null>(null)

  const [relatorioServicos, setRelatorioServicos] = useState<{
    dados: ServicosRelatorio[]
    resumo: any
  } | null>(null)

  const [relatorioEficiencia, setRelatorioEficiencia] = useState<{
    dados: EficienciaRelatorio[]
    resumo: any
  } | null>(null)

  const [relatorioAnalise, setRelatorioAnalise] = useState<{
    dados: AnaliseOperacional[]
    resumo: any
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Gerar relatório de produtividade
  const gerarRelatorioProdutividade = useCallback(async (config: ConfigRelatorioOperacional) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aplicar filtros nos dados mockados
      let dadosFiltrados = [...mockProdutividadeData]

      if (config.filtros.barbeiroId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.barbeiroId === config.filtros.barbeiroId
        )
      }

      // Calcular resumo
      const resumo = {
        totalBarbeiros: dadosFiltrados.length,
        totalAtendimentos: dadosFiltrados.reduce((sum, item) => sum + item.totalAtendimentos, 0),
        produtividadeMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.produtividadeScore, 0) /
          dadosFiltrados.length,
        eficienciaHorariaMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.eficienciaHoraria, 0) /
          dadosFiltrados.length,
        percentualMetaMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.percentualMeta, 0) /
          dadosFiltrados.length,
        barbeiroMaisProdutivo: dadosFiltrados.reduce((prev, current) =>
          prev.produtividadeScore > current.produtividadeScore ? prev : current
        ).barbeiroNome,
        tendenciaGeral: 'Crescente',
      }

      setRelatorioProdutividade({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de produtividade:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de serviços
  const gerarRelatorioServicos = useCallback(async (config: ConfigRelatorioOperacional) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      let dadosFiltrados = [...mockServicosData]

      if (config.filtros.servicoId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.servicoId === config.filtros.servicoId
        )
      }

      if (config.filtros.categoriaId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.categoria === config.filtros.categoriaId
        )
      }

      const resumo = {
        totalServicos: dadosFiltrados.length,
        totalVendas: dadosFiltrados.reduce((sum, item) => sum + item.totalVendas, 0),
        receitaTotal: dadosFiltrados.reduce((sum, item) => sum + item.receita, 0),
        margemLucroMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.margemLucro, 0) / dadosFiltrados.length,
        tempoMedioExecucao:
          dadosFiltrados.reduce((sum, item) => sum + item.tempoMedioExecucao, 0) /
          dadosFiltrados.length,
        satisfacaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.satisfacaoMedia, 0) /
          dadosFiltrados.length,
        servicoMaisPopular: dadosFiltrados.reduce((prev, current) =>
          prev.popularidade > current.popularidade ? prev : current
        ).servicoNome,
        servicoMaisRentavel: dadosFiltrados.reduce((prev, current) =>
          prev.receita > current.receita ? prev : current
        ).servicoNome,
      }

      setRelatorioServicos({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de serviços:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de eficiência
  const gerarRelatorioEficiencia = useCallback(async (config: ConfigRelatorioOperacional) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      let dadosFiltrados = [...mockEficienciaData]

      if (config.filtros.barbeiroId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.barbeiroId === config.filtros.barbeiroId
        )
      }

      const resumo = {
        totalBarbeiros: dadosFiltrados.length,
        eficienciaOperacionalMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.eficienciaOperacional, 0) /
          dadosFiltrados.length,
        qualidadeServicoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.qualidadeServico, 0) /
          dadosFiltrados.length,
        velocidadeExecucaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.velocidadeExecucao, 0) /
          dadosFiltrados.length,
        consistenciaMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.consistencia, 0) / dadosFiltrados.length,
        scoreGeralMedio:
          dadosFiltrados.reduce((sum, item) => sum + item.scoreGeral, 0) / dadosFiltrados.length,
        barbeiroMaisEficiente: dadosFiltrados.reduce((prev, current) =>
          prev.scoreGeral > current.scoreGeral ? prev : current
        ).barbeiroNome,
      }

      setRelatorioEficiencia({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de eficiência:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de análise operacional
  const gerarRelatorioAnalise = useCallback(async (config: ConfigRelatorioOperacional) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const resumo = {
        totalDias: mockAnaliseData.length,
        totalAtendimentos: mockAnaliseData.reduce((sum, item) => sum + item.totalAtendimentos, 0),
        receitaTotal: mockAnaliseData.reduce((sum, item) => sum + item.receitaTotal, 0),
        margemOperacionalMedia:
          mockAnaliseData.reduce((sum, item) => sum + item.margemOperacional, 0) /
          mockAnaliseData.length,
        utilizacaoEspacoMedia:
          mockAnaliseData.reduce((sum, item) => sum + item.utilizacaoEspaco, 0) /
          mockAnaliseData.length,
        satisfacaoGeralMedia:
          mockAnaliseData.reduce((sum, item) => sum + item.satisfacaoGeral, 0) /
          mockAnaliseData.length,
        eficienciaGeralMedia:
          mockAnaliseData.reduce((sum, item) => sum + item.eficienciaGeral, 0) /
          mockAnaliseData.length,
        principalGargalo: 'Horário 14h-16h muito ocupado',
        principalRecomendacao: 'Adicionar barbeiro no horário de pico',
      }

      setRelatorioAnalise({ dados: mockAnaliseData, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de análise:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Exportar relatório
  const exportarRelatorio = useCallback(
    async (
      tipo: ConfigRelatorioOperacional['tipo'],
      formato: ConfigRelatorioOperacional['formato']
    ) => {
      try {
        setIsLoading(true)

        let dados: any = null
        let nomeArquivo = ''

        switch (tipo) {
          case 'PRODUTIVIDADE':
            dados = relatorioProdutividade?.dados
            nomeArquivo = `relatorio-produtividade-${new Date().toISOString().split('T')[0]}`
            break
          case 'SERVICOS':
            dados = relatorioServicos?.dados
            nomeArquivo = `relatorio-servicos-${new Date().toISOString().split('T')[0]}`
            break
          case 'EFICIENCIA':
            dados = relatorioEficiencia?.dados
            nomeArquivo = `relatorio-eficiencia-${new Date().toISOString().split('T')[0]}`
            break
          case 'ANALISE':
            dados = relatorioAnalise?.dados
            nomeArquivo = `relatorio-analise-${new Date().toISOString().split('T')[0]}`
            break
          default:
            throw new Error(`Tipo de relatório ${tipo} não suportado`)
        }

        if (!dados) {
          throw new Error('Nenhum dado disponível para exportação. Gere o relatório primeiro.')
        }

        // Simular exportação (em produção, seria uma chamada para API)
        const csvContent = convertToCSV(dados)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

        // Download do arquivo
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${nomeArquivo}.${formato.toLowerCase()}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (err) {
        setIsError(true)
        setError(err as Error)
        console.error('Erro ao exportar relatório:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [relatorioProdutividade, relatorioServicos, relatorioEficiencia, relatorioAnalise]
  )

  // Limpar relatórios
  const limparRelatorios = useCallback(() => {
    setRelatorioProdutividade(null)
    setRelatorioServicos(null)
    setRelatorioEficiencia(null)
    setRelatorioAnalise(null)
    setIsError(false)
    setError(null)
  }, [])

  return {
    // Estados
    isLoading,
    isError,
    error,

    // Dados
    relatorioProdutividade,
    relatorioServicos,
    relatorioEficiencia,
    relatorioAnalise,

    // Ações
    gerarRelatorioProdutividade,
    gerarRelatorioServicos,
    gerarRelatorioEficiencia,
    gerarRelatorioAnalise,
    exportarRelatorio,
    limparRelatorios,
  }
}

// Função auxiliar para converter dados para CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        // Escapar aspas e adicionar aspas se necessário
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"') || value.includes('\n'))
        ) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}
