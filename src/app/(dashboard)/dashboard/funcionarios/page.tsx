import { Metadata } from 'next'
import { UserCheck, Plus, Edit, Trash2 } from 'lucide-react'

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
  title: 'Funcionários - StylloBarber',
  description: 'Gestão de funcionários da barbearia.',
}

// Dados mockados para demonstração
const funcionarios = [
  {
    id: '1',
    nome: 'Carlos Silva',
    email: 'carlos@styllobarber.com',
    telefone: '(11) 99999-1111',
    role: 'barber',
    status: 'active',
    dataContratacao: '2024-01-15',
    comissao: 60,
  },
  {
    id: '2',
    nome: 'Roberto Santos',
    email: 'roberto@styllobarber.com',
    telefone: '(11) 99999-2222',
    role: 'barber',
    status: 'active',
    dataContratacao: '2024-02-01',
    comissao: 55,
  },
  {
    id: '3',
    nome: 'Ana Costa',
    email: 'ana@styllobarber.com',
    telefone: '(11) 99999-3333',
    role: 'admin',
    status: 'active',
    dataContratacao: '2023-12-01',
    comissao: 0,
  },
]

// Função para obter cor do status
function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}

// Função para obter texto do status
function getStatusText(status: string) {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'pending':
      return 'Pendente'
    default:
      return 'Desconhecido'
  }
}

// Função para obter texto do role
function getRoleText(role: string) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'barber':
      return 'Barbeiro'
    default:
      return 'Funcionário'
  }
}

// Página de Funcionários (protegida para admins)
export default function FuncionariosPage() {
  return (
    <RouteGuard requiredRole="admin">
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
                Funcionários
              </h1>
              <p className="text-text-muted">
                Gerencie os funcionários da barbearia
              </p>
            </div>
            
            <PermissionGate requiredRole="admin">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Funcionário
              </Button>
            </PermissionGate>
          </div>

          {/* Estatísticas */}
          <Grid cols={4} gap="lg">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Total de Funcionários
                </CardTitle>
                <UserCheck className="h-5 w-5 text-primary-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {funcionarios.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Barbeiros Ativos
                </CardTitle>
                <UserCheck className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {funcionarios.filter(f => f.role === 'barber' && f.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Administradores
                </CardTitle>
                <UserCheck className="h-5 w-5 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {funcionarios.filter(f => f.role === 'admin').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-muted">
                  Comissão Média
                </CardTitle>
                <UserCheck className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round(funcionarios.filter(f => f.comissao > 0).reduce((acc, f) => acc + f.comissao, 0) / funcionarios.filter(f => f.comissao > 0).length)}%
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* Lista de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funcionarios.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className="flex items-center justify-between p-4 bg-background-secondary rounded-lg hover:bg-primary-gold/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-gold">
                          {funcionario.nome.charAt(0)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {funcionario.nome}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {funcionario.email} • {funcionario.telefone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {getRoleText(funcionario.role)}
                          </Badge>
                          {funcionario.comissao > 0 && (
                            <Badge variant="outline">
                              {funcionario.comissao}% comissão
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(funcionario.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}>
                        {getStatusText(funcionario.status)}
                      </Badge>
                      
                      <PermissionGate requiredRole="admin">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-error hover:text-error-dark">
                            <Trash2 className="h-4 w-4" />
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