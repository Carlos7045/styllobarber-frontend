// Demonstração do dashboard financeiro com dados mockados
'use client'

import { useState } from 'react'
import { FinancialDashboard } from '../components/FinancialDashboard'
import { MetricsService } from '../services/metrics-service'
import { getMonthRange } from '../utils'
import type { 
  MetricasFinanceiras, 
  PerformanceBarbeiro,
  DateRange 
} from '../types'

// Mock dos dados para demonstração
const mockMetricas: MetricasFinanceiras = {
  receitaBruta: 15000,
  receitaLiquida: 12000,
  despesasTotal: 3000,
  lucroLiquido: 9000,
  ticketMedio: 75,
  numeroAtendimentos: 200,
  taxaCrescimento: 15.5,
  comissoesPendentes: 2500
}

const mockEvolucaoTemporal = [
  { mes: '2024-01', receitas: 12000, despesas: 2800, lucro: 9200 },
  { mes: '2024-02', receitas: 13500, despesas: 2900, lucro: 10600 },
  { mes: '2024-03', receitas: 14200, despesas: 3100, lucro: 11100 },
  { mes: '2024-04', receitas: 15000, despesas: 3000, lucro: 12000 }
]

const mockPerformanceBarbeiros: PerformanceBarbeiro[] = [
  {
    barbeiroId: '1',
    nome: 'João Silva',
    mes: '2024-04',
    receitaGerada: 8000,
    comissoesGanhas: 2400,
    atendimentosRealizados: 120,
    ticketMedio: 66.67
  },
  {
    barbeiroId: '2',
    nome: 'Pedro Santos',
    mes: '2024-04',
    receitaGerada: 7000,
    comissoesGanhas: 2100,
    atendimentosRealizados: 80,
    ticketMedio: 87.50
  }
]

const mockBarbeiros = [
  { id: '1', nome: 'João Silva' },
  { id: '2', nome: 'Pedro Santos' },
  { id: '3', nome: 'Carlos Oliveira' }
]

const mockIndicadores = {
  ticketMedio: 75,
  crescimentoMensal: 15.5,
  eficienciaOperacional: 500, // 15000 / 3000 * 100
  margemLucro: 60 // 9000 / 15000 * 100
}

const mockComparativo = {
  atual: mockMetricas,
  anterior: {
    receitaBruta: 13000,
    receitaLiquida: 10400,
    despesasTotal: 2600,
    lucroLiquido: 7800,
    ticketMedio: 68,
    numeroAtendimentos: 191,
    taxaCrescimento: 8.2,
    comissoesPendentes: 2200
  },
  variacao: {
    receita: 15.38, // (15000 - 13000) / 13000 * 100
    despesas: 15.38, // (3000 - 2600) / 2600 * 100
    lucro: 15.38, // (9000 - 7800) / 7800 * 100
    atendimentos: 4.71 // (200 - 191) / 191 * 100
  }
}

// Mock do hook useMetrics
const mockUseMetrics = () => {
  const [periodo, setPeriodo] = useState<DateRange>(getMonthRange())
  const [barbeiroId, setBarbeiroId] = useState<string | undefined>()

  return {
    // Dados mockados
    metricas: mockMetricas,
    evolucaoTemporal: mockEvolucaoTemporal,
    performanceBarbeiros: mockPerformanceBarbeiros,
    indicadores: mockIndicadores,
    comparativo: mockComparativo,
    barbeiros: mockBarbeiros,

    // Estados
    isLoading: false,
    isError: false,
    error: null,

    // Ações
    refetch: () => console.log('Refetch chamado'),
    setPeriodo,
    setBarbeiroId
  }
}

// Componente de demonstração
export const DashboardDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Financeiro - Demonstração
          </h1>
          <p className="text-gray-600">
            Esta é uma demonstração do dashboard financeiro com dados mockados.
          </p>
        </div>

        <FinancialDashboard 
          autoRefresh={false}
          className="space-y-6"
        />
      </div>
    </div>
  )
}

// Mock do serviço para testes
export const mockMetricsService = () => {
  // Sobrescrever métodos do MetricsService para retornar dados mockados
  const originalGetMetricasFinanceiras = MetricsService.getMetricasFinanceiras
  const originalGetEvolucaoTemporal = MetricsService.getEvolucaoTemporal
  const originalGetPerformanceBarbeiros = MetricsService.getPerformanceBarbeiros
  const originalGetIndicadoresPerformance = MetricsService.getIndicadoresPerformance
  const originalGetComparativoPeriodos = MetricsService.getComparativoPeriodos
  const originalGetBarbeiros = MetricsService.getBarbeiros

  MetricsService.getMetricasFinanceiras = async () => mockMetricas
  MetricsService.getEvolucaoTemporal = async () => mockEvolucaoTemporal
  MetricsService.getPerformanceBarbeiros = async () => mockPerformanceBarbeiros
  MetricsService.getIndicadoresPerformance = async () => mockIndicadores
  MetricsService.getComparativoPeriodos = async () => mockComparativo
  MetricsService.getBarbeiros = async () => mockBarbeiros

  // Função para restaurar os métodos originais
  return () => {
    MetricsService.getMetricasFinanceiras = originalGetMetricasFinanceiras
    MetricsService.getEvolucaoTemporal = originalGetEvolucaoTemporal
    MetricsService.getPerformanceBarbeiros = originalGetPerformanceBarbeiros
    MetricsService.getIndicadoresPerformance = originalGetIndicadoresPerformance
    MetricsService.getComparativoPeriodos = originalGetComparativoPeriodos
    MetricsService.getBarbeiros = originalGetBarbeiros
  }
}

export default DashboardDemo