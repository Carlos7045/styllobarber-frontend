// Dashboard financeiro específico para barbeiros
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Calculator,
  Eye,
  Clock,
  Target,
  Award,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { Badge } from '@/shared/components/ui'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useBarberPermissions } from '@/domains/users/hooks/use-barber-permissions'
import { useQuickTransactions } from '../hooks/use-quick-transactions'
import { useBarberFinancialData } from '@/domains/users/hooks/use-barber-financial-data'
import { formatCurrency, formatDate } from '../utils'

interface BarberDashboardProps {
  className?: string
}

// Componente de Card de Métrica para Barbeiro
const BarberMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  format = 'currency',
  color = 'blue',
  progress,
}: {
  title: string
  value: number
  subtitle?: string
  icon: any
  format?: 'currency' | 'number' | 'percentage'
  color?: 'blue' | 'green' | 'purple' | 'orange'
  progress?: number
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return `${val}%`
      case 'number':
        return val.toLocaleString('pt-BR')
      default:
        return val.toString()
    }
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    green:
      'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    purple:
      'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    orange:
      'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  }

  return (
    <Card
      className={`p-6 dark:border-secondary-graphite-card/30 dark:bg-background-dark-elevated ${colorClasses[color]} border-2 transition-colors hover:dark:bg-secondary-graphite-hover`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium opacity-75 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold dark:text-white">{formatValue(value)}</p>
          {subtitle && <p className="mt-1 text-sm opacity-75 dark:text-gray-300">{subtitle}</p>}
        </div>
        <div className="rounded-full bg-white bg-opacity-50 p-3 dark:bg-secondary-graphite-card dark:bg-opacity-90">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>Progresso da Meta</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white bg-opacity-50 dark:bg-secondary-graphite-card dark:bg-opacity-90">
            <div
              className="h-2 rounded-full bg-current transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-secondary-graphite-card/30 dark:bg-background-dark-elevated">
        <p className="mb-2 font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {entry.name.includes('receita') || entry.name.includes('comissao')
              ? formatCurrency(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const BarberDashboard = ({ className = '' }: BarberDashboardProps) => {
  const router = useRouter()
  const { barbeiroNome, permissions } = useBarberPermissions()
  const { estatisticasDia } = useQuickTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState('mes')

  // Usar dados reais do barbeiro
  const barberData = useBarberFinancialData(selectedPeriod)
  const { metricas, evolucaoSemanal, servicosPopulares, proximosAgendamentos, loading } = barberData

  // Mostrar loading se os dados estão carregando
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-gold"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando seus dados...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Personalizado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Olá, {barbeiroNome || 'Barbeiro'}! 👋
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Aqui está o resumo da sua performance financeira
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/financeiro/pdv')}
            className="flex items-center space-x-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          >
            <Calculator className="h-4 w-4" />
            <span>Abrir PDV</span>
          </Button>
        </div>
      </motion.div>

      {/* Métricas Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <BarberMetricCard
            title="Receita Gerada"
            value={metricas.receitaGerada}
            subtitle="Este mês"
            icon={DollarSign}
            format="currency"
            color="green"
          />

          <BarberMetricCard
            title="Sua Comissão"
            value={metricas.comissaoAcumulada}
            subtitle="40% da receita"
            icon={TrendingUp}
            format="currency"
            color="blue"
          />

          <BarberMetricCard
            title="Clientes Atendidos"
            value={metricas.clientesAtendidos}
            subtitle="Este mês"
            icon={Users}
            format="number"
            color="purple"
          />

          <BarberMetricCard
            title="Meta Mensal"
            value={metricas.metaMensal}
            subtitle={`${metricas.progressoMeta}% atingido`}
            icon={Target}
            format="currency"
            color="orange"
            progress={metricas.progressoMeta}
          />
        </div>
      </motion.div>

      {/* Gráfico de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sua Performance Semanal
            </h3>

            <div className="flex space-x-1">
              {['semana', 'mes', 'trimestre'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs capitalize"
                >
                  {period === 'mes'
                    ? 'Este Mês'
                    : period === 'semana'
                      ? 'Esta Semana'
                      : 'Este Trimestre'}
                </Button>
              ))}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dia" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="receita" fill="#22C55E" name="Receita Gerada" radius={[2, 2, 0, 0]} />
                <Bar dataKey="comissao" fill="#3B82F6" name="Sua Comissão" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Serviços e Agendamentos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Serviços Mais Realizados */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Seus Serviços Mais Realizados
            </h3>

            <div className="space-y-3">
              {servicosPopulares.map((servico, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors dark:bg-background-dark-card hover:dark:bg-secondary-graphite-hover"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                      <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{servico.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {servico.quantidade} realizados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(servico.receita)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">receita total</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Próximos Agendamentos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Próximos Agendamentos
              </h3>
              <Badge variant="outline" className="text-xs">
                Hoje
              </Badge>
            </div>

            <div className="space-y-3">
              {proximosAgendamentos.map((agendamento, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors dark:border-secondary-graphite-card/30 hover:dark:bg-background-dark-card"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {agendamento.cliente}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {agendamento.servico}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{agendamento.horario}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(agendamento.valor)}
                    </p>
                  </div>
                </div>
              ))}

              {proximosAgendamentos.length === 0 && (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p>Nenhum agendamento para hoje</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Ações Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 transition-colors dark:border-secondary-graphite-card/30 dark:bg-background-dark-elevated dark:from-blue-900/10 dark:to-purple-900/10 hover:dark:bg-secondary-graphite-hover">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Ações Rápidas
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              onClick={() => router.push('/dashboard/financeiro/pdv')}
              className="flex h-16 flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-6 w-6" />
              <span>Abrir PDV</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/agendamentos')}
              className="flex h-16 flex-col items-center justify-center space-y-2"
            >
              <Calendar className="h-6 w-6" />
              <span>Ver Agendamentos</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/clientes')}
              className="flex h-16 flex-col items-center justify-center space-y-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <Users className="h-6 w-6" />
              <span>Meus Clientes</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
