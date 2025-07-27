// Componente para relatório de receitas
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Download, 
  Filter,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReceitasReport } from '../hooks/use-reports'
import { formatCurrency, formatDate, getMonthRange } from '../utils'
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
import type { ConfigRelatorio, DateRange } from '../types'

interface ReceitasReportProps {
  className?: string
  showFilters?: boolean
  autoLoad?: boolean
}

export const ReceitasReport = ({ 
  className = '', 
  showFilters = true,
  autoLoad = false 
}: ReceitasReportProps) => {
  const router = useRouter()
  const [periodo, setPeriodo] = useState<DateRange>(getMonthRange())
  const [barbeiroId, setBarbeiroId] = useState<string>('')
  const [statusPagamento, setStatusPagamento] = useState<string>('')

  const { dados, isLoading, isError, error, gerar, exportar } = useReceitasReport()

  // Carregar dados automaticamente se solicitado
  useEffect(() => {
    if (autoLoad) {
      handleGerar()
    }
  }, [autoLoad])

  // Gerar relatório
  const handleGerar = async () => {
    const config: ConfigRelatorio = {
      tipo: 'RECEITAS',
      periodo,
      filtros: {
        barbeiroId: barbeiroId || undefined,
        statusPagamento: statusPagamento || undefined
      },
      formato: 'CSV'
    }
    
    await gerar(config)
  }

  // Preparar dados para gráficos
  const prepararDadosGraficos = () => {
    if (!dados?.resumo) return { porBarbeiro: [], porMetodo: [] }

    const porBarbeiro = Object.entries(dados.resumo.receitaPorBarbeiro).map(([nome, valor]) => ({
      nome,
      valor: valor as number
    }))

    const porMetodo = Object.entries(dados.resumo.receitaPorMetodo).map(([metodo, valor]) => ({
      metodo,
      valor: valor as number
    }))

    return { porBarbeiro, porMetodo }
  }

  const { porBarbeiro, porMetodo } = prepararDadosGraficos()

  // Cores para gráficos
  const cores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Relatório de Receitas
              </h1>
              <p className="text-gray-600">
                Análise detalhada das receitas da barbearia
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          {dados && (
            <>
              <Button
                variant="outline"
                onClick={() => exportar('CSV')}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => exportar('EXCEL')}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => exportar('PDF')}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barbeiro
              </label>
              <select
                value={barbeiroId}
                onChange={(e) => setBarbeiroId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os barbeiros</option>
                {/* TODO: Carregar lista de barbeiros */}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusPagamento}
                onChange={(e) => setStatusPagamento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleGerar}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{isLoading ? 'Gerando...' : 'Gerar Relatório'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Cards de Resumo */}
      {dados?.resumo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dados.resumo.totalReceitas)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nº Transações</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dados.resumo.numeroTransacoes}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dados.resumo.ticketMedio)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Barbeiros Ativos</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.keys(dados.resumo.receitaPorBarbeiro).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Gráficos */}
      {dados?.resumo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas por Barbeiro */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Receitas por Barbeiro
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porBarbeiro}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="nome" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                    />
                    <Bar dataKey="valor" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Receitas por Método de Pagamento */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Receitas por Método de Pagamento
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porMetodo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ metodo, percent }: { metodo: string; percent: number }) => 
                        `${metodo} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {porMetodo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
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
      )}

      {/* Tabela de Dados */}
      {dados?.dados && dados.dados.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalhamento das Receitas
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barbeiro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dados.dados.slice(0, 20).map((receita, index) => (
                    <tr key={receita.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receita.data}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receita.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receita.barbeiro}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receita.servico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(receita.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receita.metodoPagamento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          receita.status === 'CONFIRMADA' 
                            ? 'bg-green-100 text-green-800'
                            : receita.status === 'PENDENTE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {receita.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {dados.dados.length > 20 && (
                <div className="text-center py-4 text-sm text-gray-600">
                  Mostrando 20 de {dados.dados.length} registros. 
                  Exporte o relatório para ver todos os dados.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Estado de Erro */}
      {isError && error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3 text-red-600">
            <TrendingUp className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Erro ao gerar relatório de receitas</h3>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Estado Vazio */}
      {!isLoading && !dados && !isError && (
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum relatório gerado
          </h3>
          <p className="text-gray-600 mb-4">
            Configure os filtros e clique em "Gerar Relatório" para visualizar os dados.
          </p>
          <Button onClick={handleGerar} disabled={isLoading}>
            Gerar Relatório
          </Button>
        </Card>
      )}
    </div>
  )
}