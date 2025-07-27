// Página de controle de fluxo de caixa
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Settings,
  Download,
  Bell,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CashFlowManager } from '@/components/financial/components/CashFlowManager'
import { RecentTransactions } from '@/components/financial/components/RecentTransactions'
import { useCashFlow, useCashFlowAlerts } from '@/components/financial/hooks/use-cash-flow'
import { formatCurrency } from '@/components/financial/utils'

// Componente de configurações rápidas
const QuickSettings = ({ 
  onConfigureAlert, 
  currentLimit 
}: { 
  onConfigureAlert: (limit: number) => void
  currentLimit: number 
}) => {
  const [showSettings, setShowSettings] = useState(false)
  const [newLimit, setNewLimit] = useState(currentLimit)

  const handleSave = () => {
    onConfigureAlert(newLimit)
    setShowSettings(false)
  }

  if (!showSettings) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSettings(true)}
        className="flex items-center space-x-2"
      >
        <Settings className="h-4 w-4" />
        <span>Configurar Alertas</span>
      </Button>
    )
  }

  return (
    <Card className="p-4 w-80">
      <h3 className="font-semibold text-gray-900 mb-3">
        Configurar Limite Mínimo
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Limite Mínimo de Caixa
          </label>
          <input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 5000"
          />
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleSave}>
            Salvar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(false)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Componente de alertas
const AlertsPanel = () => {
  const { alertas, alertasNaoLidos, marcarComoLido, removerAlerta } = useCashFlowAlerts()

  if (alertasNaoLidos.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card className="p-4 border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">
              Alertas Ativos ({alertasNaoLidos.length})
            </h3>
          </div>
        </div>
        
        <div className="space-y-2">
          {alertasNaoLidos.slice(0, 3).map((alerta) => (
            <div 
              key={alerta.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {alerta.titulo}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {alerta.mensagem}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => marcarComoLido(alerta.id)}
                  className="text-xs"
                >
                  Marcar como lido
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

// Componente principal da página
export default function FluxoCaixaPage() {
  const router = useRouter()
  const { 
    resumo, 
    loading, 
    error, 
    lastUpdate, 
    alertaSaldoBaixo,
    refresh,
    configurarAlerta 
  } = useCashFlow({
    autoRefresh: true,
    refreshInterval: 30000 // 30 segundos
  })

  const handleConfigureAlert = async (limit: number) => {
    const success = await configurarAlerta(limit)
    if (success) {
      // Mostrar feedback de sucesso
      console.log('Alerta configurado com sucesso')
    }
  }

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log('Exportar dados do fluxo de caixa')
  }

  if (loading && !resumo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fluxo de caixa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao Carregar Dados
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refresh}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
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
                Fluxo de Caixa
              </h1>
              <p className="text-gray-600 mt-1">
                Controle em tempo real das movimentações financeiras
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {lastUpdate && (
              <div className="text-sm text-gray-500">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </div>
            )}
            
            <QuickSettings
              onConfigureAlert={handleConfigureAlert}
              currentLimit={resumo?.limiteMinimoAlerta || 5000}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </motion.div>

        {/* Alertas */}
        <AlertsPanel />

        {/* Status Cards */}
        {resumo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className={`p-6 ${alertaSaldoBaixo ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Status do Caixa
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={alertaSaldoBaixo ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {alertaSaldoBaixo ? 'Saldo Baixo' : 'Normal'}
                    </Badge>
                    {alertaSaldoBaixo && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <DollarSign className={`h-8 w-8 ${alertaSaldoBaixo ? 'text-red-500' : 'text-green-500'}`} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Saldo Atual
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(resumo.saldoAtual)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Entradas Hoje
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(resumo.entradasDia)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Projeção 30 dias
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(resumo.saldoProjetado)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Componente Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="xl:col-span-2"
          >
            <CashFlowManager />
          </motion.div>

          {/* Transações Recentes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="xl:col-span-1"
          >
            <RecentTransactions limit={8} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}