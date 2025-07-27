'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Button, Input, Textarea } from '@/components/ui'
import { useAdminFuncionarios, type CreateFuncionarioData } from '@/hooks/use-admin-funcionarios'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, Tag, Percent, Calendar } from 'lucide-react'

interface NovoFuncionarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface UserProfile {
  id: string
  nome: string
  email: string
  telefone?: string
  role: string
}

export const NovoFuncionarioModal: React.FC<NovoFuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { createFuncionario } = useAdminFuncionarios()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [step, setStep] = useState<'select' | 'configure'>('select')
  
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    especialidades: [] as string[],
    especialidadeInput: '',
    comissao_percentual: '',
    data_admissao: new Date().toISOString().split('T')[0],
    horario_trabalho: {
      segunda: { inicio: '08:00', fim: '18:00', ativo: true },
      terca: { inicio: '08:00', fim: '18:00', ativo: true },
      quarta: { inicio: '08:00', fim: '18:00', ativo: true },
      quinta: { inicio: '08:00', fim: '18:00', ativo: true },
      sexta: { inicio: '08:00', fim: '18:00', ativo: true },
      sabado: { inicio: '08:00', fim: '17:00', ativo: true },
      domingo: { inicio: '08:00', fim: '12:00', ativo: false }
    }
  })

  // Buscar usuários disponíveis para serem funcionários
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!isOpen) return

      try {
        // Buscar usuários que são clientes e não são funcionários
        const { data: users } = await supabase
          .from('profiles')
          .select('id, nome, email, telefone, role')
          .eq('role', 'client')
          .eq('ativo', true)
          .neq('role', 'saas_owner')

        // Buscar IDs de usuários que já são funcionários
        const { data: funcionarios } = await supabase
          .from('funcionarios')
          .select('profile_id')

        const funcionarioIds = funcionarios?.map(f => f.profile_id) || []
        
        // Filtrar usuários que não são funcionários
        const availableUsers = users?.filter(user => 
          !funcionarioIds.includes(user.id)
        ) || []

        setAvailableUsers(availableUsers)
      } catch (err) {
        console.error('Erro ao buscar usuários disponíveis:', err)
        setError('Erro ao carregar usuários disponíveis')
      }
    }

    fetchAvailableUsers()
  }, [isOpen])

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setSelectedUserId('')
      setFormData({
        especialidades: [],
        especialidadeInput: '',
        comissao_percentual: '',
        data_admissao: new Date().toISOString().split('T')[0],
        horario_trabalho: {
          segunda: { inicio: '08:00', fim: '18:00', ativo: true },
          terca: { inicio: '08:00', fim: '18:00', ativo: true },
          quarta: { inicio: '08:00', fim: '18:00', ativo: true },
          quinta: { inicio: '08:00', fim: '18:00', ativo: true },
          sexta: { inicio: '08:00', fim: '18:00', ativo: true },
          sabado: { inicio: '08:00', fim: '17:00', ativo: true },
          domingo: { inicio: '08:00', fim: '12:00', ativo: false }
        }
      })
      setError(undefined)
    }
  }, [isOpen])

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setStep('configure')
  }

  const handleAddEspecialidade = () => {
    if (formData.especialidadeInput.trim() && !formData.especialidades.includes(formData.especialidadeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        especialidades: [...prev.especialidades, prev.especialidadeInput.trim()],
        especialidadeInput: ''
      }))
    }
  }

  const handleRemoveEspecialidade = (especialidade: string) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.filter(e => e !== especialidade)
    }))
  }

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Selecione um usuário')
      return
    }

    if (formData.especialidades.length === 0) {
      setError('Adicione pelo menos uma especialidade')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const data: CreateFuncionarioData = {
        profile_id: selectedUserId,
        especialidades: formData.especialidades,
        horario_trabalho: formData.horario_trabalho,
        comissao_percentual: formData.comissao_percentual ? parseFloat(formData.comissao_percentual) : 0,
        data_admissao: formData.data_admissao
      }

      const result = await createFuncionario(data)

      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || 'Erro ao criar funcionário')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = availableUsers.find(u => u.id === selectedUserId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      <ModalHeader>
        <ModalTitle>
          {step === 'select' ? 'Selecionar Usuário' : 'Configurar Funcionário'}
        </ModalTitle>
      </ModalHeader>

      <ModalContent className="flex-1 overflow-y-auto">
        {step === 'select' ? (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Selecione um usuário cliente para promover a funcionário:
            </p>
            
            {availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-text-secondary">
                  Nenhum usuário disponível para ser funcionário
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="p-4 border border-border-default rounded-lg hover:bg-background-secondary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-semibold">
                        {user.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{user.nome}</h4>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                        {user.telefone && (
                          <p className="text-xs text-text-secondary">{user.telefone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Usuário selecionado */}
            <div className="p-4 bg-background-secondary rounded-lg">
              <h3 className="font-medium mb-2 text-text-primary">Usuário Selecionado:</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-semibold">
                  {selectedUser?.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">{selectedUser?.nome}</h4>
                  <p className="text-sm text-text-secondary">{selectedUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Especialidades */}
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Especialidades *
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  leftIcon={<Tag className="h-4 w-4" />}
                  value={formData.especialidadeInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidadeInput: e.target.value }))}
                  placeholder="Ex: Corte masculino, Barba"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEspecialidade()}
                />
                <Button
                  type="button"
                  onClick={handleAddEspecialidade}
                  disabled={!formData.especialidadeInput.trim()}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.especialidades.map(especialidade => (
                  <span
                    key={especialidade}
                    className="px-3 py-1 bg-primary-gold/10 text-primary-gold rounded-full text-sm flex items-center gap-2"
                  >
                    {especialidade}
                    <button
                      type="button"
                      onClick={() => handleRemoveEspecialidade(especialidade)}
                      className="text-primary-gold hover:text-primary-gold-dark"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Comissão e Data de Admissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-primary">
                  Comissão (%)
                </label>
                <Input
                  leftIcon={<Percent className="h-4 w-4" />}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comissao_percentual}
                  onChange={(e) => setFormData(prev => ({ ...prev, comissao_percentual: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-primary">
                  Data de Admissão
                </label>
                <Input
                  leftIcon={<Calendar className="h-4 w-4" />}
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_admissao: e.target.value }))}
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            onClick={step === 'select' ? onClose : () => setStep('select')}
            disabled={loading}
          >
            {step === 'select' ? 'Cancelar' : 'Voltar'}
          </Button>
          
          {step === 'configure' && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
            >
              Criar Funcionário
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NovoFuncionarioModal