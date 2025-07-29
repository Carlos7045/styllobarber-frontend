// Hook para gerenciar relatórios de agendamentos
import { useState, useCallback } from 'react'
import { getMonthRange } from '@/components/financial/utils'

// Tipos para relatórios de agendamentos
export interface AgendamentoRelatorio {
  id: string
  clienteNome: string
  barbeiroNome: string
  servicoNome: string
  dataHora: string
  duracao: number // em minutos
  valor: number
  status: 'Agendado' | 'Confirmado' | 'Em Andamento' | 'Concluído' | 'Cancelado' | 'Não Compareceu'
  horarioPreferido: 'Manhã' | 'Tarde' | 'Noite'
  diaSemana: string
  tempoEspera: number // em minutos
  satisfacao?: number // 1-5
}

export interface RelatorioOcupacao {
  barbeiroId: string
  barbeiroNome: string
  totalHorasDisponiveis: number
  totalHorasOcupadas: number
  taxaOcupacao: number
  totalAgendamentos: number
  agendamentosConcluidos: number
  agendamentosCancelados: number
  receita: number
  horarioMaisOcupado: string
  diaMaisOcupado: string
}

export interface RelatorioPerformance {
  barbeiroId: string
  barbeiroNome: string
  totalAtendimentos: number
  tempoMedioAtendimento: number
  satisfacaoMedia: number
  taxaCancelamento: number
  taxaNaoComparecimento: number
  receitaTotal: number
  receitaMedia: number
  clientesUnicos: number
  clientesRecorrentes: number
  eficiencia: number // baseado em tempo vs valor
}

export interface RelatorioHorarios {
  horario: string
  totalAgendamentos: number
  taxaOcupacao: number
  receita: number
  servicoMaisComum: string
  tempoMedioEspera: number
  satisfacaoMedia: number
  diaSemana: string
}

export interface RelatorioCancelamentos {
  data: string
  totalCancelamentos: number
  motivoPrincipal: string
  barbeiroMaisAfetado: string
  horarioMaisAfetado: string
  receitaPerdida: number
  taxaCancelamento: number
  tendencia: 'Crescente' | 'Estável' | 'Decrescente'
}

export interface DateRange {
  inicio: string
  fim: string
}

export interface ConfigRelatorioAgendamento {
  tipo: 'OCUPACAO' | 'PERFORMANCE' | 'HORARIOS' | 'CANCELAMENTOS'
  periodo: DateRange
  filtros: {
    barbeiroId?: string
    servicoId?: string
    status?: string
    horarioInicio?: string
    horarioFim?: string
  }
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

interface UseAppointmentReportsReturn {
  // Estados
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Dados dos relatórios
  relatorioOcupacao: {
    dados: RelatorioOcupacao[]
    resumo: any
  } | null
  relatorioPerformance: {
    dados: RelatorioPerformance[]
    resumo: any
  } | null
  relatorioHorarios: {
    dados: RelatorioHorarios[]
    resumo: any
  } | null
  relatorioCancelamentos: {
    dados: RelatorioCancelamentos[]
    resumo: any
  } | null

  // Ações
  gerarRelatorioOcupacao: (config: ConfigRelatorioAgendamento) => Promise<void>
  gerarRelatorioPerformance: (config: ConfigRelatorioAgendamento) => Promise<void>
  gerarRelatorioHorarios: (config: ConfigRelatorioAgendamento) => Promise<void>
  gerarRelatorioCancelamentos: (config: ConfigRelatorioAgendamento) => Promise<void>
  exportarRelatorio: (
    tipo: ConfigRelatorioAgendamento['tipo'],
    formato: ConfigRelatorioAgendamento['formato']
  ) => Promise<void>
  limparRelatorios: () => void
}

// Dados mockados para desenvolvimento
const mockOcupacaoData: RelatorioOcupacao[] = [
  {
    barbeiroId: '1',
    barbeiroNome: 'Carlos Santos',
    totalHorasDisponiveis: 160,
    totalHorasOcupadas: 128,
    taxaOcupacao: 80,
    totalAgendamentos: 64,
    agendamentosConcluidos: 58,
    agendamentosCancelados: 6,
    receita: 2900.0,
    horarioMaisOcupado: '14:00-16:00',
    diaMaisOcupado: 'Sábado',
  },
  {
    barbeiroId: '2',
    barbeiroNome: 'Roberto Lima',
    totalHorasDisponiveis: 160,
    totalHorasOcupadas: 112,
    taxaOcupacao: 70,
    totalAgendamentos: 56,
    agendamentosConcluidos: 50,
    agendamentosCancelados: 6,
    receita: 2500.0,
    horarioMaisOcupado: '16:00-18:00',
    diaMaisOcupado: 'Sexta-feira',
  },
]

const mockPerformanceData: RelatorioPerformance[] = [
  {
    barbeiroId: '1',
    barbeiroNome: 'Carlos Santos',
    totalAtendimentos: 58,
    tempoMedioAtendimento: 45,
    satisfacaoMedia: 4.8,
    taxaCancelamento: 9.4,
    taxaNaoComparecimento: 3.1,
    receitaTotal: 2900.0,
    receitaMedia: 50.0,
    clientesUnicos: 42,
    clientesRecorrentes: 16,
    eficiencia: 92,
  },
  {
    barbeiroId: '2',
    barbeiroNome: 'Roberto Lima',
    totalAtendimentos: 50,
    tempoMedioAtendimento: 40,
    satisfacaoMedia: 4.6,
    taxaCancelamento: 10.7,
    taxaNaoComparecimento: 3.6,
    receitaTotal: 2500.0,
    receitaMedia: 50.0,
    clientesUnicos: 38,
    clientesRecorrentes: 12,
    eficiencia: 88,
  },
]

const mockHorariosData: RelatorioHorarios[] = [
  {
    horario: '09:00',
    totalAgendamentos: 20,
    taxaOcupacao: 83,
    receita: 1000.0,
    servicoMaisComum: 'Corte Masculino',
    tempoMedioEspera: 5,
    satisfacaoMedia: 4.7,
    diaSemana: 'Segunda-feira',
  },
  {
    horario: '14:00',
    totalAgendamentos: 35,
    taxaOcupacao: 95,
    receita: 1750.0,
    servicoMaisComum: 'Corte + Barba',
    tempoMedioEspera: 8,
    satisfacaoMedia: 4.8,
    diaSemana: 'Sábado',
  },
  {
    horario: '16:00',
    totalAgendamentos: 32,
    taxaOcupacao: 89,
    receita: 1600.0,
    servicoMaisComum: 'Corte Premium',
    tempoMedioEspera: 6,
    satisfacaoMedia: 4.9,
    diaSemana: 'Sexta-feira',
  },
]

const mockCancelamentosData: RelatorioCancelamentos[] = [
  {
    data: '2024-01-15',
    totalCancelamentos: 8,
    motivoPrincipal: 'Imprevisto pessoal',
    barbeiroMaisAfetado: 'Carlos Santos',
    horarioMaisAfetado: '14:00',
    receitaPerdida: 400.0,
    taxaCancelamento: 12.5,
    tendencia: 'Estável',
  },
  {
    data: '2024-01-16',
    totalCancelamentos: 5,
    motivoPrincipal: 'Doença',
    barbeiroMaisAfetado: 'Roberto Lima',
    horarioMaisAfetado: '16:00',
    receitaPerdida: 250.0,
    taxaCancelamento: 8.9,
    tendencia: 'Decrescente',
  },
]

export const useAppointmentReports = (): UseAppointmentReportsReturn => {
  // Estados locais
  const [relatorioOcupacao, setRelatorioOcupacao] = useState<{
    dados: RelatorioOcupacao[]
    resumo: any
  } | null>(null)

  const [relatorioPerformance, setRelatorioPerformance] = useState<{
    dados: RelatorioPerformance[]
    resumo: any
  } | null>(null)

  const [relatorioHorarios, setRelatorioHorarios] = useState<{
    dados: RelatorioHorarios[]
    resumo: any
  } | null>(null)

  const [relatorioCancelamentos, setRelatorioCancelamentos] = useState<{
    dados: RelatorioCancelamentos[]
    resumo: any
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Gerar relatório de ocupação
  const gerarRelatorioOcupacao = useCallback(async (config: ConfigRelatorioAgendamento) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aplicar filtros nos dados mockados
      let dadosFiltrados = [...mockOcupacaoData]

      if (config.filtros.barbeiroId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.barbeiroId === config.filtros.barbeiroId
        )
      }

      // Calcular resumo
      const resumo = {
        totalBarbeiros: dadosFiltrados.length,
        taxaOcupacaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.taxaOcupacao, 0) / dadosFiltrados.length,
        totalAgendamentos: dadosFiltrados.reduce((sum, item) => sum + item.totalAgendamentos, 0),
        agendamentosConcluidos: dadosFiltrados.reduce(
          (sum, item) => sum + item.agendamentosConcluidos,
          0
        ),
        agendamentosCancelados: dadosFiltrados.reduce(
          (sum, item) => sum + item.agendamentosCancelados,
          0
        ),
        receitaTotal: dadosFiltrados.reduce((sum, item) => sum + item.receita, 0),
        barbeiroMaisOcupado: dadosFiltrados.reduce((prev, current) =>
          prev.taxaOcupacao > current.taxaOcupacao ? prev : current
        ).barbeiroNome,
      }

      setRelatorioOcupacao({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de ocupação:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de performance
  const gerarRelatorioPerformance = useCallback(async (config: ConfigRelatorioAgendamento) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      let dadosFiltrados = [...mockPerformanceData]

      if (config.filtros.barbeiroId) {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.barbeiroId === config.filtros.barbeiroId
        )
      }

      const resumo = {
        totalBarbeiros: dadosFiltrados.length,
        totalAtendimentos: dadosFiltrados.reduce((sum, item) => sum + item.totalAtendimentos, 0),
        tempoMedioAtendimento:
          dadosFiltrados.reduce((sum, item) => sum + item.tempoMedioAtendimento, 0) /
          dadosFiltrados.length,
        satisfacaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.satisfacaoMedia, 0) /
          dadosFiltrados.length,
        taxaCancelamentoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.taxaCancelamento, 0) /
          dadosFiltrados.length,
        receitaTotal: dadosFiltrados.reduce((sum, item) => sum + item.receitaTotal, 0),
        eficienciaMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.eficiencia, 0) / dadosFiltrados.length,
        melhorPerformance: dadosFiltrados.reduce((prev, current) =>
          prev.eficiencia > current.eficiencia ? prev : current
        ).barbeiroNome,
      }

      setRelatorioPerformance({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de performance:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de horários
  const gerarRelatorioHorarios = useCallback(async (config: ConfigRelatorioAgendamento) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      let dadosFiltrados = [...mockHorariosData]

      // Filtrar por horário se especificado
      if (config.filtros.horarioInicio && config.filtros.horarioFim) {
        dadosFiltrados = dadosFiltrados.filter((item) => {
          const horario = parseInt(item.horario.split(':')[0])
          const inicio = parseInt(config.filtros.horarioInicio!.split(':')[0])
          const fim = parseInt(config.filtros.horarioFim!.split(':')[0])
          return horario >= inicio && horario <= fim
        })
      }

      const resumo = {
        totalHorarios: dadosFiltrados.length,
        totalAgendamentos: dadosFiltrados.reduce((sum, item) => sum + item.totalAgendamentos, 0),
        taxaOcupacaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.taxaOcupacao, 0) / dadosFiltrados.length,
        receitaTotal: dadosFiltrados.reduce((sum, item) => sum + item.receita, 0),
        tempoMedioEspera:
          dadosFiltrados.reduce((sum, item) => sum + item.tempoMedioEspera, 0) /
          dadosFiltrados.length,
        satisfacaoMedia:
          dadosFiltrados.reduce((sum, item) => sum + item.satisfacaoMedia, 0) /
          dadosFiltrados.length,
        horarioMaisOcupado: dadosFiltrados.reduce((prev, current) =>
          prev.taxaOcupacao > current.taxaOcupacao ? prev : current
        ).horario,
      }

      setRelatorioHorarios({ dados: dadosFiltrados, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de horários:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de cancelamentos
  const gerarRelatorioCancelamentos = useCallback(async (config: ConfigRelatorioAgendamento) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const resumo = {
        totalDias: mockCancelamentosData.length,
        totalCancelamentos: mockCancelamentosData.reduce(
          (sum, item) => sum + item.totalCancelamentos,
          0
        ),
        taxaCancelamentoMedia:
          mockCancelamentosData.reduce((sum, item) => sum + item.taxaCancelamento, 0) /
          mockCancelamentosData.length,
        receitaPerdidaTotal: mockCancelamentosData.reduce(
          (sum, item) => sum + item.receitaPerdida,
          0
        ),
        motivoPrincipal: 'Imprevisto pessoal',
        tendenciaGeral: 'Estável',
        diaMaisCancelamentos: '2024-01-15',
      }

      setRelatorioCancelamentos({ dados: mockCancelamentosData, resumo })
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de cancelamentos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Exportar relatório
  const exportarRelatorio = useCallback(
    async (
      tipo: ConfigRelatorioAgendamento['tipo'],
      formato: ConfigRelatorioAgendamento['formato']
    ) => {
      try {
        setIsLoading(true)

        let dados: any = null
        let nomeArquivo = ''

        switch (tipo) {
          case 'OCUPACAO':
            dados = relatorioOcupacao?.dados
            nomeArquivo = `relatorio-ocupacao-${new Date().toISOString().split('T')[0]}`
            break
          case 'PERFORMANCE':
            dados = relatorioPerformance?.dados
            nomeArquivo = `relatorio-performance-${new Date().toISOString().split('T')[0]}`
            break
          case 'HORARIOS':
            dados = relatorioHorarios?.dados
            nomeArquivo = `relatorio-horarios-${new Date().toISOString().split('T')[0]}`
            break
          case 'CANCELAMENTOS':
            dados = relatorioCancelamentos?.dados
            nomeArquivo = `relatorio-cancelamentos-${new Date().toISOString().split('T')[0]}`
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
    [relatorioOcupacao, relatorioPerformance, relatorioHorarios, relatorioCancelamentos]
  )

  // Limpar relatórios
  const limparRelatorios = useCallback(() => {
    setRelatorioOcupacao(null)
    setRelatorioPerformance(null)
    setRelatorioHorarios(null)
    setRelatorioCancelamentos(null)
    setIsError(false)
    setError(null)
  }, [])

  return {
    // Estados
    isLoading,
    isError,
    error,

    // Dados
    relatorioOcupacao,
    relatorioPerformance,
    relatorioHorarios,
    relatorioCancelamentos,

    // Ações
    gerarRelatorioOcupacao,
    gerarRelatorioPerformance,
    gerarRelatorioHorarios,
    gerarRelatorioCancelamentos,
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
