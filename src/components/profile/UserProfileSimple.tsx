'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Calendar, Save, X, Shield } from 'lucide-react'

import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { useToast } from '@/shared/components/ui/toast'
import { formatarTelefone } from '@/shared/utils'
import { schemaPerfilUsuario, type DadosPerfilUsuario } from '@/shared/utils/validation'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className }: UserProfileProps) {
  const { user, profile, updateProfile, updateProfileSimple, uploadUserAvatar, loading } = useAuth()
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
      console.log('🔄 Iniciando upload de avatar:', { name: file.name, size: file.size, type: file.type })
      setUploadingAvatar(true)
      
      const result = await uploadUserAvatar(file)
      
      if (result.success) {
        console.log('✅ Avatar atualizado com sucesso:', result.profile?.avatar_url)
        addToast({
          type: 'success',
          title: 'Avatar atualizado!',
          description: 'Sua foto de perfil foi atualizada com sucesso.'
        })
      } else {
        console.error('❌ Erro no upload de avatar:', result.error)
        addToast({
          type: 'error',
          title: 'Erro no upload',
          description: result.error?.message || 'Não foi possível atualizar o avatar.'
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado durante o upload:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado durante o upload da imagem.'
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
        alert('Avatar removido com sucesso!')
      } else {
        alert('Erro ao remover: ' + (result.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      alert('Erro inesperado ao remover avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Função para salvar perfil (versão simplificada sem interceptor)
  const onSubmit = async (data: DadosPerfilUsuario) => {
    try {
      console.log('🔄 Salvando perfil com dados:', data)

      // Preparar dados para atualização
      const updateData: any = {
        nome: data.nome,
      }

      // Adicionar telefone se fornecido
      if (data.telefone && data.telefone.trim()) {
        updateData.telefone = data.telefone
        console.log('📞 Telefone será atualizado:', data.telefone)
      }

      // Adicionar data de nascimento se fornecida
      if (data.data_nascimento && data.data_nascimento.trim()) {
        updateData.data_nascimento = data.data_nascimento
        console.log('📅 Data de nascimento será atualizada:', data.data_nascimento)
      }

      // Adicionar timestamp de atualização
      updateData.updated_at = new Date().toISOString()

      console.log('💾 Dados finais para atualização:', updateData)

      // Usar updateProfileSimple para evitar loops do interceptor
      const result = await updateProfileSimple(updateData)

      if (result.success) {
        setIsEditing(false)
        console.log('✅ Perfil atualizado com sucesso')
        addToast({
          type: 'success',
          title: 'Perfil atualizado!',
          description: 'Suas informações foram salvas com sucesso.'
        })
      } else {
        console.error('❌ Erro ao salvar perfil:', result.error)
        addToast({
          type: 'error',
          title: 'Erro ao salvar',
          description: result.error?.message || 'Erro desconhecido ao salvar perfil.'
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar perfil:', error)
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

      <CardContent className="space-y-6 sm:space-y-8">
        {/* Avatar Section - Responsiva */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`Avatar de ${profile.nome}`}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-primary-gold"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-gold rounded-full flex items-center justify-center border-4 border-primary-gold">
                <span className="text-2xl sm:text-3xl font-bold text-primary-black">
                  {profile.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Upload Button */}
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2">
                <label className="bg-primary-gold text-primary-black p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-primary-gold-dark transition-colors shadow-lg">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleAvatarUpload(file)
                    }}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            )}
            
            {/* Loading indicator para upload */}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {/* Informações do usuário */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 truncate">
              {profile.nome}
            </h3>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary-gold flex-shrink-0" />
              <span className="text-text-muted capitalize font-medium text-sm sm:text-base">
                {profile.role === 'admin' ? 'Administrador' : 
                 profile.role === 'barber' ? 'Barbeiro' : 'Cliente'}
              </span>
            </div>
            
            {profile.pontos_fidelidade !== undefined && profile.role === 'client' && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-primary-gold">
                <Award className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
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
