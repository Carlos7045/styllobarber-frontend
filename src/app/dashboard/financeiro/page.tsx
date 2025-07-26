import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Financeiro - StylloBarber',
  description: 'Acompanhe o desempenho financeiro da barbearia',
}

/**
 * Página de controle financeiro
 * Permite visualizar receitas, despesas e relatórios financeiros
 */
export default function FinanceiroPage() {
  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Financeiro
          </h1>
          <p className="text-text-muted">
            Acompanhe o desempenho financeiro da barbearia
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 450,00</div>
              <p className="text-xs text-muted-foreground">
                +20% em relação a ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 12.500,00</div>
              <p className="text-xs text-muted-foreground">
                +15% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Mensais</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 3.200,00</div>
              <p className="text-xs text-muted-foreground">
                -5% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 9.300,00</div>
              <p className="text-xs text-muted-foreground">
                +25% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { cliente: 'João Silva', servico: 'Corte + Barba', valor: 'R$ 45,00', data: 'Hoje, 14:30' },
                  { cliente: 'Pedro Santos', servico: 'Corte Masculino', valor: 'R$ 30,00', data: 'Hoje, 13:15' },
                  { cliente: 'Carlos Lima', servico: 'Barba', valor: 'R$ 20,00', data: 'Hoje, 12:00' },
                  { cliente: 'Rafael Costa', servico: 'Corte + Barba', valor: 'R$ 45,00', data: 'Ontem, 16:45' },
                  { cliente: 'Lucas Oliveira', servico: 'Sobrancelha', valor: 'R$ 15,00', data: 'Ontem, 15:30' },
                ].map((receita, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border-default rounded-lg">
                    <div>
                      <h4 className="font-medium text-text-primary">{receita.cliente}</h4>
                      <p className="text-sm text-text-muted">{receita.servico}</p>
                      <p className="text-xs text-text-muted">{receita.data}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{receita.valor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Despesas Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { categoria: 'Aluguel', valor: 'R$ 1.500,00', status: 'Pago' },
                  { categoria: 'Energia Elétrica', valor: 'R$ 280,00', status: 'Pago' },
                  { categoria: 'Água', valor: 'R$ 120,00', status: 'Pago' },
                  { categoria: 'Internet', valor: 'R$ 89,00', status: 'Pago' },
                  { categoria: 'Produtos', valor: 'R$ 450,00', status: 'Pendente' },
                  { categoria: 'Equipamentos', valor: 'R$ 200,00', status: 'Pago' },
                ].map((despesa, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border-default rounded-lg">
                    <div>
                      <h4 className="font-medium text-text-primary">{despesa.categoria}</h4>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        despesa.status === 'Pago' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {despesa.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{despesa.valor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Mensal */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumo Mensal - Janeiro 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">Total de Receitas</h3>
                <p className="text-2xl font-bold text-green-600">R$ 12.500,00</p>
                <p className="text-sm text-green-600">85 atendimentos</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">Total de Despesas</h3>
                <p className="text-2xl font-bold text-red-600">R$ 3.200,00</p>
                <p className="text-sm text-red-600">12 categorias</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">Lucro Líquido</h3>
                <p className="text-2xl font-bold text-blue-600">R$ 9.300,00</p>
                <p className="text-sm text-blue-600">74% de margem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}