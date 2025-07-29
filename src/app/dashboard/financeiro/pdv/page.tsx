// Página dedicada do PDV (Ponto de Venda)
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calculator, TrendingUp, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuickTransactionPDV } from '@/components/financial/components/QuickTransactionPDV'
import { RecentTransactions } from '@/components/financial/components/RecentTransactions'

import { PDVGuard } from '@/components/auth/PermissionGuard'
import {
  useQuickTransactions,
  useRealtimeStats,
} from '@/components/financial/hooks/use-quick-transactions'
import { formatCurrency } from '@/components/financial/utils'

// Componente de Estatísticas em Tempo Real
const RealtimeStats = () => {
  const { stats, loading } = useRealtimeStats()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse p-4">
            <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-secondary-graphite-card"></div>
            <div className="h-6 rounded bg-gray-200 dark:bg-secondary-graphite-card"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Transações Hoje
            </p>
            <p className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.transacoesHoje}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas</p>
          </div>
          <div className="rounded-xl bg-blue-100 p-4 dark:bg-blue-900/30">
            <Calculator className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Valor Total</p>
            <p className="mb-1 text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.valorTotalHoje)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Movimentado</p>
          </div>
          <div className="rounded-xl bg-green-100 p-4 dark:bg-green-900/30">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Última Transação
            </p>
            <p className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.ultimaTransacao ? formatCurrency(stats.ultimaTransacao.valor) : '-'}
            </p>
            {stats.ultimaTransacao && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.ultimaTransacao.tempo.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-orange-100 p-4 dark:bg-orange-900/30">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-primary-gold bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tendência</p>
            <div className="mb-1 flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-500 dark:text-green-400" />
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">+12%</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs. ontem</p>
          </div>
          <div className="rounded-xl bg-primary-gold/10 p-4">
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
  const { registrarTransacao } = useQuickTransactions()
  // const { estatisticasDia } = useQuickTransactions() // Não utilizado no momento

  const handleTransactionSaved = async (transaction: Record<string, unknown>) => {
    try {
      const result = await registrarTransacao(transaction)
      if (result.success) {
        // Feedback visual de sucesso
        const notification = document.createElement('div')
        notification.className =
          'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        notification.textContent = `${transaction.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada: ${formatCurrency(transaction.valor)}`
        document.body.appendChild(notification)

        setTimeout(() => {
          document.body.removeChild(notification)
        }, 3000)
      } else {
        alert(`Erro ao registrar transação: ${result.error}`)
      }
    } catch (error) {
      // console.error('Erro ao salvar transação:', error)
      alert('Erro interno ao registrar transação')
    }
  }

  return (
    <PDVGuard>
      <div className="min-h-screen bg-neutral-light-gray dark:bg-background-dark">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Moderno */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 text-center"
          >
            <div className="mb-6 flex items-center justify-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <Calculator className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  PDV - Ponto de Venda
                </h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Registro rápido de entradas e saídas
                </p>
              </div>
            </div>
            <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>

            <div className="flex items-center justify-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2 border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>

              <Badge
                variant="outline"
                className="border-primary-gold/30 px-3 py-1 text-sm text-primary-gold"
              >
                {new Date().toLocaleDateString('pt-BR')}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
            <Card className="border-primary-gold/20 bg-gradient-to-br from-primary-gold/5 to-primary-gold/10 p-6 shadow-lg dark:border-secondary-graphite-card/30 dark:from-secondary-graphite-card dark:to-secondary-graphite">
              <div className="mb-4 flex items-center space-x-3">
                <div className="rounded-lg bg-primary-gold/10 p-2">
                  <svg
                    className="h-5 w-5 text-primary-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-primary-gold">
                  Atalhos de Teclado
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex items-center space-x-3 rounded-lg bg-white/50 p-3 dark:bg-secondary-graphite/50">
                  <kbd className="rounded-lg border border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite dark:text-white">
                    F1
                  </kbd>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nova Entrada</span>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-white/50 p-3 dark:bg-secondary-graphite/50">
                  <kbd className="rounded-lg border border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite dark:text-white">
                    F2
                  </kbd>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nova Saída</span>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-white/50 p-3 dark:bg-secondary-graphite/50">
                  <kbd className="rounded-lg border border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite dark:text-white">
                    F3
                  </kbd>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Calculadora</span>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-white/50 p-3 dark:bg-secondary-graphite/50">
                  <kbd className="rounded-lg border border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite dark:text-white">
                    ESC
                  </kbd>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Limpar</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </PDVGuard>
  )
}
