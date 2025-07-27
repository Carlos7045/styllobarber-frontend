import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { ReportsCenterDemo } from '@/components/financial/examples/reports-demo'

export const metadata: Metadata = {
  title: 'Demo - Relatórios Financeiros - StylloBarber',
  description: 'Demonstração do sistema de relatórios financeiros com dados mockados',
}

/**
 * Página de demonstração do centro de relatórios financeiros
 */
export default function RelatoriosDemoPage() {
  return (
    <Container className="py-8">
      <ReportsCenterDemo />
    </Container>
  )
}