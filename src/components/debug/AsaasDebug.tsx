'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { asaasService } from '@/lib/services/asaas-service'

export const AsaasDebug: React.FC = () => {
  const [testResult, setTestResult] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const testAsaasConnection = async () => {
    setLoading(true)
    try {
      const result = await asaasService.processAppointmentPayment(
        {
          name: 'Cliente Teste',
          email: 'teste@exemplo.com',
          phone: '11999999999'
        },
        {
          amount: 10.00,
          description: 'Teste de conexão',
          appointmentId: 'test-123',
          paymentMethod: 'pix'
        }
      )
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔧 Debug Asaas API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variáveis de Ambiente */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Variáveis de Ambiente:</h4>
          <div className="space-y-1 text-sm font-mono">
            <div>
              <strong>NEXT_PUBLIC_ASAAS_BASE_URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'NÃO CONFIGURADA'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_ASAAS_API_KEY:</strong>{' '}
              {process.env.NEXT_PUBLIC_ASAAS_API_KEY 
                ? `${process.env.NEXT_PUBLIC_ASAAS_API_KEY.substring(0, 10)}...` 
                : 'NÃO CONFIGURADA'
              }
            </div>
            <div>
              <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
            </div>
          </div>
        </div>

        {/* Status do Serviço */}
        <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Status do Serviço:</h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Usando Mock:</strong>{' '}
              {!process.env.NEXT_PUBLIC_ASAAS_API_KEY ? '✅ SIM' : '❌ NÃO'}
            </div>
            <div>
              <strong>API Key Configurada:</strong>{' '}
              {process.env.NEXT_PUBLIC_ASAAS_API_KEY ? '✅ SIM' : '❌ NÃO'}
            </div>
          </div>
        </div>

        {/* Teste de Conexão */}
        <div>
          <Button 
            onClick={testAsaasConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testando...' : '🧪 Testar Conexão Asaas'}
          </Button>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Resultado do Teste:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📋 Como Configurar:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Acesse sua conta no Asaas (sandbox ou produção)</li>
            <li>Vá em Configurações → Integrações → API</li>
            <li>Copie sua chave de API</li>
            <li>Adicione no arquivo .env.local:</li>
          </ol>
          <div className="mt-2 bg-gray-200 dark:bg-gray-700 p-2 rounded font-mono text-xs">
            NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_aqui<br/>
            NEXT_PUBLIC_ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
          </div>
          <p className="text-xs mt-2 text-gray-600">
            ⚠️ Reinicie o servidor após alterar as variáveis de ambiente
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AsaasDebug