import type { Metadata } from 'next'
import { UserProfile } from '@/components/profile/UserProfile'
import { Container } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Meu Perfil - StylloBarber',
  description: 'Gerencie suas informações pessoais e configurações de conta',
}

/**
 * Página do perfil do usuário
 * Permite visualizar e editar informações pessoais
 */
export default function PerfilPage() {
  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Meu Perfil
          </h1>
          <p className="text-text-muted">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <UserProfile />
      </div>
    </Container>
  )
}