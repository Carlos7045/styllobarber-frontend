'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { Upload, Save, User, Calendar, Phone } from 'lucide-react'

export function ProfileTestPanel() {
  const { user, profile, updateProfile, uploadUserAvatar, loading } = useAuth()
  const [testData, setTestData] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    data_nascimento: profile?.data_nascimento || ''
  })
  const [uploading, setUploading] = useState(false)

  // Teste de atualização de perfil
  const handleTestUpdate = async () => {
    try {
      console.log('🧪 Teste: Atualizando perfil com dados:', testData)

      const result = await updateProfile({
        nome: testData.nome,
        telefone: testData.telefone || undefined,
        data_nascimento: testData.data_nascimento || undefined
      })

      if (result.success) {
        console.log('✅ Teste: Perfil atualizado com sucesso')
        alert('Perfil atualizado com sucesso!')
      } else {
        console.error('❌ Teste: Erro ao atualizar perfil:', result.error)
        alert('Erro: ' + (result.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Teste: Erro inesperado:', error)
      alert('Erro inesperado: ' + error)
    }
  }

  // Teste de upload de avatar
  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      console.log('🧪 Teste: Upload de avatar:', { name: file.name, size: file.size, type: file.type })
      setUploading(true)

      const result = await uploadUserAvatar(file)

      if (result.success) {
        console.log('✅ Teste: Avatar enviado com sucesso')
        alert('Avatar atualizado com sucesso!')
      } else {
        console.error('❌ Teste: Erro no upload:', result.error)
        alert('Erro no upload: ' + (result.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Teste: Erro inesperado no upload:', error)
      alert('Erro inesperado no upload: ' + error)
    } finally {
      setUploading(false)
    }
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-text-muted">Usuário não autenticado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Teste de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações atuais */}
        <div>
          <h4 className="font-medium mb-3">Dados Atuais</h4>
          <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
            <div><strong>Nome:</strong> {profile.nome}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Telefone:</strong> {profile.telefone || 'N/A'}</div>
            <div><strong>Data Nascimento:</strong> {profile.data_nascimento || 'N/A'}</div>
            <div><strong>Avatar:</strong> {profile.avatar_url ? 'Sim' : 'Não'}</div>
          </div>
        </div>

        {/* Teste de atualização */}
        <div>
          <h4 className="font-medium mb-3">Teste de Atualização</h4>
          <div className="space-y-3">
            <Input
              label="Nome"
              leftIcon={<User className="h-4 w-4" />}
              value={testData.nome}
              onChange={(e) => setTestData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome"
            />

            <Input
              label="Telefone"
              leftIcon={<Phone className="h-4 w-4" />}
              value={testData.telefone}
              onChange={(e) => setTestData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />

            <Input
              label="Data de Nascimento"
              leftIcon={<Calendar className="h-4 w-4" />}
              type="date"
              value={testData.data_nascimento}
              onChange={(e) => setTestData(prev => ({ ...prev, data_nascimento: e.target.value }))}
            />

            <Button
              onClick={handleTestUpdate}
              disabled={loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Testar Atualização'}
            </Button>
          </div>
        </div>

        {/* Teste de upload */}
        <div>
          <h4 className="font-medium mb-3">Teste de Upload de Avatar</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt="Avatar atual"
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-gold"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTestUpload}
                  disabled={uploading || loading}
                  id="avatar-upload-test"
                  className="hidden"
                />
                <label htmlFor="avatar-upload-test">
                  <div className={`inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer transition-colors ${uploading || loading ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Testar Upload'}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h4 className="font-medium mb-3">Ações</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔍 Estado atual do perfil:', {
                  user,
                  profile,
                  loading,
                  testData
                })
              }}
            >
              Log Estado
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestData({
                  nome: profile?.nome || '',
                  telefone: profile?.telefone || '',
                  data_nascimento: profile?.data_nascimento || ''
                })
              }}
            >
              Reset Dados
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}