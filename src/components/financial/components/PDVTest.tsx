// Componente de teste para verificar se o PDV está funcionando
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuickTransactions } from '../hooks/use-quick-transactions'
import { formatCurrency } from '../utils'

export const PDVTest = () => {
  const [testResult, setTestResult] = useState<string>('')
  const { 
    historicoRecente, 
    estatisticasDia, 
    loading, 
    error, 
    registrarTransacao 
  } = useQuickTransactions()

  const testarRegistro = async () => {
    setTestResult('Testando...')
    
    try {
      const resultado = await registrarTransacao({
        tipo: 'ENTRADA',
        valor: 50.00,
        descricao: 'Teste PDV',
        metodoPagamento: 'DINHEIRO',
        categoria: 'Serviços',
        barbeiro: 'João Silva'
      })

      if (resultado.success) {
        setTestResult('✅ Teste realizado com sucesso!')
      } else {
        setTestResult(`❌ Erro: ${resultado.error}`)
      }
    } catch (err) {
      setTestResult(`❌ Erro inesperado: ${err}`)
    }
  }

  return (
    <Card className="p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Teste do PDV</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Status:</strong> {loading ? 'Carregando...' : 'Pronto'}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Erro:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>Estatísticas:</strong>
          <ul className="text-sm mt-1">
            <li>Entradas: {formatCurrency(estatisticasDia.totalEntradas)}</li>
            <li>Saídas: {formatCurrency(estatisticasDia.totalSaidas)}</li>
            <li>Transações: {estatisticasDia.numeroTransacoes}</li>
          </ul>
        </div>
        
        <div>
          <strong>Histórico:</strong> {historicoRecente.length} transações
        </div>
        
        <Button onClick={testarRegistro} className="w-full">
          Testar Registro
        </Button>
        
        {testResult && (
          <div className="p-2 bg-gray-100 rounded text-sm">
            {testResult}
          </div>
        )}
      </div>
    </Card>
  )
}