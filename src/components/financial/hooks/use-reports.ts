// Hook para gerenciar relatórios financeiros
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReportsServiceHybrid as ReportsService } from '../services/reports-service-hybrid'
import { getMonthRange } from '../utils'
import type { 
  ConfigRelatorio,
  RelatorioReceitas,
  RelatorioDespesas,
  RelatorioComissoes,
  DREData,
  DateRange
} from '../types'

interface UseReportsOptions {
  autoLoad?: boolean
  cacheTime?: number
}

interface UseReportsReturn {
  // Estados
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Dados dos relatórios
  relatorioReceitas: {
    dados: RelatorioReceitas[]
    resumo: any
  } | null
  relatorioDespesas: {
    dados: RelatorioDespesas[]
    resumo: any
  } | null
  relatorioComissoes: {
    dados: RelatorioComissoes[]
    resumo: any
  } | null
  dreData: DREData | null

  // Ações
  gerarRelatorioReceitas: (config: ConfigRelatorio) => Promise<void>
  gerarRelatorioDespesas: (config: ConfigRelatorio) => Promise<void>
  gerarRelatorioComissoes: (config: ConfigRelatorio) => Promise<void>
  gerarDRE: (periodo: DateRange) => Promise<void>
  exportarRelatorio: (tipo: ConfigRelatorio['tipo'], formato: ConfigRelatorio['formato']) => Promise<void>
  limparRelatorios: () => void
}

export const useReports = (options: UseReportsOptions = {}): UseReportsReturn => {
  const { autoLoad = false, cacheTime = 5 * 60 * 1000 } = options

  // Estados locais
  const [relatorioReceitas, setRelatorioReceitas] = useState<{
    dados: RelatorioReceitas[]
    resumo: any
  } | null>(null)
  
  const [relatorioDespesas, setRelatorioDespesas] = useState<{
    dados: RelatorioDespesas[]
    resumo: any
  } | null>(null)
  
  const [relatorioComissoes, setRelatorioComissoes] = useState<{
    dados: RelatorioComissoes[]
    resumo: any
  } | null>(null)
  
  const [dreData, setDreData] = useState<DREData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Gerar relatório de receitas
  const gerarRelatorioReceitas = useCallback(async (config: ConfigRelatorio) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      const resultado = await ReportsService.gerarRelatorioReceitas(config)
      setRelatorioReceitas(resultado)
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de receitas:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de despesas
  const gerarRelatorioDespesas = useCallback(async (config: ConfigRelatorio) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      const resultado = await ReportsService.gerarRelatorioDespesas(config)
      setRelatorioDespesas(resultado)
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de despesas:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar relatório de comissões
  const gerarRelatorioComissoes = useCallback(async (config: ConfigRelatorio) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      const resultado = await ReportsService.gerarRelatorioComissoes(config)
      setRelatorioComissoes(resultado)
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar relatório de comissões:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gerar DRE
  const gerarDRE = useCallback(async (periodo: DateRange) => {
    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      const resultado = await ReportsService.gerarDRE(periodo)
      setDreData(resultado)
    } catch (err) {
      setIsError(true)
      setError(err as Error)
      console.error('Erro ao gerar DRE:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Exportar relatório
  const exportarRelatorio = useCallback(async (
    tipo: ConfigRelatorio['tipo'], 
    formato: ConfigRelatorio['formato']
  ) => {
    try {
      setIsLoading(true)
      
      let dados: any = null
      let nomeArquivo = ''

      switch (tipo) {
        case 'RECEITAS':
          dados = relatorioReceitas?.dados
          nomeArquivo = `relatorio-receitas-${new Date().toISOString().split('T')[0]}`
          break
        case 'DESPESAS':
          dados = relatorioDespesas?.dados
          nomeArquivo = `relatorio-despesas-${new Date().toISOString().split('T')[0]}`
          break
        case 'COMISSOES':
          dados = relatorioComissoes?.dados
          nomeArquivo = `relatorio-comissoes-${new Date().toISOString().split('T')[0]}`
          break
        case 'DRE':
          dados = dreData
          nomeArquivo = `dre-${new Date().toISOString().split('T')[0]}`
          break
        default:
          throw new Error(`Tipo de relatório ${tipo} não suportado`)
      }

      if (!dados) {
        throw new Error('Nenhum dado disponível para exportação. Gere o relatório primeiro.')
      }

      const blob = await ReportsService.exportarRelatorio(tipo, dados, formato)
      
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
  }, [relatorioReceitas, relatorioDespesas, relatorioComissoes, dreData])

  // Limpar relatórios
  const limparRelatorios = useCallback(() => {
    setRelatorioReceitas(null)
    setRelatorioDespesas(null)
    setRelatorioComissoes(null)
    setDreData(null)
    setIsError(false)
    setError(null)
  }, [])

  return {
    // Estados
    isLoading,
    isError,
    error,

    // Dados
    relatorioReceitas,
    relatorioDespesas,
    relatorioComissoes,
    dreData,

    // Ações
    gerarRelatorioReceitas,
    gerarRelatorioDespesas,
    gerarRelatorioComissoes,
    gerarDRE,
    exportarRelatorio,
    limparRelatorios
  }
}

// Hook simplificado para relatório de receitas
export const useReceitasReport = (config?: ConfigRelatorio) => {
  const { 
    relatorioReceitas, 
    isLoading, 
    isError, 
    error, 
    gerarRelatorioReceitas,
    exportarRelatorio 
  } = useReports()

  const gerarRelatorio = useCallback((customConfig?: ConfigRelatorio) => {
    const finalConfig = customConfig || config || {
      tipo: 'RECEITAS' as const,
      periodo: getMonthRange(),
      filtros: {},
      formato: 'CSV' as const
    }
    return gerarRelatorioReceitas(finalConfig)
  }, [config, gerarRelatorioReceitas])

  const exportar = useCallback((formato: ConfigRelatorio['formato']) => {
    return exportarRelatorio('RECEITAS', formato)
  }, [exportarRelatorio])

  return {
    dados: relatorioReceitas,
    isLoading,
    isError,
    error,
    gerar: gerarRelatorio,
    exportar
  }
}

// Hook simplificado para relatório de despesas
export const useDespesasReport = (config?: ConfigRelatorio) => {
  const { 
    relatorioDespesas, 
    isLoading, 
    isError, 
    error, 
    gerarRelatorioDespesas,
    exportarRelatorio 
  } = useReports()

  const gerarRelatorio = useCallback((customConfig?: ConfigRelatorio) => {
    const finalConfig = customConfig || config || {
      tipo: 'DESPESAS' as const,
      periodo: getMonthRange(),
      filtros: {},
      formato: 'CSV' as const
    }
    return gerarRelatorioDespesas(finalConfig)
  }, [config, gerarRelatorioDespesas])

  const exportar = useCallback((formato: ConfigRelatorio['formato']) => {
    return exportarRelatorio('DESPESAS', formato)
  }, [exportarRelatorio])

  return {
    dados: relatorioDespesas,
    isLoading,
    isError,
    error,
    gerar: gerarRelatorio,
    exportar
  }
}

// Hook simplificado para DRE
export const useDREReport = (periodo?: DateRange) => {
  const { 
    dreData, 
    isLoading, 
    isError, 
    error, 
    gerarDRE,
    exportarRelatorio 
  } = useReports()

  const gerarRelatorio = useCallback((customPeriodo?: DateRange) => {
    const finalPeriodo = customPeriodo || periodo || getMonthRange()
    return gerarDRE(finalPeriodo)
  }, [periodo, gerarDRE])

  const exportar = useCallback((formato: ConfigRelatorio['formato']) => {
    return exportarRelatorio('DRE', formato)
  }, [exportarRelatorio])

  return {
    dados: dreData,
    isLoading,
    isError,
    error,
    gerar: gerarRelatorio,
    exportar
  }
}
