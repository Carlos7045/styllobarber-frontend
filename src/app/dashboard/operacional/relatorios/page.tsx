import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { OperationalReportsCenter } from '@/components/operational/OperationalReportsCenter'

export const metadata: Metadata = {
  title: 'Relatórios Operacionais - StylloBarber',
  description:
    'Centro de relatórios operacionais com análises de produtividade, serviços e eficiência',
}

/**
 * Página do centro de relatórios operacionais
 * Permite gerar e exportar relatórios detalhados de produtividade, serviços, eficiência e análise operacional
 */
export default function OperacionalRelatoriosPage() {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <OperationalReportsCenter />
      </div>
    </Container>
  )
}
