'use client'

import React from 'react'
import { Scissors, Clock, DollarSign, Check } from 'lucide-react'
import { useServices } from '@/hooks/use-services'
import { useFuncionariosEspecialidades } from '@/hooks/use-funcionarios-especialidades-simple'
import type { Service } from '@/types/services'

interface ServicoSelectorProps {
  funcionarioId?: string
  selectedServiceId?: string
  onServiceSelect: (service: Service | null) => void
  disabled?: boolean
  className?: string
}

export const ServicoSelector: React.FC<ServicoSelectorProps> = ({
  funcionarioId,
  selectedServiceId,
  onServiceSelect,
  disabled = false,
  className = ''
}) => {
  const { services, loading: servicesLoading } = useServices()
  const { getServicesByFuncionario } = useFuncionariosEspecialidades()

  // Filtrar serviços que o funcionário pode fazer
  const servicosDisponiveis = funcionarioId 
    ? getServicesByFuncionario(funcionarioId)
    : services.filter(service => service.ativo)

  // Agrupar serviços por categoria
  const servicosPorCategoria = servicosDisponiveis.reduce((acc, service) => {
    const categoria = service.categoria || 'Outros'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const handleServiceClick = (service: Service) => {
    if (disabled) return
    
    // Se já está selecionado, desselecionar
    if (selectedServiceId === service.id) {
      onServiceSelect(null)
    } else {
      onServiceSelect(service)
    }
  }

  if (servicesLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-medium text-text-primary">Selecione o Serviço</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-text-secondary">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  if (servicosDisponiveis.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-medium text-text-primary">Selecione o Serviço</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-text-secondary">
            {funcionarioId 
              ? 'Este funcionário não possui especialidades definidas'
              : 'Nenhum serviço disponível'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-medium text-text-primary">
        Selecione o Serviço
        {funcionarioId && (
          <span className="text-sm text-text-secondary font-normal ml-2">
            ({servicosDisponiveis.length} disponível{servicosDisponiveis.length !== 1 ? 'eis' : ''})
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        {Object.entries(servicosPorCategoria).map(([categoria, categoryServices]) => (
          <div key={categoria} className="space-y-2">
            <h4 className="font-medium text-text-primary text-sm border-b border-border-default pb-1">
              {categoria}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryServices.map((service) => {
                const isSelected = selectedServiceId === service.id
                
                return (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary-gold bg-primary-gold/10'
                          : 'border-border-default hover:border-primary-gold/50 hover:bg-background-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Ícone do serviço */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected 
                            ? 'bg-primary-gold text-primary-black' 
                            : 'bg-background-secondary text-text-secondary'
                        }`}>
                          <Scissors className="h-5 w-5" />
                        </div>

                        {/* Informações do serviço */}
                        <div>
                          <h5 className="font-medium text-text-primary">
                            {service.nome}
                          </h5>
                          {service.descricao && (
                            <p className="text-sm text-text-secondary">
                              {service.descricao}
                            </p>
                          )}
                          
                          {/* Preço e duração */}
                          <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
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

                      {/* Indicador de seleção */}
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary-gold rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-black" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServicoSelector