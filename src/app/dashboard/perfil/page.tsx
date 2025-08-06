import type { Metadata } from 'next'
import { UserProfile } from '@/components/profile/UserProfileSimple'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { ProfileHistory } from '@/components/profile/ProfileHistory'
import { Container } from '@/shared/components/layout'

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
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <svg className="h-10 w-10 text-primary-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Meu Perfil
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
        </div>

        {/* Resumo do perfil */}
        <div className="mb-8">
          <ProfileSummary />
        </div>

        {/* Componente principal de edição */}
        <UserProfile />

        {/* Histórico de alterações */}
        <div className="mt-8">
          <ProfileHistory />
        </div>
      </div>
    </Container>
  )
}
