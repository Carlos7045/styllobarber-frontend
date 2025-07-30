'use client'

import React, { useState } from 'react'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { NovoAgendamentoModal } from '@/components/client/NovoAgendamentoModal'
import { ServicoFormModal } from '@/components/admin/ServicoFormModal'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions'
import { useAdminServicos, type ServicoAdmin } from '@/hooks/use-admin-servicos'
import { useServices } from '@/hooks/use-services'
import {
  Scissors,
  Plus,
  Edit,
  Trash2,
  Calendar,
  BarChart3,
  History,
  GripVertical,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import {
  ServicoAnalyticsCard,
  HistoricoPrecoModal,
  ServicoCategoriaManager,
} from '@/components/admin'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

/**
 * Página de serviços - versão adaptativa para clientes e administradores
 * Clientes: visualizar serviços e agendar
 * Administradores: gerenciar serviços completo
 */
export default function ServicosPage() {
  const { canManageServices, hasPermission } = usePermissions()
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>()
  const [isServicoFormOpen, setIsServicoFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<ServicoAdmin | null>(null)

  // Estados para novas funcionalidades administrativas
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false)
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [isCategoriaManagerOpen, setIsCategoriaManagerOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')

  // Usar hook apropriado baseado nas permissões
  const isAdmin = canManageServices

  // Hook para clientes (dados básicos)
  const { services: servicosCliente, loading: loadingCliente } = useServices()

  // Hook para administradores (dados completos)
  const {
    servicos: servicosAdmin,
    loading: loadingAdmin,
    toggleServicoStatus,
    deleteServico,
    refetch,
  } = useAdminServicos()

  // Usar dados apropriados baseado no role
  const servicos = isAdmin ? servicosAdmin : servicosCliente
  const loading = isAdmin ? loadingAdmin : loadingCliente

  const handleAgendar = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setIsAgendamentoOpen(true)
  }

  // Filtrar serviços para administradores
  const servicosFiltrados = isAdmin
    ? servicos.filter((servico) => {
        const matchCategoria = !filtroCategoria || servico.categoria === filtroCategoria
        const matchStatus = showInactive || servico.ativo
        return matchCategoria && matchStatus
      })
    : servicos.filter((s) => s.ativo)

  // Obter categorias únicas
  const categorias = Array.from(new Set(servicos.map((s) => s.categoria).filter(Boolean)))

  // Novos handlers para funcionalidades administrativas
  const handleVerHistorico = (servicoId: string) => {
    setSelectedServicoId(servicoId)
    setIsHistoricoOpen(true)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isAdmin) return

    const items = Array.from(servicosFiltrados)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar ordem no banco
    const servicosOrdenados = items.map((servico, index) => ({
      id: servico.id,
      ordem: index + 1,
    }))

    try {
      const result = await (servicosAdmin as any).updateOrdem?.(servicosOrdenados)
      if (result?.success) {
        refetch()
      } else {
        alert('Erro ao atualizar ordem')
      }
    } catch (error) {
      alert('Erro inesperado ao atualizar ordem')
    }
  }

  const handleAgendamentoSuccess = (appointment: Record<string, unknown>) => {
    // console.log('Agendamento criado:', appointment)
    // Aqui você pode adicionar uma notificação de sucesso
  }

  const handleToggleStatus = async (serviceId: string, ativo: boolean) => {
    if (!isAdmin) return

    try {
      const result = await toggleServicoStatus(serviceId, ativo)
      if (result.success) {
        refetch()
      } else {
        // console.error('Erro ao alterar status:', result.error)
        alert(result.error || 'Erro ao alterar status do serviço')
      }
    } catch (error) {
      // console.error('Erro inesperado ao alterar status:', error)
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
      // console.error('Erro ao atualizar lista de serviços:', error)
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
      // console.error('Erro inesperado ao excluir serviço:', error)
      alert('Erro inesperado ao excluir serviço')
    }
  }
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <Scissors className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Serviços</h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {isAdmin
                    ? 'Gerencie os serviços oferecidos pela barbearia'
                    : 'Nossos serviços premium'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCategoriaManagerOpen(true)}
                  className="border-primary-gold text-primary-gold hover:bg-primary-gold/10"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Categorias
                </Button>

                <Button
                  onClick={handleNovoServico}
                  className="bg-primary-gold text-primary-black hover:bg-primary-gold-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Serviço
                </Button>
              </div>
            )}
          </div>

          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Analytics Cards - apenas para admins */}
        {isAdmin && <ServicoAnalyticsCard servicos={servicos as ServicoAdmin[]} />}

        {/* Filtros - apenas para admins */}
        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Categoria:</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="border-border-default rounded-lg border bg-background-primary px-3 py-1 text-text-primary"
                  >
                    <option value="">Todas</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="border-border-default h-4 w-4 rounded bg-background-primary text-primary-gold accent-primary-gold focus:ring-2 focus:ring-primary-gold"
                  />
                  <label htmlFor="showInactive" className="text-sm font-medium">
                    Mostrar serviços inativos
                  </label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroCategoria('')
                    setShowInactive(false)
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de serviços */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isAdmin ? `Gerenciar Serviços (${servicosFiltrados.length})` : 'Nossos Serviços'}
              </CardTitle>
              {!isAdmin && (
                <div className="text-sm text-text-secondary">
                  {servicos.length} serviços disponíveis
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-lg bg-neutral-light-gray dark:bg-background-dark-card"
                  />
                ))}
              </div>
            ) : servicosFiltrados.length === 0 ? (
              <div className="py-12 text-center">
                <Scissors className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
                <h3 className="mb-2 text-lg font-medium text-text-primary">
                  Nenhum serviço encontrado
                </h3>
                <p className="text-text-secondary">
                  {isAdmin
                    ? servicos.length === 0
                      ? 'Comece criando seu primeiro serviço'
                      : 'Ajuste os filtros para ver mais serviços'
                    : 'Serviços serão exibidos aqui quando disponíveis'}
                </p>
              </div>
            ) : (
              <>
                {/* Lista com Drag and Drop para admins */}
                {isAdmin ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="servicos">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {servicosFiltrados.map((servico, index) => (
                            <Draggable key={servico.id} draggableId={servico.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 dark:border-secondary-graphite-card/50 dark:bg-secondary-graphite-light ${snapshot.isDragging ? 'scale-105 shadow-xl' : 'hover:shadow-md'} ${!servico.ativo ? 'opacity-60' : ''} `}
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-text-secondary hover:text-text-primary active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>

                                    {/* Ícone do Serviço */}
                                    <div
                                      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md ${
                                        servico.ativo
                                          ? 'bg-gradient-to-br from-primary-gold to-primary-gold-dark'
                                          : 'bg-gray-300 dark:bg-gray-600'
                                      } `}
                                    >
                                      <Scissors
                                        className={`h-6 w-6 ${servico.ativo ? 'text-primary-black' : 'text-gray-500'}`}
                                      />
                                    </div>

                                    {/* Informações do Serviço */}
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                          {servico.nome}
                                        </h3>
                                        {servico.categoria && (
                                          <span className="rounded-full bg-primary-gold/20 px-2 py-1 text-xs text-primary-gold">
                                            {servico.categoria}
                                          </span>
                                        )}
                                        {!servico.ativo && (
                                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            Inativo
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="font-semibold text-primary-gold">
                                          {formatarMoeda(servico.preco)}
                                        </span>
                                        <span>{servico.duracao_minutos} min</span>
                                        <span>
                                          {(servico as ServicoAdmin).total_agendamentos || 0}{' '}
                                          agendamentos
                                        </span>
                                        <span className="text-green-600 dark:text-green-400">
                                          {formatarMoeda(
                                            (servico as ServicoAdmin).receita_mes || 0
                                          )}
                                          /mês
                                        </span>
                                      </div>
                                    </div>

                                    {/* Ações Administrativas */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVerHistorico(servico.id)}
                                        title="Ver histórico de preços"
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>

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
                                        onClick={() =>
                                          handleToggleStatus(servico.id, !servico.ativo)
                                        }
                                        title={
                                          servico.ativo ? 'Desativar serviço' : 'Ativar serviço'
                                        }
                                        className={
                                          servico.ativo
                                            ? 'text-warning hover:text-warning'
                                            : 'text-success hover:text-success'
                                        }
                                      >
                                        {servico.ativo ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteServico(servico.id, servico.nome)
                                        }
                                        title="Excluir permanentemente"
                                        className="text-error hover:text-error"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  /* Grid para clientes */
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {servicos
                      .filter((s) => s.ativo)
                      .map((servico) => (
                        <Card
                          key={servico.id}
                          className="border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite dark:hover:bg-secondary-graphite-hover"
                        >
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-gold to-primary-gold-dark shadow-md">
                                <Scissors className="h-6 w-6 text-primary-black" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {servico.nome}
                                </h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {servico.duracao_minutos} minutos
                                </p>
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

                            <p className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                              {servico.descricao || 'Sem descrição'}
                            </p>

                            {/* Estatísticas para admin - Melhorado */}
                            {isAdmin && (
                              <div className="mb-4 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 shadow-sm dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {(servico as ServicoAdmin).total_agendamentos || 0}
                                  </div>
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Agendamentos
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {formatarMoeda((servico as ServicoAdmin).receita_mes || 0)}
                                  </div>
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Receita/Mês
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="bg-gradient-to-r from-primary-gold to-primary-gold-dark bg-clip-text text-3xl font-bold text-transparent">
                                {formatarMoeda(servico.preco)}
                              </div>
                              {!isAdmin && (
                                <Button
                                  onClick={() => handleAgendar(servico.id)}
                                  className="bg-gradient-to-r from-primary-gold to-primary-gold-dark font-semibold text-primary-black shadow-lg transition-all duration-300 hover:from-primary-gold-dark hover:to-primary-gold hover:shadow-xl"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Agendar
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {/* Serviços inativos */}
                {servicos.some((s) => !s.ativo) && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-medium text-text-secondary">
                      {isAdmin ? 'Serviços Desativados' : 'Serviços Temporariamente Indisponíveis'}
                    </h3>
                    <div className="space-y-3">
                      {servicos
                        .filter((s) => !s.ativo)
                        .map((servico) => (
                          <div
                            key={servico.id}
                            className="flex items-center justify-between rounded-xl border-2 border-gray-300 bg-gray-50 p-4 opacity-75 transition-all duration-300 hover:opacity-90 hover:shadow-md dark:border-secondary-graphite-card/50 dark:bg-secondary-graphite-card/30"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-secondary-graphite-light">
                                <Scissors className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                                  {servico.nome}
                                </h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {formatarMoeda(servico.preco)} • {servico.duracao_minutos} min
                                </p>
                                {isAdmin && (servico as ServicoAdmin).agendamentos_futuros > 0 && (
                                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                    {(servico as ServicoAdmin).agendamentos_futuros} agendamento(s)
                                    futuro(s)
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                {isAdmin ? 'Desativado' : 'Indisponível'}
                              </span>
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(servico.id, true)}
                                    className="border-success/20 text-success hover:bg-success/10 hover:text-success"
                                    title="Reativar serviço"
                                  >
                                    Reativar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteServico(servico.id, servico.nome)}
                                    className="border-error/20 text-error hover:bg-error/10 hover:text-error"
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

        {/* Novos Modais Administrativos */}
        {isAdmin && (
          <>
            <HistoricoPrecoModal
              isOpen={isHistoricoOpen}
              onClose={() => setIsHistoricoOpen(false)}
              servicoId={selectedServicoId}
            />

            <ServicoCategoriaManager
              isOpen={isCategoriaManagerOpen}
              onClose={() => setIsCategoriaManagerOpen(false)}
              onSuccess={refetch}
            />
          </>
        )}
      </div>
    </Container>
  )
}
