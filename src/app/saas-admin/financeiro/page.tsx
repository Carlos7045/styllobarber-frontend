/**
 * Página de Relatórios Financeiros
 * SaaS Owner visualiza receitas, pagamentos e métricas financeiras
 */

import { Metadata } from 'next'
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, AlertTriangle, CheckCircle, Clock, Download, Filter, Building2 } from 'lucide-react'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge 
} from '@/shared/components/ui'

export const metadata: Metadata = {
  title: 'Relatórios Financeiros - SaaS Admin',
  description: 'Acompanhe receitas, pagamentos e métricas financeiras',
}

// Dados mockados financeiros
const dadosFinanceiros = {
  resumoMensal: {
    receitaAtual: 7596.20,
    receitaAnterior: 6890.50,
    crescimento: 10.2,
    pagamentosRecebidos: 38,
    pagamentosPendentes: 3,
    pagamentosAtrasados: 2,
    ticketMedio: 199.90
  },
  pagamentosRecentes: [
    {
      id: '1',
      barbearia: 'Barbearia Central',
      admin: 'João Silva',
      valor: 199.90,
      plano: 'Premium',
      status: 'paid',
      dataPagamento: '2024-01-25',
      dataVencimento: '2024-01-25',
      metodoPagamento: 'Cartão de Crédito'
    },
    {
      id: '2',
      barbearia: 'Corte & Estilo',
      admin: 'Pedro Santos',
      valor: 99.90,
      plano: 'Básico',
      status: 'paid',
      dataPagamento: '2024-01-24',
      dataVencimento: '2024-01-24',
      metodoPagamento: 'PIX'
    },
    {
      id: '3',
      barbearia: 'Barbearia Moderna',
      admin: 'Ana Costa',
      valor: 199.90,
      plano: 'Premium',
      status: 'pending',
      dataPagamento: null,
      dataVencimento: '2024-01-26',
      metodoPagamento: 'Boleto'
    },
    {
      id: '4',
      barbearia: 'Barber Shop Elite',
      admin: 'Carlos Oliveira',
      valor: 199.90,
      plano: 'Premium',
      status: 'overdue',
      dataPagamento: null,
      dataVencimento: '2024-01-15',
      metodoPagamento: 'Cartão de Crédito'
    },
    {
      id: '5',
      barbearia: 'Style Cut BR',
      admin: 'Roberto Lima',
      valor: 199.90,
      plano: 'Premium',
      status: 'pending',
      dataPagamento: null,
      dataVencimento: '2024-01-27',
      metodoPagamento: 'PIX'
    }
  ],
  receitaPorMes: [
    { mes: 'Set/23', receita: 5420.30 },
    { mes: 'Out/23', receita: 5890.80 },
    { mes: 'Nov/23', receita: 6234.50 },
    { mes: 'Dez/23', receita: 6890.50 },
    { mes: 'Jan/24', receita: 7596.20 }
  ]
}

export default function FinanceiroPage() {
  const { resumoMensal, pagamentosRecentes, receitaPorMes } = dadosFinanceiros

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Relatórios Financeiros
          </h1>
          <p className="text-text-muted">
            Acompanhe receitas, pagamentos e métricas financeiras
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Receita Mensal</p>
                <p className="text-2xl font-bold text-text-primary">
                  R$ {resumoMensal.receitaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{resumoMensal.crescimento}% vs mês anterior
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Pagamentos Recebidos</p>
                <p className="text-2xl font-bold text-green-600">
                  {resumoMensal.pagamentosRecebidos}
                </p>
                <p className="text-xs text-text-muted">
                  Este mês
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {resumoMensal.pagamentosPendentes}
                </p>
                <p className="text-xs text-text-muted">
                  Aguardando pagamento
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">
                  {resumoMensal.pagamentosAtrasados}
                </p>
                <p className="text-xs text-text-muted">
                  Requer atenção
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita (Mockado) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução da Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receitaPorMes.map((item, index) => (
                <div key={item.mes} className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">{item.mes}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary-gold rounded-full"
                      style={{ 
                        width: `${(item.receita / Math.max(...receitaPorMes.map(r => r.receita))) * 100}px` 
                      }}
                    />
                    <span className="text-sm font-medium">
                      R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio e Métricas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Métricas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-text-muted">Ticket Médio</p>
                <p className="text-3xl font-bold text-primary-gold">
                  R$ {resumoMensal.ticketMedio.toFixed(2)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round((resumoMensal.pagamentosRecebidos / (resumoMensal.pagamentosRecebidos + resumoMensal.pagamentosPendentes + resumoMensal.pagamentosAtrasados)) * 100)}%
                  </p>
                  <p className="text-xs text-text-muted">Taxa de Pagamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {Math.round((resumoMensal.pagamentosAtrasados / (resumoMensal.pagamentosRecebidos + resumoMensal.pagamentosPendentes + resumoMensal.pagamentosAtrasados)) * 100)}%
                  </p>
                  <p className="text-xs text-text-muted">Taxa de Inadimplência</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pagamentosRecentes.map((pagamento) => (
              <div
                key={pagamento.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-gold/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary-gold" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {pagamento.barbearia}
                    </h4>
                    <p className="text-sm text-text-muted">
                      Admin: {pagamento.admin}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          pagamento.status === 'paid' ? 'success' :
                          pagamento.status === 'pending' ? 'warning' : 'error'
                        }
                        size="sm"
                      >
                        {pagamento.status === 'paid' ? 'Pago' :
                         pagamento.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        Plano {pagamento.plano}
                      </span>
                      <span className="text-xs text-text-muted">
                        {pagamento.metodoPagamento}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-text-primary">
                    R$ {pagamento.valor.toFixed(2)}
                  </div>
                  <div className="text-sm text-text-muted">
                    Venc: {new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}
                  </div>
                  {pagamento.dataPagamento && (
                    <div className="text-sm text-green-600">
                      Pago: {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
