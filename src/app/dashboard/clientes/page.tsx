/**
 * Página de Gestão de Clientes
 * Admins veem todos os clientes, barbeiros veem apenas seus clientes
 */

'use client'

import { useState, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  Star,
  DollarSign,
  Edit,
  Eye,
  UserPlus,
} from 'lucide-react'
import { Button, Badge } from '@/shared/components/ui'
import { Container } from '@/shared/components/layout'
import { RouteGuard, PermissionGate } from '@/domains/auth/components'
import { useBarberPermissions } from '@/domains/users/hooks/use-barber-permissions'
import { useBarberClients } from '@/domains/users/hooks/use-barber-clients'
import { useAdminClientes } from '@/domains/users/hooks/use-admin-clientes'

export default function ClientesPage() {
  const { isBarber, isAdmin } = useBarberPermissions()

  // Usar hooks específicos baseado no papel do usuário
  const barberClientsData = useBarberClients()
  const adminClientsData = useAdminClientes()

  // Selecionar dados baseado no papel
  const {
    clientes,
    loading,
    error,
    filters,
    totalClientes,
    clientesAtivos,
    clientesInativos,
    setFilters,
    clearFilters,
  } = isAdmin ? adminClientsData : barberClientsData

  // Função auxiliar para garantir compatibilidade de filtros
  const updateFilters = useCallback(
    (newFilters: any) => {
      if (isAdmin) {
        setFilters(newFilters)
      } else {
        // Para barbeiros, garantir que apenas campos compatíveis sejam usados
        const compatibleFilters = {
          busca: newFilters.busca,
          status: newFilters.status === 'bloqueado' ? 'all' : newFilters.status,
          periodo: newFilters.periodo,
        }
        setFilters(compatibleFilters)
      }
    },
    [isAdmin, setFilters]
  )

  // Estados locais para compatibilidade com o UI existente
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Sincronizar filtros locais com os hooks
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    updateFilters({ ...filters, busca: value })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateFilters({ ...filters, status: value })
  }

  // Para compatibilidade, usar os dados filtrados dos hooks
  const clientesFiltrados = clientes

  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Moderno */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <Users className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  {isBarber ? 'Meus Clientes' : 'Gestão de Clientes'}
                </h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {isBarber ? 'Seus clientes atendidos' : 'Gerencie todos os clientes da barbearia'}
                </p>
              </div>
            </div>
            <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
          </div>

          {/* Filtros e Busca */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 transition-all duration-300 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite dark:hover:shadow-xl">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="w-full flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="min-w-[150px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
              >
                <option value="">Todos os clientes</option>
                <option value="ativo">Clientes Ativos</option>
                <option value="inativo">Clientes Inativos</option>
                {isAdmin && <option value="bloqueado">Clientes Bloqueados</option>}
              </select>

              {isBarber && (
                <select
                  value={(filters as any).periodo || 'todos'}
                  onChange={(e) => updateFilters({ ...filters, periodo: e.target.value } as any)}
                  className="min-w-[120px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
                >
                  <option value="todos">Todos os períodos</option>
                  <option value="mes">Este mês</option>
                  <option value="trimestre">Este trimestre</option>
                  <option value="ano">Este ano</option>
                </select>
              )}

              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 transition-colors hover:bg-gray-50 dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white dark:hover:bg-gray-700">
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border-l-4 border-l-primary-gold bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {isBarber ? 'Meus Clientes' : 'Total de Clientes'}
                  </div>
                  <div className="mb-1 text-3xl font-bold text-primary-gold">{totalClientes}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isBarber ? 'Atendidos por você' : 'Base ativa'}
                  </div>
                </div>
                <div className="rounded-xl bg-primary-gold/10 p-4">
                  <Users className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-green-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Clientes Ativos
                  </div>
                  <div className="mb-1 text-3xl font-bold text-green-600 dark:text-green-400">
                    {clientesAtivos}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Engajados</div>
                </div>
                <div className="rounded-xl bg-green-100 p-4 dark:bg-green-900/30">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Média Agendamentos
                  </div>
                  <div className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {totalClientes > 0
                      ? Math.round(
                          clientes.reduce(
                            (acc, c) => acc + ((c as any).totalAgendamentos || 0),
                            0
                          ) / totalClientes
                        )
                      : 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Por cliente</div>
                </div>
                <div className="rounded-xl bg-blue-100 p-4 dark:bg-blue-900/30">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-primary-gold bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {isBarber ? 'Receita Gerada' : 'Receita Total'}
                  </div>
                  <div className="mb-1 text-3xl font-bold text-primary-gold">
                    R${' '}
                    {(isAdmin
                      ? clientes.reduce((acc, c) => acc + ((c as any).valor_total_gasto || 0), 0)
                      : (barberClientsData as any).receitaTotal || 0
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isBarber ? 'Por seus serviços' : 'Acumulado'}
                  </div>
                </div>
                <div className="rounded-xl bg-primary-gold/10 p-4">
                  <DollarSign className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Novo Cliente - Apenas para Admins */}
          <PermissionGate requiredRole="admin">
            <div className="flex justify-center">
              <Button className="rounded-xl bg-primary-gold px-6 py-3 font-semibold text-primary-black shadow-lg transition-all duration-300 hover:bg-primary-gold-dark hover:shadow-xl">
                <Plus className="mr-2 h-5 w-5" />
                Novo Cliente
              </Button>
            </div>
          </PermissionGate>

          {/* Lista de Clientes */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-8 py-6 dark:border-secondary-graphite-card/30">
              <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                <div className="rounded-lg bg-primary-gold/10 p-2">
                  <Users className="h-6 w-6 text-primary-gold" />
                </div>
                {isBarber ? 'Meus Clientes' : 'Lista de Clientes'}
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-gold"></div>
                  <p className="text-gray-500 dark:text-gray-400">Carregando clientes...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-red-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    Erro ao carregar clientes
                  </h3>
                  <p className="mb-4 text-gray-500 dark:text-gray-400">{error}</p>
                  <button
                    onClick={() =>
                      isAdmin ? adminClientsData.refetch() : barberClientsData.refetch()
                    }
                    className="rounded-lg bg-primary-gold px-4 py-2 text-primary-black transition-colors hover:bg-primary-gold-dark"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    {searchTerm || statusFilter
                      ? 'Nenhum cliente encontrado'
                      : isBarber
                        ? 'Nenhum cliente encontrado'
                        : 'Nenhum cliente cadastrado'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter
                      ? 'Tente ajustar os filtros de busca.'
                      : isBarber
                        ? 'Você ainda não atendeu nenhum cliente.'
                        : 'Comece adicionando o primeiro cliente da barbearia.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="cursor-pointer rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary-gold/50 hover:from-primary-gold/5 hover:to-primary-gold/10 hover:shadow-xl dark:border-secondary-graphite-card/30 dark:from-secondary-graphite-light dark:to-secondary-graphite"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-gold to-primary-gold-dark shadow-lg">
                            <span className="text-xl font-bold text-primary-black">
                              {cliente.nome.charAt(0)}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {cliente.nome}
                            </h3>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {cliente.telefone}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <Badge variant={cliente.status === 'ativo' ? 'success' : 'secondary'}>
                                {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                {(cliente as any).totalAgendamentos || 0} agendamentos
                              </span>
                              <span className="flex items-center gap-1 text-xs text-primary-gold">
                                <Star className="h-3 w-3" />
                                {(cliente as any).pontosFidelidade || 0} pontos
                              </span>
                              {isBarber && (
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                  R${' '}
                                  {(
                                    (cliente as any).valorTotalGasto ||
                                    (cliente as any).valor_total_gasto ||
                                    0
                                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                                  gerados
                                </span>
                              )}
                            </div>
                            {(cliente as any).servicoFavorito && (
                              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                Serviço favorito: {(cliente as any).servicoFavorito}
                              </p>
                            )}
                            {isBarber && (cliente as any).proximoAgendamento && (
                              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                Próximo agendamento:{' '}
                                {new Date((cliente as any).proximoAgendamento).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="text-gray-600 dark:text-gray-300">
                              Último agendamento
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(cliente as any).ultimoAgendamento ||
                              (cliente as any).ultimo_agendamento
                                ? new Date(
                                    (cliente as any).ultimoAgendamento ||
                                      (cliente as any).ultimo_agendamento
                                  ).toLocaleDateString('pt-BR')
                                : 'Nunca'}
                            </div>
                            {isBarber &&
                              (cliente as any).frequenciaMedia &&
                              (cliente as any).frequenciaMedia > 0 && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Frequência: {(cliente as any).frequenciaMedia} dias
                                </div>
                              )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 rounded-lg border border-primary-gold/30 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-all duration-200 hover:border-primary-gold/50 hover:bg-primary-gold/10 dark:bg-secondary-graphite-light dark:text-white">
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </button>
                            {isBarber && (
                              <button className="flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:from-green-100 hover:to-green-200 dark:border-green-800/30 dark:from-green-900/20 dark:to-green-900/30 dark:text-green-300 dark:hover:from-green-900/30 dark:hover:to-green-900/40">
                                <UserPlus className="h-4 w-4" />
                                Novo Agendamento
                              </button>
                            )}
                            <PermissionGate requiredRole="admin">
                              <button className="flex items-center gap-2 rounded-lg border border-primary-gold/30 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-all duration-200 hover:border-primary-gold/50 hover:bg-primary-gold/10 dark:bg-secondary-graphite-light dark:text-white">
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
