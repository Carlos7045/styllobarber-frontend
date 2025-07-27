// Componente de controle de fluxo de caixa em tempo real
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Clock,
  Target,
  Plus,
  CreditCard,
  X
} from 'lucide-react'
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { formatCurrency, formatDate } from '../utils'
import type { 
  MovimentacaoFluxoCaixa, 
  FluxoCaixaResumo,
  DateRange 
} from '../types'
import { QuickTransactionPDV } from './QuickTransactionPDV'
import { useQuickTransactions } from '../hooks/use-quick-transactions'

// Dados mockados para demonstração
const mockCashFlowData = {
  resumo: {
    saldoAtual: 15750.00,
    entradasDia: 2800.00,
    saidasDia: 1200.00,
    saldoProjetado: 18350.00,
    limiteMinimoAlerta: 5000.00
  },
  movimentacoes: [
    {
      id: '1',
      tipo: 'ENTRADA' as const,
      valor: 150.00,
      descricao: 'Corte + Barba - João Silva',
      categoria: 'OPERACIONAL' as const,
      dataMovimentacao: new Date().toISOString(),
      status: 'REALIZADA' as const,
      origem: 'Agendamento #1234'
    },
    {
      id: '2',
      tipo: 'ENTRADA' as const,
      valor: 80.00,
      descricao: 'Corte Simples - Pedro Santos',
      categoria: 'OPERACIONAL' as const,
      dataMovimentacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'REALIZADA' as const,
      origem: 'Agendamento #1235'
    },
    {
      id: '3',
      tipo: 'SAIDA' as const,
      valor: 300.00,
      descricao: 'Compra de produtos',
      categoria: 'OPERACIONAL' as const,
      dataMovimentacao: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'REALIZADA' as const,
      origem: 'Despesa #456'
    },
    {
      id: '4',
      tipo: 'ENTRADA' as const,
      valor: 120.00,
      descricao: 'Corte + Sobrancelha - Carlos Lima',
      categoria: 'OPERACIONAL' as const,
      dataMovimentacao: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'PROJETADA' as const,
      origem: 'Agendamento #1236'
    }
  ] as MovimentacaoFluxoCaixa[],
  evolucaoSemanal: [
    { dia: 'Seg', entradas: 1200, saidas: 800, saldo: 400 },
    { dia: 'Ter', entradas: 1500, saidas: 600, saldo: 900 },
    { dia: 'Qua', entradas: 1800, saidas: 1000, saldo: 800 },
    { dia: 'Qui', entradas: 2200, saidas: 900, saldo: 1300 },
    { dia: 'Sex', entradas: 2800, saidas: 1200, saldo: 1600 },
    { dia: 'Sáb', entradas: 3200, saidas: 800, saldo: 2400 },
    { dia: 'Dom', entradas: 800, saidas: 400, saldo: 400 }
  ],
  categorias: [
    { nome: 'Operacional', valor: 12500, cor: '#22C55E' },
    { nome: 'Investimento', valor: 2000, cor: '#3B82F6' },
    { nome: 'Financiamento', valor: 1250, cor: '#F59E0B' }
  ]
}

interface CashFlowManagerProps {
  className?: string
}

// Componente de Card de Resumo
const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  alert = false,
  subtitle
}: {
  title: string
  value: number
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  alert?: boolean
  subtitle?: string
}) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  const cardBorderColor = alert ? 'border-red-200 bg-red-50' : ''

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow duration-200 ${cardBorderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-600">
              {title}
            </p>
            {alert && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${alert ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

// Componente de Item de Movimentação
const MovementItem = ({ movimento }: { movimento: MovimentacaoFluxoCaixa }) => {
  const isEntrada = movimento.tipo === 'ENTRADA'
  const isProjetada = movimento.status === 'PROJETADA'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 border rounded-lg ${isProjetada ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isEntrada ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isEntrada ? (
              <ArrowUpCircle className="h-5 w-5" />
            ) : (
              <ArrowDownCircle className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {movimento.descricao}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-500">
                {formatDate(movimento.dataMovimentacao)}
              </p>
              <Badge 
                variant={movimento.categoria === 'OPERACIONAL' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {movimento.categoria}
              </Badge>
              {isProjetada && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Projetada
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
            {isEntrada ? '+' : '-'}{formatCurrency(movimento.valor)}
          </p>
          <p className="text-sm text-gray-500">
            {movimento.origem}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Tooltip customizado para gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
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

export const CashFlowManager = ({ className = '' }: CashFlowManagerProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('hoje')
  const [showProjections, setShowProjections] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showPDV, setShowPDV] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Hook para transações rápidas
  const { registrarTransacao, estatisticasDia } = useQuickTransactions()

  const { resumo, movimentacoes, evolucaoSemanal, categorias } = mockCashFlowData

  // Verificar se o saldo está abaixo do limite
  const isLowBalance = resumo.saldoAtual < resumo.limiteMinimoAlerta

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    if (selectedCategory && mov.categoria !== selectedCategory) return false
    if (!showProjections && mov.status === 'PROJETADA') return false
    return true
  })

  const handleRefresh = () => {
    setLastRefresh(new Date())
    // Aqui seria feita a atualização dos dados em tempo real
  }

  const handleTransactionSaved = async (transaction: any) => {
    try {
      const result = await registrarTransacao(transaction)
      if (result.success) {
        setLastRefresh(new Date())
        // Fechar PDV após salvar
        setShowPDV(false)
      } else {
        alert(`Erro ao registrar transação: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro interno ao registrar transação')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fluxo de Caixa
          </h1>
          <p className="text-gray-600 mt-1">
            Controle em tempo real das movimentações financeiras
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowPDV(!showPDV)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>PDV</span>
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

      {/* Alerta de Saldo Baixo */}
      {isLowBalance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Saldo Abaixo do Limite Mínimo
                </h3>
                <p className="text-red-700 mt-1">
                  O saldo atual ({formatCurrency(resumo.saldoAtual)}) está abaixo do limite configurado ({formatCurrency(resumo.limiteMinimoAlerta)})
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Cards de Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Saldo Atual"
            value={resumo.saldoAtual}
            icon={Wallet}
            alert={isLowBalance}
          />
          <SummaryCard
            title="Entradas do Dia"
            value={resumo.entradasDia}
            icon={TrendingUp}
            trend="up"
            subtitle="Receitas confirmadas"
          />
          <SummaryCard
            title="Saídas do Dia"
            value={resumo.saidasDia}
            icon={TrendingDown}
            trend="down"
            subtitle="Despesas realizadas"
          />
          <SummaryCard
            title="Saldo Projetado"
            value={resumo.saldoProjetado}
            icon={Target}
            subtitle="Com agendamentos confirmados"
          />
        </div>
      </motion.div>

      {/* Filtros e Controles */}
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
                {['hoje', 'semana', 'mes'].map((period) => (
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

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              <option value="OPERACIONAL">Operacional</option>
              <option value="INVESTIMENTO">Investimento</option>
              <option value="FINANCIAMENTO">Financiamento</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProjections(!showProjections)}
              className="flex items-center space-x-2"
            >
              {showProjections ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              <span>Projeções</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Semanal */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Evolução Semanal
            </h3>
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
                    dataKey="entradas"
                    fill="#22C55E"
                    name="Entradas"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="saidas"
                    fill="#EF4444"
                    name="Saídas"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Distribuição por Categoria */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Movimentações por Categoria
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorias}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, valor }) => `${nome}: ${formatCurrency(valor)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {categorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Lista de Movimentações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Movimentações Recentes
            </h3>
            <Badge variant="outline">
              {movimentacoesFiltradas.length} movimentações
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {movimentacoesFiltradas.map((movimento) => (
              <MovementItem key={movimento.id} movimento={movimento} />
            ))}
            
            {movimentacoesFiltradas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma movimentação encontrada para os filtros selecionados</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* PDV Modal */}
      <AnimatePresence>
        {showPDV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPDV(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  PDV - Registro Rápido de Transações
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPDV(false)}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Fechar</span>
                </Button>
              </div>
              
              <div className="p-6">
                <QuickTransactionPDV onTransactionSaved={handleTransactionSaved} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}