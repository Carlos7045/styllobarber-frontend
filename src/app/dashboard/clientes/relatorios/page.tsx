import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { ClientReportsCenter } from '@/components/clients/ClientReportsCenter'

export const metadata: Metadata = {
  title: 'Relatórios de Clientes - StylloBarber',
  description: 'Centro de relatórios de clientes com análises de perfil, frequência e fidelização',
}

/**
 * Página do centro de relatórios de clientes
 * Permite gerar e exportar relatórios detalhados de perfil, frequência, fidelização e segmentação de clientes
 */
export default function ClientesRelatoriosPage() {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <ClientReportsCenter />
      </div>
    </Container>
  )
}
