'use client'

import { Calendar, Clock, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils/date-utils'
import type { CalendarStats } from '@/types/appointments'

interface CalendarStatsProps {
  stats: CalendarStats | null
  loading?: boolean
  className?: string
}

export function CalendarStats({ stats, loading = false, className }: CalendarStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Não foi possível carregar as estatísticas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: 'Agendamentos Hoje',
      value: stats.agendamentos_hoje,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: formatDate(new Date(), 'dd/MM/yyyy')
    },
    {
      title: 'Total de Agendamentos',
      value: stats.total_agendamentos,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'No período selecionado'
    },
    {
      title: 'Pendentes',
      value: stats.agendamentos_pendentes,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Aguardando confirmação'
    },
    {
      title: 'Receita do Dia',
      value: `R$ ${stats.receita_dia.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Agendamentos concluídos'
    },
    {
      title: 'Taxa de Ocupação',
      value: `${stats.taxa_ocupacao.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Horários ocupados'
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              
              {/* Indicadores adicionais baseados no tipo */}
              {stat.title === 'Pendentes' && stats.agendamentos_pendentes > 0 && (
                <Badge variant="warning" className="mt-2 text-xs">
                  Requer atenção
                </Badge>
              )}
              
              {stat.title === 'Taxa de Ocupação' && stats.taxa_ocupacao > 80 && (
                <Badge variant="success" className="mt-2 text-xs">
                  Alta demanda
                </Badge>
              )}
              
              {stat.title === 'Taxa de Ocupação' && stats.taxa_ocupacao < 30 && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Baixa ocupação
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
