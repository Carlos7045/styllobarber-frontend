import { Metadata } from 'next'
import { Container } from '@/components/layout'
import { UserManagement } from '@/components/admin/UserManagement'

export const metadata: Metadata = {
  title: 'Gestão de Clientes - StylloBarber',
  description: 'Gerencie clientes do sistema.',
}

export default function ClientesPage() {
  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <svg className="h-10 w-10 text-primary-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Gestão de Clientes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Gerencie clientes e usuários do sistema
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
        </div>

        <UserManagement />
      </div>
    </Container>
  )
}