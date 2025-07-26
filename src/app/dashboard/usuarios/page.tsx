import { Metadata } from 'next'
import { Container } from '@/components/layout'
import { UserManagement } from '@/components/admin/UserManagement'

export const metadata: Metadata = {
  title: 'Gestão de Usuários - StylloBarber',
  description: 'Gerencie usuários, roles e permissões do sistema.',
}

export default function UsuariosPage() {
  return (
    <Container className="py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Gestão de Usuários
          </h1>
          <p className="text-text-muted">
            Gerencie usuários, roles e permissões do sistema
          </p>
        </div>

        <UserManagement />
      </div>
    </Container>
  )
}