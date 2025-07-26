import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Scissors, Plus, Edit, Trash2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Serviços - StylloBarber',
  description: 'Gerencie os serviços oferecidos pela barbearia',
}

/**
 * Página de gerenciamento de serviços
 * Permite visualizar, criar, editar e excluir serviços
 */
export default function ServicosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Serviços
          </h1>
          <p className="text-text-muted">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10</div>
              <p className="text-xs text-muted-foreground">
                83% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 35,00</div>
              <p className="text-xs text-muted-foreground">
                +R$ 5,00 desde o mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de serviços */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Serviços</CardTitle>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-gold text-primary-black rounded-lg hover:bg-primary-gold-dark transition-colors">
                <Plus className="h-4 w-4" />
                Novo Serviço
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Exemplo de serviços */}
              {[
                { nome: 'Corte Masculino', preco: 'R$ 30,00', duracao: '30 min', ativo: true },
                { nome: 'Barba', preco: 'R$ 20,00', duracao: '20 min', ativo: true },
                { nome: 'Corte + Barba', preco: 'R$ 45,00', duracao: '45 min', ativo: true },
                { nome: 'Sobrancelha', preco: 'R$ 15,00', duracao: '15 min', ativo: true },
                { nome: 'Lavagem', preco: 'R$ 10,00', duracao: '10 min', ativo: false },
              ].map((servico, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-gold/10 rounded-full flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-primary-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{servico.nome}</h3>
                      <p className="text-sm text-text-muted">
                        {servico.preco} • {servico.duracao}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      servico.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {servico.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <button className="p-2 text-text-muted hover:text-primary-gold transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}