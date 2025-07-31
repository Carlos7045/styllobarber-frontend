'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  MessageSquare, 
  Bell, 
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw
} from 'lucide-react'

import { useAdminNotificacoes } from '@/hooks/use-admin-notificacoes'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

import type { NotificationStats as StatsType, TipoNotificacao, StatusNotificacao } from '@/types/notifications'

export function NotificationStats() {
  const {
    stats,
    loading,
    loadStats
  } = useAdminNotificacoes()

  // Estados locais
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Carregar estatísticas
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Obter ícone do tipo
  const getTipoIcon = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'sms':
        return <MessageSquare className="h-5 w-5" />
      case 'push':
        return <Bell className="h-5 w-5" />
      case 'whatsapp':
        return <Smartphone className="h-5 w-5" />
    }
  }

  // Obter cor do tipo
  const getTipoColor = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case 'email':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'sms':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'push':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'whatsapp':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20'
    }
  }

  // Obter ícone do status
  const getStatusIcon = (status: StatusNotificacao) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="h-5 w-5" />
      case 'falhou':
        return <XCircle className="h-5 w-5" />
      case 'pendente':
        return <Clock className="h-5 w-5" />
      case 'cancelado':
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  // Obter cor do status
  const getStatusColor = (status: StatusNotificacao) => {
    switch (status) {
      case 'enviado':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'falhou':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'cancelado':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando estatísticas...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Estatísticas não disponíveis</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Não foi possível carregar as estatísticas de notificações.
        </p>
        <Button onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Estatísticas de Notificações
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Análise detalhada do desempenho das notificações
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <Button variant="outline" onClick={loadStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Enviadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.total_enviadas}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">Sucesso</span>
                </div>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Falharam</p>
                <p className="text-3xl font-bold text-red-600">{stats.total_falharam}</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">Falhas</span>
                </div>
              </div>
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-blue-600">{stats.taxa_sucesso.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {stats.taxa_sucesso >= 90 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Excelente</span>
                    </>
                  ) : stats.taxa_sucesso >= 70 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-yellow-600 mr-1" />
                      <span className="text-sm text-yellow-600">Bom</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">Precisa melhorar</span>
                    </>
                  )}
                </div>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Geral</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.total_enviadas + stats.total_falharam}
                </p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600">Período</span>
                </div>
              </div>
              <Bell className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.por_tipo).map(([tipo, quantidade]) => {
                const tipoTyped = tipo as TipoNotificacao
                const percentage = stats.total_enviadas + stats.total_falharam > 0 
                  ? (quantidade / (stats.total_enviadas + stats.total_falharam)) * 100 
                  : 0

                return (
                  <div key={tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        getTipoColor(tipoTyped)
                      )}>
                        {getTipoIcon(tipoTyped)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tipo}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{quantidade}</p>
                    </div>
                  </div>
                )
              })}

              {Object.keys(stats.por_tipo).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.por_status).map(([status, quantidade]) => {
                const statusTyped = status as StatusNotificacao
                const percentage = stats.total_enviadas + stats.total_falharam > 0 
                  ? (quantidade / (stats.total_enviadas + stats.total_falharam)) * 100 
                  : 0

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        getStatusColor(statusTyped)
                      )}>
                        {getStatusIcon(statusTyped)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{status}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{quantidade}</p>
                    </div>
                  </div>
                )
              })}

              {Object.keys(stats.por_status).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico dos últimos 7 dias */}
      {stats.ultimos_7_dias && stats.ultimos_7_dias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.ultimos_7_dias.map((dia, index) => {
                const total = dia.enviadas + dia.falharam
                const successRate = total > 0 ? (dia.enviadas / total) * 100 : 0

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-graphite rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{dia.data}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-green-600">
                          {dia.enviadas} enviadas
                        </span>
                        <span className="text-sm text-red-600">
                          {dia.falharam} falharam
                        </span>
                        <span className="text-sm text-blue-600">
                          {successRate.toFixed(1)}% sucesso
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{total}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">total</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights e recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.taxa_sucesso < 70 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-400">
                    Taxa de sucesso baixa
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Sua taxa de sucesso está abaixo de 70%. Verifique as configurações de envio e templates.
                  </p>
                </div>
              </div>
            )}

            {stats.total_falharam > stats.total_enviadas && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-400">
                    Muitas falhas detectadas
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    O número de falhas é maior que o de sucessos. Revise as configurações de retry.
                  </p>
                </div>
              </div>
            )}

            {stats.taxa_sucesso >= 90 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">
                    Excelente desempenho!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Sua taxa de sucesso está acima de 90%. Continue com as boas práticas!
                  </p>
                </div>
              </div>
            )}

            {Object.keys(stats.por_tipo).length === 1 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">
                    Diversifique os canais
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Você está usando apenas um tipo de notificação. Considere ativar outros canais para melhor alcance.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}