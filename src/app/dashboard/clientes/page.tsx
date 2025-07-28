/**
 * Página de Gestão de Clientes
 * Admins veem todos os clientes, barbeiros veem apenas seus clientes
 */

'use client'


import { Users, Plus, Search, Filter, Calendar, Phone, Mail, Star } from 'lucide-react'

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
import { useBarberPermissions } from '@/hooks/use-barber-permissions'

// Removido metadata pois agora é client component

// Dados mockados para demonstração
const todosClientes = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-1111',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-20',
    totalAgendamentos: 15,
    pontosFidelidade: 150,
    barbeiro: 'Carlos Henrique', // Cliente do barbeiro logado
    servicoFavorito: 'Corte + Barba',
    valorTotal: 675.00
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
    pontosFidelidade: 80,
    barbeiro: 'Carlos Henrique', // Cliente do barbeiro logado
    servicoFavorito: 'Corte Simples',
    valorTotal: 320.00
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
    pontosFidelidade: 30,
    barbeiro: 'Outro Barbeiro', // Cliente de outro barbeiro
    servicoFavorito: 'Barba',
    valorTotal: 90.00
  },
  {
    id: '4',
    nome: 'Roberto Lima',
    email: 'roberto@email.com',
    telefone: '(11) 99999-4444',
    role: 'client',
    status: 'active',
    ultimoAgendamento: '2024-01-22',
    totalAgendamentos: 12,
    pontosFidelidade: 120,
    barbeiro: 'Carlos Henrique', // Cliente do barbeiro logado
    servicoFavorito: 'Corte + Barba',
    valorTotal: 540.00
  }
]

export default function ClientesPage() {
  const { barbeiroNome, permissions, isBarber, isAdmin } = useBarberPermissions()
  
  // Filtrar clientes baseado no role
  const clientes = isAdmin 
    ? todosClientes 
    : todosClientes.filter(cliente => cliente.barbeiro === barbeiroNome)

  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {isBarber ? 'Meus Clientes' : 'Gestão de Clientes'}
              </h1>
              <p className="text-text-muted">
                {isBarber 
                  ? `Seus clientes atendidos, ${barbeiroNome || 'Barbeiro'}`
                  : 'Gerencie todos os clientes da barbearia'
                }
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou telefone..."
                      className="pl-10"
                    />
                  </div>
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
                    {isBarber ? 'Meus Clientes' : 'Total de Clientes'}
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
                  <div className="text-2xl font-bold text-blue-600">
                    {clientes.length > 0 ? Math.round(clientes.reduce((acc, c) => acc + c.totalAgendamentos, 0) / clientes.length) : 0}
                  </div>
                  <div className="text-sm text-text-muted">
                    Média Agendamentos
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {clientes.reduce((acc, c) => acc + (c.valorTotal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-text-muted">
                    {isBarber ? 'Receita Gerada' : 'Receita Total'}
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
                {isBarber ? 'Meus Clientes' : 'Lista de Clientes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isBarber ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </h3>
                  <p className="text-gray-500">
                    {isBarber 
                      ? 'Você ainda não atendeu nenhum cliente.'
                      : 'Comece adicionando o primeiro cliente da barbearia.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                          <span className="text-primary-gold font-semibold text-lg">
                            {cliente.nome.charAt(0)}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-text-primary text-lg">
                            {cliente.nome}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {cliente.telefone}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge 
                              variant={cliente.status === 'active' ? 'success' : 'secondary'}
                            >
                              {cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {cliente.totalAgendamentos} agendamentos
                            </span>
                            <span className="text-xs text-primary-gold flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {cliente.pontosFidelidade} pontos
                            </span>
                            {isBarber && (
                              <span className="text-xs text-green-600 font-medium">
                                R$ {cliente.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerados
                              </span>
                            )}
                          </div>
                          {cliente.servicoFavorito && (
                            <p className="text-xs text-blue-600 mt-1">
                              Serviço favorito: {cliente.servicoFavorito}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="text-text-muted">Último agendamento</div>
                          <div className="font-medium">
                            {new Date(cliente.ultimoAgendamento).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          {isBarber && (
                            <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                              Novo Agendamento
                            </Button>
                          )}
                          <PermissionGate requiredRole="admin">
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </RouteGuard>
  )
}