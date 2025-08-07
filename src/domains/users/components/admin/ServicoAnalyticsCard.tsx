'use client'

import React from 'react'
import { Card, CardContent } from '@/shared/components/ui'
import { ServicoAdmin } from '@/domains/users/hooks/use-admin-servicos'
import { Scissors, TrendingUp, DollarSign, Clock, BarChart3, Users, Target } from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'

interface ServicoAnalyticsCardProps {
  servicos: ServicoAdmin[]
}

export const ServicoAnalyticsCard: React.FC<ServicoAnalyticsCardProps> = ({ servicos }) => {
  // Calcular estatísticas
  const totalServicos = servicos.length
  const servicosAtivos = servicos.filter((s) => s.ativo).length
  const servicosInativos = totalServicos - servicosAtivos

  const receitaTotalMes = servicos.reduce((sum, s) => sum + s.receita_mes, 0)
  const totalAgendamentos = servicos.reduce((sum, s) => sum + s.total_agendamentos, 0)

  const precoMedio =
    totalServicos > 0 ? servicos.reduce((sum, s) => sum + s.preco, 0) / totalServicos : 0

  const duracaoMedia =
    totalServicos > 0 ? servicos.reduce((sum, s) => sum + s.duracao_minutos, 0) / totalServicos : 0

  // Serviço mais popular (mais agendamentos)
  const servicoMaisPopular = servicos.reduce(
    (prev, current) => (current.total_agendamentos > prev.total_agendamentos ? current : prev),
    servicos[0] || { nome: 'N/A', total_agendamentos: 0 }
  )

  // Serviço mais lucrativo (maior receita mensal)
  const servicoMaisLucrativo = servicos.reduce(
    (prev, current) => (current.receita_mes > prev.receita_mes ? current : prev),
    servicos[0] || { nome: 'N/A', receita_mes: 0 }
  )

  // Taxa de ocupação média (baseada nos agendamentos)
  const taxaOcupacaoMedia =
    totalServicos > 0
      ? (totalAgendamentos / (totalServicos * 30)) * 100 // Estimativa baseada em 30 dias
      : 0

  const analytics = [
    {
      title: 'Total de Serviços',
      value: totalServicos.toString(),
      subtitle: `${servicosAtivos} ativos, ${servicosInativos} inativos`,
      icon: Scissors,
      colorClass: 'text-amber-600',
      bgColorClass: 'bg-amber-100 dark:bg-amber-900/30',
      borderClass: 'border-l-amber-500',
    },
    {
      title: 'Receita Mensal',
      value: formatarMoeda(receitaTotalMes),
      subtitle: 'Receita total dos serviços',
      icon: DollarSign,
      colorClass: 'text-green-600',
      bgColorClass: 'bg-green-100 dark:bg-green-900/30',
      borderClass: 'border-l-green-500',
    },
    {
      title: 'Total de Agendamentos',
      value: totalAgendamentos.toString(),
      subtitle: 'Agendamentos realizados',
      icon: Users,
      colorClass: 'text-blue-600',
      bgColorClass: 'bg-blue-100 dark:bg-blue-900/30',
      borderClass: 'border-l-blue-500',
    },
    {
      title: 'Preço Médio',
      value: formatarMoeda(precoMedio),
      subtitle: `Duração média: ${Math.round(duracaoMedia)} min`,
      icon: BarChart3,
      colorClass: 'text-purple-600',
      bgColorClass: 'bg-purple-100 dark:bg-purple-900/30',
      borderClass: 'border-l-purple-500',
    },
    {
      title: 'Mais Popular',
      value: servicoMaisPopular.nome,
      subtitle: `${servicoMaisPopular.total_agendamentos} agendamentos`,
      icon: Award,
      colorClass: 'text-orange-600',
      bgColorClass: 'bg-orange-100 dark:bg-orange-900/30',
      borderClass: 'border-l-orange-500',
    },
    {
      title: 'Mais Lucrativo',
      value: servicoMaisLucrativo.nome,
      subtitle: formatarMoeda(servicoMaisLucrativo.receita_mes),
      icon: TrendingUp,
      colorClass: 'text-emerald-600',
      bgColorClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      borderClass: 'border-l-emerald-500',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${Math.round(taxaOcupacaoMedia)}%`,
      subtitle: 'Média estimada mensal',
      icon: Target,
      colorClass: 'text-indigo-600',
      bgColorClass: 'bg-indigo-100 dark:bg-indigo-900/30',
      borderClass: 'border-l-indigo-500',
    },
    {
      title: 'Tempo Médio',
      value: `${Math.round(duracaoMedia)} min`,
      subtitle: 'Duração média dos serviços',
      icon: Clock,
      colorClass: 'text-pink-600',
      bgColorClass: 'bg-pink-100 dark:bg-pink-900/30',
      borderClass: 'border-l-pink-500',
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {analytics.map((item, index) => (
        <Card
          key={index}
          className={`border-l-4 bg-gradient-to-br from-white to-gray-50 p-6 dark:from-secondary-graphite-light dark:to-secondary-graphite ${item.borderClass} transition-all duration-300 hover:scale-105 hover:shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {item.title}
              </div>
              <div className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</div>
            </div>
            <div className={`p-4 ${item.bgColorClass} rounded-xl`}>
              <item.icon className={`text-2xl ${item.colorClass}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default ServicoAnalyticsCard
