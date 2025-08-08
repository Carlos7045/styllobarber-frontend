import type { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
import { LazyReportsCenter, LazyPageWrapper } from '@/shared/components/lazy'

export const metadata: Metadata = {
  title: 'Relatórios Financeiros - StylloBarber',
  description: 'Centro de relatórios financeiros com análises detalhadas e exportação',
}

/**
 * Página do centro de relatórios financeiros
 * Permite gerar e exportar relatórios detalhados de receitas, despesas, comissões e DRE
 */
export default function RelatoriosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <LazyPageWrapper title="Relatórios Financeiros">
          <LazyReportsCenter />
        </LazyPageWrapper>
      </div>
    </Container>
  )
}
