'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Calendar, Save, X, Shield, Award } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { AvatarUpload } from './AvatarUpload'
import { useToast } from '@/components/ui/toast'
import { formatarTelefone } from '@/lib/utils'
import { schemaPerfilUsuario, type DadosPerfilUsuario } from '@/lib/validations'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className }: UserProfileProps) {
  const { user, profile, updateProfile, uploadUserAvatar, loading } = useAuth()
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DadosPerfilUsuario>({
    resolver: zodResolver(schemaPerfilUsuario),
    defaultValues: {
      nome: profile?.nome || '',
      telefone: profile?.telefone || '',
      data_nascimento: profile?.data_nascimento || '',
    },
  })

  // Observar valor do telefone para formatação
  const telefoneValue = watch('telefone')

  // Função para formatar telefone em tempo real
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value)
    setValue('telefone', formatted)
  }

  // Função para fazer upload do avatar
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true)
      const result = await uploadUserAvatar(file)
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Avatar atualizado!',
          description: 'Sua foto de perfil foi atualizada com sucesso.'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro no upload',
          description: result.error?.message || 'Não foi possível atualizar o avatar.'
        })
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado durante o upload.'
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Função para remover avatar
  const handleAvatarRemove = async () => {
    try {
      setUploadingAvatar(true)
      const result = await updateProfile({ avatar_url: null })
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Avatar removido',
          description: 'Sua foto de perfil foi removida com sucesso.'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao remover',
          description: result.error?.message || 'Não foi possível remover o avatar.'
        })
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao remover o avatar.'
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Função para salvar perfil
  const onSubmit = async (data: DadosPerfilUsuario) => {
    try {
      // Preparar dados para atualização
      const updateData: Partial<typeof profile> = {
        nome: data.nome,
      }

      // Adicionar telefone se fornecido
      if (data.telefone && data.telefone.trim()) {
        updateData.telefone = data.telefone
      }

      // Adicionar data de nascimento se fornecida
      if (data.data_nascimento && data.data_nascimento.trim()) {
        updateData.data_nascimento = data.data_nascimento
      }

      const result = await updateProfile(updateData)

      if (result.success) {
        setIsEditing(false)
        addToast({
          type: 'success',
          title: 'Perfil atualizado!',
          description: 'Suas informações foram salvas com sucesso.'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao salvar',
          description: result.error?.message || 'Não foi possível atualizar o perfil.'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao salvar as alterações.'
      })
    }
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setIsEditing(false)
    reset({
      nome: profile?.nome || '',
      telefone: profile?.telefone || '',
      data_nascimento: profile?.data_nascimento || '',
    })
  }

  if (!user || !profile) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-text-muted">Carregando perfil...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <AvatarUpload
            currentAvatar={profile.avatar_url}
            userName={profile.nome}
            onUpload={handleAvatarUpload}
            onRemove={profile.avatar_url ? handleAvatarRemove : undefined}
            isLoading={uploadingAvatar}
            size="lg"
            disabled={!isEditing}
          />
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-text-primary mb-1">
              {profile.nome}
            </h3>
            
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary-gold" />
              <span className="text-text-muted capitalize font-medium">
                {profile.role === 'admin' ? 'Administrador' : 
                 profile.role === 'barber' ? 'Barbeiro' : 'Cliente'}
              </span>
            </div>
            
            {profile.pontos_fidelidade !== undefined && profile.role === 'client' && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary-gold">
                <Award className="h-4 w-4" />
                <span className="font-medium">
                  {profile.pontos_fidelidade} pontos de fidelidade
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <Input
            {...register('nome')}
            label="Nome Completo"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.nome?.message}
            disabled={!isEditing || isSubmitting || loading || uploadingAvatar}
            required
          />

          {/* Email (readonly) */}
          <Input
            value={profile.email}
            label="Email"
            leftIcon={<Mail className="h-4 w-4" />}
            disabled
            helperText="O email não pode ser alterado"
          />

          {/* Telefone */}
          <Input
            {...register('telefone')}
            label="Telefone (opcional)"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.telefone?.message}
            disabled={!isEditing || isSubmitting || loading || uploadingAvatar}
            onChange={handleTelefoneChange}
            value={telefoneValue || ''}
            placeholder="(11) 99999-9999"
            maxLength={15}
            helperText="Formato: (XX) XXXXX-XXXX"
          />

          {/* Data de Nascimento */}
          <Input
            {...register('data_nascimento')}
            type="date"
            label="Data de Nascimento (opcional)"
            leftIcon={<Calendar className="h-4 w-4" />}
            error={errors.data_nascimento?.message}
            disabled={!isEditing || isSubmitting || loading || uploadingAvatar}
            helperText="Idade deve estar entre 13 e 120 anos"
          />

          {/* Informações do sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-default">
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Membro desde
              </label>
              <p className="text-sm text-text-muted">
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Última atualização
              </label>
              <p className="text-sm text-text-muted">
                {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={isSubmitting || loading || uploadingAvatar}
                disabled={isSubmitting || loading || uploadingAvatar}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting || loading || uploadingAvatar ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || loading || uploadingAvatar}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}