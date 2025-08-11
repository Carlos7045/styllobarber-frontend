import type { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
// import { LazyFinancialDashboard, LazyPageWrapper } from '@/shared/components/lazy'
import { FinancialDashboard } from '@/components/financial/components/FinancialDashboard'

export const metadata: Metadata = {
  title: 'Financeiro - StylloBarber',
  description: 'Dashboard financeiro avançado com gráficos interativos e métricas detalhadas',
}

/**
 * Página de controle financeiro avançado
 * Dashboard completo com métricas detalhadas (sem lazy loading)
 */
export default function FinanceiroPage() {
  return (
    <Container className="py-8">
      <FinancialDashboard />
    </Container>
  )
}
