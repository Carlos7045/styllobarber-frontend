import { Metadata } from 'next'
import { Container } from '@/components/layout'
import { FuncionarioManagement } from '@/components/admin/FuncionarioManagement'

export const metadata: Metadata = {
  title: 'Gestão de Funcionários - StylloBarber',
  description: 'Gerencie funcionários, barbeiros e administradores do sistema.',
}

export default function FuncionariosPage() {
  return (
    <Container className="py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Gestão de Funcionários
          </h1>
          <p className="text-text-muted">
            Gerencie funcionários, barbeiros e administradores da barbearia
          </p>
        </div>

        <FuncionarioManagement />
      </div>
    </Container>
  )
}