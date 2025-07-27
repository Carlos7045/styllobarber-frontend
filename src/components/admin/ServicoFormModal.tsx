'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Button, Input, Textarea } from '@/components/ui'
import { useAdminServicos, type CreateServicoData, type UpdateServicoData, type ServicoAdmin } from '@/hooks/use-admin-servicos'
import { Scissors, DollarSign, Clock, Tag, Hash } from 'lucide-react'

interface ServicoFormModalProps {
  isOpen: boolean
  onClose: () => void
  servico?: ServicoAdmin | null
  onSuccess?: (servico: ServicoAdmin) => void
}

export const ServicoFormModal: React.FC<ServicoFormModalProps> = ({
  isOpen,
  onClose,
  servico,
  onSuccess
}) => {
  const { createServico, updateServico } = useAdminServicos()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao_minutos: '',
    categoria: '',
    ordem: '',
    ativo: true
  })

  const isEditing = !!servico

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (servico) {
        setFormData({
          nome: servico.nome,
          descricao: servico.descricao || '',
          preco: servico.preco.toString(),
          duracao_minutos: servico.duracao_minutos.toString(),
          categoria: servico.categoria || '',
          ordem: servico.ordem?.toString() || '',
          ativo: servico.ativo
        })
      } else {
        setFormData({
          nome: '',
          descricao: '',
          preco: '',
          duracao_minutos: '',
          categoria: '',
          ordem: '',
          ativo: true
        })
      }
      setError(undefined)
    }
  }, [isOpen, servico])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      setError('Preço deve ser maior que zero')
      return
    }

    if (!formData.duracao_minutos || parseInt(formData.duracao_minutos) <= 0) {
      setError('Duração deve ser maior que zero')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const data = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        preco: parseFloat(formData.preco),
        duracao_minutos: parseInt(formData.duracao_minutos),
        categoria: formData.categoria.trim() || undefined,
        ordem: formData.ordem ? parseInt(formData.ordem) : undefined,
        ativo: formData.ativo
      }

      let result
      if (isEditing) {
        result = await updateServico(servico.id, data as UpdateServicoData)
      } else {
        result = await createServico(data as CreateServicoData)
      }

      if (result.success) {
        onSuccess?.(result.data || { ...servico!, ...data })
        onClose()
      } else {
        setError(result.error || 'Erro ao salvar serviço')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(undefined)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      <ModalHeader>
        <ModalTitle>
          {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
        </ModalTitle>
      </ModalHeader>

      <ModalContent className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do serviço */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Nome do Serviço *
            </label>
            <Input
              leftIcon={<Scissors className="h-4 w-4" />}
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Corte Masculino"
              disabled={loading}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Descrição
            </label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva o serviço oferecido..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Preço e Duração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Preço (R$) *
              </label>
              <Input
                leftIcon={<DollarSign className="h-4 w-4" />}
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => handleInputChange('preco', e.target.value)}
                placeholder="0,00"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Duração (minutos) *
              </label>
              <Input
                leftIcon={<Clock className="h-4 w-4" />}
                type="number"
                min="1"
                value={formData.duracao_minutos}
                onChange={(e) => handleInputChange('duracao_minutos', e.target.value)}
                placeholder="30"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Categoria e Ordem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Categoria
              </label>
              <Input
                leftIcon={<Tag className="h-4 w-4" />}
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                placeholder="Ex: Corte, Barba, Combo"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Ordem de Exibição
              </label>
              <Input
                leftIcon={<Hash className="h-4 w-4" />}
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(e) => handleInputChange('ordem', e.target.value)}
                placeholder="1"
                disabled={loading}
              />
              <p className="text-xs text-text-secondary mt-1">
                Menor número aparece primeiro
              </p>
            </div>
          </div>

          {/* Status ativo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleInputChange('ativo', e.target.checked)}
              disabled={loading}
              className="w-4 h-4 text-primary-gold bg-background-primary border-border-default rounded focus:ring-primary-gold focus:ring-2 accent-primary-gold"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-text-primary">
              Serviço ativo (disponível para agendamento)
            </label>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}
        </form>
      </ModalContent>

      <ModalFooter>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Serviço'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default ServicoFormModal