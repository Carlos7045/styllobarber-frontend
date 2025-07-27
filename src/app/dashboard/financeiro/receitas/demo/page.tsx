import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { ReceitasReportDemo } from '@/components/financial/examples/reports-demo'

export const metadata: Metadata = {
  title: 'Demo - Relatório de Receitas - StylloBarber',
  description: 'Demonstração do relatório de receitas com dados mockados',
}

/**
 * Página de demonstração do relatório de receitas
 */
export default function ReceitasDemoPage() {
  return (
    <Container className="py-8">
      <ReceitasReportDemo />
    </Container>
  )
}