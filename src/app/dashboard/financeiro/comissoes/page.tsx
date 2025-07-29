'use client'

import { motion } from 'framer-motion'
import { Users, ArrowLeft, Calendar, Filter, Download, DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout'
import { useRouter } from 'next/navigation'

export default function ComissoesPage() {
  const router = useRouter()

  // Dados mockados de comissões
  const comissoes = [
    {
      id: 1,
      barbeiro: 'João Silva',
      periodo: '2024-01',
      receitaGerada: 8000,
      percentualComissao: 40,
      valorComissao: 3200,
      status: 'Pago',
      dataPagamento: '2024-02-05'
    },
    {
      id: 2,
      barbeiro: 'Pedro Santos',
      periodo: '2024-01',
      receitaGerada: 7000,
      percentualComissao: 35,
      valorComissao: 2450,
      status: 'Pago',
      dataPagamento: '2024-02-05'
    },
    {
      id: 3,
      barbeiro: 'Carlos Oliveira',
      periodo: '2024-01',
      receitaGerada: 5500,
      percentualComissao: 30,
      valorComissao: 1650,
      status: 'Pendente',
      dataPagamento: null
    },
    {
      id: 4,
      barbeiro: 'João Silva',
      periodo: '2024-02',
      receitaGerada: 8500,
      percentualComissao: 40,
      valorComissao: 3400,
      status: 'Pendente',
      dataPagamento: null
    }
  ]

  const totalComissoes = comissoes.reduce((acc, comissao) => acc + comissao.valorComissao, 0)
  const comissoesPagas = comissoes.filter(c => c.status === 'Pago').reduce((acc, c) => acc + c.valorComissao, 0)
  const comissoesPendentes = comissoes.filter(c => c.status === 'Pendente').reduce((acc, c) => acc + c.valorComissao, 0)

  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Moderno */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <Users className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Comissões dos Barbeiros
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Acompanhe a performance e comissões de cada barbeiro
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-primary-gold/50 hover:border-primary-gold hover:bg-primary-gold/20 text-primary-gold hover:text-primary-gold-dark font-semibold flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
              <Button
                size="sm"
                className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Processar Pagamentos</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cards de Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Total de Comissões
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalComissoes)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Período atual
                  </div>
                </div>
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Comissões Pagas
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(comissoesPagas)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Quitadas
                  </div>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-orange-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Comissões Pendentes
                  </div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(comissoesPendentes)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    A pagar
                  </div>
                </div>
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Barbeiros Ativos
                  </div>
                  <div className="text-3xl font-bold text-primary-gold mb-1">
                    {new Set(comissoes.map(c => c.barbeiro)).size}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Com vendas
                  </div>
                </div>
                <div className="p-4 bg-primary-gold/10 rounded-xl">
                  <Users className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Performance dos Barbeiros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-gold" />
                </div>
                Performance dos Barbeiros (Mês Atual)
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from(new Set(comissoes.map(c => c.barbeiro))).map((barbeiro) => {
                const comissoesBarbeiro = comissoes.filter(c => c.barbeiro === barbeiro)
                const receitaTotal = comissoesBarbeiro.reduce((acc, c) => acc + c.receitaGerada, 0)
                const comissaoTotal = comissoesBarbeiro.reduce((acc, c) => acc + c.valorComissao, 0)
                const percentualMedio = comissoesBarbeiro.reduce((acc, c) => acc + c.percentualComissao, 0) / comissoesBarbeiro.length
                
                return (
                  <Card key={barbeiro} className="p-4 bg-white dark:bg-secondary-graphite-light border border-gray-200 dark:border-secondary-graphite-card/30 border-l-4 border-l-purple-500 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {barbeiro.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{barbeiro}</h3>
                      </div>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-secondary-graphite-card/30 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Receita Gerada:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(receitaTotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Comissão Total:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(comissaoTotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-primary-gold/10 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">% Médio:</span>
                        <span className="font-bold text-primary-gold">
                          {percentualMedio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <Filter className="h-5 w-5 text-primary-gold" />
                </div>
                Filtros de Pesquisa
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Período
                </label>
                <select className="w-full text-sm border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg px-3 py-2 bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent">
                  <option>Este mês</option>
                  <option>Últimos 3 meses</option>
                  <option>Este ano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Barbeiro
                </label>
                <select className="w-full text-sm border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg px-3 py-2 bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent">
                  <option value="">Todos os barbeiros</option>
                  <option value="joao">João Silva</option>
                  <option value="pedro">Pedro Santos</option>
                  <option value="carlos">Carlos Oliveira</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Status
                </label>
                <select className="w-full text-sm border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg px-3 py-2 bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent">
                  <option value="">Todos os status</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button className="w-full bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Lista de Comissões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary-gold" />
                </div>
                Histórico de Comissões
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Barbeiro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Receita Gerada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      % Comissão
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Valor Comissão
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Data Pagamento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-graphite-light divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                  {comissoes.map((comissao) => (
                    <tr key={comissao.id} className="hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {comissao.barbeiro.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {comissao.barbeiro}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(comissao.periodo + '-01').toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(comissao.receitaGerada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-gold/20 text-primary-gold">
                          {comissao.percentualComissao}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600 dark:text-purple-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(comissao.valorComissao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          comissao.status === 'Pago' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                        }`}>
                          {comissao.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {comissao.dataPagamento 
                          ? new Date(comissao.dataPagamento).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {comissao.status === 'Pendente' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 text-primary-gold font-semibold"
                          >
                            Pagar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-300 dark:border-secondary-graphite-card/30 hover:border-gray-400 dark:hover:border-secondary-graphite-card/50 hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30"
                          >
                            Ver Detalhes
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </Container>
  )
}