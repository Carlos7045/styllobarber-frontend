'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Calendar, Camera, Save, X, Upload, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatarTelefone } from '@/lib/utils'
import { schemaPerfilUsuario, type DadosPerfilUsuario } from '@/lib/validations'
import { validateFile, resizeImage } from '@/lib/storage'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className }: UserProfileProps) {
  const { user, profile, updateProfile, uploadUserAvatar, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
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

  // Função para lidar com upload de avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    try {
      // Redimensionar imagem para otimizar
      const resizedFile = await resizeImage(file, 400, 400, 0.8)
      
      setAvatarFile(resizedFile)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(resizedFile)
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      alert('Erro ao processar imagem')
    }
  }

  // Função para fazer upload do avatar
  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    try {
      setUploadingAvatar(true)
      const result = await uploadUserAvatar(avatarFile)
      
      if (result.success) {
        setAvatarFile(null)
        setAvatarPreview(null)
        alert('Avatar atualizado com sucesso!')
      } else {
        alert(result.error?.message || 'Erro ao fazer upload do avatar')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro inesperado no upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Função para remover avatar
  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return

    if (!confirm('Tem certeza que deseja remover seu avatar?')) return

    try {
      setUploadingAvatar(true)
      const result = await updateProfile({ avatar_url: '' })
      
      if (result.success) {
        alert('Avatar removido com sucesso!')
      } else {
        alert(result.error?.message || 'Erro ao remover avatar')
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      alert('Erro inesperado ao remover avatar')
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
        setAvatarFile(null)
        setAvatarPreview(null)
        alert('Perfil atualizado com sucesso!')
      } else {
        alert(result.error?.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      alert('Erro inesperado ao atualizar perfil')
    }
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
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

      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-bold text-xl overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview do avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar do usuário"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.nome.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Botões de ação do avatar */}
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <label className="bg-primary-gold text-primary-black p-1 rounded-full cursor-pointer hover:bg-primary-gold-dark transition-colors">
                  <Camera className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
                
                {profile.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    title="Remover avatar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{profile.nome}</h3>
            <p className="text-text-muted capitalize">{profile.role}</p>
            {profile.pontos_fidelidade !== undefined && (
              <p className="text-sm text-primary-gold">
                {profile.pontos_fidelidade} pontos de fidelidade
              </p>
            )}
            
            {/* Botão de upload quando há preview */}
            {avatarPreview && isEditing && (
              <Button
                type="button"
                size="sm"
                onClick={handleUploadAvatar}
                loading={uploadingAvatar}
                disabled={uploadingAvatar}
                className="mt-2"
              >
                <Upload className="h-3 w-3 mr-1" />
                {uploadingAvatar ? 'Enviando...' : 'Salvar Avatar'}
              </Button>
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