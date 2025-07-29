// Página de controle de fluxo de caixa
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings,
  Download,
  Bell,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout'
import { CashFlowManager } from '@/components/financial/components'
import { RouteGuard } from '@/components/auth'

// Dados mockados para demonstração
const mockCashFlowData = {
  resumo: {
    saldoAtual: 15750.00,
    entradasDia: 3200.00,
    saidasDia: 800.00,
    saldoProjetado: 18350.00,
    limiteMinimoAlerta: 5000.00
  },
  loading: false,
  error: null,
  lastUpdate: new Date(),
  alertaSaldoBaixo: false
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

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
        className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
      >
        <Settings className="h-4 w-4" />
        <span>Configurar Alertas</span>
      </Button>
    )
  }

  return (
    <Card className="p-6 w-80 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-xl">
      <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="p-1 bg-primary-gold/10 rounded-lg">
            <Settings className="h-4 w-4 text-primary-gold" />
          </div>
          Configurar Limite Mínimo
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Limite Mínimo de Caixa
          </label>
          <input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
            placeholder="Ex: 5000"
          />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="default"
            size="sm" 
            onClick={handleSave}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold"
          >
            Salvar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(false)}
            className="border-gray-300 dark:border-secondary-graphite-card/30 hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Componente de alertas mockado
const AlertsPanel = ({ alertaSaldoBaixo, saldoAtual, limiteMinimo }: {
  alertaSaldoBaixo: boolean
  saldoAtual: number
  limiteMinimo: number
}) => {
  if (!alertaSaldoBaixo) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card className="p-8 border-2 border-red-200 dark:border-red-800/30 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200 flex items-center space-x-2 mb-1">
              <Bell className="h-5 w-5" />
              <span>Saldo Abaixo do Limite Mínimo</span>
            </h3>
            <p className="text-red-700 dark:text-red-300 font-medium">
              O saldo atual ({formatCurrency(saldoAtual)}) está abaixo do limite configurado ({formatCurrency(limiteMinimo)})
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Componente principal da página
export default function FluxoCaixaPage() {
  const router = useRouter()
  
  // Usar dados mockados
  const { resumo, loading, error } = mockCashFlowData

  const handleConfigureAlert = async (limit: number) => {
    // Implementação mockada
    // console.log('Alerta configurado com sucesso para:', limit)
    alert(`Limite mínimo configurado para ${formatCurrency(limit)}`)
  }

  const handleExportData = () => {
    // Implementar exportação de dados
    // console.log('Exportar dados do fluxo de caixa')
    alert('Funcionalidade de exportação será implementada em breve')
  }

  const refresh = () => {
    // console.log('Atualizando dados...')
    window.location.reload()
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-8">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Moderno */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <DollarSign className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Fluxo de Caixa
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Controle em tempo real das movimentações financeiras
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-primary-gold/50 hover:border-primary-gold hover:bg-primary-gold/20 text-primary-gold hover:text-primary-gold-dark font-semibold flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
            
            <QuickSettings
              onConfigureAlert={handleConfigureAlert}
              currentLimit={resumo?.limiteMinimoAlerta || 5000}
            />
          </div>
        </motion.div>

        {/* Alertas */}
        <AlertsPanel 
          alertaSaldoBaixo={resumo.saldoAtual < resumo.limiteMinimoAlerta}
          saldoAtual={resumo.saldoAtual}
          limiteMinimo={resumo.limiteMinimoAlerta}
        />

        {/* Cards de Status */}
        {resumo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite hover:shadow-xl hover:scale-105 transition-all duration-300 ${resumo.saldoAtual < resumo.limiteMinimoAlerta ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Status do Caixa
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        variant={resumo.saldoAtual < resumo.limiteMinimoAlerta ? 'error' : 'success'}
                        className="text-xs font-bold"
                      >
                        {resumo.saldoAtual < resumo.limiteMinimoAlerta ? 'Saldo Baixo' : 'Normal'}
                      </Badge>
                      {resumo.saldoAtual < resumo.limiteMinimoAlerta && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Monitoramento ativo
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${resumo.saldoAtual < resumo.limiteMinimoAlerta ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    <DollarSign className={`h-8 w-8 ${resumo.saldoAtual < resumo.limiteMinimoAlerta ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite border-l-4 border-l-primary-gold hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Saldo Atual
                    </div>
                    <div className="text-3xl font-bold text-primary-gold mb-1">
                      {formatCurrency(resumo.saldoAtual)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Em caixa
                    </div>
                  </div>
                  <div className="p-4 bg-primary-gold/10 rounded-xl">
                    <DollarSign className="h-8 w-8 text-primary-gold" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Entradas Hoje
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {formatCurrency(resumo.entradasDia)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Recebimentos
                    </div>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Projeção 30 dias
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {formatCurrency(resumo.saldoProjetado)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Estimativa
                    </div>
                  </div>
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Componente Principal - CashFlowManager Completo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <CashFlowManager />
        </motion.div>
        </div>
      </Container>
    </RouteGuard>
  )
}