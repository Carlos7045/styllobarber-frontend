// Dashboard financeiro simplificado com dados mockados
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calculator,
  AlertCircle,
  RefreshCw,
  Calendar,
  User,
  Filter,
  FileText
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

// Dados mockados
const mockData = {
  metricas: {
    receitaBruta: 15000,
    receitaLiquida: 12000,
    despesasTotal: 3000,
    lucroLiquido: 9000,
    ticketMedio: 75,
    numeroAtendimentos: 200,
    taxaCrescimento: 15.5,
    comissoesPendentes: 2500
  },
  evolucaoTemporal: [
    { mes: 'Jan', receitas: 12000, despesas: 2800, lucro: 9200 },
    { mes: 'Fev', receitas: 13500, despesas: 2900, lucro: 10600 },
    { mes: 'Mar', receitas: 14200, despesas: 3100, lucro: 11100 },
    { mes: 'Abr', receitas: 15000, despesas: 3000, lucro: 12000 }
  ],
  performanceBarbeiros: [
    { nome: 'João Silva', receitaGerada: 8000 },
    { nome: 'Pedro Santos', receitaGerada: 7000 },
    { nome: 'Carlos Oliveira', receitaGerada: 5500 }
  ],
  barbeiros: [
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Pedro Santos' },
    { id: '3', nome: 'Carlos Oliveira' }
  ]
}

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
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
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
                <span className="text-sm text-gray-500">
                  vs período anterior
                </span>
              </div>
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

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
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

  const handleRefresh = () => {
    setLastRefresh(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            onClick={() => router.push('/dashboard/financeiro/receitas')}
            className="flex items-center space-x-2"
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
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filtros</span>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-1">
                {['hoje', 'semana', 'mes', 'trimestre', 'ano'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className="text-xs capitalize"
                  >
                    {period === 'mes' ? 'Este Mês' : period}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <select
                value={selectedBarbeiro}
                onChange={(e) => setSelectedBarbeiro(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os barbeiros</option>
                {mockData.barbeiros.map((barbeiro) => (
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
          value={mockData.metricas.receitaBruta}
          previousValue={13000}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Receita Líquida"
          value={mockData.metricas.receitaLiquida}
          previousValue={10400}
          icon={TrendingUp}
          format="currency"
        />
        <MetricCard
          title="Despesas Totais"
          value={mockData.metricas.despesasTotal}
          previousValue={2600}
          icon={TrendingDown}
          format="currency"
          trend="down"
        />
        <MetricCard
          title="Lucro Líquido"
          value={mockData.metricas.lucroLiquido}
          previousValue={7800}
          icon={Calculator}
          format="currency"
        />
      </div>

      {/* Indicadores de Performance */}
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
                  R$ {mockData.metricas.ticketMedio.toFixed(2)}
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
                  {mockData.metricas.numeroAtendimentos}
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
                  {mockData.metricas.taxaCrescimento.toFixed(1)}%
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
                  {((mockData.metricas.lucroLiquido / mockData.metricas.receitaBruta) * 100).toFixed(1)}%
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-500" />
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Acesso Rápido aos Relatórios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => router.push('/dashboard/financeiro/receitas')}
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Receitas</h3>
                <p className="text-sm text-gray-600">Análise detalhada das receitas</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => router.push('/dashboard/financeiro/relatorios')}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Centro de Relatórios</h3>
                <p className="text-sm text-gray-600">Todos os relatórios em um lugar</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => router.push('/dashboard/financeiro/despesas')}
          >
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-medium text-gray-900">Despesas</h3>
                <p className="text-sm text-gray-600">Controle de gastos por categoria</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => router.push('/dashboard/financeiro/comissoes')}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Comissões</h3>
                <p className="text-sm text-gray-600">Performance dos barbeiros</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Análise Temporal
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Evolução */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Evolução Financeira
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData.evolucaoTemporal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="mes" stroke="#6B7280" fontSize={12} />
                  <YAxis 
                    stroke="#6B7280" 
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
                    stroke="#22C55E"
                    strokeWidth={3}
                    name="Receitas"
                    dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#EF4444"
                    strokeWidth={3}
                    name="Despesas"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Lucro"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gráfico de Performance dos Barbeiros */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance dos Barbeiros
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.performanceBarbeiros}>
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
                    fill="#3B82F6"
                    name="Receita Gerada"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Alerta de Comissões Pendentes */}
      {mockData.metricas.comissoesPendentes > 0 && (
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
                  Há R$ {mockData.metricas.comissoesPendentes.toFixed(2)} em comissões pendentes de pagamento
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}