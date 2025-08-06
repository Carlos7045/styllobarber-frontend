// Hook para gerenciar métricas financeiras
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MetricsService } from '../services/metrics-service'
import { getMonthRange } from '../utils'
import type { 
  MetricasFinanceiras, 
  PerformanceBarbeiro, 
  DateRange 
} from '../types'

interface UseMetricsOptions {
  periodo?: DateRange
  barbeiroId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseMetricsReturn {
  // Dados
  metricas: MetricasFinanceiras | undefined
  evolucaoTemporal: Array<{
    mes: string
    receitas: number
    despesas: number
    lucro: number
  }> | undefined
  performanceBarbeiros: PerformanceBarbeiro[] | undefined
  indicadores: {
    ticketMedio: number
    crescimentoMensal: number
    eficienciaOperacional: number
    margemLucro: number
  } | undefined
  comparativo: {
    atual: MetricasFinanceiras
    anterior: MetricasFinanceiras
    variacao: {
      receita: number
      despesas: number
      lucro: number
      atendimentos: number
    }
  } | undefined
  barbeiros: Array<{ id: string; nome: string }> | undefined

  // Estados
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Ações
  refetch: () => void
  setPeriodo: (periodo: DateRange) => void
  setBarbeiroId: (barbeiroId?: string) => void
}

export const useMetrics = (options: UseMetricsOptions = {}): UseMetricsReturn => {
  const {
    periodo: initialPeriodo = getMonthRange(),
    barbeiroId: initialBarbeiroId,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutos
  } = options

  const [periodo, setPeriodo] = useState<DateRange>(initialPeriodo)
  const [barbeiroId, setBarbeiroId] = useState<string | undefined>(initialBarbeiroId)

  // Query para métricas principais
  const {
    data: metricas,
    isLoading: isLoadingMetricas,
    isError: isErrorMetricas,
    error: errorMetricas,
    refetch: refetchMetricas
  } = useQuery({
    queryKey: ['financial-metrics', periodo, barbeiroId],
    queryFn: () => MetricsService.getMetricasFinanceiras(periodo, barbeiroId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000 // 5 minutos
  })

  // Query para evolução temporal
  const {
    data: evolucaoTemporal,
    isLoading: isLoadingEvolucao,
    refetch: refetchEvolucao
  } = useQuery({
    queryKey: ['financial-evolution', periodo, barbeiroId],
    queryFn: () => MetricsService.getEvolucaoTemporal(periodo, barbeiroId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000
  })

  // Query para performance dos barbeiros
  const {
    data: performanceBarbeiros,
    isLoading: isLoadingPerformance,
    refetch: refetchPerformance
  } = useQuery({
    queryKey: ['barber-performance', periodo],
    queryFn: () => MetricsService.getPerformanceBarbeiros(periodo),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000,
    enabled: !barbeiroId // Só busca se não há filtro por barbeiro específico
  })

  // Query para indicadores de performance
  const {
    data: indicadores,
    isLoading: isLoadingIndicadores,
    refetch: refetchIndicadores
  } = useQuery({
    queryKey: ['performance-indicators', periodo, barbeiroId],
    queryFn: () => MetricsService.getIndicadoresPerformance(periodo, barbeiroId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000
  })

  // Query para comparativo de períodos
  const {
    data: comparativo,
    isLoading: isLoadingComparativo,
    refetch: refetchComparativo
  } = useQuery({
    queryKey: ['period-comparison', periodo, barbeiroId],
    queryFn: () => MetricsService.getComparativoPeriodos(periodo, barbeiroId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 2 * 60 * 1000
  })

  // Query para lista de barbeiros
  const {
    data: barbeiros,
    isLoading: isLoadingBarbeiros
  } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: () => MetricsService.getBarbeiros(),
    staleTime: 10 * 60 * 1000, // 10 minutos (dados mais estáveis)
    gcTime: 30 * 60 * 1000 // 30 minutos
  })

  // Estados consolidados
  const isLoading = isLoadingMetricas || 
                   isLoadingEvolucao || 
                   isLoadingPerformance || 
                   isLoadingIndicadores || 
                   isLoadingComparativo || 
                   isLoadingBarbeiros

  const isError = isErrorMetricas
  const error = errorMetricas

  // Função para refetch de todos os dados
  const refetch = useCallback(() => {
    refetchMetricas()
    refetchEvolucao()
    refetchPerformance()
    refetchIndicadores()
    refetchComparativo()
  }, [
    refetchMetricas,
    refetchEvolucao,
    refetchPerformance,
    refetchIndicadores,
    refetchComparativo
  ])

  // Atualizar período automaticamente se não foi especificado
  useEffect(() => {
    if (!options.periodo) {
      const currentMonthRange = getMonthRange()
      if (currentMonthRange.inicio !== periodo.inicio || 
          currentMonthRange.fim !== periodo.fim) {
        setPeriodo(currentMonthRange)
      }
    }
  }, [options.periodo, periodo])

  return {
    // Dados
    metricas,
    evolucaoTemporal,
    performanceBarbeiros,
    indicadores,
    comparativo,
    barbeiros,

    // Estados
    isLoading,
    isError,
    error,

    // Ações
    refetch,
    setPeriodo,
    setBarbeiroId
  }
}

// Hook simplificado para métricas básicas
export const useBasicMetrics = (periodo?: DateRange, barbeiroId?: string) => {
  const { metricas, isLoading, isError, error, refetch } = useMetrics({
    periodo,
    barbeiroId,
    autoRefresh: true
  })

  return {
    metricas,
    isLoading,
    isError,
    error,
    refetch
  }
}

// Hook para gráficos de evolução
export const useEvolutionCharts = (periodo?: DateRange, barbeiroId?: string) => {
  const { evolucaoTemporal, isLoading, refetch } = useMetrics({
    periodo,
    barbeiroId
  })

  return {
    data: evolucaoTemporal,
    isLoading,
    refetch
  }
}

// Hook para comparativos
export const useComparison = (periodo?: DateRange, barbeiroId?: string) => {
  const { comparativo, isLoading, refetch } = useMetrics({
    periodo,
    barbeiroId
  })

  return {
    comparativo,
    isLoading,
    refetch
  }
}
