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

    const result = await toggleServicoStatus(serviceId, ativo)
    if (result.success) {
      refetch()
    } else {
      alert(result.error || 'Erro ao alterar status do serviço')
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
    refetch()
    setIsServicoFormOpen(false)
    setSelectedServico(null)
  }
  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Serviços
          </h1>
          <p className="text-text-secondary">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>

        {/* Cards de estatísticas - apenas para admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                <Scissors className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servicos.length}</div>
                <p className="text-xs text-text-secondary">
                  Serviços cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
                <Scissors className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servicos.filter(s => s.ativo).length}</div>
                <p className="text-xs text-text-secondary">
                  {servicos.length > 0 ? Math.round((servicos.filter(s => s.ativo).length / servicos.length) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                <Scissors className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {servicos.length > 0
                    ? formatarMoeda(servicos.reduce((sum, s) => sum + s.preco, 0) / servicos.length)
                    : 'R$ 0,00'
                  }
                </div>
                <p className="text-xs text-text-secondary">
                  Média de preços
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
                <BarChart3 className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatarMoeda(
                    servicos.reduce((sum, s) => sum + ((s as ServicoAdmin).receita_mes || 0), 0)
                  )}
                </div>
                <p className="text-xs text-text-secondary">
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
                  <div key={i} className="h-48 bg-neutral-light-gray animate-pulse rounded-lg" />
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
                    <Card key={servico.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                            <Scissors className="h-6 w-6 text-primary-gold" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-text-primary">{servico.nome}</h3>
                            <p className="text-sm text-text-secondary">{servico.duracao_minutos} minutos</p>
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

                        <p className="text-text-secondary text-sm mb-4">
                          {servico.descricao || 'Sem descrição'}
                        </p>

                        {/* Estatísticas para admin */}
                        {isAdmin && 'total_agendamentos' in servico && (
                          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-neutral-light-gray rounded-lg">
                            <div className="text-center">
                              <div className="text-sm font-medium text-primary-gold">
                                {(servico as ServicoAdmin).total_agendamentos || 0}
                              </div>
                              <div className="text-xs text-text-secondary">Agendamentos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-success">
                                {formatarMoeda((servico as ServicoAdmin).receita_mes || 0)}
                              </div>
                              <div className="text-xs text-text-secondary">Receita/Mês</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-primary-gold">
                            {formatarMoeda(servico.preco)}
                          </div>
                          {!isAdmin && (
                            <Button
                              onClick={() => handleAgendar(servico.id)}
                              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
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
                        <div key={servico.id} className="flex items-center justify-between p-4 border border-border-default rounded-lg opacity-60">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neutral-light-gray rounded-full flex items-center justify-center">
                              <Scissors className="h-5 w-5 text-text-secondary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-text-primary">{servico.nome}</h3>
                              <p className="text-sm text-text-secondary">
                                {formatarMoeda(servico.preco)} • {servico.duracao_minutos} min
                              </p>
                              {isAdmin && 'agendamentos_futuros' in servico && (servico as ServicoAdmin).agendamentos_futuros! > 0 && (
                                <p className="text-xs text-warning">
                                  {(servico as ServicoAdmin).agendamentos_futuros} agendamento(s) futuro(s)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              {isAdmin ? 'Desativado' : 'Indisponível'}
                            </span>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(servico.id, true)}
                                className="text-success hover:text-success"
                              >
                                Reativar
                              </Button>
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