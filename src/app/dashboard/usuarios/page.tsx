'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
import { UserManagement } from '@/domains/users/components/admin/UserManagement'
import { useBarberPermissions } from '@/domains/users/hooks/use-barber-permissions'
import { FullPageLoading } from '@/domains/auth/components/AuthLoadingState'

// Não podemos usar metadata em client component, então vamos remover
// export const metadata: Metadata = {
//   title: 'Gestão de Usuários - StylloBarber',
//   description: 'Gerencie usuários do sistema.',
// }

export default function UsuariosPage() {
  const router = useRouter()
  const { isBarber, isAdmin } = useBarberPermissions()

  useEffect(() => {
    // Se for barbeiro, redirecionar para a página de clientes
    if (isBarber && !isAdmin) {
      router.replace('/dashboard/clientes')
      return
    }
  }, [isBarber, isAdmin, router])

  // Mostrar loading enquanto verifica permissões
  if (false) {
    return <FullPageLoading />
  }

  // Se for barbeiro, não renderizar nada (será redirecionado)
  if (isBarber && !isAdmin) {
    return <FullPageLoading />
  }

  // Apenas admins podem ver esta página
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Moderno */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <svg
                className="h-10 w-10 text-primary-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Gestão de Usuários
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Gerencie todos os usuários do sistema (Admins, Barbeiros, Clientes)
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        <UserManagement />
      </div>
    </Container>
  )
}
