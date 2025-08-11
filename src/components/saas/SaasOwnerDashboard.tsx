
'use client'
/**
 * Dashboard específico para o dono do SaaS
 * Visão completa de todos os clientes e infraestrutura
 */


import { useState, useEffect } from 'react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
// Removido import de debug component
import { SystemStatusCard } from '@/domains/users/components/admin/SystemStatusCard'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { Crown, Building2, Users, DollarSign, TrendingUp, AlertTriangle, Shield, Database, Globe, Server } from 'lucide-react'

interface SaasMetrics {
  totalClients: number
  activeUsers: number
  monthlyRevenue: number
  systemUptime: number
  totalTransactions: number
  errorRate: number
  avgResponseTime: number
  storageUsed: number
}

interface ClientHealth {
  clientId: string
  clientName: string
  isHealthy: boolean
  activeUsers: number
  lastActivity: Date
  issues: string[]
}

export function SaasOwnerDashboard() {
  const { profile } = useAuth()
  const { permissions, canAccess, isSaasOwner } = useMonitoringPermissions(profile?.role || 'client', profile)
  const [metrics, setMetrics] = useState<SaasMetrics>({
    totalClients: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    systemUptime: 99.9,
    totalTransactions: 0,
    errorRate: 0,
    avgResponseTime: 0,
    storageUsed: 0
  })
  const [clientsHealth, setClientsHealth] = useState<ClientHealth[]>([])
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  if (!isSaasOwner()) {
    return null // Ou mostrar mensagem de acesso negado
  }

  useEffect(() => {
    // Simular dados do SaaS (em produção viria de APIs reais)
    setMetrics({
      totalClients: 15,
      activeUsers: 127,
      monthlyRevenue: 4500,
      systemUptime: 99.8,
      totalTransactions: 1250,
      errorRate: 0.2,
      avgResponseTime: 180,
      storageUsed: 2.3
    })

    setClientsHealth([
      {
        clientId: '1',
        clientName: 'Barbearia Central',
        isHealthy: true,
        activeUsers: 12,
        lastActivity: new Date(),
        issues: []
      },
      {
        clientId: '2',
        clientName: 'Cortes & Estilo',
        isHealthy: false,
        activeUsers: 8,
        lastActivity: new Date(Date.now() - 300000), // 5 min atrás
        issues: ['Alta latência', 'Erros de sincronização']
      }
    ])
  }, [])

  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header do SaaS Owner */}
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            StylloBarber SaaS - Dashboard do Proprietário
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Visão completa de todos os clientes e infraestrutura
          </p>
        </CardHeader>
      </Card>

      {/* Métricas Principais do SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Clientes Ativos</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalClients}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +2 este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Usuários Online</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.activeUsers}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pico: 156 hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Receita Mensal</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {metrics.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.systemUptime}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saúde dos Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Saúde dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientsHealth.map((client) => (
              <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-background-dark-card rounded-lg hover:dark:bg-secondary-graphite-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    client.isHealthy ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">{client.clientName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {client.activeUsers} usuários ativos • 
                      Última atividade: {client.lastActivity.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${getHealthColor(client.isHealthy)}`}>
                    {client.isHealthy ? 'Saudável' : 'Problemas'}
                  </div>
                  {client.issues.length > 0 && (
                    <div className="text-xs text-red-600">
                      {client.issues.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Infraestrutura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Tempo Resposta</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.avgResponseTime}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Média últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Taxa de Erro</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.errorRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Armazenamento</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.storageUsed} GB
            </div>
            <p className="text-xs text-gray-500 mt-1">
              de 10 GB utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toggle para Detalhes Técnicos */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        >
          {showTechnicalDetails ? 'Ocultar' : 'Mostrar'} Detalhes Técnicos
        </Button>
      </div>

      {/* Detalhes Técnicos (Dashboard Completo) */}
      {showTechnicalDetails && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Monitoramento Técnico Detalhado
            </h3>
            
            {/* Dashboard técnico simplificado */}
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Status da API</div>
                    <div className="text-lg font-semibold text-green-600">Operacional</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Banco de Dados</div>
                    <div className="text-lg font-semibold text-green-600">Conectado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Status Card para comparação */}
      <SystemStatusCard />
    </div>
  )
}
