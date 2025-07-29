import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { AppointmentReportsCenter } from '@/components/appointments/AppointmentReportsCenter'

export const metadata: Metadata = {
  title: 'Relatórios de Agendamentos - StylloBarber',
  description:
    'Centro de relatórios de agendamentos com análises de ocupação, performance e estatísticas',
}

/**
 * Página do centro de relatórios de agendamentos
 * Permite gerar e exportar relatórios detalhados de ocupação, performance, horários e cancelamentos
 */
export default function AgendaRelatoriosPage() {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AppointmentReportsCenter />
      </div>
    </Container>
  )
}
