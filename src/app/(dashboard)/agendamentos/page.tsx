import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Calendar, Clock, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Meus Agendamentos - StylloBarber',
  description: 'Visualize e gerencie seus agendamentos',
}

export default function AgendamentosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Meus Agendamentos
          </h1>
          <p className="text-text-muted">
            Visualize e gerencie seus agendamentos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                Nenhum agendamento encontrado
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