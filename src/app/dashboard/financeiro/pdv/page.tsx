// Página dedicada do PDV (Ponto de Venda)
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Calculator,
  TrendingUp,
  Clock,
  DollarSign,
  CreditCard,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuickTransactionPDV } from '@/components/financial/components/QuickTransactionPDV'
import { RecentTransactions } from '@/components/financial/components/RecentTransactions'
import { PDVTest } from '@/components/financial/components/PDVTest'
import { PDVGuard } from '@/components/auth/PermissionGuard'
import { useQuickTransactions, useRealtimeStats } from '@/components/financial/hooks/use-quick-transactions'
import { formatCurrency } from '@/components/financial/utils'

// Componente de Estatísticas em Tempo Real
const RealtimeStats = () => {
  const { stats, loading } = useRealtimeStats()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Transações Hoje</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.transacoesHoje}
            </p>
          </div>
          <Calculator className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.valorTotalHoje)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Última Transação</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.ultimaTransacao ? formatCurrency(stats.ultimaTransacao.valor) : '-'}
            </p>
            {stats.ultimaTransacao && (
              <p className="text-xs text-gray-500">
                {stats.ultimaTransacao.tempo.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <Clock className="h-8 w-8 text-orange-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Tendência</p>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-lg font-bold text-green-600">+12%</p>
            </div>
            <p className="text-xs text-gray-500">vs ontem</p>
          </div>
          <BarChart3 className="h-8 w-8 text-purple-500" />
        </div>
      </Card>
    </div>
  )
}

// Componente principal da página
export default function PDVPage() {
  const router = useRouter()
  const [showStats, setShowStats] = useState(true)
  const { registrarTransacao, estatisticasDia } = useQuickTransactions()

  const handleTransactionSaved = async (transaction: any) => {
    try {
      const result = await registrarTransacao(transaction)
      if (result.success) {
        // Feedback visual de sucesso
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        notification.textContent = `${transaction.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada: ${formatCurrency(transaction.valor)}`
        document.body.appendChild(notification)
        
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 3000)
      } else {
        alert(`Erro ao registrar transação: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro interno ao registrar transação')
    }
  }

  return (
    <PDVGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                PDV - Ponto de Venda
              </h1>
              <p className="text-gray-600 mt-1">
                Registro rápido de entradas e saídas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm">
              {new Date().toLocaleDateString('pt-BR')}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showStats ? 'Ocultar' : 'Mostrar'} Stats</span>
            </Button>
          </div>
        </motion.div>

        {/* Estatísticas em Tempo Real */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <RealtimeStats />
          </motion.div>
        )}

        {/* Componente de Teste (temporário) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mb-8"
        >
          <PDVTest />
        </motion.div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* PDV Principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="xl:col-span-2"
          >
            <QuickTransactionPDV onTransactionSaved={handleTransactionSaved} />
          </motion.div>

          {/* Transações Recentes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="xl:col-span-1"
          >
            <RecentTransactions limit={10} />
          </motion.div>
        </div>

        {/* Atalhos de Teclado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              Atalhos de Teclado
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">F1</kbd>
                <span className="text-blue-700">Nova Entrada</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">F2</kbd>
                <span className="text-blue-700">Nova Saída</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">F3</kbd>
                <span className="text-blue-700">Calculadora</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs">ESC</kbd>
                <span className="text-blue-700">Limpar</span>
              </div>
            </div>
          </Card>
        </motion.div>
        </div>
      </div>
    </PDVGuard>
  )
}