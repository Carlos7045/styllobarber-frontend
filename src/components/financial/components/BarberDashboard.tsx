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
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  ResponsiveContainer
} from 'recharts'
import { useBarberPermissions } from '@/hooks/use-barber-permissions'
import { useQuickTransactions } from '../hooks/use-quick-transactions'
import { formatCurrency, formatDate } from '../utils'

interface BarberDashboardProps {
  className?: string
}

// Dados mockados específicos para barbeiro
const mockBarberData = {
  metricas: {
    receitaGerada: 2800.00,
    comissaoAcumulada: 1120.00, // 40% da receita
    clientesAtendidos: 18,
    servicosRealizados: 22,
    ticketMedio: 127.27,
    metaMensal: 5000.00,
    progressoMeta: 56 // %
  },
  evolucaoSemanal: [
    { dia: 'Seg', receita: 320, comissao: 128, clientes: 3 },
    { dia: 'Ter', receita: 450, comissao: 180, clientes: 4 },
    { dia: 'Qua', receita: 380, comissao: 152, clientes: 3 },
    { dia: 'Qui', receita: 520, comissao: 208, clientes: 5 },
    { dia: 'Sex', receita: 680, comissao: 272, clientes: 6 },
    { dia: 'Sáb', receita: 450, comissao: 180, clientes: 4 }
  ],
  servicosPopulares: [
    { nome: 'Corte + Barba', quantidade: 8, receita: 1200 },
    { nome: 'Corte Simples', quantidade: 6, receita: 600 },
    { nome: 'Barba Completa', quantidade: 4, receita: 320 },
    { nome: 'Sobrancelha', quantidade: 4, receita: 240 }
  ],
  proximosAgendamentos: [
    { cliente: 'João Silva', servico: 'Corte + Barba', horario: '14:00', valor: 45 },
    { cliente: 'Pedro Santos', servico: 'Corte Simples', horario: '15:30', valor: 25 },
    { cliente: 'Carlos Lima', servico: 'Barba', horario: '16:00', valor: 20 }
  ]
}

// Componente de Card de Métrica para Barbeiro
const BarberMetricCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  format = 'currency',
  color = 'blue',
  progress
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
    green: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    orange: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
  }

  return (
    <Card className={`p-6 dark:bg-background-dark-elevated dark:border-secondary-graphite-card/30 ${colorClasses[color]} border-2 hover:dark:bg-secondary-graphite-hover transition-colors`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-1 dark:text-gray-300">
            {title}
          </p>
          <p className="text-2xl font-bold dark:text-white">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm opacity-75 mt-1 dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-white bg-opacity-50 dark:bg-secondary-graphite-card dark:bg-opacity-90">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progresso da Meta</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-50 dark:bg-secondary-graphite-card dark:bg-opacity-90 rounded-full h-2">
            <div 
              className="bg-current h-2 rounded-full transition-all duration-300"
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
      <div className="bg-white dark:bg-background-dark-elevated p-3 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {entry.name.includes('receita') || entry.name.includes('comissao') 
              ? formatCurrency(entry.value)
              : entry.value
            }
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
  const [selectedPeriod, setSelectedPeriod] = useState('semana')

  const { metricas, evolucaoSemanal, servicosPopulares, proximosAgendamentos } = mockBarberData

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
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Aqui está o resumo da sua performance financeira
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/financeiro/pdv')}
            className="flex items-center space-x-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sua Performance Semanal
            </h3>
            
            <div className="flex space-x-1">
              {['semana', 'mes'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs capitalize"
                >
                  {period === 'mes' ? 'Este Mês' : 'Esta Semana'}
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
                <Bar
                  dataKey="receita"
                  fill="#22C55E"
                  name="Receita Gerada"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="comissao"
                  fill="#3B82F6"
                  name="Sua Comissão"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Serviços e Agendamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços Mais Realizados */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seus Serviços Mais Realizados
            </h3>
            
            <div className="space-y-3">
              {servicosPopulares.map((servico, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-background-dark-card rounded-lg hover:dark:bg-secondary-graphite-hover transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{servico.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{servico.quantidade} realizados</p>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Próximos Agendamentos
              </h3>
              <Badge variant="outline" className="text-xs">
                Hoje
              </Badge>
            </div>
            
            <div className="space-y-3">
              {proximosAgendamentos.map((agendamento, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg hover:dark:bg-background-dark-card transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{agendamento.cliente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{agendamento.servico}</p>
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
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
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
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-secondary-graphite-card/30 dark:bg-background-dark-elevated hover:dark:bg-secondary-graphite-hover transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push('/dashboard/financeiro/pdv')}
              className="h-16 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-6 w-6" />
              <span>Abrir PDV</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/agendamentos')}
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Calendar className="h-6 w-6" />
              <span>Ver Agendamentos</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/clientes')}
              className="h-16 flex flex-col items-center justify-center space-y-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
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