'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Database, Search, AlertTriangle } from 'lucide-react'

export function DatabaseTestPanel() {
  const { user, profile } = useAuth()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Testar estrutura da tabela profiles
  const testTableStructure = async () => {
    try {
      setTesting(true)
      console.log('🧪 Testando estrutura da tabela profiles...')

      // Tentar buscar o perfil atual
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      console.log('📊 Perfil atual:', currentProfile)
      console.log('❌ Erro na busca:', fetchError)

      // Tentar fazer uma atualização de teste
      const testUpdate = {
        nome: profile?.nome || 'Teste',
        data_nascimento: '1990-01-15',
        updated_at: new Date().toISOString()
      }

      console.log('🔄 Testando atualização:', testUpdate)

      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(testUpdate)
        .eq('id', user?.id)
        .select()

      console.log('✅ Resultado da atualização:', updateResult)
      console.log('❌ Erro na atualização:', updateError)

      // Verificar se a data foi salva corretamente
      const { data: verifyResult, error: verifyError } = await supabase
        .from('profiles')
        .select('data_nascimento, updated_at')
        .eq('id', user?.id)
        .single()

      console.log('🔍 Verificação pós-atualização:', verifyResult)
      console.log('❌ Erro na verificação:', verifyError)

      setResults({
        currentProfile,
        fetchError,
        updateResult,
        updateError,
        verifyResult,
        verifyError
      })

    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setResults({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  // Testar permissões RLS
  const testRLSPermissions = async () => {
    try {
      setTesting(true)
      console.log('🧪 Testando permissões RLS...')

      // Testar SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('id, nome, email, data_nascimento')
        .eq('id', user?.id)

      console.log('📖 SELECT result:', selectData)
      console.log('❌ SELECT error:', selectError)

      // Testar UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user?.id)
        .select()

      console.log('✏️ UPDATE result:', updateData)
      console.log('❌ UPDATE error:', updateError)

      setResults({
        selectData,
        selectError,
        updateData,
        updateError
      })

    } catch (error) {
      console.error('❌ Erro no teste RLS:', error)
      setResults({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  // Testar conexão básica
  const testConnection = async () => {
    try {
      setTesting(true)
      console.log('🧪 Testando conexão com Supabase...')

      // Testar conexão básica
      const { data, error } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1)

      console.log('🔗 Conexão result:', data)
      console.log('❌ Conexão error:', error)

      // Testar auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      console.log('👤 Auth user:', authUser)
      console.log('❌ Auth error:', authError)

      setResults({
        connectionData: data,
        connectionError: error,
        authUser,
        authError
      })

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error)
      setResults({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  if (!user) {
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
          <Database className="h-5 w-5" />
          Teste de Banco de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do usuário */}
        <div>
          <h4 className="font-medium mb-2">Informações do Usuário</h4>
          <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Profile ID:</strong> {profile?.id}</div>
            <div><strong>Profile Nome:</strong> {profile?.nome}</div>
            <div><strong>Profile Data:</strong> {profile?.data_nascimento || 'N/A'}</div>
          </div>
        </div>

        {/* Botões de teste */}
        <div>
          <h4 className="font-medium mb-3">Testes Disponíveis</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testConnection}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Testar Conexão
            </Button>
            
            <Button
              onClick={testRLSPermissions}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Testar RLS
            </Button>
            
            <Button
              onClick={testTableStructure}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              Testar Tabela
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div>
            <h4 className="font-medium mb-2">Resultados do Teste</h4>
            <div className="bg-gray-50 p-3 rounded text-xs">
              <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Status */}
        {testing && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-gold mx-auto mb-2"></div>
            <p className="text-sm text-text-muted">Executando teste...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}