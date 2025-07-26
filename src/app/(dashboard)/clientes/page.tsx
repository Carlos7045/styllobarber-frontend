/**
 * Página de Gestão de Clientes
 * Apenas admins e funcionários podem acessar
 */

import { Metadata } from 'next'
import { Users, Plus, Search, Filter } from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Badge 
} from '@/components/ui'
import { Container, Grid, Stack } from '@/components/layout'
import { RouteGuard, PermissionGate } from '@/components/auth'

export const metadata: Metadata = {
  title: 'Clientes - StylloBarber',
  description: 'Gestão de clientes da barbearia.',
}

// Dados mockados para demonstração (apenas clientes)
const clientes = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-1111',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-20',
    totalAgendamentos: 15,
    pontosFidelidade: 150
  },
  {
    id: '2',
    nome: 'Pedro Santos',
    email: 'pedro@email.com',
    telefone: '(11) 99999-2222',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-18',
    totalAgendamentos: 8,
    pontosFidelidade: 80
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    email: 'carlos@email.com',
    telefone: '(11) 99999-3333',
    role: 'client',
    status: 'inactive',
    ultimoAgendamento: '2023-12-15',
    totalAgendamentos: 3,
    pontosFidelidade: 30
  }
]

export default function ClientesPage() {
  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Gestão de Clientes
              </h1>
              <p className="text-text-muted">
                Gerencie os clientes da sua barbearia
              </p>
            </div>
            
            <PermissionGate requiredRole="admin">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </PermissionGate>
          </div>

          {/* Filtros e Busca */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    icon={Search}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Grid cols={4} gap="md">
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-gold">
                    {clientes.length}
                  </div>
                  <div className="text-sm text-text-muted">
                    Total de Clientes
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {clientes.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-sm text-text-muted">
                    Ativos
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {clientes.filter(c => c.status === 'inactive').length}
                  </div>
                  <div className="text-sm text-text-muted">
                    Inativos
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(clientes.reduce((acc, c) => acc + c.totalAgendamentos, 0) / clientes.length)}
                  </div>
                  <div className="text-sm text-text-muted">
                    Média Agendamentos
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* Lista de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-gold/10 rounded-full flex items-center justify-center">
                        <span className="text-primary-gold font-semibold">
                          {cliente.nome.charAt(0)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {cliente.nome}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {cliente.email} • {cliente.telefone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={cliente.status === 'active' ? 'success' : 'secondary'}
                          >
                            {cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <span className="text-xs text-text-muted">
                            {cliente.totalAgendamentos} agendamentos
                          </span>
                          <span className="text-xs text-primary-gold">
                            {cliente.pontosFidelidade} pontos
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="text-text-muted">Último agendamento</div>
                        <div className="font-medium">
                          {new Date(cliente.ultimoAgendamento).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <PermissionGate requiredRole="admin">
                        <div className="flex items-center gap-1 ml-4">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </RouteGuard>
  )
}