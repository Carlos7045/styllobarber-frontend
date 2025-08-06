'use client'

import React, { useState, useEffect } from 'react'
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle, SimpleModalFooter } from '@/shared/components/ui/modal-simple'
import { Button, Input } from '@/shared/components/ui'
import { useServices } from '@/shared/hooks/data/use-services'
import { useFuncionariosEspecialidades } from '@/domains/users/hooks/use-funcionarios-especialidades-simple'
import { Search, Check, X, Scissors, Clock, DollarSign, Trash2, RotateCcw } from 'lucide-react'
import type { FuncionarioComEspecialidades } from '@/types/funcionarios'
import type { Service } from '@/types/services'

interface EspecialidadesModalProps {
  funcionario: FuncionarioComEspecialidades | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const EspecialidadesModal: React.FC<EspecialidadesModalProps> = ({
  funcionario,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { services, disabledServices, loading: servicesLoading, deleteService, reactivateService } = useServices()
  const { updateFuncionarioEspecialidades } = useFuncionariosEspecialidades()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debug: Log dos serviços desativados
  console.log('🔍 Serviços desativados:', disabledServices)
  console.log('🔍 Quantidade de serviços desativados:', disabledServices?.length || 0)
  console.log('🔍 Modal está aberto:', isOpen)

  // Resetar estado quando modal abre/fecha
  useEffect(() => {
    if (isOpen && funcionario) {
      setSelectedServiceIds(funcionario.servicos.map(s => s.id))
      setSearchTerm('')
      setError(undefined)
    } else {
      setSelectedServiceIds([])
      setSearchTerm('')
      setError(undefined)
    }
  }, [isOpen, funcionario])

  // Filtrar serviços por busca
  const filteredServices = services.filter(service =>
    service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agrupar serviços por categoria
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const categoria = service.categoria || 'Outros'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleSelectAll = () => {
    setSelectedServiceIds(filteredServices.map(s => s.id))
  }

  const handleDeselectAll = () => {
    setSelectedServiceIds([])
  }

  const handleSubmit = async () => {
    if (!funcionario) return

    // Confirmar se o usuário quer salvar sem especialidades
    if (selectedServiceIds.length === 0) {
      const confirmar = window.confirm(
        `Tem certeza que deseja salvar sem especialidades?\n\n${funcionario.nome} não poderá realizar nenhum serviço até que especialidades sejam definidas.`
      )
      if (!confirmar) return
    }

    setLoading(true)
    setError(undefined)

    try {
      const result = await updateFuncionarioEspecialidades({
        funcionario_id: funcionario.id,
        service_ids: selectedServiceIds
      })

      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || 'Erro ao atualizar especialidades')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Função para deletar serviço desativado
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    const confirmar = window.confirm(
      `ATENÇÃO: Esta ação é irreversível!\n\nTem certeza que deseja excluir permanentemente o serviço "${serviceName}"?\n\nEsta ação irá:\n- Remover o serviço do banco de dados\n- Remover todas as associações com funcionários\n- Não poderá ser desfeita`
    )
    
    if (!confirmar) return

    setActionLoading(serviceId)
    setError(undefined)

    try {
      const result = await deleteService(serviceId)
      
      if (result.success) {
        // Sucesso - não precisa fazer nada, o hook já atualiza o estado
      } else {
        setError(result.error || 'Erro ao excluir serviço')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao excluir serviço')
    } finally {
      setActionLoading(null)
    }
  }

  // Função para reativar serviço
  const handleReactivateService = async (serviceId: string, serviceName: string) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja reativar o serviço "${serviceName}"?\n\nO serviço ficará disponível novamente para seleção.`
    )
    
    if (!confirmar) return

    setActionLoading(serviceId)
    setError(undefined)

    try {
      const result = await reactivateService(serviceId)
      
      if (result.success) {
        // Sucesso - não precisa fazer nada, o hook já atualiza o estado
      } else {
        setError(result.error || 'Erro ao reativar serviço')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao reativar serviço')
    } finally {
      setActionLoading(null)
    }
  }

  if (!funcionario) return null

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <SimpleModalHeader className="flex-shrink-0">
        <SimpleModalTitle>
          Especialidades de {funcionario.nome}
        </SimpleModalTitle>
      </SimpleModalHeader>

      <SimpleModalContent className="flex-1 overflow-y-auto space-y-4 min-h-0 max-h-[60vh]">
        <div className="text-sm text-text-secondary">
          Selecione os serviços que <strong>{funcionario.nome}</strong> pode realizar:
        </div>

        {/* Busca e ações */}
        <div className="space-y-3">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading || servicesLoading}
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading || servicesLoading || filteredServices.length === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Selecionar Todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={loading || servicesLoading || selectedServiceIds.length === 0}
            >
              <X className="h-4 w-4 mr-1 text-text-primary" />
              Desmarcar Todos
            </Button>
          </div>
        </div>

        {/* Resumo da seleção */}
        <div className="p-3 bg-background-secondary rounded-lg border border-border-default sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm">
            <Scissors className="h-4 w-4 text-primary-gold" />
            {selectedServiceIds.length > 0 ? (
              <span className="text-text-primary">
                <strong>{selectedServiceIds.length}</strong> especialidade{selectedServiceIds.length !== 1 ? 's' : ''} selecionada{selectedServiceIds.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-text-secondary">
                Nenhuma especialidade selecionada - funcionário não realizará serviços
              </span>
            )}
          </div>
        </div>

        {/* Lista de serviços */}
        {servicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-text-secondary">Carregando serviços...</p>
          </div>
        ) : Object.keys(servicesByCategory).length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-text-secondary">Nenhum serviço encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(servicesByCategory).map(([categoria, categoryServices]) => (
              <div key={categoria} className="space-y-2">
                <h4 className="font-medium text-text-primary border-b border-border-default pb-1">
                  {categoria}
                </h4>
                <div className="space-y-2">
                  {categoryServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id)
                    
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceToggle(service.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-gold bg-primary-gold/10'
                            : 'border-border-default hover:border-primary-gold/50 hover:bg-background-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-primary-gold bg-primary-gold'
                                : 'border-border-default'
                            }`}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-primary-black" />
                              )}
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-text-primary">
                                {service.nome}
                              </h5>
                              {service.descricao && (
                                <p className="text-sm text-text-secondary">
                                  {service.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              R$ {service.preco.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.duracao_minutos}min
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seção de Serviços Desativados */}
        {disabledServices && disabledServices.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border-default">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-error" />
              <h4 className="font-medium text-text-primary">
                Serviços Desativados ({disabledServices.length})
              </h4>
            </div>
            
            <div className="text-sm text-text-secondary mb-3">
              Estes serviços estão desativados e não podem ser selecionados. Você pode reativá-los ou excluí-los permanentemente.
            </div>

            <div className="space-y-2">
              {disabledServices.map((service) => (
                <div
                  key={service.id}
                  className="p-3 border border-border-default rounded-lg bg-background-secondary/50 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-error bg-error/10 flex items-center justify-center">
                        <X className="h-3 w-3 text-error" />
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-text-primary">
                          {service.nome}
                        </h5>
                        {service.descricao && (
                          <p className="text-sm text-text-secondary">
                            {service.descricao}
                          </p>
                        )}
                        {service.categoria && (
                          <p className="text-xs text-text-secondary">
                            Categoria: {service.categoria}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          R$ {service.preco.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.duracao_minutos}min
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivateService(service.id, service.nome)}
                          disabled={actionLoading === service.id}
                          loading={actionLoading === service.id}
                          className="text-success hover:text-success hover:bg-success/10 border-success/20"
                          title="Reativar serviço"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id, service.nome)}
                          disabled={actionLoading === service.id}
                          loading={actionLoading === service.id}
                          className="text-error hover:text-error hover:bg-error/10 border-error/20"
                          title="Excluir permanentemente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug: Mostrar sempre se há serviços desativados */}
        <div className="p-2 bg-yellow-100 text-yellow-800 text-xs">
          Debug: {disabledServices?.length || 0} serviços desativados encontrados
        </div>

        {/* Espaçamento final para garantir scroll completo */}
        <div className="h-4"></div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}
      </SimpleModalContent>

      <SimpleModalFooter className="flex-shrink-0 border-t border-border-default">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
          >
            Salvar Especialidades
          </Button>
        </div>
      </SimpleModalFooter>
    </SimpleModal>
  )
}

export default EspecialidadesModal
