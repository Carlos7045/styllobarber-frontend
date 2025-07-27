import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { ReceitasReport } from '@/components/financial/components/ReceitasReport'

export const metadata: Metadata = {
  title: 'Relatório de Receitas - StylloBarber',
  description: 'Relatório detalhado de receitas com gráficos e análises',
}

/**
 * Página do relatório de receitas
 * Análise detalhada das receitas com filtros, gráficos e exportação
 */
export default function ReceitasPage() {
  return (
    <Container className="py-8">
      <ReceitasReport 
        showFilters={true}
        autoLoad={false}
      />
    </Container>
  )
}