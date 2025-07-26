'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { Calendar, Save, AlertCircle } from 'lucide-react'
import { schemaPerfilUsuario } from '@/lib/validations'

export function DateTestPanel() {
  const { profile, updateProfile, loading } = useAuth()
  const [testDate, setTestDate] = useState(profile?.data_nascimento || '')
  const [validationError, setValidationError] = useState<string | undefined>(undefined)

  // Testar validação da data
  const testValidation = (date: string) => {
    try {
      const result = schemaPerfilUsuario.safeParse({
        nome: profile?.nome || 'Teste',
        telefone: profile?.telefone || '',
        data_nascimento: date
      })

      if (result.success) {
        setValidationError(undefined)
        console.log('✅ Validação passou:', result.data)
        return true
      } else {
        const error = result.error.issues.find(e => e.path.includes('data_nascimento'))
        setValidationError(error?.message || 'Erro de validação')
        console.error('❌ Validação falhou:', result.error.issues)
        return false
      }
    } catch (error) {
      setValidationError('Erro inesperado na validação')
      console.error('❌ Erro na validação:', error)
      return false
    }
  }

  // Testar atualização da data
  const handleTestUpdate = async () => {
    try {
      console.log('🧪 Testando atualização de data:', testDate)

      // Primeiro testar validação
      if (!testValidation(testDate)) {
        console.error('❌ Validação falhou, não prosseguindo')
        return
      }

      // Preparar dados
      const updateData = {
        data_nascimento: testDate.trim() || undefined
      }

      console.log('💾 Dados para atualização:', updateData)

      const result = await updateProfile(updateData)

      if (result.success) {
        console.log('✅ Data atualizada com sucesso:', result.profile?.data_nascimento)
        alert('Data atualizada com sucesso!')
      } else {
        console.error('❌ Erro ao atualizar data:', result.error)
        alert('Erro: ' + (result.error?.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      alert('Erro inesperado: ' + error)
    }
  }

  // Testar diferentes formatos de data
  const testFormats = () => {
    const formats = [
      '1990-01-15',
      '2000-12-25',
      '1985-06-30',
      '',
      '2010-01-01', // Muito jovem
      '1900-01-01', // Muito velho
      'invalid-date',
      '90-01-15', // Formato inválido
    ]

    console.log('🧪 Testando formatos de data:')
    formats.forEach(format => {
      console.log(`Testando "${format}":`, testValidation(format))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Teste de Data de Nascimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data atual */}
        <div>
          <h4 className="font-medium mb-2">Data Atual no Perfil</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <strong>Data:</strong> {profile?.data_nascimento || 'Não definida'}
          </div>
        </div>

        {/* Teste de data */}
        <div>
          <h4 className="font-medium mb-3">Teste de Nova Data</h4>
          <div className="space-y-3">
            <Input
              type="date"
              label="Data de Nascimento"
              value={testDate}
              onChange={(e) => {
                setTestDate(e.target.value)
                testValidation(e.target.value)
              }}
              error={validationError}
            />

            {validationError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleTestUpdate}
                disabled={loading || !!validationError}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Testar Atualização'}
              </Button>

              <Button
                variant="outline"
                onClick={testFormats}
              >
                Testar Formatos
              </Button>
            </div>
          </div>
        </div>

        {/* Informações de debug */}
        <div>
          <h4 className="font-medium mb-2">Debug Info</h4>
          <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
            <div><strong>Valor atual:</strong> "{testDate}"</div>
            <div><strong>Valor limpo:</strong> "{testDate.trim()}"</div>
            <div><strong>É vazio:</strong> {testDate.trim() === '' ? 'Sim' : 'Não'}</div>
            <div><strong>Data parseada:</strong> {testDate ? new Date(testDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestDate('')}
          >
            Limpar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestDate('1990-01-15')}
          >
            Data Teste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestDate(profile?.data_nascimento || '')}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}