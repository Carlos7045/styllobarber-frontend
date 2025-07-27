'use client'

import { motion } from 'framer-motion'
import { TrendingDown, ArrowLeft, Calendar, Filter, Download, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <TrendingDown className="h-6 w-6 text-red-600" />
                <span>Controle de Despesas</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie e monitore todas as despesas da barbearia
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Despesa</span>
            </Button>
          </div>
        </motion.div>

        {/* Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalDespesas)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Despesas Pagas</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(despesas.filter(d => d.status === 'Pago').reduce((acc, d) => acc + d.valor, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Despesas Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(despesas.filter(d => d.status === 'Pendente').reduce((acc, d) => acc + d.valor, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Número de Despesas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {despesas.length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Filtros</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Este mês</option>
                    <option>Últimos 3 meses</option>
                    <option>Este ano</option>
                  </select>
                </div>

                <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas as categorias</option>
                  <option value="produtos">Produtos</option>
                  <option value="equipamentos">Equipamentos</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="utilities">Utilities</option>
                </select>

                <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de Despesas
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {despesas.map((despesa) => (
                    <tr key={despesa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(despesa.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {despesa.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {despesa.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(despesa.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          despesa.status === 'Pago' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {despesa.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button variant="outline" size="sm">
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
    </div>
  )
}