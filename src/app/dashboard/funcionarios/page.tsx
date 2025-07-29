import { Metadata } from 'next'
import { Container } from '@/components/layout'
import { FuncionarioManagement } from '@/components/admin/FuncionarioManagement'

export const metadata: Metadata = {
  title: 'Gestão de Funcionários - StylloBarber',
  description: 'Gerencie funcionários, barbeiros e administradores do sistema.',
}

export default function FuncionariosPage() {
  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <svg className="h-10 w-10 text-primary-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Gestão de Funcionários
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Gerencie funcionários, barbeiros e administradores da barbearia
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
        </div>

        <FuncionarioManagement />
      </div>
    </Container>
  )
}