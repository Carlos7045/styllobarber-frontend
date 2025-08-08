
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Dashboard financeiro simplificado com dados mockados

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, RefreshCw, Calendar, User, Filter, FileText } from '@/shared/utils/optimized-imports'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { BarberDashboard } from './BarberDashboard'
import { useBarberPermissions } from '@/domains/users/hooks/use-barber-permissions'
import { useFinancialData } from '@/shared/hooks/data/use-financial-data'
import { DataSourceIndicator, useDataSource } from './DataSourceIndicator'


// Dados mockados removidos - agora usando dados reais

// Componente de Card de Métrica
const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  format = 'currency',
  trend 
}: {
  title: string
  value: number
  previousValue?: number
  icon: any
  format?: 'currency' | 'number' | 'percentage'
  trend?: 'up' | 'down' | 'neutral'
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
        return val.toLocaleString('pt-BR')
      default:
        return val.toString()
    }
  }

  const variation = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0

  const calculatedTrend = trend || (variation > 0 ? 'up' : variation < 0 ? 'down' : 'neutral')

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatValue(value)}
            </p>
            {previousValue !== undefined && (
              <div className="flex items-center space-x-1">
                {calculatedTrend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : calculatedTrend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : null}
                <span className={`text-sm font-medium ${trendColors[calculatedTrend]}`}>
                  {Math.abs(variation).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs período anterior
                </span>
              </div>
            )}
          </div>
          <div className="p-4 rounded-xl bg-primary-gold/10 shadow-lg">
            <Icon className="h-8 w-8 text-primary-gold" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-secondary-graphite-light p-3 border border-gray-200 dark:border-secondary-graphite rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Componente principal
export const FinancialDashboardSimple = () => {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  const [selectedBarbeiro, setSelectedBarbeiro] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  // Verificar se é barbeiro para mostrar dashboard específico
  const { isBarber, isAdmin } = useBarberPermissions()
  
  // Buscar dados financeiros reais
  const financialData = useFinancialData(selectedPeriod)

  // Se for barbeiro (não admin), mostrar dashboard específico
  if (isBarber && !isAdmin) {
    return <BarberDashboard />
  }

  const handleRefresh = () => {
    setLastRefresh(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header Moderno */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
            <DollarSign className="h-10 w-10 text-primary-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard Financeiro
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              Visão geral das finanças da barbearia
            </p>
          </div>
        </div>
        <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-center justify-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-secondary-graphite-light px-3 py-1 rounded-full border">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/financeiro/receitas')}
            className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Receitas</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/financeiro/relatorios')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Relatórios</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-gold/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary-gold" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Filtros</span>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-primary-gold" />
              <div className="flex space-x-2">
                {['hoje', 'semana', 'mes', 'trimestre', 'ano'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={`text-xs capitalize font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                      selectedPeriod === period 
                        ? 'bg-gradient-to-r from-primary-gold to-primary-gold-dark text-primary-black shadow-lg transform scale-105' 
                        : 'bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {period === 'mes' ? 'Este Mês' : period}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-primary-gold" />
              <select
                value={selectedBarbeiro}
                onChange={(e) => setSelectedBarbeiro(e.target.value)}
                className="text-sm border-2 border-gray-300 dark:border-secondary-graphite-card/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-primary-gold bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white font-semibold shadow-sm hover:shadow-md transition-all duration-300"
              >
                <option value="">Todos os barbeiros</option>
                {financialData.barbeiros.map((barbeiro) => (
                  <option key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Bruta"
          value={financialData.loading ? 0 : financialData.metricas.receitaBruta}
          previousValue={financialData.loading ? 0 : financialData.metricasAnteriores.receitaBruta}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Receita Líquida"
          value={financialData.loading ? 0 : financialData.metricas.receitaLiquida}
          previousValue={financialData.loading ? 0 : financialData.metricasAnteriores.receitaLiquida}
          icon={TrendingUp}
          format="currency"
        />
        <MetricCard
          title="Despesas Totais"
          value={financialData.loading ? 0 : financialData.metricas.despesasTotal}
          previousValue={financialData.loading ? 0 : financialData.metricasAnteriores.despesasTotal}
          icon={TrendingDown}
          format="currency"
          trend="down"
        />
        <MetricCard
          title="Lucro Líquido"
          value={financialData.loading ? 0 : financialData.metricas.lucroLiquido}
          previousValue={financialData.loading ? 0 : financialData.metricasAnteriores.lucroLiquido}
          icon={Calculator}
          format="currency"
        />
      </div>

      {/* Indicador de erro se houver */}
      {financialData.error && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <p className="text-orange-800 dark:text-orange-200 font-medium">
              {financialData.error}
            </p>
          </div>
        </div>
      )}

      {/* Indicadores de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Indicadores de Performance
          </h2>
          <DataSourceIndicator 
            source={useDataSource(
              !financialData.loading && financialData.metricas.numeroAtendimentos > 0,
              financialData.error !== null
            )}
            size="sm"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {financialData.loading ? '...' : `R$ ${financialData.metricas.ticketMedio.toFixed(2)}`}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Atendimentos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {financialData.loading ? '...' : financialData.metricas.numeroAtendimentos}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Taxa de Crescimento</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {financialData.loading ? '...' : `${financialData.metricas.taxaCrescimento.toFixed(1)}%`}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-orange-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Margem de Lucro</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {financialData.loading ? '...' : 
                    financialData.metricas.receitaBruta > 0 
                      ? `${((financialData.metricas.lucroLiquido / financialData.metricas.receitaBruta) * 100).toFixed(1)}%`
                      : '0%'
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl shadow-lg">
                <Calculator className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Acesso Rápido aos Relatórios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acesso Rápido aos Relatórios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:border-green-300 dark:hover:border-green-600"
            onClick={() => router.push('/dashboard/financeiro/receitas')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shadow-sm">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Receitas</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Análise detalhada</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:border-blue-300 dark:hover:border-blue-600"
            onClick={() => router.push('/dashboard/financeiro/relatorios')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Relatórios</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Centro completo</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:border-red-300 dark:hover:border-red-600"
            onClick={() => router.push('/dashboard/financeiro/despesas')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shadow-sm">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Despesas</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Controle de gastos</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:border-purple-300 dark:hover:border-purple-600"
            onClick={() => router.push('/dashboard/financeiro/comissoes')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shadow-sm">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Comissões</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Performance</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:border-indigo-300 dark:hover:border-indigo-600"
            onClick={() => router.push('/dashboard/financeiro/fluxo-caixa')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg shadow-sm">
                <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Fluxo de Caixa</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Tempo real</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-600 hover:border-green-400 dark:hover:border-green-500"
            onClick={() => router.push('/dashboard/financeiro/pdv')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-200 dark:bg-green-800/50 rounded-lg shadow-sm">
                <Calculator className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-200">PDV</h3>
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">Registro rápido</p>
              </div>
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análise Temporal
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Evolução */}
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 bg-primary-gold/10 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-primary-gold" />
                </div>
                Evolução Financeira
              </h3>
              <DataSourceIndicator 
                source={useDataSource(
                  financialData.evolucaoTemporal.length > 0 && 
                  financialData.evolucaoTemporal.some(item => item.receitas > 0)
                )}
                size="sm"
              />
            </div>
            <div className="h-80">
              {financialData.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-gold"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialData.evolucaoTemporal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" className="dark:stroke-gray-600" />
                    <XAxis dataKey="mes" stroke="#374151" className="dark:stroke-gray-300" fontSize={12} />
                    <YAxis 
                      stroke="#374151" 
                      className="dark:stroke-gray-300"
                      fontSize={12}
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        }).format(value)
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      stroke="#10B981"
                      strokeWidth={4}
                      name="Receitas"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke="#F59E0B"
                      strokeWidth={4}
                      name="Despesas"
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#3B82F6"
                      strokeWidth={4}
                      name="Lucro"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Gráfico de Performance dos Barbeiros */}
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 bg-primary-gold/10 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-primary-gold" />
                </div>
                Performance dos Barbeiros
              </h3>
              <DataSourceIndicator 
                source={useDataSource(
                  financialData.performanceBarbeiros.length > 0 && 
                  !financialData.performanceBarbeiros.some(b => b.id.startsWith('fallback-'))
                )}
                size="sm"
              />
            </div>
            <div className="h-80">
              {financialData.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-gold"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.performanceBarbeiros}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" className="dark:stroke-gray-600" />
                    <XAxis 
                      dataKey="nome" 
                      stroke="#374151"
                      className="dark:stroke-gray-300"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#374151"
                      className="dark:stroke-gray-300"
                      fontSize={12}
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        }).format(value)
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="receitaGerada"
                      fill="#8B5CF6"
                      name="Receita Gerada"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Alerta de Comissões Pendentes */}
      {!financialData.loading && financialData.metricas.comissoesPendentes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="p-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                  Comissões Pendentes
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mt-1">
                  Há R$ {financialData.metricas.comissoesPendentes.toFixed(2)} em comissões pendentes de pagamento
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
