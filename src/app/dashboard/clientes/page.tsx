/**
 * Página de Gestão de Clientes
 * Admins veem todos os clientes, barbeiros veem apenas seus clientes
 */

'use client'

import { useState } from 'react'
import { Users, Plus, Search, Filter, Calendar, Phone, Mail, Star, DollarSign, Edit, Eye, UserPlus } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { Container } from '@/components/layout'
import { RouteGuard, PermissionGate } from '@/components/auth'
import { useBarberPermissions } from '@/hooks/use-barber-permissions'

// Dados mockados para demonstração
const todosClientes = [
  {
    id: '1',
    nome: 'João Teste',
    email: 'joao.teste@exemplo.com',
    telefone: '(11) 99999-1111',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-20',
    totalAgendamentos: 15,
    pontosFidelidade: 150,
    barbeiro: 'Carlos Henrique',
    servicoFavorito: 'Corte + Barba',
    valorTotal: 675.00
  },
  {
    id: '2',
    nome: 'Pedro Santos',
    email: 'pedro@email.com',
    telefone: '(11) 99999-2222',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-18',
    totalAgendamentos: 8,
    pontosFidelidade: 80,
    barbeiro: 'Carlos Henrique',
    servicoFavorito: 'Corte Simples',
    valorTotal: 320.00
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    email: 'carlos@email.com',
    telefone: '(11) 99999-3333',
    role: 'client',
    status: 'inactive',
    ultimoAgendamento: '2024-01-10',
    totalAgendamentos: 3,
    pontosFidelidade: 30,
    barbeiro: 'Outro Barbeiro',
    servicoFavorito: 'Barba',
    valorTotal: 90.00
  }
]

export default function ClientesPage() {
  const { barbeiroNome, isBarber, isAdmin } = useBarberPermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtrar clientes baseado no papel do usuário
  const clientes = isAdmin
    ? todosClientes
    : todosClientes.filter(cliente => cliente.barbeiro === barbeiroNome)

  // Aplicar filtros de busca e status
  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm)
    const matchesStatus = !statusFilter || cliente.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Moderno */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
                <Users className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {isBarber ? 'Meus Clientes' : 'Gestão de Clientes'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {isBarber
                    ? `Seus clientes atendidos, ${barbeiroNome || 'Barbeiro'}`
                    : 'Gerencie todos os clientes da barbearia'
                  }
                </p>
              </div>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
          </div>



          {/* Filtros e Busca */}
          <div className="bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl p-6 hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou telefone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  />
                </div>
              </div>

              <select className="px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold min-w-[150px]">
                <option value="">Todos os clientes</option>
                <option value="active">Clientes Ativos</option>
                <option value="inactive">Clientes Inativos</option>
              </select>

              <select className="px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold min-w-[120px]">
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>

              <button className="px-4 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold rounded-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {isBarber ? 'Meus Clientes' : 'Total de Clientes'}
                  </div>
                  <div className="text-3xl font-bold text-primary-gold mb-1">
                    {clientes.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Base ativa
                  </div>
                </div>
                <div className="p-4 bg-primary-gold/10 rounded-xl">
                  <Users className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 rounded-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Clientes Ativos
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {clientes.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Engajados
                  </div>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 rounded-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Média Agendamentos
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {clientes.length > 0 ? Math.round(clientes.reduce((acc, c) => acc + c.totalAgendamentos, 0) / clientes.length) : 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Por cliente
                  </div>
                </div>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold rounded-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {isBarber ? 'Receita Gerada' : 'Receita Total'}
                  </div>
                  <div className="text-3xl font-bold text-primary-gold mb-1">
                    R$ {clientes.reduce((acc, c) => acc + (c.valorTotal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Acumulado
                  </div>
                </div>
                <div className="p-4 bg-primary-gold/10 rounded-xl">
                  <DollarSign className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Novo Cliente - Apenas para Admins */}
          <PermissionGate requiredRole="admin">
            <div className="flex justify-center">
              <Button className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </PermissionGate>

          {/* Lista de Clientes */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary-gold" />
                </div>
                {isBarber ? 'Meus Clientes' : 'Lista de Clientes'}
              </h2>
            </div>
            <div className="p-6">
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm || statusFilter ? 'Nenhum cliente encontrado' : isBarber ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter
                      ? 'Tente ajustar os filtros de busca.'
                      : isBarber
                        ? 'Você ainda não atendeu nenhum cliente.'
                        : 'Comece adicionando o primeiro cliente da barbearia.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-6 cursor-pointer rounded-xl border border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite hover:from-primary-gold/5 hover:to-primary-gold/10 hover:border-primary-gold/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-primary-black font-bold text-xl">
                              {cliente.nome.charAt(0)}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {cliente.nome}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {cliente.telefone}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge
                                variant={cliente.status === 'active' ? 'success' : 'secondary'}
                              >
                                {cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {cliente.totalAgendamentos} agendamentos
                              </span>
                              <span className="text-xs text-primary-gold flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {cliente.pontosFidelidade} pontos
                              </span>
                              {isBarber && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  R$ {cliente.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerados
                                </span>
                              )}
                            </div>
                            {cliente.servicoFavorito && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Serviço favorito: {cliente.servicoFavorito}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="text-gray-600 dark:text-gray-300">Último agendamento</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(cliente.ultimoAgendamento).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="px-4 py-2 text-sm border border-primary-gold/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white hover:bg-primary-gold/10 hover:border-primary-gold/50 transition-all duration-200 font-medium flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </button>
                            {isBarber && (
                              <button className="px-4 py-2 text-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-900/40 rounded-lg transition-all duration-200 font-medium shadow-sm flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Novo Agendamento
                              </button>
                            )}
                            <PermissionGate requiredRole="admin">
                              <button className="px-4 py-2 text-sm border border-primary-gold/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white hover:bg-primary-gold/10 hover:border-primary-gold/50 transition-all duration-200 font-medium flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </RouteGuard>
  )
}