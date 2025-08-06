// Componente para cards de métricas financeiras
'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { formatCurrency, formatPercentage } from '../utils'

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  icon: LucideIcon
  format?: 'currency' | 'number' | 'percentage'
  trend?: 'up' | 'down' | 'neutral'
  isLoading?: boolean
  className?: string
}

export const MetricCard = ({
  title,
  value,
  previousValue,
  icon: Icon,
  format = 'currency',
  trend,
  isLoading = false,
  className = ''
}: MetricCardProps) => {
  // Calcular variação se temos valor anterior
  const variation = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0

  const hasVariation = previousValue !== undefined && variation !== 0

  // Determinar trend automaticamente se não foi fornecido
  const calculatedTrend = trend || (
    hasVariation 
      ? variation > 0 ? 'up' : 'down'
      : 'neutral'
  )

  // Formatação do valor
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      case 'number':
        return val.toLocaleString('pt-BR')
      default:
        return val.toString()
    }
  }

  // Cores baseadas no trend
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  const iconColors = {
    up: 'text-green-500 bg-green-50',
    down: 'text-red-500 bg-red-50',
    neutral: 'text-blue-500 bg-blue-50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            ) : (
              <>
                <motion.p 
                  className="text-2xl font-bold text-gray-900 mb-1"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {formatValue(value)}
                </motion.p>
                
                {hasVariation && (
                  <motion.div 
                    className="flex items-center space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {calculatedTrend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : calculatedTrend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    
                    <span className={`text-sm font-medium ${trendColors[calculatedTrend]}`}>
                      {Math.abs(variation).toFixed(1)}%
                    </span>
                    
                    <span className="text-sm text-gray-500">
                      vs período anterior
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${iconColors[calculatedTrend]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Componente para card de métrica simples (sem comparação)
export const SimpleMetricCard = ({
  title,
  value,
  icon: Icon,
  format = 'currency',
  isLoading = false,
  className = ''
}: Omit<MetricCardProps, 'previousValue' | 'trend'>) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      case 'number':
        return val.toLocaleString('pt-BR')
      default:
        return val.toString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <motion.p 
                className="text-2xl font-bold text-gray-900"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {formatValue(value)}
              </motion.p>
            )}
          </div>
          
          <div className="p-3 rounded-full bg-blue-50 text-blue-500">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Componente para grid de cards de métricas
interface MetricCardsGridProps {
  children: React.ReactNode
  className?: string
}

export const MetricCardsGrid = ({ 
  children, 
  className = '' 
}: MetricCardsGridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  )
}
