/**
 * Página de Gestão de Administradores
 * SaaS Owner gerencia todos os admins das barbearias
 */

import { Metadata } from 'next'
import { 
  Crown, 
  Plus, 
  Search, 
  Filter,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Badge 
} from '@/shared/components/ui'

export const metadata: Metadata = {
  title: 'Gestão de Administradores - SaaS Admin',
  description: 'Gerencie todos os administradores das barbearias',
}

// Dados mockados dos administradores
const administradores = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@barbeariacentral.com',
    telefone: '(11) 99999-1111',
    barbearia: {
      id: 'barb1',
      nome: 'Barbearia Central',
      status: 'active'
    },
    status: 'active',
    dataCriacao: '2024-01-15',
    ultimoLogin: '2024-01-25',
    funcionariosCadastrados: 5,
    clientesGerenciados: 234
  },
  {
    id: '2',
    nome: 'Pedro Santos',
    email: 'pedro@cortestyle.com',
    telefone: '(11) 88888-2222',
    barbearia: {
      id: 'barb2',
      nome: 'Corte & Estilo',
      status: 'trial'
    },
    status: 'active',
    dataCriacao: '2024-01-20',
    ultimoLogin: '2024-01-24',
    funcionariosCadastrados: 2,
    clientesGerenciados: 89
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    email: 'carlos@barbershopelite.com',
    telefone: '(11) 77777-3333',
    barbearia: {
      id: 'barb3',
      nome: 'Barber Shop Elite',
      status: 'overdue'
    },
    status: 'suspended',
    dataCriacao: '2023-12-10',
    ultimoLogin: '2024-01-10',
    funcionariosCadastrados: 4,
    clientesGerenciados: 178
  },
  {
    id: '4',
    nome: 'Ana Costa',
    email: 'ana@barberiamoderna.com',
    telefone: '(11) 66666-4444',
    barbearia: {
      id: 'barb4',
      nome: 'Barbearia Moderna',
      status: 'active'
    },
    status: 'active',
    dataCriacao: '2024-01-05',
    ultimoLogin: '2024-01-25',
    funcionariosCadastrados: 6,
    clientesGerenciados: 312
  },
  {
    id: '5',
    nome: 'Roberto Lima',
    email: 'roberto@stylecutbr.com',
    telefone: '(11) 55555-5555',
    barbearia: {
      id: 'barb5',
      nome: 'Style Cut BR',
      status: 'active'
    },
    status: 'pending',
    dataCriacao: '2024-01-23',
    ultimoLogin: null,
    funcionariosCadastrados: 0,
    clientesGerenciados: 0
  }
]

export default function AdministradoresPage() {
  const totalAdmins = administradores.length
  const adminsAtivos = administradores.filter(a => a.status === 'active').length
  const adminsSuspensos = administradores.filter(a => a.status === 'suspended').length
  const adminsPendentes = administradores.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Gestão de Administradores
          </h1>
          <p className="text-text-muted">
            Gerencie todos os administradores das barbearias
          </p>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Administrador
        </Button>
      </div>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total</p>
                <p className="text-2xl font-bold text-text-primary">
                  {totalAdmins}
                </p>
              </div>
              <Crown className="h-8 w-8 text-primary-gold" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {adminsAtivos}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Suspensos</p>
                <p className="text-2xl font-bold text-red-600">
                  {adminsSuspensos}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {adminsPendentes}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou barbearia..."
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Administradores Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {administradores.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary-gold" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {admin.nome}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Mail className="h-3 w-3" />
                      {admin.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Phone className="h-3 w-3" />
                      {admin.telefone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                      <Building2 className="h-3 w-3" />
                      {admin.barbearia.nome}
                      <Badge 
                        variant={
                          admin.barbearia.status === 'active' ? 'success' :
                          admin.barbearia.status === 'trial' ? 'warning' : 'error'
                        }
                        size="sm"
                      >
                        {admin.barbearia.status === 'active' ? 'Ativo' :
                         admin.barbearia.status === 'trial' ? 'Trial' : 'Atrasado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge 
                        variant={
                          admin.status === 'active' ? 'success' :
                          admin.status === 'suspended' ? 'error' : 'warning'
                        }
                      >
                        {admin.status === 'active' ? 'Ativo' :
                         admin.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {admin.funcionariosCadastrados} funcionários
                      </span>
                      <span className="text-xs text-text-muted">
                        {admin.clientesGerenciados} clientes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-text-muted">Criado em</div>
                    <div className="font-medium">
                      {new Date(admin.dataCriacao).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-text-muted mt-1">Último login</div>
                    <div className="font-medium">
                      {admin.ultimoLogin 
                        ? new Date(admin.ultimoLogin).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={
                        admin.status === 'suspended' 
                          ? "text-green-600 hover:text-green-700"
                          : "text-red-600 hover:text-red-700"
                      }
                    >
                      {admin.status === 'suspended' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
