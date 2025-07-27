'use client'

import { motion } from 'framer-motion'
import { Users, ArrowLeft, Calendar, Filter, Download, DollarSign, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
                <Users className="h-6 w-6 text-purple-600" />
                <span>Comissões dos Barbeiros</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe a performance e comissões de cada barbeiro
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
              <DollarSign className="h-4 w-4" />
              <span>Processar Pagamentos</span>
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
                <p className="text-sm text-gray-600 mb-1">Total de Comissões</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalComissoes)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Comissões Pagas</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(comissoesPagas)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Comissões Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(comissoesPendentes)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Barbeiros Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(comissoes.map(c => c.barbeiro)).size}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Performance dos Barbeiros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Performance dos Barbeiros (Mês Atual)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from(new Set(comissoes.map(c => c.barbeiro))).map((barbeiro) => {
                const comissoesBarbeiro = comissoes.filter(c => c.barbeiro === barbeiro)
                const receitaTotal = comissoesBarbeiro.reduce((acc, c) => acc + c.receitaGerada, 0)
                const comissaoTotal = comissoesBarbeiro.reduce((acc, c) => acc + c.valorComissao, 0)
                const percentualMedio = comissoesBarbeiro.reduce((acc, c) => acc + c.percentualComissao, 0) / comissoesBarbeiro.length
                
                return (
                  <Card key={barbeiro} className="p-4 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{barbeiro}</h3>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Receita Gerada:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(receitaTotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Comissão Total:</span>
                        <span className="font-medium text-purple-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(comissaoTotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">% Médio:</span>
                        <span className="font-medium">
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
                  <option value="">Todos os barbeiros</option>
                  <option value="joao">João Silva</option>
                  <option value="pedro">Pedro Santos</option>
                  <option value="carlos">Carlos Oliveira</option>
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

        {/* Lista de Comissões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Histórico de Comissões
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barbeiro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita Gerada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Comissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Comissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comissoes.map((comissao) => (
                    <tr key={comissao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {comissao.barbeiro.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {comissao.barbeiro}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(comissao.periodo + '-01').toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(comissao.receitaGerada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comissao.percentualComissao}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(comissao.valorComissao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          comissao.status === 'Pago' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {comissao.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comissao.dataPagamento 
                          ? new Date(comissao.dataPagamento).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comissao.status === 'Pendente' ? (
                          <Button variant="outline" size="sm">
                            Pagar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
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
    </div>
  )
}