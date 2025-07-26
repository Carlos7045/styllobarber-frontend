import type { Metadata } from 'next'
import { UserManagement } from '@/components/admin'
import { Container } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Gestão de Usuários - StylloBarber',
  description: 'Gerencie usuários, perfis de acesso e permissões do sistema',
}

/**
 * Página de gestão de usuários para administradores
 * Permite visualizar, editar, ativar/desativar e gerenciar usuários
 */
export default function UsuariosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Gestão de Usuários
          </h1>
          <p className="text-text-muted">
            Gerencie usuários, perfis de acesso e permissões do sistema
          </p>
        </div>

        <UserManagement />
      </div>
    </Container>
  )
}