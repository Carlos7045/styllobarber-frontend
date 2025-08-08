import type { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
import { LazyReceitasReport, LazyPageWrapper } from '@/shared/components/lazy'

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
      <div className="max-w-7xl mx-auto space-y-8">
        <LazyPageWrapper title="Relatório de Receitas">
          <LazyReceitasReport 
            showFilters={true}
            autoLoad={false}
          />
        </LazyPageWrapper>
      </div>
    </Container>
  )
}
