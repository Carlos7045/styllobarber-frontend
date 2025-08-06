'use client'

import { motion } from 'framer-motion'
import { TrendingDown, ArrowLeft, Calendar, Filter, Download, Plus, DollarSign, CreditCard, AlertCircle } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Container } from '@/shared/components/layout'
import { useRouter } from 'next/navigation'

export default function DespesasPage() {
  const router = useRouter()

  // Dados mockados de despesas
  const despesas = [
    {
      id: 1,
      categoria: 'Produtos',
      descricao: 'Shampoo e condicionador',
      valor: 450.00,
      data: '2024-01-15',
      status: 'Pago'
    },
    {
      id: 2,
      categoria: 'Equipamentos',
      descricao: 'Manutenção máquina de cortar',
      valor: 120.00,
      data: '2024-01-12',
      status: 'Pago'
    },
    {
      id: 3,
      categoria: 'Aluguel',
      descricao: 'Aluguel do espaço',
      valor: 1200.00,
      data: '2024-01-01',
      status: 'Pago'
    },
    {
      id: 4,
      categoria: 'Utilities',
      descricao: 'Conta de luz',
      valor: 180.00,
      data: '2024-01-10',
      status: 'Pendente'
    }
  ]

  const totalDespesas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0)

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
              <TrendingDown className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Controle de Despesas
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Gerencie e monitore todas as despesas da barbearia
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
                <Plus className="h-4 w-4" />
                <span>Nova Despesa</span>
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
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-red-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Total de Despesas
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalDespesas)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Período atual
                  </div>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Despesas Pagas
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(despesas.filter(d => d.status === 'Pago').reduce((acc, d) => acc + d.valor, 0))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Quitadas
                  </div>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-orange-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Despesas Pendentes
                  </div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(despesas.filter(d => d.status === 'Pendente').reduce((acc, d) => acc + d.valor, 0))}
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
                    Número de Despesas
                  </div>
                  <div className="text-3xl font-bold text-primary-gold mb-1">
                    {despesas.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total de registros
                  </div>
                </div>
                <div className="p-4 bg-primary-gold/10 rounded-xl">
                  <CreditCard className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <Filter className="h-6 w-6 text-primary-gold" />
                </div>
                Filtros de Pesquisa
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Período
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold">
                  <option>Este mês</option>
                  <option>Últimos 3 meses</option>
                  <option>Este ano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold">
                  <option value="">Todas as categorias</option>
                  <option value="produtos">Produtos</option>
                  <option value="equipamentos">Equipamentos</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="utilities">Utilities</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold">
                  <option value="">Todos os status</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Lista de Despesas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-4 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-primary-gold" />
                </div>
                Lista de Despesas
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-graphite-light divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                  {despesas.map((despesa) => (
                    <tr key={despesa.id} className="hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(despesa.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
                          {despesa.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {despesa.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(despesa.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          despesa.status === 'Pago' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                        }`}>
                          {despesa.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
                        >
                          Editar
                        </Button>
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
