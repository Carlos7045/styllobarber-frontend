'use client'

import React, { useState } from 'react'
import { Container } from '@/shared/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared/components/ui'
import { LazyNovoAgendamentoModal, LazyServicoFormModal, LazyModalWrapper } from '@/shared/components/lazy'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { usePermissions, PERMISSIONS } from '@/domains/auth/hooks/use-permissions'
import { useAdminServicos, type ServicoAdmin } from '@/domains/users/hooks/use-admin-servicos'
import { useServices } from '@/shared/hooks/data/use-services'
import { Scissors, Plus, Edit, Trash2, Calendar, BarChart3, Filter, Eye, EyeOff, Search, Clock, DollarSign, Users, Star, GripVertical, History } from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'
import {
  ServicoAnalyticsCard,
  HistoricoPrecoModal,
  ServicoCategoriaManager,
} from '@/domains/users/components/admin'
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

  // Estados separados para busca e filtro de categoria
  const [buscaTexto, setBuscaTexto] = useState<string>('')

  // Filtrar serviços para administradores
  const servicosFiltrados = isAdmin
    ? servicos.filter((servico) => {
        const matchBusca =
          !buscaTexto ||
          servico.nome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
          servico.descricao?.toLowerCase().includes(buscaTexto.toLowerCase()) ||
          servico.categoria?.toLowerCase().includes(buscaTexto.toLowerCase())
        const matchCategoria = !filtroCategoria || servico.categoria === filtroCategoria
        const matchStatus = showInactive || servico.ativo
        return matchBusca && matchCategoria && matchStatus
      })
    : servicos.filter((s) => {
        const matchBusca =
          !buscaTexto ||
          s.nome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
          s.descricao?.toLowerCase().includes(buscaTexto.toLowerCase())
        return s.ativo && matchBusca
      })

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
    <>
      <Container className="py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Moderno */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <Scissors className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  {isAdmin ? 'Gestão de Serviços' : 'Nossos Serviços'}
                </h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {isAdmin
                    ? 'Gerencie os serviços oferecidos pela barbearia'
                    : 'Nossos serviços premium'}
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
                    placeholder="Buscar por nome, descrição ou categoria..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {isAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showInactive"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-gold focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30"
                    />
                    <label
                      htmlFor="showInactive"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Mostrar inativos
                    </label>
                  </div>

                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="min-w-[150px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </>
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
                    Total de Serviços
                  </div>
                  <div className="mb-1 text-3xl font-bold text-primary-gold">{servicos.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Disponíveis</div>
                </div>
                <div className="rounded-xl bg-primary-gold/10 p-4">
                  <Scissors className="h-8 w-8 text-primary-gold" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-green-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Serviços Ativos
                  </div>
                  <div className="mb-1 text-3xl font-bold text-green-600 dark:text-green-400">
                    {servicos.filter((s) => s.ativo).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Em funcionamento</div>
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
                    Preço Médio
                  </div>
                  <div className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatarMoeda(
                      servicos.length > 0
                        ? servicos.reduce((acc, s) => acc + s.preco, 0) / servicos.length
                        : 0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Por serviço</div>
                </div>
                <div className="rounded-xl bg-blue-100 p-4 dark:bg-blue-900/30">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Duração Média
                  </div>
                  <div className="mb-1 text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {servicos.length > 0
                      ? Math.round(
                          servicos.reduce((acc, s) => acc + s.duracao_minutos, 0) / servicos.length
                        )
                      : 0}
                    min
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Por serviço</div>
                </div>
                <div className="rounded-xl bg-purple-100 p-4 dark:bg-purple-900/30">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Novo Serviço - Apenas para Admins */}
          {isAdmin && (
            <div className="flex justify-center">
              <Button
                onClick={handleNovoServico}
                className="rounded-xl bg-primary-gold px-6 py-3 font-semibold text-primary-black shadow-lg transition-all duration-300 hover:bg-primary-gold-dark hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Novo Serviço
              </Button>
            </div>
          )}

          {/* Lista de Serviços */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-8 py-6 dark:border-secondary-graphite-card/30">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                  <div className="rounded-lg bg-primary-gold/10 p-2">
                    <Scissors className="h-6 w-6 text-primary-gold" />
                  </div>
                  {isAdmin ? 'Gerenciar Serviços' : 'Nossos Serviços'}
                </h2>
                {isAdmin && servicosFiltrados.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <GripVertical className="h-4 w-4" />
                    <span>Arraste para reordenar</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-gold"></div>
                  <p className="text-gray-500 dark:text-gray-400">Carregando serviços...</p>
                </div>
              ) : servicosFiltrados.length === 0 ? (
                <div className="py-12 text-center">
                  <Scissors className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    {buscaTexto || filtroCategoria
                      ? 'Nenhum serviço encontrado'
                      : isAdmin
                        ? 'Nenhum serviço cadastrado'
                        : 'Nenhum serviço disponível'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {buscaTexto || filtroCategoria
                      ? 'Tente ajustar os filtros de busca.'
                      : isAdmin
                        ? 'Comece adicionando o primeiro serviço da barbearia.'
                        : 'Serviços serão exibidos aqui quando disponíveis.'}
                  </p>
                </div>
              ) : isAdmin ? (
                /* Lista com Drag and Drop para admins */
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
                                className={`rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:border-primary-gold/50 hover:from-primary-gold/5 hover:to-primary-gold/10 hover:shadow-xl dark:border-secondary-graphite-card/30 dark:from-secondary-graphite-light dark:to-secondary-graphite ${
                                  snapshot.isDragging
                                    ? 'rotate-2 scale-105 shadow-2xl'
                                    : 'hover:scale-[1.02]'
                                } ${!servico.ativo ? 'opacity-60' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-gray-400 hover:text-primary-gold active:cursor-grabbing"
                                      title="Arrastar para reordenar"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>

                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-gold to-primary-gold-dark shadow-lg">
                                      <Scissors className="h-7 w-7 text-primary-black" />
                                    </div>

                                    <div>
                                      <div className="mb-1 flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                          {servico.nome}
                                        </h3>
                                        <Badge variant={servico.ativo ? 'success' : 'secondary'}>
                                          {servico.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                        {servico.categoria && (
                                          <Badge variant="outline" className="text-xs">
                                            {servico.categoria}
                                          </Badge>
                                        )}
                                      </div>

                                      {servico.descricao && (
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                                          {servico.descricao}
                                        </p>
                                      )}

                                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          <span className="font-semibold text-primary-gold">
                                            {formatarMoeda(servico.preco)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {servico.duracao_minutos} min
                                        </div>
                                        {isAdmin && (
                                          <>
                                            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                              <Calendar className="h-3 w-3" />
                                              {(servico as ServicoAdmin).total_agendamentos ||
                                                0}{' '}
                                              agendamentos
                                            </span>
                                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                              {formatarMoeda(
                                                (servico as ServicoAdmin).receita_mes || 0
                                              )}
                                              /mês
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right text-sm">
                                      <div className="text-gray-600 dark:text-gray-300">Preço</div>
                                      <div className="text-2xl font-bold text-primary-gold">
                                        {formatarMoeda(servico.preco)}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {!isAdmin ? (
                                        <button
                                          onClick={() => handleAgendar(servico.id)}
                                          className="flex items-center gap-2 rounded-lg border border-primary-gold/30 bg-gradient-to-r from-primary-gold/10 to-primary-gold/20 px-4 py-2 text-sm font-medium text-primary-gold transition-all duration-200 hover:from-primary-gold/20 hover:to-primary-gold/30 hover:shadow-md"
                                        >
                                          <Calendar className="h-4 w-4" />
                                          Agendar
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleVerHistorico(servico.id)}
                                            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:from-blue-100 hover:to-blue-200 dark:border-blue-800/30 dark:from-blue-900/20 dark:to-blue-900/30 dark:text-blue-300"
                                            title="Ver histórico de preços"
                                          >
                                            <History className="h-4 w-4" />
                                            Histórico
                                          </button>
                                          <button
                                            onClick={() => handleEditarServico(servico as any)}
                                            className="flex items-center gap-2 rounded-lg border border-primary-gold/30 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-all duration-200 hover:border-primary-gold/50 hover:bg-primary-gold/10 dark:bg-secondary-graphite-light dark:text-white"
                                          >
                                            <Edit className="h-4 w-4" />
                                            Editar
                                          </button>
                                          <button
                                            onClick={() => handleToggleStatus(servico.id, false)}
                                            className="flex items-center gap-2 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-2 text-sm font-medium text-orange-700 transition-all duration-200 hover:from-orange-100 hover:to-orange-200 dark:border-orange-800/30 dark:from-orange-900/20 dark:to-orange-900/30 dark:text-orange-300"
                                            title="Desativar serviço"
                                          >
                                            <EyeOff className="h-4 w-4" />
                                            Desativar
                                          </button>
                                        </>
                                      )}
                                    </div>
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
                /* Lista simples para clientes */
                <div className="space-y-4">
                  {servicosFiltrados.map((servico) => (
                    <div
                      key={servico.id}
                      className="cursor-pointer rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary-gold/50 hover:from-primary-gold/5 hover:to-primary-gold/10 hover:shadow-xl dark:border-secondary-graphite-card/30 dark:from-secondary-graphite-light dark:to-secondary-graphite"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-gold to-primary-gold-dark shadow-lg">
                            <Scissors className="h-7 w-7 text-primary-black" />
                          </div>

                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {servico.nome}
                              </h3>
                              <Badge variant={servico.ativo ? 'success' : 'secondary'}>
                                {servico.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {servico.categoria && (
                                <Badge variant="outline" className="text-xs">
                                  {servico.categoria}
                                </Badge>
                              )}
                            </div>

                            {servico.descricao && (
                              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                                {servico.descricao}
                              </p>
                            )}

                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-semibold text-primary-gold">
                                  {formatarMoeda(servico.preco)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {servico.duracao_minutos} min
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="text-gray-600 dark:text-gray-300">Preço</div>
                            <div className="text-2xl font-bold text-primary-gold">
                              {formatarMoeda(servico.preco)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAgendar(servico.id)}
                              className="flex items-center gap-2 rounded-lg border border-primary-gold/30 bg-gradient-to-r from-primary-gold/10 to-primary-gold/20 px-4 py-2 text-sm font-medium text-primary-gold transition-all duration-200 hover:from-primary-gold/20 hover:to-primary-gold/30 hover:shadow-md"
                            >
                              <Calendar className="h-4 w-4" />
                              Agendar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção de Serviços Inativos */}
            {isAdmin && servicos.some((s) => !s.ativo) && (
              <div className="mt-8 p-6">
                <h3 className="mb-4 text-lg font-medium text-gray-600 dark:text-gray-300">
                  Serviços Desativados
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
                            {(servico as ServicoAdmin).agendamentos_futuros > 0 && (
                              <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                {(servico as ServicoAdmin).agendamentos_futuros} agendamento(s)
                                futuro(s)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Desativado
                          </Badge>
                          <button
                            onClick={() => handleToggleStatus(servico.id, true)}
                            className="flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:from-green-100 hover:to-green-200 dark:border-green-800/30 dark:from-green-900/20 dark:to-green-900/30 dark:text-green-300"
                            title="Reativar serviço"
                          >
                            <Eye className="h-3 w-3" />
                            Reativar
                          </button>
                          <button
                            onClick={() => handleDeleteServico(servico.id, servico.nome)}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:from-red-100 hover:to-red-200 dark:border-red-800/30 dark:from-red-900/20 dark:to-red-900/30 dark:text-red-300"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Modais */}
      <LazyNovoAgendamentoModal
        isOpen={isAgendamentoOpen}
        onClose={() => setIsAgendamentoOpen(false)}
        onSuccess={handleAgendamentoSuccess}
        preSelectedServiceId={selectedServiceId}
      />

      {/* Modal de formulário de serviço - apenas para admins */}
      {isAdmin && (
        <LazyServicoFormModal
          isOpen={isServicoFormOpen}
          onClose={() => {
            setIsServicoFormOpen(false)
            setSelectedServico(null)
          }}
          servico={selectedServico}
          onSuccess={handleServicoFormSuccess}
        />
      )}

      {/* Modal de histórico de preços - apenas para admins */}
      {isAdmin && (
        <HistoricoPrecoModal
          isOpen={isHistoricoOpen}
          onClose={() => setIsHistoricoOpen(false)}
          servicoId={selectedServicoId}
        />
      )}

      {/* Modal de gerenciamento de categorias - apenas para admins */}
      {isAdmin && (
        <ServicoCategoriaManager
          isOpen={isCategoriaManagerOpen}
          onClose={() => setIsCategoriaManagerOpen(false)}
          onSuccess={() => {
            // Atualizar lista de serviços após mudanças nas categorias
            refetch()
          }}
        />
      )}


    </>
  )
}
