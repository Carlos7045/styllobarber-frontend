import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { SimpleAuthTest } from '@/components/debug/SimpleAuthTest'
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel'

export const metadata: Metadata = {
  title: 'Teste de Autenticação - StylloBarber',
  description: 'Página de teste para diagnosticar problemas de autenticação',
}

/**
 * Página de teste para diagnosticar problemas de autenticação
 */
export default function TestAuthPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Teste de Autenticação
          </h1>
          <p className="text-text-muted">
            Esta página é para diagnosticar problemas de autenticação
          </p>
        </div>

        <div className="space-y-8">
          {/* Teste simples */}
          <SimpleAuthTest />
          
          {/* Debug panel */}
          <AuthDebugPanel />
        </div>
      </div>
    </Container>
  )
}