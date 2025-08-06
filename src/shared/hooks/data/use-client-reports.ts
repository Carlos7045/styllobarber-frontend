// Hook para gerenciar relatórios de clientes
import { useState, useCallback } from 'react'
import { getMonthRange } from '@/components/financial/utils'

// Tipos para relatórios de clientes
export interface ClienteRelatorio {
  id: string
  nome: string
  email: string
  telefone: string
  dataUltimaVisita: string
  totalVisitas: number
  valorTotalGasto: number
  servicosFavoritos: string[]
  barbeiroPreferido: string
  frequenciaMedia: number // dias entre visitas
  statusFidelidade: 'Novo' | 'Regular' | 'VIP' | 'Inativo'
  tempoComoCliente: number // em meses
}

export interface RelatorioFrequencia {
  clienteId: string
  nomeCliente: string
  visitasUltimos30Dias: number
  visitasUltimos90Dias: number
  visitasUltimoAno: number
  diasDesdeUltimaVisita: number
  mediaVisitasPorMes: number
  tendencia: 'Crescente' | 'Estável' | 'Decrescente'
}

export interface RelatorioFidelizacao {
  clienteId: string
  nomeCliente: string
  pontuacaoFidelidade: number
  nivelFidelidade: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'
  valorTotalGasto: number
  tempoComoCliente: number
  frequenciaVisitas: number
  probabilidadeRetorno: number
  recomendacoes: string[]
}

export interface RelatorioSegmentacao {
  segmento: string
  totalClientes: number
  percentualBase: number
  valorMedioGasto: number
  frequenciaMediaVisitas: number
  caracteristicas: string[]
}

export interface DateRange {
  inicio: string
  fim: string
}

export interface ConfigRelatorioCliente {
  tipo: 'PERFIL' | 'FREQUENCIA' | 'FIDELIZACAO' | 'SEGMENTACAO'
  periodo: DateRange
  filtros: {
    barbeiroId?: string
    statusFidelidade?: string
    servicoId?: string
    valorMinimo?: number
    valorMaximo?: number
  }
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

interface UseClientReportsReturn {
  // Estados
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Dados dos relatórios
  relatorioClientes: {
    dados: ClienteRelatorio[]
    resumo: any
  } | null
  relatorioFrequencia: {
    dados: RelatorioFrequencia[]
    resumo: any
  } | null
  relatorioFidelizacao: {
    dados: RelatorioFidelizacao[]
    resumo: any
  } | null
  relatorioSegmentacao: {
    dados: RelatorioSegmentacao[]
    resumo: any
  } | null

  // Ações
  gerarRelatorioClientes: (config: ConfigRelatorioCliente) => Promise<void>
  gerarRelatorioFrequencia: (config: ConfigRelatorioCliente) => Promise<void>
  gerarRelatorioFidelizacao: (config: ConfigRelatorioCliente) => Promise<void>
  gerarRelatorioSegmentacao: (config: ConfigRelatorioCliente) => Promise<void>
  exportarRelatorio: (
    tipo: ConfigRelatorioCliente['tipo'],
    formato: ConfigRelatorioCliente['formato']
  ) => Promise<void>
  limparRelatorios: () => void
}

// Dados mockados para desenvolvimento
const mockClientesData: ClienteRelatorio[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    dataUltimaVisita: '2024-01-15',
    totalVisitas: 24,
    valorTotalGasto: 1200.0,
    servicosFavoritos: ['Corte Masculino', 'Barba'],
    barbeiroPreferido: 'Carlos Santos',
    frequenciaMedia: 15,
    statusFidelidade: 'VIP',
    tempoComoCliente: 12,
  },
  {
    id: '2',
    nome: 'Pedro Oliveira',
    email: 'pedro@email.com',
    telefone: '(11) 88888-8888',
    dataUltimaVisita: '2024-01-10',
    totalVisitas: 8,
    valorTotalGasto: 400.0,
    servicosFavoritos: ['Corte Masculino'],
    barbeiroPreferido: 'Roberto Lima',
    frequenciaMedia: 30,
    statusFidelidade: 'Regular',
    tempoComoCliente: 4,
  },
  {
    id: '3',
    nome: 'Lucas Costa',
    email: 'lucas@email.com',
    telefone: '(11) 77777-7777',
    dataUltimaVisita: '2024-01-20',
    totalVisitas: 45,
    valorTotalGasto: 2250.0,
    servicosFavoritos: ['Corte Premium', 'Barba', 'Sobrancelha'],
    barbeiroPreferido: 'Carlos Santos',
    frequenciaMedia: 12,
    statusFidelidade: 'VIP',
    tempoComoCliente: 18,
  },
  {
    id: '4',
    nome: 'Rafael Santos',
    email: 'rafael@email.com',
    telefone: '(11) 66666-6666',
    dataUltimaVisita: '2023-12-05',
    totalVisitas: 3,
    valorTotalGasto: 150.0,
    servicosFavoritos: ['Corte Masculino'],
    barbeiroPreferido: 'Roberto Lima',
    frequenciaMedia: 45,
    statusFidelidade: 'Inativo',
    tempoComoCliente: 6,
  },
]

const mockFrequenciaData: RelatorioFrequencia[] = [
  {
    clienteId: '1',
    nomeCliente: 'João Silva',
    visitasUltimos30Dias: 2,
    visitasUltimos90Dias: 6,
    visitasUltimoAno: 24,
    diasDesdeUltimaVisita: 5,
    mediaVisitasPorMes: 2,
    tendencia: 'Estável',
  },
  {
    clienteId: '2',
    nomeCliente: 'Pedro Oliveira',
    visitasUltimos30Dias: 1,
    visitasUltimos90Dias: 2,
    visitasUltimoAno: 8,
    diasDesdeUltimaVisita: 10,
    mediaVisitasPorMes: 0.7,
    tendencia: 'Decrescente',
  },
]

const mockFidelizacaoData: RelatorioFidelizacao[] = [
  {
    clienteId: '1',
    nomeCliente: 'João Silva',
    pontuacaoFidelidade: 95,
    nivelFidelidade: 'Ouro',
    valorTotalGasto: 1200.0,
    tempoComoCliente: 12,
    frequenciaVisitas: 24,
    probabilidadeRetorno: 92,
    recomendacoes: ['Oferecer desconto em pacotes', 'Programa de indicação'],
  },
  {
    clienteId: '3',
    nomeCliente: 'Lucas Costa',
    pontuacaoFidelidade: 98,
    nivelFidelidade: 'Diamante',
    valorTotalGasto: 2250.0,
    tempoComoCliente: 18,
    frequenciaVisitas: 45,
    probabilidadeRetorno: 96,
    recomendacoes: ['Cliente VIP - manter qualidade', 'Serviços premium'],
  },
]

const mockSegmentacaoData: RelatorioSegmentacao[] = [
  {
    segmento: 'Clientes VIP',
    totalClientes: 15,
    percentualBase: 12.5,
    valorMedioGasto: 1800.0,
    frequenciaMediaVisitas: 2.5,
    caracteristicas: ['Alta frequência', 'Serviços premium', 'Fidelidade alta'],
  },
  {
    segmento: 'Clientes Regulares',
    totalClientes: 45,
    percentualBase: 37.5,
    valorMedioGasto: 600.0,
    frequenciaMediaVisitas: 1.2,
    caracteristicas: ['Frequência média', 'Serviços básicos', 'Fidelidade média'],
  },
  {
    segmento: 'Clientes Novos',
    totalClientes: 30,
    percentualBase: 25.0,
    valorMedioGasto: 200.0,
    frequenciaMediaVisitas: 0.5,
    caracteristicas: ['Baixa frequência', 'Experimentando serviços', 'Potencial crescimento'],
  },
  {
    segmento: 'Clientes Inativos',
    totalClientes: 30,
    percentualBase: 25.0,
    valorMedioGasto: 150.0,
    frequenciaMediaVisitas: 0.1,
    caracteristicas: ['Sem visitas recentes', 'Risco de perda', 'Necessita reativação'],
  },
]

export const useClientReports = (): UseClientReportsReturn => {
  // Estados locais
  const [relatorioClientes, setRelatorioClientes] = useState<{
    dados: ClienteRelatorio[]
    resumo: any
  } | null>(null)

  const [relatorioFrequencia, setRelatorioFrequencia] = useState<{
    dados: RelatorioFrequencia[]
    resumo: any
  } | null>(null)

  const [relatorioFidelizacao, setRelatorioFidelizacao] = useState<{
    dados: RelatorioFidelizacao[]
    resumo: any
  } | null>(null)

  const [relatorioSegmentacao, setRelatorioSegmentacao] = useState<{
    dados: RelatorioSegmentacao[]
    resumo: any
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Gerar relatório de perfil de clientes
  const gerarRelatorioClientes = useCallback(async (config: ConfigRelatorioCliente) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aplicar filtros nos dados mockados
      let dadosFiltrados = [...mockClientesData]

      if (config.filtros.barbeiroId) {
        dadosFiltrados = dadosFiltrados.filter((cliente) =>
          cliente.barbeiroPreferido.includes(config.filtros.barbeiroId!)
        )
      }

      if (config.filtros.statusFidelidade) {
        dadosFiltrados = dadosFiltrados.filter(
          (cliente) => cliente.statusFidelidade === config.filtros.statusFidelidade
        )
      }

      if (config.filtros.valorMinimo) {
        dadosFiltrados = dadosFiltrados.filter(
          (cliente) => cliente.valorTotalGasto >= config.filtros.valorMinimo!
        )
      }

      if (config.filtros.valorMaximo) {
        dadosFiltrados = dadosFiltrados.filter(
          (cliente) => cliente.valorTotalGasto <= config.filtros.valorMaximo!
        )
      }

      // Calcular resumo
      const resumo = {
        totalClientes: dadosFiltrados.length,
        valorTotalGasto: dadosFiltrados.reduce((sum, cliente) => sum + cliente.valorTotalGasto, 0),
        valorMedioGasto:
          dadosFiltrados.length > 0
            ? dadosFiltrados.reduce((sum, cliente) => sum + cliente.valorTotalGasto, 0) /
              dadosFiltrados.length
            : 0,
        frequenciaMediaVisitas:
          dadosFiltrados.length > 0
            ? dadosFiltrados.reduce((sum, cliente) => sum + cliente.totalVisitas, 0) /
              dadosFiltrados.length
            : 0,
        clientesVIP: dadosFiltrados.filter((c) => c.statusFidelidade === 'VIP').length,
        clientesRegulares: dadosFiltrados.filter((c) => c.statusFidelidade === 'Regular').length,
        clientesNovos: dadosFiltrados.filter((c) => c.statusFidelidade === 'Novo').length,
        clientesInativos: dadosFiltrados.filter((c) => c.statusFidelidade === 'Inativo').length,
      }

      setRelatorioClientes({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de clientes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de frequência
  const gerarRelatorioFrequencia = useCallback(async (config: ConfigRelatorioCliente) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const resumo = {
        totalClientes: mockFrequenciaData.length,
        mediaVisitas30Dias:
          mockFrequenciaData.reduce((sum, item) => sum + item.visitasUltimos30Dias, 0) /
          mockFrequenciaData.length,
        mediaVisitas90Dias:
          mockFrequenciaData.reduce((sum, item) => sum + item.visitasUltimos90Dias, 0) /
          mockFrequenciaData.length,
        clientesCrescentes: mockFrequenciaData.filter((c) => c.tendencia === 'Crescente').length,
        clientesEstaveis: mockFrequenciaData.filter((c) => c.tendencia === 'Estável').length,
        clientesDecrescentes: mockFrequenciaData.filter((c) => c.tendencia === 'Decrescente')
          .length,
      }

      setRelatorioFrequencia({ dados: mockFrequenciaData, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de frequência:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de fidelização
  const gerarRelatorioFidelizacao = useCallback(async (config: ConfigRelatorioCliente) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const resumo = {
        totalClientes: mockFidelizacaoData.length,
        pontuacaoMediaFidelidade:
          mockFidelizacaoData.reduce((sum, item) => sum + item.pontuacaoFidelidade, 0) /
          mockFidelizacaoData.length,
        probabilidadeMediaRetorno:
          mockFidelizacaoData.reduce((sum, item) => sum + item.probabilidadeRetorno, 0) /
          mockFidelizacaoData.length,
        clientesBronze: mockFidelizacaoData.filter((c) => c.nivelFidelidade === 'Bronze').length,
        clientesPrata: mockFidelizacaoData.filter((c) => c.nivelFidelidade === 'Prata').length,
        clientesOuro: mockFidelizacaoData.filter((c) => c.nivelFidelidade === 'Ouro').length,
        clientesDiamante: mockFidelizacaoData.filter((c) => c.nivelFidelidade === 'Diamante')
          .length,
      }

      setRelatorioFidelizacao({ dados: mockFidelizacaoData, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de fidelização:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de segmentação
  const gerarRelatorioSegmentacao = useCallback(async (config: ConfigRelatorioCliente) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const resumo = {
        totalSegmentos: mockSegmentacaoData.length,
        totalClientes: mockSegmentacaoData.reduce((sum, item) => sum + item.totalClientes, 0),
        valorMedioGeral:
          mockSegmentacaoData.reduce(
            (sum, item) => sum + item.valorMedioGasto * item.totalClientes,
            0
          ) / mockSegmentacaoData.reduce((sum, item) => sum + item.totalClientes, 0),
        segmentoMaior: mockSegmentacaoData.reduce((prev, current) =>
          prev.totalClientes > current.totalClientes ? prev : current
        ).segmento,
      }

      setRelatorioSegmentacao({ dados: mockSegmentacaoData, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de segmentação:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Exportar relatório
  const exportarRelatorio = useCallback(
    async (tipo: ConfigRelatorioCliente['tipo'], formato: ConfigRelatorioCliente['formato']) => {
      try {
        setIsLoading(true)

        let dados: any = null
        let nomeArquivo = ''

        switch (tipo) {
          case 'PERFIL':
            dados = relatorioClientes?.dados
            nomeArquivo = `relatorio-clientes-${new Date().toISOString().split('T')[0]}`
            break
          case 'FREQUENCIA':
            dados = relatorioFrequencia?.dados
            nomeArquivo = `relatorio-frequencia-${new Date().toISOString().split('T')[0]}`
            break
          case 'FIDELIZACAO':
            dados = relatorioFidelizacao?.dados
            nomeArquivo = `relatorio-fidelizacao-${new Date().toISOString().split('T')[0]}`
            break
          case 'SEGMENTACAO':
            dados = relatorioSegmentacao?.dados
            nomeArquivo = `relatorio-segmentacao-${new Date().toISOString().split('T')[0]}`
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
    [relatorioClientes, relatorioFrequencia, relatorioFidelizacao, relatorioSegmentacao]
  )

  // Limpar relatórios
  const limparRelatorios = useCallback(() => {
    setRelatorioClientes(null)
    setRelatorioFrequencia(null)
    setRelatorioFidelizacao(null)
    setRelatorioSegmentacao(null)
    setIsError(false)
    setError(null)
  }, [])

  return {
    // Estados
    isLoading,
    isError,
    error,

    // Dados
    relatorioClientes,
    relatorioFrequencia,
    relatorioFidelizacao,
    relatorioSegmentacao,

    // Ações
    gerarRelatorioClientes,
    gerarRelatorioFrequencia,
    gerarRelatorioFidelizacao,
    gerarRelatorioSegmentacao,
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
