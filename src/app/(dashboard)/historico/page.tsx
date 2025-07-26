import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { History, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Histórico - StylloBarber',
  description: 'Visualize seu histórico de agendamentos e serviços',
}

export default function HistoricoPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Histórico
          </h1>
          <p className="text-text-muted">
            Visualize seu histórico de agendamentos e serviços
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <History className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                Nenhum histórico encontrado
              </p>
              <p className="text-sm text-text-muted mt-2">
                Esta funcionalidade está sendo implementada
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}