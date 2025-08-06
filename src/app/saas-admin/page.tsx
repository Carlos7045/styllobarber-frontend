/**
 * Dashboard principal do SaaS Owner
 * Visão geral de todas as métricas do sistema
 */

import { Metadata } from 'next'
import { 
  Building2, 
  Crown, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Button
} from '@/shared/components/ui'
import { SecurityLogs } from '@/components/saas/SecurityLogs'

export const metadata: Metadata = {
  title: 'Dashboard SaaS - StylloBarber',
  description: 'Painel administrativo do SaaS Owner',
}

// Dados mockados para demonstração
const dashboardData = {
  metricas: {
    totalBarbearias: 45,
    barbeariasPagantes: 38,
    totalAdmins: 42,
    totalUsuarios: 1247,
    receitaMensal: 18500,
    crescimentoMensal: 12.5
  },
  barbeariasRecentes: [
    {
      id: '1',
      nome: 'Barbearia Central',
      admin: 'João Silva',
      status: 'active',
      plano: 'Premium',
      dataAssinatura: '2024-01-20',
      proximoPagamento: '2024-02-20'
    },
    {
      id: '2',
      nome: 'Corte & Estilo',
      admin: 'Pedro Santos',
      status: 'trial',
      plano: 'Básico',
      dataAssinatura: '2024-01-18',
      proximoPagamento: '2024-02-18'
    },
    {
      id: '3',
      nome: 'Barber Shop Elite',
      admin: 'Carlos Oliveira',
      status: 'overdue',
      plano: 'Premium',
      dataAssinatura: '2023-12-15',
      proximoPagamento: '2024-01-15'
    }
  ],
  alertas: [
    {
      id: '1',
      tipo: 'payment',
      titulo: '3 barbearias com pagamento em atraso',
      descricao: 'Verificar status de cobrança',
      prioridade: 'high'
    },
    {
      id: '2',
      tipo: 'trial',
      titulo: '5 trials expirando em 3 dias',
      descricao: 'Acompanhar conversão',
      prioridade: 'medium'
    },
    {
      id: '3',
      tipo: 'system',
      titulo: 'Backup automático concluído',
      descricao: 'Sistema funcionando normalmente',
      prioridade: 'low'
    }
  ]
}

export default function SaasAdminDashboard() {
  const { metricas, barbeariasRecentes, alertas } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Dashboard SaaS
        </h1>
        <p className="text-text-muted">
          Visão geral do sistema StylloBarber
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Barbearias</p>
                <p className="text-2xl font-bold text-text-primary">
                  {metricas.totalBarbearias}
                </p>
                <p className="text-xs text-green-600">
                  {metricas.barbeariasPagantes} pagantes
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Administradores</p>
                <p className="text-2xl font-bold text-text-primary">
                  {metricas.totalAdmins}
                </p>
                <p className="text-xs text-text-muted">
                  Ativos no sistema
                </p>
              </div>
              <Crown className="h-8 w-8 text-primary-gold" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Usuários</p>
                <p className="text-2xl font-bold text-text-primary">
                  {metricas.totalUsuarios.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">
                  Todos os tipos
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Receita Mensal</p>
                <p className="text-2xl font-bold text-text-primary">
                  R$ {metricas.receitaMensal.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{metricas.crescimentoMensal}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barbearias Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Barbearias Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {barbeariasRecentes.map((barbearia) => (
                <div
                  key={barbearia.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {barbearia.nome}
                    </h4>
                    <p className="text-sm text-text-muted">
                      Admin: {barbearia.admin}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          barbearia.status === 'active' ? 'success' :
                          barbearia.status === 'trial' ? 'warning' : 'error'
                        }
                      >
                        {barbearia.status === 'active' ? 'Ativo' :
                         barbearia.status === 'trial' ? 'Trial' : 'Atrasado'}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {barbearia.plano}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-text-muted">Próximo pagamento</div>
                    <div className="font-medium">
                      {new Date(barbearia.proximoPagamento).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todas as Barbearias
            </Button>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {alerta.prioridade === 'high' && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {alerta.prioridade === 'medium' && (
                      <Clock className="h-4 w-4 text-orange-600" />
                    )}
                    {alerta.prioridade === 'low' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary text-sm">
                      {alerta.titulo}
                    </h4>
                    <p className="text-xs text-text-muted mt-1">
                      {alerta.descricao}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      alerta.prioridade === 'high' ? 'error' :
                      alerta.prioridade === 'medium' ? 'warning' : 'success'
                    }
                    size="sm"
                  >
                    {alerta.prioridade === 'high' ? 'Alta' :
                     alerta.prioridade === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todos os Alertas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logs de Segurança */}
      <SecurityLogs />
    </div>
  )
}
