'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Scissors,
  BarChart3,
  Shield
} from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge 
} from '@/components/ui'
import { Container, Grid, Stack } from '@/components/layout'

// Dados mockados para demonstração
const dashboardData = {
  metrics: [
    {
      title: 'Agendamentos Hoje',
      value: '12',
      change: '+2 desde ontem',
      trend: 'up' as const,
      icon: Calendar,
      color: 'text-primary-gold',
    },
    {
      title: 'Clientes Ativos',
      value: '248',
      change: '+12 este mês',
      trend: 'up' as const,
      icon: Users,
      color: 'text-info',
    },
    {
      title: 'Receita Hoje',
      value: 'R$ 1.240',
      change: '+15% vs ontem',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: 'Taxa de Ocupação',
      value: '85%',
      change: '+5% esta semana',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-warning',
    },
  ],
  recentAppointments: [
    {
      id: '1',
      client: 'João Silva',
      service: 'Corte + Barba',
      time: '09:00',
      barber: 'Carlos',
      status: 'confirmed' as const,
    },
    {
      id: '2',
      client: 'Pedro Santos',
      service: 'Corte Masculino',
      time: '10:30',
      barber: 'Roberto',
      status: 'in_progress' as const,
    },
    {
      id: '3',
      client: 'Lucas Oliveira',
      service: 'Barba',
      time: '11:00',
      barber: 'Carlos',
      status: 'pending' as const,
    },
    {
      id: '4',
      client: 'Rafael Costa',
      service: 'Corte + Barba',
      time: '14:00',
      barber: 'Roberto',
      status: 'confirmed' as const,
    },
  ],
  quickStats: {
    totalServices: 156,
    completedToday: 8,
    pendingToday: 4,
    cancelledToday: 1,
  },
}

// Função para obter cor do status
function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'pending':
      return 'info'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

// Função para obter texto do status
function getStatusText(status: string) {
  switch (status) {
    case 'confirmed':
      return 'Confirmado'
    case 'in_progress':
      return 'Em Andamento'
    case 'pending':
      return 'Pendente'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Desconhecido'
  }
}

// Página do Dashboard - Apenas para Admin e Barber
export default function DashboardPage() {
  const { profile, user, loading } = useAuth()
  const router = useRouter()

  // Verificar permissões
  useEffect(() => {
    if (loading) return

    const userRole = profile?.role || user?.user_metadata?.role || 'client'
    
    // Clientes não podem acessar o dashboard administrativo
    if (userRole === 'client') {
      console.log('🚫 Cliente tentando acessar dashboard administrativo, redirecionando...')
      router.replace('/agendamentos')
      return
    }
  }, [profile, user, loading, router])

  // Mostrar loading
  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
        </div>
      </Container>
    )
  }

  const userRole = profile?.role || user?.user_metadata?.role || 'client'

  // Bloquear acesso para clientes
  if (userRole === 'client') {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Shield className="h-5 w-5" />
                Área Administrativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Acesso Restrito
                </h3>
                <p className="text-gray-600 mb-6">
                  Esta área é exclusiva para administradores e barbeiros.
                </p>
                <p className="text-sm text-gray-500">
                  Como cliente, você tem acesso a: Agendamentos, Histórico e Perfil.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-6">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Dashboard
          </h1>
          <p className="text-text-muted">
            Visão geral das atividades de hoje
          </p>
        </div>

        {/* Métricas principais */}
        <Grid cols={4} gap="lg" className="mb-8">
          {dashboardData.metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index} hover="lift" className="animate-fade-in-up">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-text-muted">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {metric.value}
                  </div>
                  <p className="text-xs text-success flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </Grid>

        {/* Conteúdo principal */}
        <Grid cols={3} gap="lg">
          {/* Agendamentos recentes */}
          <Card className="col-span-2 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-gold" />
                Agendamentos de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-primary-gold/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-gold/10 rounded-full flex items-center justify-center">
                        <Scissors className="h-5 w-5 text-primary-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {appointment.client}
                        </p>
                        <p className="text-sm text-text-muted">
                          {appointment.service} • {appointment.barber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-secondary">
                        {appointment.time}
                      </span>
                      <Badge variant={getStatusColor(appointment.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas rápidas */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-info" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-text-muted">Concluídos</span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {dashboardData.quickStats.completedToday}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-text-muted">Pendentes</span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {dashboardData.quickStats.pendingToday}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-error" />
                    <span className="text-sm text-text-muted">Cancelados</span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {dashboardData.quickStats.cancelledToday}
                  </span>
                </div>

                <div className="pt-4 border-t border-border-default">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      Total de Serviços
                    </span>
                    <span className="text-lg font-bold text-primary-gold">
                      {dashboardData.quickStats.totalServices}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Ações rápidas */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid cols={4} gap="md">
              <button 
                onClick={() => alert('Novo Agendamento clicado!')}
                className="flex flex-col items-center gap-2 p-4 bg-primary-gold/10 hover:bg-primary-gold/20 rounded-lg transition-colors group"
              >
                <Calendar className="h-6 w-6 text-primary-gold group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-text-primary">
                  Novo Agendamento
                </span>
              </button>

              <button 
                onClick={() => alert('Cadastrar Cliente clicado!')}
                className="flex flex-col items-center gap-2 p-4 bg-info/10 hover:bg-info/20 rounded-lg transition-colors group"
              >
                <Users className="h-6 w-6 text-info group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-text-primary">
                  Cadastrar Cliente
                </span>
              </button>

              <button 
                onClick={() => alert('Registrar Pagamento clicado!')}
                className="flex flex-col items-center gap-2 p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-colors group"
              >
                <DollarSign className="h-6 w-6 text-success group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-text-primary">
                  Registrar Pagamento
                </span>
              </button>

              <button 
                onClick={() => alert('Gerenciar Serviços clicado!')}
                className="flex flex-col items-center gap-2 p-4 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors group"
              >
                <Scissors className="h-6 w-6 text-warning group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-text-primary">
                  Gerenciar Serviços
                </span>
              </button>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}