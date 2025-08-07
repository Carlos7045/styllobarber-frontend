
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Componente principal do dashboard financeiro

import { useState, useEffect } from 'react'

import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { useMetrics } from '../hooks/use-metrics'
import { getMonthRange } from '../utils'
import { MetricCard, MetricCardsGrid } from './MetricCard'
import { DashboardFilters } from './DashboardFilters'
import { 
  EvolutionChart, 
  RevenueAreaChart, 
  BarberPerformanceChart,
  ChartsGrid 
} from './FinancialCharts'
import type { DateRange } from '../types'

interface FinancialDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export const FinancialDashboard = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutos
}: FinancialDashboardProps) => {
  const [periodo, setPeriodo] = useState<DateRange>(getMonthRange())
  const [barbeiroId, setBarbeiroId] = useState<string | undefined>()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const {
    metricas,
    evolucaoTemporal,
    performanceBarbeiros,
    indicadores,
    comparativo,
    barbeiros,
    isLoading,
    isError,
    error,
    refetch
  } = useMetrics({
    periodo,
    barbeiroId,
    autoRefresh,
    refreshInterval
  })

  // Atualizar timestamp do último refresh
  useEffect(() => {
    if (!isLoading) {
      setLastRefresh(new Date())
    }
  }, [isLoading])

  const handleRefresh = () => {
    refetch()
    setLastRefresh(new Date())
  }

  // Preparar dados para os gráficos
  const chartData = evolucaoTemporal || []
  const barberChartData = performanceBarbeiros?.map(p => ({
    nome: p.nome,
    receitaGerada: p.receitaGerada,
    atendimentosRealizados: p.atendimentosRealizados
  })) || []

  if (isError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Erro ao carregar dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                {error?.message || 'Ocorreu um erro inesperado'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 mt-1">
            Visão geral das finanças da barbearia
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <DashboardFilters
        periodo={periodo}
        barbeiroId={barbeiroId}
        barbeiros={barbeiros || []}
        onPeriodoChange={setPeriodo}
        onBarbeiroChange={setBarbeiroId}
        isLoading={isLoading}
      />

      {/* Cards de Métricas Principais */}
      <MetricCardsGrid>
        <MetricCard
          title="Receita Bruta"
          value={metricas?.receitaBruta || 0}
          previousValue={comparativo?.anterior.receitaBruta}
          icon={DollarSign}
          format="currency"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Receita Líquida"
          value={metricas?.receitaLiquida || 0}
          previousValue={comparativo?.anterior.receitaLiquida}
          icon={TrendingUp}
          format="currency"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Despesas Totais"
          value={metricas?.despesasTotal || 0}
          previousValue={comparativo?.anterior.despesasTotal}
          icon={TrendingDown}
          format="currency"
          trend="down" // Despesas menores são melhores
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Lucro Líquido"
          value={metricas?.lucroLiquido || 0}
          previousValue={comparativo?.anterior.lucroLiquido}
          icon={Calculator}
          format="currency"
          isLoading={isLoading}
        />
      </MetricCardsGrid>

      {/* Cards de Indicadores de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Indicadores de Performance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                  ) : (
                    `R$ ${(metricas?.ticketMedio || 0).toFixed(2)}`
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atendimentos</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  ) : (
                    metricas?.numeroAtendimentos || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Crescimento</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  ) : (
                    `${(metricas?.taxaCrescimento || 0).toFixed(1)}%`
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margem de Lucro</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  ) : (
                    `${(indicadores?.margemLucro || 0).toFixed(1)}%`
                  )}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Gráficos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Análise Temporal
        </h2>
        
        <ChartsGrid>
          <EvolutionChart
            data={chartData}
            isLoading={isLoading}
          />
          
          <RevenueAreaChart
            data={chartData}
            isLoading={isLoading}
          />
        </ChartsGrid>
      </motion.div>

      {/* Performance dos Barbeiros (só mostra se não há filtro por barbeiro) */}
      {!barbeiroId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance dos Barbeiros
          </h2>
          
          <BarberPerformanceChart
            data={barberChartData}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Resumo de Comissões Pendentes */}
      {metricas && metricas.comissoesPendentes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  Comissões Pendentes
                </h3>
                <p className="text-orange-700 mt-1">
                  Há R$ {metricas.comissoesPendentes.toFixed(2)} em comissões pendentes de pagamento
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
