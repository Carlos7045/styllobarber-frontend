
'use client'

// Componente para relatório de receitas

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { TrendingUp, Download, Filter, Calendar, DollarSign, Users, CreditCard, BarChart3, ArrowLeft } from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { useReceitasReport } from '../hooks/use-reports'
import { formatCurrency, formatDate, getMonthRange } from '../utils'

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

  // Cores para gráficos - usando design system
  const cores = ['#D4AF37', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Moderno */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
            <TrendingUp className="h-10 w-10 text-primary-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Relatório de Receitas
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              Análise detalhada das receitas da barbearia
            </p>
          </div>
        </div>
        <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          
          {dados && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportar('CSV')}
                disabled={isLoading}
                className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportar('EXCEL')}
                disabled={isLoading}
                className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportar('PDF')}
                disabled={isLoading}
                className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-lg">
                <Filter className="h-6 w-6 text-primary-gold" />
              </div>
              Filtros de Pesquisa
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Data Início
              </label>
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Data Fim
              </label>
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Barbeiro
              </label>
              <select
                value={barbeiroId}
                onChange={(e) => setBarbeiroId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold"
              >
                <option value="">Todos os barbeiros</option>
                {/* TODO: Carregar lista de barbeiros */}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusPagamento}
                onChange={(e) => setStatusPagamento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold"
              >
                <option value="">Todos os status</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleGerar}
              disabled={isLoading}
              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <BarChart3 className="h-5 w-5" />
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
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Total de Receitas
                  </div>
                  <div className="text-3xl font-bold text-primary-gold mb-1">
                    {formatCurrency(dados.resumo.totalReceitas)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Período selecionado
                  </div>
                </div>
                <div className="p-4 bg-primary-gold/10 rounded-xl">
                  <DollarSign className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Nº Transações
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {dados.resumo.numeroTransacoes}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Vendas realizadas
                  </div>
                </div>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Ticket Médio
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {formatCurrency(dados.resumo.ticketMedio)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Por transação
                  </div>
                </div>
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Barbeiros Ativos
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {Object.keys(dados.resumo.receitaPorBarbeiro).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Com vendas
                  </div>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
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
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-primary-gold/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary-gold" />
                  </div>
                  Receitas por Barbeiro
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porBarbeiro}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="nome" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="valor" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Receitas por Método de Pagamento */}
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-primary-gold/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary-gold" />
                  </div>
                  Receitas por Método de Pagamento
                </h3>
              </div>
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
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
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
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-4 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary-gold" />
                </div>
                Detalhamento das Receitas
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Barbeiro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-graphite-light divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                  {dados.dados.slice(0, 20).map((receita, index) => (
                    <tr key={receita.id} className="hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {receita.data}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {receita.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {receita.barbeiro}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {receita.servico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-gold">
                        {formatCurrency(receita.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {receita.metodoPagamento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          receita.status === 'CONFIRMADA' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : receita.status === 'PENDENTE'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}>
                          {receita.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {dados.dados.length > 20 && (
                <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light rounded-lg mt-4 border border-gray-200 dark:border-secondary-graphite-card/50">
                  <strong>Mostrando 20 de {dados.dados.length} registros.</strong><br />
                  Exporte o relatório para ver todos os dados.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Estado de Erro */}
      {isError && error && (
        <Card className="p-8 border-2 border-red-200 dark:border-red-800/30 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4 text-red-600 dark:text-red-400">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Erro ao gerar relatório de receitas</h3>
              <p className="text-sm font-medium">{error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Estado Vazio */}
      {!isLoading && !dados && !isError && (
        <Card className="p-12 text-center bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg">
          <div className="p-6 bg-primary-gold/10 rounded-2xl w-fit mx-auto mb-6">
            <TrendingUp className="h-16 w-16 text-primary-gold mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Nenhum relatório gerado
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
            Configure os filtros e clique em &quot;Gerar Relatório&quot; para visualizar os dados de receitas.
          </p>
          <Button 
            onClick={handleGerar} 
            disabled={isLoading}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Gerar Relatório
          </Button>
        </Card>
      )}
    </div>
  )
}
