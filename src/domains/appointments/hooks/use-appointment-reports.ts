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

// Dados reais serão buscados do banco de dados

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

      // Buscar dados reais do banco de dados
      // TODO: Implementar busca real de dados de ocupação
      
      // Por enquanto, retornar dados vazios até implementar a busca real
      const dadosReais: RelatorioOcupacao[] = []
      
      const resumo = {
        totalBarbeiros: 0,
        taxaOcupacaoMedia: 0,
        totalAgendamentos: 0,
        agendamentosConcluidos: 0,
        agendamentosCancelados: 0,
        receitaTotal: 0,
        barbeiroMaisOcupado: 'Nenhum',
      }

      setRelatorioOcupacao({ dados: dadosReais, resumo })
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

      // Buscar dados reais do banco de dados
      // TODO: Implementar busca real de dados de performance
      
      // Por enquanto, retornar dados vazios até implementar a busca real
      const dadosReais: RelatorioPerformance[] = []
      
      const resumo = {
        totalBarbeiros: 0,
        totalAtendimentos: 0,
        tempoMedioAtendimento: 0,
        satisfacaoMedia: 0,
        taxaCancelamentoMedia: 0,
        receitaTotal: 0,
        eficienciaMedia: 0,
        melhorPerformance: 'Nenhum',
      }

      setRelatorioPerformance({ dados: dadosReais, resumo })
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

      // Buscar dados reais do banco de dados
      // TODO: Implementar busca real de dados de horários
      
      // Por enquanto, retornar dados vazios até implementar a busca real
      const dadosReais: RelatorioHorarios[] = []
      
      const resumo = {
        totalHorarios: 0,
        totalAgendamentos: 0,
        taxaOcupacaoMedia: 0,
        receitaTotal: 0,
        tempoMedioEspera: 0,
        satisfacaoMedia: 0,
        horarioMaisOcupado: 'Nenhum',
      }

      setRelatorioHorarios({ dados: dadosReais, resumo })
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

      // Buscar dados reais do banco de dados
      // TODO: Implementar busca real de dados de cancelamentos
      
      // Por enquanto, retornar dados vazios até implementar a busca real
      const dadosReais: RelatorioCancelamentos[] = []
      
      const resumo = {
        totalDias: 0,
        totalCancelamentos: 0,
        taxaCancelamentoMedia: 0,
        receitaPerdidaTotal: 0,
        motivoPrincipal: 'Nenhum',
        tendenciaGeral: 'Estável' as const,
        diaMaisCancelamentos: 'Nenhum',
      }

      setRelatorioCancelamentos({ dados: dadosReais, resumo })
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
