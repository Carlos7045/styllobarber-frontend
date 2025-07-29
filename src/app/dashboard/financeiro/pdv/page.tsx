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
            <div className="h-4 bg-gray-200 dark:bg-secondary-graphite-card rounded mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-secondary-graphite-card rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Transações Hoje</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stats.transacoesHoje}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas</p>
          </div>
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Calculator className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Valor Total</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {formatCurrency(stats.valorTotalHoje)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Movimentado</p>
          </div>
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-orange-500 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Última Transação</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.ultimaTransacao ? formatCurrency(stats.ultimaTransacao.valor) : '-'}
            </p>
            {stats.ultimaTransacao && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.ultimaTransacao.tempo.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tendência</p>
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-6 w-6 text-green-500 dark:text-green-400" />
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">+12%</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs. ontem</p>
          </div>
          <div className="p-4 bg-primary-gold/10 rounded-xl">
            <TrendingUp className="h-8 w-8 text-primary-gold" />
          </div>
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
      <div className="min-h-screen bg-neutral-light-gray dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <Calculator className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                PDV - Ponto de Venda
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Registro rápido de entradas e saídas
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
          
          <div className="flex items-center justify-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <Badge variant="outline" className="text-sm px-3 py-1 border-primary-gold/30 text-primary-gold">
              {new Date().toLocaleDateString('pt-BR')}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
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

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transações Recentes - Posição Destacada */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="order-1 lg:order-1"
          >
            <RecentTransactions limit={10} />
          </motion.div>

          {/* PDV Principal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="order-2 lg:order-2"
          >
            <QuickTransactionPDV onTransactionSaved={handleTransactionSaved} />
          </motion.div>
        </div>

        {/* Atalhos de Teclado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-primary-gold/5 to-primary-gold/10 dark:from-secondary-graphite-card dark:to-secondary-graphite border-primary-gold/20 dark:border-secondary-graphite-card/30 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary-gold/10 rounded-lg">
                <svg className="h-5 w-5 text-primary-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-primary-gold">
                Atalhos de Teclado
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-secondary-graphite/50 rounded-lg">
                <kbd className="px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-300 dark:border-secondary-graphite-card/50 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-sm">F1</kbd>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Nova Entrada</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-secondary-graphite/50 rounded-lg">
                <kbd className="px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-300 dark:border-secondary-graphite-card/50 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-sm">F2</kbd>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Nova Saída</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-secondary-graphite/50 rounded-lg">
                <kbd className="px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-300 dark:border-secondary-graphite-card/50 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-sm">F3</kbd>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Calculadora</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-secondary-graphite/50 rounded-lg">
                <kbd className="px-3 py-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-300 dark:border-secondary-graphite-card/50 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-sm">ESC</kbd>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Limpar</span>
              </div>
            </div>
          </Card>
        </motion.div>
        </div>
      </div>
    </PDVGuard>
  )
}