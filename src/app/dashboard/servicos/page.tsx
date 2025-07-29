'use client'

import React, { useState } from 'react'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { NovoAgendamentoModal } from '@/components/client/NovoAgendamentoModal'
import { ServicoFormModal } from '@/components/admin/ServicoFormModal'
import { useAuth } from '@/hooks/use-auth'
import { useAdminServicos, type ServicoAdmin } from '@/hooks/use-admin-servicos'
import { useServices } from '@/hooks/use-services'
import { Scissors, Plus, Edit, Trash2, Calendar, BarChart3 } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

/**
 * Página de serviços - versão adaptativa para clientes e administradores
 * Clientes: visualizar serviços e agendar
 * Administradores: gerenciar serviços completo
 */
export default function ServicosPage() {
  const { hasRole } = useAuth()
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>()
  const [isServicoFormOpen, setIsServicoFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<ServicoAdmin | null>(null)

  // Usar hook apropriado baseado no role
  const isAdmin = hasRole('admin') || hasRole('saas_owner')

  // Hook para clientes (dados básicos)
  const { services: servicosCliente, loading: loadingCliente } = useServices()

  // Hook para administradores (dados completos)
  const {
    servicos: servicosAdmin,
    loading: loadingAdmin,
    toggleServicoStatus,
    deleteServico,
    refetch
  } = useAdminServicos()

  // Usar dados apropriados baseado no role
  const servicos = isAdmin ? servicosAdmin : servicosCliente
  const loading = isAdmin ? loadingAdmin : loadingCliente

  const handleAgendar = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setIsAgendamentoOpen(true)
  }

  const handleAgendamentoSuccess = (appointment: any) => {
    console.log('Agendamento criado:', appointment)
    // Aqui você pode adicionar uma notificação de sucesso
  }

  const handleToggleStatus = async (serviceId: string, ativo: boolean) => {
    if (!isAdmin) return

    try {
      const result = await toggleServicoStatus(serviceId, ativo)
      if (result.success) {
        refetch()
      } else {
        console.error('Erro ao alterar status:', result.error)
        alert(result.error || 'Erro ao alterar status do serviço')
      }
    } catch (error) {
      console.error('Erro inesperado ao alterar status:', error)
      alert('Erro inesperado ao alterar status do serviço')
    }
  }

  const handleNovoServico = () => {
    setSelectedServico(null)
    setIsServicoFormOpen(true)
  }

  const handleEditarServico = (servico: ServicoAdmin) => {
    setSelectedServico(servico)
    setIsServicoFormOpen(true)
  }

  const handleServicoFormSuccess = () => {
    try {
      refetch()
      setIsServicoFormOpen(false)
      setSelectedServico(null)
    } catch (error) {
      console.error('Erro ao atualizar lista de serviços:', error)
    }
  }

  const handleDeleteServico = async (serviceId: string, serviceName: string) => {
    if (!isAdmin) return

    const confirmar = window.confirm(
      `ATENÇÃO: Esta ação é irreversível!\n\nTem certeza que deseja excluir permanentemente o serviço "${serviceName}"?\n\nEsta ação irá:\n- Remover o serviço do banco de dados\n- Remover todas as associações com funcionários\n- Não poderá ser desfeita`
    )
    
    if (!confirmar) return

    try {
      const result = await deleteServico(serviceId)
      if (result.success) {
        alert('Serviço excluído com sucesso!')
        refetch()
      } else {
        alert(result.error || 'Erro ao excluir serviço')
      }
    } catch (error) {
      console.error('Erro inesperado ao excluir serviço:', error)
      alert('Erro inesperado ao excluir serviço')
    }
  }
  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <Scissors className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Serviços
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {isAdmin ? 'Gerencie os serviços oferecidos pela barbearia' : 'Nossos serviços premium'}
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
        </div>

        {/* Cards de estatísticas - apenas para admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold hover:shadow-xl hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Serviços</CardTitle>
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <Scissors className="h-5 w-5 text-primary-gold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary-gold">{servicos.length}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Serviços cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Serviços Ativos</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Scissors className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{servicos.filter(s => s.ativo).length}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {servicos.length > 0 ? Math.round((servicos.filter(s => s.ativo).length / servicos.length) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Preço Médio</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Scissors className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {servicos.length > 0
                    ? formatarMoeda(servicos.reduce((sum, s) => sum + s.preco, 0) / servicos.length)
                    : 'R$ 0,00'
                  }
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Média de preços
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Receita do Mês</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatarMoeda(
                    servicos.reduce((sum, s) => sum + ((s as ServicoAdmin).receita_mes || 0), 0)
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receita dos serviços
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de serviços */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isAdmin ? 'Gerenciar Serviços' : 'Nossos Serviços'}</CardTitle>
              {isAdmin && (
                <Button
                  onClick={handleNovoServico}
                  className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-neutral-light-gray dark:bg-background-dark-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : servicos.length === 0 ? (
              <div className="text-center py-12">
                <Scissors className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Nenhum serviço encontrado
                </h3>
                <p className="text-text-secondary">
                  {isAdmin ? 'Comece criando seu primeiro serviço' : 'Serviços serão exibidos aqui quando disponíveis'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicos.filter(s => s.ativo).map((servico) => (
                    <Card key={servico.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 hover:shadow-xl hover:scale-105 dark:hover:bg-secondary-graphite-hover transition-all duration-300 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-full flex items-center justify-center shadow-md">
                            <Scissors className="h-6 w-6 text-primary-black" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{servico.nome}</h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{servico.duracao_minutos} minutos</p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditarServico(servico)}
                                title="Editar serviço"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(servico.id, false)}
                                title="Desativar serviço"
                                className="text-warning hover:text-warning"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 font-medium">
                          {servico.descricao || 'Sem descrição'}
                        </p>

                        {/* Estatísticas para admin - Melhorado */}
                        {isAdmin && (
                          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light rounded-xl border border-gray-200 dark:border-secondary-graphite-card/50 shadow-sm">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {(servico as ServicoAdmin).total_agendamentos || 0}
                              </div>
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Agendamentos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatarMoeda((servico as ServicoAdmin).receita_mes || 0)}
                              </div>
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Receita/Mês</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold bg-gradient-to-r from-primary-gold to-primary-gold-dark bg-clip-text text-transparent">
                            {formatarMoeda(servico.preco)}
                          </div>
                          {!isAdmin && (
                            <Button
                              onClick={() => handleAgendar(servico.id)}
                              className="bg-gradient-to-r from-primary-gold to-primary-gold-dark hover:from-primary-gold-dark hover:to-primary-gold text-primary-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Serviços inativos */}
                {servicos.some(s => !s.ativo) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-text-secondary mb-4">
                      {isAdmin ? 'Serviços Desativados' : 'Serviços Temporariamente Indisponíveis'}
                    </h3>
                    <div className="space-y-3">
                      {servicos.filter(s => !s.ativo).map((servico) => (
                        <div key={servico.id} className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-secondary-graphite-card/50 rounded-xl bg-gray-50 dark:bg-secondary-graphite-card/30 opacity-75 hover:opacity-90 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-secondary-graphite-light rounded-full flex items-center justify-center">
                              <Scissors className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-700 dark:text-gray-200">{servico.nome}</h3>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {formatarMoeda(servico.preco)} • {servico.duracao_minutos} min
                              </p>
                              {isAdmin && (servico as ServicoAdmin).agendamentos_futuros > 0 && (
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                  {(servico as ServicoAdmin).agendamentos_futuros} agendamento(s) futuro(s)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                              {isAdmin ? 'Desativado' : 'Indisponível'}
                            </span>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStatus(servico.id, true)}
                                  className="text-success hover:text-success hover:bg-success/10 border-success/20"
                                  title="Reativar serviço"
                                >
                                  Reativar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteServico(servico.id, servico.nome)}
                                  className="text-error hover:text-error hover:bg-error/10 border-error/20"
                                  title="Excluir permanentemente"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de agendamento */}
        <NovoAgendamentoModal
          isOpen={isAgendamentoOpen}
          onClose={() => setIsAgendamentoOpen(false)}
          onSuccess={handleAgendamentoSuccess}
          preSelectedServiceId={selectedServiceId}
        />

        {/* Modal de formulário de serviço - apenas para admins */}
        {isAdmin && (
          <ServicoFormModal
            isOpen={isServicoFormOpen}
            onClose={() => {
              setIsServicoFormOpen(false)
              setSelectedServico(null)
            }}
            servico={selectedServico}
            onSuccess={handleServicoFormSuccess}
          />
        )}
      </div>
    </Container>
  )
}