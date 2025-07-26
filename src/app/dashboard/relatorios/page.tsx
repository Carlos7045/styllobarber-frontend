import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { BarChart3, FileText, Download, Calendar, Users, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Relatórios - StylloBarber',
  description: 'Visualize relatórios e análises da barbearia',
}

/**
 * Página de relatórios
 * Permite visualizar e gerar relatórios diversos
 */
export default function RelatoriosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Relatórios
          </h1>
          <p className="text-text-muted">
            Visualize relatórios e análises da barbearia
          </p>
        </div>

        {/* Tipos de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-gold" />
                Relatório Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Receitas, despesas e lucros por período
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-gold text-primary-black rounded-lg hover:bg-primary-gold-dark transition-colors">
                <FileText className="h-4 w-4" />
                Gerar Relatório
              </button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-gold" />
                Relatório de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Análise de clientes e frequência de visitas
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-gold text-primary-black rounded-lg hover:bg-primary-gold-dark transition-colors">
                <FileText className="h-4 w-4" />
                Gerar Relatório
              </button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-gold" />
                Relatório de Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Estatísticas de agendamentos e horários
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-gold text-primary-black rounded-lg hover:bg-primary-gold-dark transition-colors">
                <FileText className="h-4 w-4" />
                Gerar Relatório
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Recentes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Relatórios Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  nome: 'Relatório Financeiro - Janeiro 2024', 
                  tipo: 'Financeiro', 
                  data: '01/02/2024', 
                  status: 'Concluído',
                  tamanho: '2.3 MB'
                },
                { 
                  nome: 'Análise de Clientes - Dezembro 2023', 
                  tipo: 'Clientes', 
                  data: '31/12/2023', 
                  status: 'Concluído',
                  tamanho: '1.8 MB'
                },
                { 
                  nome: 'Relatório de Agendamentos - Dezembro 2023', 
                  tipo: 'Agendamentos', 
                  data: '30/12/2023', 
                  status: 'Concluído',
                  tamanho: '1.2 MB'
                },
                { 
                  nome: 'Relatório Financeiro - Dezembro 2023', 
                  tipo: 'Financeiro', 
                  data: '29/12/2023', 
                  status: 'Processando',
                  tamanho: '-'
                },
              ].map((relatorio, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-gold/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{relatorio.nome}</h3>
                      <p className="text-sm text-text-muted">
                        {relatorio.tipo} • {relatorio.data} • {relatorio.tamanho}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      relatorio.status === 'Concluído' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {relatorio.status}
                    </span>
                    {relatorio.status === 'Concluído' && (
                      <button className="p-2 text-text-muted hover:text-primary-gold transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Total de downloads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Acessado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Financeiro</div>
              <p className="text-xs text-muted-foreground">
                45% dos acessos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hoje</div>
              <p className="text-xs text-muted-foreground">
                14:30
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}