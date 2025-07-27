'use client'

import React from 'react'
import { User, Clock, DollarSign } from 'lucide-react'
import { useFuncionariosEspecialidades } from '@/hooks/use-funcionarios-especialidades-simple'
import type { FuncionarioComEspecialidades } from '@/types/funcionarios'

interface FuncionarioSelectorProps {
  serviceId?: string
  selectedFuncionarioId?: string
  onFuncionarioSelect: (funcionario: FuncionarioComEspecialidades | null) => void
  disabled?: boolean
  className?: string
}

export const FuncionarioSelector: React.FC<FuncionarioSelectorProps> = ({
  serviceId,
  selectedFuncionarioId,
  onFuncionarioSelect,
  disabled = false,
  className = ''
}) => {
  const { funcionarios, loading, error } = useFuncionariosEspecialidades()

  // Filtrar funcionários que podem fazer o serviço selecionado
  const funcionariosDisponiveis = serviceId 
    ? funcionarios.filter(funcionario => 
        funcionario.ativo && 
        funcionario.servicos.some(servico => servico.id === serviceId)
      )
    : funcionarios.filter(funcionario => funcionario.ativo)

  const handleFuncionarioClick = (funcionario: FuncionarioComEspecialidades) => {
    if (disabled) return
    
    // Se já está selecionado, desselecionar
    if (selectedFuncionarioId === funcionario.id) {
      onFuncionarioSelect(null)
    } else {
      onFuncionarioSelect(funcionario)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-medium text-text-primary">Selecione o Funcionário</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-text-secondary">Carregando funcionários...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-medium text-text-primary">Selecione o Funcionário</h3>
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          Erro ao carregar funcionários: {error}
        </div>
      </div>
    )
  }

  if (funcionariosDisponiveis.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-medium text-text-primary">Selecione o Funcionário</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-text-secondary">
            {serviceId 
              ? 'Nenhum funcionário disponível para este serviço'
              : 'Nenhum funcionário disponível'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="font-medium text-text-primary">
        Selecione o Funcionário
        {serviceId && (
          <span className="text-sm text-text-secondary font-normal ml-2">
            ({funcionariosDisponiveis.length} disponível{funcionariosDisponiveis.length !== 1 ? 'eis' : ''})
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {funcionariosDisponiveis.map((funcionario) => {
          const isSelected = selectedFuncionarioId === funcionario.id
          const servicoSelecionado = serviceId 
            ? funcionario.servicos.find(s => s.id === serviceId)
            : null
          
          return (
            <div
              key={funcionario.id}
              onClick={() => handleFuncionarioClick(funcionario)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary-gold bg-primary-gold/10'
                    : 'border-border-default hover:border-primary-gold/50 hover:bg-background-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-semibold">
                  {funcionario.avatar_url ? (
                    <img
                      src={funcionario.avatar_url}
                      alt={funcionario.nome}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    funcionario.nome.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">
                    {funcionario.nome}
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {funcionario.role === 'admin' ? 'Administrador' : 'Barbeiro'}
                  </p>
                  
                  {/* Informações do serviço se selecionado */}
                  {servicoSelecionado && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        R$ {servicoSelecionado.preco.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {servicoSelecionado.duracao_minutos}min
                      </div>
                    </div>
                  )}
                  
                  {/* Especialidades (se não há serviço selecionado) */}
                  {!serviceId && funcionario.servicos.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {funcionario.servicos.slice(0, 2).map((servico) => (
                          <span
                            key={servico.id}
                            className="px-2 py-1 bg-neutral-light-gray text-text-secondary text-xs rounded-full"
                          >
                            {servico.nome}
                          </span>
                        ))}
                        {funcionario.servicos.length > 2 && (
                          <span className="px-2 py-1 bg-neutral-light-gray text-text-secondary text-xs rounded-full">
                            +{funcionario.servicos.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Indicador de seleção */}
                {isSelected && (
                  <div className="w-6 h-6 bg-primary-gold rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-black" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FuncionarioSelector