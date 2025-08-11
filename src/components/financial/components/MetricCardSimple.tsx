'use client'

// Versão simplificada do MetricCard para debug
import { Card } from '@/shared/components/ui'
import type { LucideIcon } from 'lucide-react'

interface MetricCardSimpleProps {
  title: string
  value: number
  icon: LucideIcon
  isLoading?: boolean
}

export const MetricCardSimple = ({
  title,
  value,
  icon: Icon,
  isLoading = false
}: MetricCardSimpleProps) => {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">
            R$ {value.toFixed(2)}
          </p>
        </div>
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
    </Card>
  )
}

export const MetricCardsGridSimple = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}