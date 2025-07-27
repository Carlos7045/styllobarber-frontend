// Componente para configuração de comissões

'use client'

import React, { useState, useEffect } from 'react'
import { useCommission } from '../hooks/use-commission'
import { ComissaoConfig } from '../types'
import { formatCurrency, formatPercentage } from '../utils'

interface CommissionConfigProps {
  barbeiroId: string
  barbeiroNome?: string
  onSave?: (config: ComissaoConfig) => void
  onCancel?: () => void
}

interface ServiceOption {
  id: string
  nome: string
}

export function CommissionConfig({ 
  barbeiroId, 
  barbeiroNome, 
  onSave, 
  onCancel 
}: CommissionConfigProps) {
  const { 
    configs, 
    loading, 
    error, 
    setCommissionConfig, 
    loadBarbeiroConfigs,
    clearError 
  } = useCommission({ barbeiroId })

  // Estado do formulário
  const [formData, setFormData] = useState({
    servicoId: '',
    percentual: 15,
    valorMinimo: '',
    valorMaximo: '',
    ativo: true
  })

  // Estado para serviços disponíveis
  const [services, setServices] = useState<ServiceOption[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ComissaoConfig | null>(null)

  // Carregar serviços disponíveis
  useEffect(() => {
    // TODO: Implementar busca de serviços
    // Por enquanto, usar dados mock
    setServices([
      { id: 'servico_1', nome: 'Corte Masculino' },
      { id: 'servico_2', nome: 'Barba' },
      { id: 'servico_3', nome: 'Corte + Barba' },
      { id: 'servico_4', nome: 'Sobrancelha' }
    ])
  }, [])

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      servicoId: '',
      percentual: 15,
      valorMinimo: '',
      valorMaximo: '',
      ativo: true
    })
    setEditingConfig(null)
    setShowForm(false)
    clearError()
  }

  // Iniciar edição
  const startEdit = (config: ComissaoConfig) => {
    setFormData({
      servicoId: config.servico_id || '',
      percentual: config.percentual,
      valorMinimo: config.valor_minimo?.toString() || '',
      valorMaximo: config.valor_maximo?.toString() || '',
      ativo: config.ativo
    })
    setEditingConfig(config)
    setShowForm(true)
  }

  // Salvar configuração
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const configData = {
        barbeiroId,
        servicoId: formData.servicoId || undefined,
        percentual: formData.percentual,
        valorMinimo: formData.valorMinimo ? parseFloat(formData.valorMinimo) : undefined,
        valorMaximo: formData.valorMaximo ? parseFloat(formData.valorMaximo) : undefined,
        ativo: formData.ativo
      }

      await setCommissionConfig(configData)
      
      // Recarregar configurações
      await loadBarbeiroConfigs(barbeiroId)
      
      resetForm()
      onSave?.(configs[0]) // Passar a primeira configuração como exemplo
    } catch (err) {
      // Erro já tratado pelo hook
    }
  }

  // Obter nome do serviço
  const getServiceName = (servicoId: string | null) => {
    if (!servicoId) return 'Configuração Geral'
    const service = services.find(s => s.id === servicoId)
    return service?.nome || 'Serviço Desconhecido'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configuração de Comissões
          </h2>
          {barbeiroNome && (
            <p className="text-sm text-gray-600 mt-1">
              Barbeiro: {barbeiroNome}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Nova Configuração
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-800">
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Lista de configurações existentes */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Configurações Atuais
        </h3>
        
        {loading && configs.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando configurações...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma configuração de comissão encontrada.</p>
            <p className="text-sm mt-1">Clique em "Nova Configuração" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={`${config.barbeiro_id}-${config.servico_id || 'geral'}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {getServiceName(config.servico_id)}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          config.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {config.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Percentual:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {formatPercentage(config.percentual)}
                        </span>
                      </div>
                      
                      {config.valor_minimo && (
                        <div>
                          <span className="text-gray-600">Valor Mínimo:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(config.valor_minimo)}
                          </span>
                        </div>
                      )}
                      
                      {config.valor_maximo && (
                        <div>
                          <span className="text-gray-600">Valor Máximo:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(config.valor_maximo)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startEdit(config)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de configuração */}
      {showForm && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            {/* Seleção de serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serviço
              </label>
              <select
                value={formData.servicoId}
                onChange={(e) => setFormData(prev => ({ ...prev, servicoId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Configuração Geral (todos os serviços)</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para aplicar a todos os serviços
              </p>
            </div>

            {/* Percentual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentual de Comissão *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.percentual}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    percentual: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* Valores mínimo e máximo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Mínimo (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorMinimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorMinimo: e.target.value }))}
                  placeholder="Ex: 5.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Máximo (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorMaximo}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorMaximo: e.target.value }))}
                  placeholder="Ex: 100.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status ativo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                Configuração ativa
              </label>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  onCancel?.()
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// Componente para preview de cálculo de comissão
interface CommissionPreviewProps {
  barbeiroId: string
  valorServico: number
  servicoId?: string
}

export function CommissionPreview({ barbeiroId, valorServico, servicoId }: CommissionPreviewProps) {
  const { getCommissionConfig } = useCommission()
  const [preview, setPreview] = useState<{
    percentual: number
    valorComissao: number
    valorMinimo?: number
    valorMaximo?: number
  } | null>(null)

  useEffect(() => {
    const calculatePreview = async () => {
      try {
        const config = await getCommissionConfig(barbeiroId, servicoId)
        if (config && valorServico > 0) {
          let valorComissao = (valorServico * config.percentual) / 100
          
          // Aplicar limites
          if (config.valor_minimo && valorComissao < config.valor_minimo) {
            valorComissao = config.valor_minimo
          }
          if (config.valor_maximo && valorComissao > config.valor_maximo) {
            valorComissao = config.valor_maximo
          }
          
          setPreview({
            percentual: config.percentual,
            valorComissao,
            valorMinimo: config.valor_minimo,
            valorMaximo: config.valor_maximo
          })
        } else {
          setPreview(null)
        }
      } catch (err) {
        console.error('Erro ao calcular preview:', err)
        setPreview(null)
      }
    }

    calculatePreview()
  }, [barbeiroId, valorServico, servicoId, getCommissionConfig])

  if (!preview) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Preview da Comissão</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-700">Valor do Serviço:</span>
          <span className="font-medium">{formatCurrency(valorServico)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-700">Percentual:</span>
          <span className="font-medium">{formatPercentage(preview.percentual)}</span>
        </div>
        <div className="flex justify-between border-t border-blue-200 pt-1">
          <span className="text-blue-900 font-medium">Comissão:</span>
          <span className="font-bold text-blue-900">{formatCurrency(preview.valorComissao)}</span>
        </div>
        
        {(preview.valorMinimo || preview.valorMaximo) && (
          <div className="text-xs text-blue-600 mt-2">
            {preview.valorMinimo && `Mín: ${formatCurrency(preview.valorMinimo)}`}
            {preview.valorMinimo && preview.valorMaximo && ' • '}
            {preview.valorMaximo && `Máx: ${formatCurrency(preview.valorMaximo)}`}
          </div>
        )}
      </div>
    </div>
  )
}