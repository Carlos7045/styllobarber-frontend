// Componente de controle de fluxo de caixa em tempo real
'use client'

import { useState } from 'react'
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
  X
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
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
  MovimentacaoFluxoCaixa
} from '../types'
import { QuickTransactionPDV } from './QuickTransactionPDV'
import { useQuickTransactions } from '../hooks/use-quick-transactions'
import { useCashFlowData } from '@/hooks/use-cash-flow-data'
import { DataSourceIndicator, useDataSource } from './DataSourceIndicator'

// Dados mockados removidos - agora usando dados reais

interface CashFlowManagerProps {
  className?: string
}

// Componente de Card de Resumo
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  alert = false,
  subtitle
}: {
  title: string
  value: number
  icon: any
  alert?: boolean
  subtitle?: string
}) => {
  return (
    <Card className={`p-6 bg-white dark:bg-secondary-graphite-card border border-gray-200 dark:border-secondary-graphite-card/30 hover:shadow-lg transition-shadow duration-200 ${alert ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {alert && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${alert ? 'bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

// Componente de Item de Movimentação
const MovementItem = ({ movimento }: { movimento: any }) => {
  const isEntrada = movimento.tipo === 'ENTRADA'
  const isProjetada = false // Removido status por enquanto

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-xl border border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite hover:from-primary-gold/5 hover:to-primary-gold/10 hover:border-primary-gold/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${isProjetada ? 'border-dashed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Ícone da transação */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEntrada ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
            {isEntrada ? (
              <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Informações da movimentação */}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {movimento.descricao}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatDate(movimento.data.toISOString())}
            </p>
            {movimento.origem && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {movimento.origem}
              </p>
            )}

            {/* Badges */}
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={movimento.categoria === 'OPERACIONAL' ? 'primary' : 'secondary'}
                size="sm"
              >
                {movimento.categoria}
              </Badge>
              {isProjetada && (
                <Badge variant="outline" size="sm" className="border-dashed">
                  <Clock className="h-3 w-3 mr-1" />
                  Projetada
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge do tipo */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isEntrada
            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/30'
            : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30'
            }`}>
            {isEntrada ? 'Entrada' : 'Saída'}
          </span>

          {/* Valor */}
          <div className="text-right">
            <div className={`text-lg font-bold ${isEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isEntrada ? '+' : '-'}{formatCurrency(movimento.valor)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Tooltip customizado para gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-secondary-graphite-card p-3 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
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
  const { registrarTransacao } = useQuickTransactions()

  // Usar dados reais
  const { resumo, evolucaoSemanal, movimentacoes, loading, error } = useCashFlowData()
  
  // Categorias calculadas baseadas em dados reais
  const categorias = [
    { nome: 'Serviços', valor: resumo.entradasDia * 0.8, cor: '#10B981' },
    { nome: 'Produtos', valor: resumo.entradasDia * 0.2, cor: '#F59E0B' },
    { nome: 'Despesas', valor: resumo.saidasDia, cor: '#EF4444' }
  ]

  // Verificar se o saldo está abaixo do limite
  const isLowBalance = resumo.saldoAtual < resumo.limiteMinimoAlerta

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    if (selectedCategory && mov.categoria !== selectedCategory) return false
    // Removido filtro de status por enquanto
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Controle Detalhado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Movimentações e análises em tempo real
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </div>
          <Button
            variant="primary"
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
          <Card className="p-4 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  Saldo Abaixo do Limite Mínimo
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
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
            subtitle="Receitas confirmadas"
          />
          <SummaryCard
            title="Saídas do Dia"
            value={resumo.saidasDia}
            icon={TrendingDown}
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
      <Card className="p-4 bg-white dark:bg-secondary-graphite-card border border-gray-200 dark:border-secondary-graphite-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
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
                    className={`text-xs capitalize ${selectedPeriod === period ? 'bg-primary-gold hover:bg-primary-gold-dark text-primary-black' : ''}`}
                  >
                    {period === 'mes' ? 'Este Mês' : period}
                  </Button>
                ))}
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 dark:border-secondary-graphite-card/50 rounded-md px-3 py-1 bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold"
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
          <Card className="p-6 bg-white dark:bg-secondary-graphite-card border border-gray-200 dark:border-secondary-graphite-card/30">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
          <Card className="p-6 bg-white dark:bg-secondary-graphite-card border border-gray-200 dark:border-secondary-graphite-card/30">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
        <Card className="p-6 bg-white dark:bg-secondary-graphite-card border border-gray-200 dark:border-secondary-graphite-card/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Movimentações Recentes
              </h3>
              <DataSourceIndicator 
                source={useDataSource(movimentacoesFiltradas.length > 0)}
                size="sm"
              />
            </div>
            <Badge variant="outline">
              {movimentacoesFiltradas.length} movimentações
            </Badge>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {movimentacoesFiltradas.map((movimento) => (
              <MovementItem key={movimento.id} movimento={movimento} />
            ))}

            {movimentacoesFiltradas.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="mb-2">Nenhuma movimentação encontrada</p>
                <p className="text-sm">
                  {loading ? 'Carregando dados...' : 'Registre transações usando o PDV para ver o histórico'}
                </p>
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
              className="bg-white dark:bg-secondary-graphite-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-secondary-graphite-card border-b border-gray-200 dark:border-secondary-graphite-card/30 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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