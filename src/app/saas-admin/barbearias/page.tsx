/**
 * Página de Gestão de Barbearias (Clientes do SaaS)
 * Apenas SaaS Owner pode acessar
 */

import { Building2, Plus, Search, Filter, DollarSign, Users, Calendar, AlertTriangle, CheckCircle, Clock, Edit, Trash2, Eye } from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Badge 
} from '@/shared/components/ui'

// Dados mockados das barbearias
const barbearias = [
  {
    id: '1',
    nome: 'Barbearia Central',
    admin: {
      nome: 'João Silva',
      email: 'joao@barbeariacentral.com',
      telefone: '(11) 99999-1111'
    },
    endereco: {
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    plano: 'Premium',
    status: 'active',
    dataAssinatura: '2024-01-15',
    proximoPagamento: '2024-02-15',
    valorMensal: 199.90,
    funcionarios: 5,
    clientes: 234,
    agendamentosMes: 456
  },
  {
    id: '2',
    nome: 'Corte & Estilo',
    admin: {
      nome: 'Pedro Santos',
      email: 'pedro@cortestyle.com',
      telefone: '(11) 88888-2222'
    },
    endereco: {
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20123-456'
    },
    plano: 'Básico',
    status: 'trial',
    dataAssinatura: '2024-01-20',
    proximoPagamento: '2024-02-20',
    valorMensal: 99.90,
    funcionarios: 2,
    clientes: 89,
    agendamentosMes: 123
  },
  {
    id: '3',
    nome: 'Barber Shop Elite',
    admin: {
      nome: 'Carlos Oliveira',
      email: 'carlos@barbershopelite.com',
      telefone: '(11) 77777-3333'
    },
    endereco: {
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30123-789'
    },
    plano: 'Premium',
    status: 'overdue',
    dataAssinatura: '2023-12-10',
    proximoPagamento: '2024-01-10',
    valorMensal: 199.90,
    funcionarios: 4,
    clientes: 178,
    agendamentosMes: 89
  },
  {
    id: '4',
    nome: 'Barbearia Moderna',
    admin: {
      nome: 'Ana Costa',
      email: 'ana@barberiamoderna.com',
      telefone: '(11) 66666-4444'
    },
    endereco: {
      cidade: 'Curitiba',
      estado: 'PR',
      cep: '80123-456'
    },
    plano: 'Premium',
    status: 'active',
    dataAssinatura: '2024-01-05',
    proximoPagamento: '2024-02-05',
    valorMensal: 199.90,
    funcionarios: 6,
    clientes: 312,
    agendamentosMes: 567
  }
]

export default function BarbeariasPage() {
  const totalBarbearias = barbearias.length
  const barbeariasPagantes = barbearias.filter(b => b.status === 'active').length
  const receitaMensal = barbearias
    .filter(b => b.status === 'active')
    .reduce((acc, b) => acc + b.valorMensal, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Gestão de Barbearias
          </h1>
          <p className="text-text-muted">
            Gerencie todas as barbearias clientes do SaaS
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Barbearia
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
                  {totalBarbearias}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Pagantes</p>
                <p className="text-2xl font-bold text-green-600">
                  {barbeariasPagantes}
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
                <p className="text-sm text-text-muted">Em Trial</p>
                <p className="text-2xl font-bold text-orange-600">
                  {barbearias.filter(b => b.status === 'trial').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Receita Mensal</p>
                <p className="text-2xl font-bold text-primary-gold">
                  R$ {receitaMensal.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-gold" />
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
                placeholder="Buscar por nome, admin ou cidade..."
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

      {/* Lista de Barbearias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Barbearias Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {barbearias.map((barbearia) => (
              <div
                key={barbearia.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-gold/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary-gold" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {barbearia.nome}
                    </h3>
                    <p className="text-sm text-text-muted">
                      Admin: {barbearia.admin.nome} • {barbearia.admin.email}
                    </p>
                    <p className="text-sm text-text-muted">
                      {barbearia.endereco.cidade}, {barbearia.endereco.estado}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
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
                        Plano {barbearia.plano}
                      </span>
                      <span className="text-xs text-text-muted">
                        {barbearia.funcionarios} funcionários
                      </span>
                      <span className="text-xs text-text-muted">
                        {barbearia.clientes} clientes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">
                      R$ {barbearia.valorMensal.toFixed(2)}/mês
                    </div>
                    <div className="text-sm text-text-muted">
                      Próximo: {new Date(barbearia.proximoPagamento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-text-muted">
                      {barbearia.agendamentosMes} agendamentos/mês
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
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
