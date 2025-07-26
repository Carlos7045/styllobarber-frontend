'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Save, User, Mail, Phone, Calendar, Shield, UserCheck, UserX } from 'lucide-react'
import { z } from 'zod'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { UserProfile } from '@/hooks/use-auth'
import { formatarTelefone } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// Schema para edição de usuário pelo admin
const schemaEdicaoUsuario = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'barber', 'client'], {
    errorMap: () => ({ message: 'Role inválido' })
  }),
  data_nascimento: z.string().optional().or(z.literal('')),
  ativo: z.boolean(),
})

type DadosEdicaoUsuario = z.infer<typeof schemaEdicaoUsuario>

interface UserEditModalProps {
  user: UserProfile | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedUser: UserProfile) => void
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DadosEdicaoUsuario>({
    resolver: zodResolver(schemaEdicaoUsuario),
  })

  // Observar valor do telefone para formatação
  const telefoneValue = watch('telefone')

  // Resetar formulário quando usuário muda
  useEffect(() => {
    if (user) {
      reset({
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || '',
        role: user.role,
        data_nascimento: user.data_nascimento || '',
        ativo: true, // TODO: Implementar campo ativo no banco
      })
    }
  }, [user, reset])

  // Função para formatar telefone em tempo real
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value)
    setValue('telefone', formatted)
  }

  // Função para salvar alterações
  const onSubmit = async (data: DadosEdicaoUsuario) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para atualização
      const updateData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || null,
        role: data.role,
        data_nascimento: data.data_nascimento || null,
        updated_at: new Date().toISOString(),
      }

      // Atualizar no banco
      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Atualizar email no Supabase Auth se mudou
      if (data.email !== user.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email: data.email }
        )

        if (authError) {
          console.warn('Erro ao atualizar email no Auth:', authError)
          // Não bloquear a operação, apenas avisar
        }
      }

      // Chamar callback de sucesso
      onSave(updatedData as UserProfile)
      onClose()

    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      setError(error.message || 'Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  // Função para desativar/ativar usuário
  const handleToggleUserStatus = async (activate: boolean) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // TODO: Implementar campo ativo no banco
      // Por enquanto, apenas simular
      console.log(`${activate ? 'Ativando' : 'Desativando'} usuário:`, user.id)
      
      // Atualizar estado local
      setValue('ativo', activate)

    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      setError(error.message || 'Erro ao alterar status do usuário')
    } finally {
      setLoading(false)
    }
  }

  // Obter nome do role em português
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'barber':
        return 'Barbeiro'
      case 'client':
        return 'Cliente'
      default:
        return role
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Editar Usuário
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <Input
                {...register('nome')}
                label="Nome Completo"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.nome?.message}
                disabled={loading}
                required
              />

              {/* Email */}
              <Input
                {...register('email')}
                type="email"
                label="Email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telefone */}
              <Input
                {...register('telefone')}
                label="Telefone"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.telefone?.message}
                disabled={loading}
                onChange={handleTelefoneChange}
                value={telefoneValue || ''}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />

              {/* Data de Nascimento */}
              <Input
                {...register('data_nascimento')}
                type="date"
                label="Data de Nascimento"
                leftIcon={<Calendar className="h-4 w-4" />}
                error={errors.data_nascimento?.message}
                disabled={loading}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Perfil de Acesso
              </label>
              <select
                {...register('role')}
                disabled={loading}
                className="w-full px-3 py-2 border border-border-default rounded-md bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent disabled:opacity-50"
              >
                <option value="client">Cliente</option>
                <option value="barber">Barbeiro</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-error">{errors.role.message}</p>
              )}
            </div>

            {/* Informações do sistema */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-default">
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Criado em
                </label>
                <p className="text-sm text-text-muted">
                  {new Date(user.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Última atualização
                </label>
                <p className="text-sm text-text-muted">
                  {new Date(user.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Ações de status do usuário */}
            <div className="flex gap-2 pt-4 border-t border-border-default">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleUserStatus(true)}
                disabled={loading}
                className="flex-1"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Ativar Usuário
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleUserStatus(false)}
                disabled={loading}
                className="flex-1 text-error border-error hover:bg-error hover:text-white"
              >
                <UserX className="h-4 w-4 mr-2" />
                Desativar Usuário
              </Button>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}