'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

export default function AsaasTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAsaasAPI = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testando API do Asaas diretamente...')

      // 0. Verificar configuração primeiro
      console.log('🔧 Verificando configuração da API...')
      const configResponse = await fetch('/api/asaas/customers', {
        method: 'OPTIONS'
      })
      console.log('🔧 Status da configuração:', configResponse.status)

      // 1. Testar criação de cliente
      console.log('👤 Criando cliente de teste...')
      const customerResponse = await fetch('/api/asaas/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Cliente Teste API',
          email: `teste-${Date.now()}@exemplo.com`,
          phone: '11987654321',
          mobilePhone: '11987654321',
          cpfCnpj: '11144477735', // CPF válido de teste para sandbox
        }),
      })

      const customerData = await customerResponse.json()
      console.log('👤 Resultado criação cliente:', customerData)

      if (!customerResponse.ok) {
        console.error('❌ Erro detalhado do cliente:', {
          status: customerResponse.status,
          statusText: customerResponse.statusText,
          data: customerData
        })

        // Mostrar erros específicos se disponíveis
        if (customerData.specificErrors && customerData.specificErrors.length > 0) {
          console.error('🔍 Erros específicos:')
          customerData.specificErrors.forEach((err: any, index: number) => {
            console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
          })
        }

        const errorMessage = customerData.specificErrors && customerData.specificErrors.length > 0
          ? customerData.specificErrors.map((err: any) => `${err.code}: ${err.description}`).join('; ')
          : customerData.error || 'Erro desconhecido'

        throw new Error(`Erro ao criar cliente (${customerResponse.status}): ${errorMessage}`)
      }

      // 2. Testar criação de cobrança PIX
      console.log('💰 Criando cobrança PIX...')
      const paymentResponse = await fetch('/api/asaas/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerData.id,
          billingType: 'PIX',
          value: 25.00,
          dueDate: new Date().toISOString().split('T')[0],
          description: 'Teste de cobrança PIX via API',
          externalReference: `test-${Date.now()}`,
        }),
      })

      const paymentData = await paymentResponse.json()
      console.log('💰 Resultado criação cobrança:', paymentData)

      if (!paymentResponse.ok) {
        console.error('❌ Erro detalhado da cobrança:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          data: paymentData
        })

        // Mostrar erros específicos se disponíveis
        if (paymentData.specificErrors && paymentData.specificErrors.length > 0) {
          console.error('🔍 Erros específicos da cobrança:')
          paymentData.specificErrors.forEach((err: any, index: number) => {
            console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
          })
        }

        const errorMessage = paymentData.specificErrors && paymentData.specificErrors.length > 0
          ? paymentData.specificErrors.map((err: any) => `${err.code}: ${err.description}`).join('; ')
          : paymentData.error || 'Erro desconhecido'

        throw new Error(`Erro ao criar cobrança (${paymentResponse.status}): ${errorMessage}`)
      }

      setResult({
        success: true,
        customer: customerData,
        payment: paymentData,
        message: 'API do Asaas funcionando! Verifique o painel em https://sandbox.asaas.com/',
      })

    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setLoading(false)
    }
  }

  const testCustomerSearch = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🔍 Testando busca de cliente...')

      const response = await fetch('/api/asaas/customers?email=teste@exemplo.com')
      const data = await response.json()

      console.log('🔍 Resultado busca:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: data
      })

      setResult({
        success: response.ok,
        searchResult: data,
        message: response.ok ? 'Busca funcionando! API key válida.' : `Erro na busca (${response.status}): ${data.error || 'Erro desconhecido'}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      })

    } catch (error) {
      console.error('❌ Erro na busca:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">🧪 Teste Direto da API Asaas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">🎯 Objetivo</h3>
              <p className="text-blue-300 text-sm">
                Testar se a API do Asaas está realmente sendo chamada e se as cobranças estão sendo criadas no painel.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={testCustomerSearch}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Testando...' : '🔍 Testar API Key (Busca de Cliente)'}
              </Button>

              <Button
                onClick={testAsaasAPI}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Testando...' : '🚀 Testar Criação de Cliente + Cobrança PIX'}
              </Button>
            </div>

            {result && (
              <div className={`rounded-lg p-4 ${result.success
                ? 'bg-green-900/20 border border-green-700/50'
                : 'bg-red-900/20 border border-red-700/50'
                }`}>
                <h4 className={`font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {result.success ? '✅ Sucesso!' : '❌ Erro!'}
                </h4>
                <pre className={`text-sm whitespace-pre-wrap ${result.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">📋 Como Verificar:</h4>
              <ol className="text-yellow-300 text-sm space-y-1 list-decimal list-inside">
                <li>Clique em "Testar Criação de Cliente + Cobrança PIX"</li>
                <li>Verifique se aparece "✅ Sucesso!" abaixo</li>
                <li>Abra o painel do Asaas: <a href="https://sandbox.asaas.com/" target="_blank" className="text-blue-400 underline">https://sandbox.asaas.com/</a></li>
                <li>Vá em "Cobranças" e verifique se apareceu uma nova cobrança</li>
                <li>Se aparecer = API real funcionando ✅</li>
                <li>Se não aparecer = ainda usando mock ❌</li>
              </ol>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">🔧 Logs do Servidor</h4>
              <p className="text-gray-300 text-sm mb-2">
                Verifique também os logs no terminal onde roda <code>npm run dev</code>:
              </p>
              <div className="bg-gray-800 p-2 rounded font-mono text-xs text-gray-300">
                🔧 API Route Config: &#123; hasApiKey: true, apiKeyLength: 164 &#125;<br />
                🔄 API Route: Criando cliente no Asaas<br />
                📊 Resposta da API Asaas: &#123; status: 200, ok: true &#125;<br />
                ✅ Cliente criado com sucesso: cus_123456789
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}