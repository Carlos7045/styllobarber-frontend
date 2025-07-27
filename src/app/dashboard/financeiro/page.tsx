import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { FinancialDashboardSimple } from '@/components/financial/components/FinancialDashboardSimple'

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
      <FinancialDashboardSimple />
    </Container>
  )
}