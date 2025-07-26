import type { Metadata } from 'next'
import { LogoutDebugger } from '@/components/debug/LogoutDebugger'
import { EmergencyLogout } from '@/components/debug/EmergencyLogout'

export const metadata: Metadata = {
  title: 'Debug Logout - StylloBarber',
  description: 'Página de debug para problemas de logout',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Página de debug para problemas de logout
 */
export default function DebugLogoutPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug de Logout
          </h1>
          <p className="text-gray-600">
            Ferramenta para diagnosticar e resolver problemas de logout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogoutDebugger />
          <EmergencyLogout />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Como usar:</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. <strong>Sistema normal:</strong> Indica que não há logout em andamento</p>
            <p>2. <strong>Logout em andamento:</strong> Indica que o processo de logout está ativo</p>
            <p>3. <strong>Forçar Logout:</strong> Use se o logout estiver travado em loop</p>
            <p>4. <strong>Limpar Dados:</strong> Remove todos os dados locais de autenticação</p>
          </div>
        </div>
      </div>
    </div>
  )
}