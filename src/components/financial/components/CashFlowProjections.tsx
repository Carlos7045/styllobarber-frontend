// Componente de projeções de fluxo de caixa
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { Badge } from '@/shared/components/ui'
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatCurrency, formatDate } from '../utils'
import { useCashFlow } from '../hooks/use-cash-flow'

interface CashFlowProjectionsProps {
  className?: string
  diasProjecao?: number
}

// Dados mockados para demonstração
const mockProjectionData = {
  projecoesDiarias: [
    { data: '2025-01-27', entradasProjetadas: 800, saidasProjetadas: 300, saldoProjetado: 16250 },
    { data: '2025-01-28', entradasProjetadas: 1200, saidasProjetadas: 400, saldoProjetado: 17050 },
    { data: '2025-01-29', entradasProjetadas: 1500, saidasProjetadas: 500, saldoProjetado: 18050 },
    { data: '2025-01-30', entradasProjetadas: 2000, saidasProjetadas: 600, saldoProjetado: 19450 },
    { data: '2025-01-31', entradasProjetadas: 2200, saidasProjetadas: 800, saldoProjetado: 20850 },
    { data: '2025-02-01', entradasProjetadas: 1800, saidasProjetadas: 700, saldoProjetado: 21950 },
    { data: '2025-02-02', entradasProjetadas: 900, saidasProjetadas: 300, saldoProjetado: 22550 }
  ],
  cenarios: {
    otimista: { crescimento: 20, saldoFinal: 25000 },
    realista: { crescimento: 10, saldoFinal: 22550 },
    pessimista: { crescimento: -5, saldoFinal: 18000 }
  },
  alertas: [
    {
      tipo: 'POSITIVO',
      data: '2025-02-01',
      mensagem: 'Saldo projetado ultrapassa R$ 20.000'
    },
    {
      tipo: 'ATENCAO',
      data: '2025-01-31',
      mensagem: 'Pico de saídas previsto (R$ 800)'
    }
  ]
}

// Componente de Card de Cenário
const ScenarioCard = ({ 
  titulo, 
  crescimento, 
  saldoFinal, 
  tipo 
}: {
  titulo: string
  crescimento: number
  saldoFinal: number
  tipo: 'otimista' | 'realista' | 'pessimista'
}) => {
  const cores = {
    otimista: 'border-green-200 bg-green-50 text-green-700',
    realista: 'border-blue-200 bg-blue-50 text-blue-700',
    pessimista: 'border-red-200 bg-red-50 text-red-700'
  }

  const icones = {
    otimista: TrendingUp,
    realista: Target,
    pessimista: TrendingDown
  }

  const Icon = icones[tipo]

  return (
    <Card className={`p-4 ${cores[tipo]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{titulo}</h3>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs opacity-75">Crescimento Projetado</p>
          <p className="text-lg font-bold">
            {crescimento > 0 ? '+' : ''}{crescimento}%
          </p>
        </div>
        
        <div>
          <p className="text-xs opacity-75">Saldo Final</p>
          <p className="text-lg font-bold">
            {formatCurrency(saldoFinal)}
          </p>
        </div>
      </div>
    </Card>
  )
}

// Componente de Alerta de Projeção
const ProjectionAlert = ({ 
  alerta 
}: { 
  alerta: { tipo: string; data: string; mensagem: string } 
}) => {
  const isPositivo = alerta.tipo === 'POSITIVO'
  
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
      isPositivo 
        ? 'border-green-200 bg-green-50' 
        : 'border-orange-200 bg-orange-50'
    }`}>
      {isPositivo ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-orange-600" />
      )}
      
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          isPositivo ? 'text-green-900' : 'text-orange-900'
        }`}>
          {alerta.mensagem}
        </p>
        <p className={`text-xs ${
          isPositivo ? 'text-green-700' : 'text-orange-700'
        }`}>
          Previsto para {formatDate(alerta.data)}
        </p>
      </div>
    </div>
  )
}

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-secondary-graphite-light p-4 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          {formatDate(label)}
        </p>
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

export const CashFlowProjections = ({ 
  className = '', 
  diasProjecao = 30 
}: CashFlowProjectionsProps) => {
  const [selectedScenario, setSelectedScenario] = useState<'otimista' | 'realista' | 'pessimista'>('realista')
  const [showDetails, setShowDetails] = useState(false)
  
  const { projecoes, calcularProjecoes, loading } = useCashFlow()
  
  // Usar dados mockados se não houver projeções reais
  const dadosProjecao = projecoes.length > 0 ? projecoes : mockProjectionData.projecoesDiarias
  const { cenarios, alertas } = mockProjectionData

  useEffect(() => {
    calcularProjecoes(diasProjecao)
  }, [diasProjecao, calcularProjecoes])

  // Preparar dados para o gráfico
  const dadosGrafico = dadosProjecao.map(item => ({
    ...item,
    dataFormatada: new Date(item.data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    }),
    saldoMinimo: 5000 // Linha de referência
  }))

  // Calcular estatísticas
  const estatisticas = {
    maiorSaldo: Math.max(...dadosProjecao.map(d => d.saldoProjetado)),
    menorSaldo: Math.min(...dadosProjecao.map(d => d.saldoProjetado)),
    totalEntradas: dadosProjecao.reduce((sum, d) => sum + d.entradasProjetadas, 0),
    totalSaidas: dadosProjecao.reduce((sum, d) => sum + d.saidasProjetadas, 0),
    diasAbaixoLimite: dadosProjecao.filter(d => d.saldoProjetado < 5000).length
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Calculando projeções...</p>
          </div>
        </div>
      </Card>
    )
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
          <h2 className="text-xl font-bold text-gray-900">
            Projeções de Fluxo de Caixa
          </h2>
          <p className="text-gray-600 mt-1">
            Análise preditiva para os próximos {diasProjecao} dias
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant={showDetails ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Detalhes</span>
          </Button>
        </div>
      </motion.div>

      {/* Cenários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cenários de Projeção
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScenarioCard
            titulo="Cenário Otimista"
            crescimento={cenarios.otimista.crescimento}
            saldoFinal={cenarios.otimista.saldoFinal}
            tipo="otimista"
          />
          <ScenarioCard
            titulo="Cenário Realista"
            crescimento={cenarios.realista.crescimento}
            saldoFinal={cenarios.realista.saldoFinal}
            tipo="realista"
          />
          <ScenarioCard
            titulo="Cenário Pessimista"
            crescimento={cenarios.pessimista.crescimento}
            saldoFinal={cenarios.pessimista.saldoFinal}
            tipo="pessimista"
          />
        </div>
      </motion.div>

      {/* Gráfico de Projeção */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução Projetada do Saldo
          </h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="dataFormatada" 
                  stroke="#6B7280" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Linha de referência do limite mínimo */}
                <ReferenceLine 
                  y={5000} 
                  stroke="#EF4444" 
                  strokeDasharray="5 5"
                  label={{ value: "Limite Mínimo", position: "topRight" }}
                />
                
                <Area
                  type="monotone"
                  dataKey="saldoProjetado"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  name="Saldo Projetado"
                />
                
                <Line
                  type="monotone"
                  dataKey="entradasProjetadas"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', strokeWidth: 2, r: 3 }}
                  name="Entradas Projetadas"
                />
                
                <Line
                  type="monotone"
                  dataKey="saidasProjetadas"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                  name="Saídas Projetadas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Estatísticas e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estatísticas da Projeção
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Maior Saldo Projetado:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(estatisticas.maiorSaldo)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Menor Saldo Projetado:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(estatisticas.menorSaldo)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Entradas:</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(estatisticas.totalEntradas)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Saídas:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(estatisticas.totalSaidas)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dias Abaixo do Limite:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">
                    {estatisticas.diasAbaixoLimite}
                  </span>
                  {estatisticas.diasAbaixoLimite > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Atenção
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Alertas */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alertas de Projeção
            </h3>
            
            <div className="space-y-3">
              {alertas.map((alerta, index) => (
                <ProjectionAlert key={index} alerta={alerta} />
              ))}
              
              {alertas.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum alerta de projeção no momento</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalhes Diários da Projeção
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Data</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Entradas</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Saídas</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Saldo</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosProjecao.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        {formatDate(item.data)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-600">
                        {formatCurrency(item.entradasProjetadas)}
                      </td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(item.saidasProjetadas)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(item.saldoProjetado)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.saldoProjetado < 5000 ? (
                          <Badge variant="destructive" className="text-xs">
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Normal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
