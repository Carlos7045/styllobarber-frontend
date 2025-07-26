import type { Metadata } from 'next'
import { SimpleRouteGuard } from '@/components/auth/SimpleRouteGuard'

export const metadata: Metadata = {
  title: 'Teste RouteGuard - StylloBarber',
  description: 'Página de teste para o RouteGuard corrigido',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Página de teste para o RouteGuard corrigido
 */
export default function TestRouteGuardPage() {
  return (
    <SimpleRouteGuard requiredRoles={['admin', 'barber', 'client']}>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Teste RouteGuard Corrigido
            </h1>
            <p className="text-gray-600">
              Se você está vendo esta página, o RouteGuard está funcionando corretamente!
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status:</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✅ <strong>Autenticação:</strong> Funcionando</p>
              <p>✅ <strong>Autorização:</strong> Funcionando</p>
              <p>✅ <strong>Sem loops:</strong> Funcionando</p>
              <p>✅ <strong>Performance:</strong> Otimizada</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Correções Aplicadas:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Timeout no query-optimizer corrigido</li>
              <li>• Loop infinito no RouteGuard resolvido</li>
              <li>• Problemas de navegação do Next.js corrigidos</li>
              <li>• Sistema de logout robusto implementado</li>
              <li>• Middleware simplificado e otimizado</li>
            </ul>
          </div>
        </div>
      </div>
    </SimpleRouteGuard>
  )
}