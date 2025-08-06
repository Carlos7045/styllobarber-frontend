// Componentes de gráficos para o dashboard financeiro
'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card } from '@/shared/components/ui'
import { formatCurrency } from '../utils'

// Cores para os gráficos
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F97316',
  info: '#06B6D4',
  purple: '#8B5CF6'
}

// Tooltip customizado para valores monetários
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-secondary-graphite-light p-3 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Gráfico de evolução temporal (linha)
interface EvolutionChartProps {
  data: Array<{
    mes: string
    receitas: number
    despesas: number
    lucro: number
  }>
  isLoading?: boolean
  className?: string
}

export const EvolutionChart = ({ 
  data, 
  isLoading = false, 
  className = '' 
}: EvolutionChartProps) => {
  // Formatar dados para exibição
  const formattedData = data.map(item => ({
    ...item,
    mes: new Date(item.mes + '-01').toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    })
  }))

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evolução Financeira
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="mes" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Line
                type="monotone"
                dataKey="receitas"
                stroke={CHART_COLORS.success}
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              <Line
                type="monotone"
                dataKey="despesas"
                stroke={CHART_COLORS.danger}
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: CHART_COLORS.danger, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              <Line
                type="monotone"
                dataKey="lucro"
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                name="Lucro"
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

// Gráfico de área para receitas vs despesas
interface RevenueAreaChartProps {
  data: Array<{
    mes: string
    receitas: number
    despesas: number
  }>
  isLoading?: boolean
  className?: string
}

export const RevenueAreaChart = ({ 
  data, 
  isLoading = false, 
  className = '' 
}: RevenueAreaChartProps) => {
  const formattedData = data.map(item => ({
    ...item,
    mes: new Date(item.mes + '-01').toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    })
  }))

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Receitas vs Despesas
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="mes" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                type="monotone"
                dataKey="receitas"
                stackId="1"
                stroke={CHART_COLORS.success}
                fill={CHART_COLORS.success}
                fillOpacity={0.6}
                name="Receitas"
              />
              
              <Area
                type="monotone"
                dataKey="despesas"
                stackId="2"
                stroke={CHART_COLORS.danger}
                fill={CHART_COLORS.danger}
                fillOpacity={0.6}
                name="Despesas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

// Gráfico de barras para performance dos barbeiros
interface BarberPerformanceChartProps {
  data: Array<{
    nome: string
    receitaGerada: number
    atendimentosRealizados: number
  }>
  isLoading?: boolean
  className?: string
}

export const BarberPerformanceChart = ({ 
  data, 
  isLoading = false, 
  className = '' 
}: BarberPerformanceChartProps) => {
  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance dos Barbeiros
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="nome" 
                stroke="#6B7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar
                dataKey="receitaGerada"
                fill={CHART_COLORS.primary}
                name="Receita Gerada"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

// Gráfico de pizza para distribuição de receitas
interface RevenueDistributionChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  isLoading?: boolean
  className?: string
}

export const RevenueDistributionChart = ({ 
  data, 
  isLoading = false, 
  className = '' 
}: RevenueDistributionChartProps) => {
  const colors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.purple,
    CHART_COLORS.info,
    CHART_COLORS.danger
  ]

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }))

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribuição de Receitas
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => 
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

// Container para grid de gráficos
interface ChartsGridProps {
  children: React.ReactNode
  className?: string
}

export const ChartsGrid = ({ 
  children, 
  className = '' 
}: ChartsGridProps) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  )
}
