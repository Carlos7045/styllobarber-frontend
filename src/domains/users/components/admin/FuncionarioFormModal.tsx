/**
 * Modal de formulário para funcionários com validações robustas
 */

'use client'

import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, UserCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { useFuncionariosAdmin } from '@/domains/users/hooks/use-funcionarios-admin'
import { useFuncionarioForm, usePhoneFormatter, type FuncionarioFormData } from '@/domains/users/hooks/use-funcionario-form'
import { useServices } from '@/shared/hooks/data/use-services'

interface FuncionarioFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  mode: 'create' | 'update'
  funcionarioId?: string
  initialData?: Partial<FuncionarioFormData>
}

export const FuncionarioFormModal: React.FC<FuncionarioFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  funcionarioId,
  initialData
}) => {
  const { create, update } = useFuncionariosAdmin()
  const { services } = useServices()
  const { formatPhone } = usePhoneFormatter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  
  const form = useFuncionarioForm({
    mode,
    funcionarioId,
    initialData,
    onValidationChange: (isValid) => {
      // Pode ser usado para habilitar/desabilitar botão de submit
    }
  })

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      form.reset()
      setSubmitError(undefined)
    }
  }, [isOpen, form])

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.isValidating || isSubmitting) return
    
    setIsSubmitting(true)
    setSubmitError(undefined)
    
    try {
      // Validar antes de submeter
      const validation = await form.validate()
      
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ')
        setSubmitError(errorMessages)
        return
      }
      
      // Submeter dados
      let result
      if (mode === 'create') {
        result = await create(form.data)
      } else {
        if (!funcionarioId) {
          throw new Error('ID do funcionário é obrigatório para atualização')
        }
        result = await update(funcionarioId, form.data)
      }
      
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setSubmitError(result.error || 'Erro ao salvar funcionário')
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Adicionar especialidade
  const handleAddEspecialidade = (serviceId: string) => {
    const currentEspecialidades = form.data.especialidades || []
    if (!currentEspecialidades.includes(serviceId)) {
      form.setField('especialidades', [...currentEspecialidades, serviceId])
    }
  }

  // Remover especialidade
  const handleRemoveEspecialidade = (serviceId: string) => {
    const currentEspecialidades = form.data.especialidades || []
    form.setField('especialidades', currentEspecialidades.filter(id => id !== serviceId))
  }

  // Formatar telefone em tempo real
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    form.setField('telefone', formatted)
  }

  if (!isOpen) return null

  const selectedServices = services.filter(s => form.data.especialidades?.includes(s.id))
  const availableServices = services.filter(s => !form.data.especialidades?.includes(s.id) && s.ativo)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Básicos
              </h3>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <Input
                  {...form.getFieldProps('nome')}
                  placeholder="Digite o nome completo"
                  className={form.errors.nome ? 'border-red-500' : ''}
                />
                {form.errors.nome && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {form.errors.nome}
                  </p>
                )}
                {form.warnings.nome && (
                  <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {form.warnings.nome}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...form.getFieldProps('email')}
                    type="email"
                    placeholder="email@exemplo.com"
                    className={`pl-10 ${form.errors.email ? 'border-red-500' : ''}`}
                  />
                  {form.isValidating && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                  )}
                </div>
                {form.errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {form.errors.email}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={form.data.telefone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={form.getFieldProps('telefone').onBlur}
                    placeholder="(11) 99999-9999"
                    className={`pl-10 ${form.errors.telefone ? 'border-red-500' : ''}`}
                  />
                </div>
                {form.errors.telefone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {form.errors.telefone}
                  </p>
                )}
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="barber"
                      checked={form.data.role === 'barber'}
                      onChange={(e) => form.setField('role', e.target.value as 'barber')}
                      className="mr-2"
                    />
                    Barbeiro
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={form.data.role === 'admin'}
                      onChange={(e) => form.setField('role', e.target.value as 'admin')}
                      className="mr-2"
                    />
                    Administrador
                  </label>
                </div>
                {form.warnings.role && (
                  <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {form.warnings.role}
                  </p>
                )}
              </div>
            </div>

            {/* Especialidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Especialidades
              </h3>

              {/* Especialidades Selecionadas */}
              {selectedServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades Selecionadas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map(service => (
                      <Badge
                        key={service.id}
                        variant="primary"
                        className="flex items-center gap-1"
                      >
                        {service.nome}
                        <button
                          type="button"
                          onClick={() => handleRemoveEspecialidade(service.id)}
                          className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar Especialidades */}
              {availableServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar Especialidades
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableServices.map(service => (
                      <Badge
                        key={service.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200"
                        onClick={() => handleAddEspecialidade(service.id)}
                      >
                        + {service.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {form.errors.especialidades && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {form.errors.especialidades}
                </p>
              )}

              {form.warnings.especialidades && (
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {form.warnings.especialidades}
                </p>
              )}
            </div>

            {/* Erro Geral */}
            {(submitError || form.errors.general) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {submitError || form.errors.general}
                </p>
              </div>
            )}

            {/* Status de Validação */}
            {form.isDirty && (
              <div className="flex items-center gap-2 text-sm">
                {form.isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-blue-600">Validando...</span>
                  </>
                ) : form.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Dados válidos</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Corrija os erros acima</span>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!form.isValid || form.isValidating || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}