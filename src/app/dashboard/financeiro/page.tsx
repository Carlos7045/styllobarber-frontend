import type { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
import { LazyFinancialDashboard, LazyPageWrapper } from '@/shared/components/lazy'

export const metadata: Metadata = {
  title: 'Financeiro - StylloBarber',
  description: 'Dashboard financeiro avançado com gráficos interativos e métricas detalhadas',
}

/**
 * Página de controle financeiro avançado
 * Dashboard completo com gráficos interativos, filtros e métricas detalhadas
 */
export default function FinanceiroPage() {
  return (
    <Container className="py-8">
      <LazyPageWrapper title="Dashboard Financeiro">
        <LazyFinancialDashboard />
      </LazyPageWrapper>
    </Container>
  )
}
