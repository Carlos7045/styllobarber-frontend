import type { Metadata } from 'next'
import { UserProfile } from '@/components/profile/UserProfileSimple'
import { ProfileSync } from '@/components/profile/ProfileSync'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { ProfileHistory } from '@/components/profile/ProfileHistory'
import { Container } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Meu Perfil - StylloBarber',
  description: 'Gerencie suas informações pessoais e configurações de conta',
}

/**
 * Página do perfil do usuário (versão limpa para produção)
 * Permite visualizar e editar informações pessoais
 */
export default function PerfilCleanPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Meu Perfil
          </h1>
          <p className="text-text-muted">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="space-y-8">
          {/* Resumo do perfil */}
          <ProfileSummary />

          {/* Componente principal de edição */}
          <UserProfile />
          
          {/* Sistema de sincronização */}
          <ProfileSync />

          {/* Histórico de alterações */}
          <ProfileHistory />
        </div>
      </div>
    </Container>
  )
}