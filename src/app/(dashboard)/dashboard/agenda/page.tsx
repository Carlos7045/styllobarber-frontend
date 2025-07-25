import { Metadata } from 'next'
import { Calendar, Clock, User, Plus } from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge 
} from '@/components/ui'
import { Container, Grid, Stack } from '@/components/layout'
import { RouteGuard, PermissionGate } from '@/components/auth'

// Metadados da página
export const metadata: Metadata = {
  title: 'Agenda - StylloBarber',
  description: 'Visualize e gerencie os agendamentos da barbearia.',
}

// Dados mockados para demonstração
const agendamentos = [
  {
    id: '1',
    cliente: 'João Silva',
    servico: 'Corte + Barba',
    barbeiro: 'Carlos',
    horario: '09:00',
    duracao: 60,
    status: 'confirmed',
    valor: 45.00,
  },
  {
    id: '2',
    cliente: 'Pedro Santos',
    servico: 'Corte Masculino',
    barbeiro: 'Roberto',
    horario: '10:30',
    duracao: 45,
    status: 'in_progress',
    valor: 30.00,
  },
  {
    id: '3',
    cliente: 'Lucas Oliveira',
    servico: 'Barba',
    barbeiro: 'Carlos',
    horario: '11:00',
    duracao: 30,
    status: 'pending',
    valor: 20.00,
  },
  {
    id: '4',
    cliente: 'Rafael Costa',
    servico: 'Corte + Barba',
    barbeiro: 'Roberto',
    horario: '14:00',
    duracao: 60,
    status: 'confirmed',
    valor: 45.00,
  },
]

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

// Página da Agenda (protegida para admins e barbeiros)
export default function AgendaPage() {
  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
                Agenda
              </h1>
              <p className="text-text-muted">
                Gerencie os agendamentos de hoje
              </p>
            </div>
            
            <PermissionGate requiredRoles={['admin', 'barber']}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </PermissionGate>
          </div>

          {/* Estatísticas do dia */}
          <Grid cols={4} gap="lg">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Agendamentos Hoje
                </CardTitle>
                <Calendar className="h-5 w-5 text-primary-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {agendamentos.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Em Andamento
                </CardTitle>
                <Clock className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {agendamentos.filter(a => a.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Confirmados
                </CardTitle>
                <User className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {agendamentos.filter(a => a.status === 'confirmed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Receita Prevista
                </CardTitle>
                <Calendar className="h-5 w-5 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  R$ {agendamentos.reduce((acc, a) => acc + a.valor, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* Timeline dos agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-4 bg-background-secondary rounded-lg hover:bg-primary-gold/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-text-primary">
                          {agendamento.horario}
                        </div>
                        <div className="text-xs text-text-muted">
                          {agendamento.duracao}min
                        </div>
                      </div>
                      
                      <div className="w-px h-12 bg-border-default" />
                      
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {agendamento.cliente}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {agendamento.servico} • {agendamento.barbeiro}
                        </p>
                        <p className="text-sm font-medium text-success">
                          R$ {agendamento.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(agendamento.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}>
                        {getStatusText(agendamento.status)}
                      </Badge>
                      
                      <PermissionGate requiredRoles={['admin', 'barber']}>
                        <div className="flex items-center gap-2">
                          {agendamento.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              Confirmar
                            </Button>
                          )}
                          {agendamento.status === 'confirmed' && (
                            <Button size="sm">
                              Iniciar
                            </Button>
                          )}
                          {agendamento.status === 'in_progress' && (
                            <Button size="sm" variant="success">
                              Finalizar
                            </Button>
                          )}
                        </div>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações rápidas */}
          <PermissionGate requiredRoles={['admin', 'barber']}>
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid cols={3} gap="md">
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Novo Agendamento</span>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Bloquear Horário</span>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Clock className="h-6 w-6" />
                    <span className="text-sm">Reagendar</span>
                  </Button>
                </Grid>
              </CardContent>
            </Card>
          </PermissionGate>
        </Stack>
      </Container>
    </RouteGuard>
  )
}