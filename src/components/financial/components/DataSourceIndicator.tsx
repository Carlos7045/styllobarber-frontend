
'use client'
// Componente para indicar a origem dos dados (real vs. estimado)

import { Badge } from '@/shared/components/ui'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export type DataSource = 'real' | 'estimated' | 'fallback'

interface DataSourceIndicatorProps {
  source: DataSource
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const DataSourceIndicator = ({ 
  source, 
  size = 'sm', 
  showIcon = true,
  className = '' 
}: DataSourceIndicatorProps) => {
  const config = {
    real: {
      label: 'Dados Reais',
      variant: 'success' as const,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400'
    },
    estimated: {
      label: 'Estimado',
      variant: 'warning' as const,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400'
    },
    fallback: {
      label: 'Dados Simulados',
      variant: 'error' as const,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400'
    }
  }

  const { label, variant, icon: Icon, color } = config[source]

  return (
    <Badge 
      variant={variant} 
      size={size}
      className={`flex items-center space-x-1 ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  )
}

// Hook para determinar a origem dos dados
export const useDataSource = (
  hasRealData: boolean, 
  isEstimated: boolean = false
): DataSource => {
  if (hasRealData && !isEstimated) return 'real'
  if (hasRealData && isEstimated) return 'estimated'
  return 'fallback'
}
