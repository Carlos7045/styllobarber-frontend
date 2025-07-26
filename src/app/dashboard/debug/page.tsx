/**
 * Página de debug - apenas para desenvolvimento
 * Acesso restrito ao desenvolvedor
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Container } from '@/components/layout'
import { RoleDebugger } from '@/components/debug/RoleDebugger'
import { UserDebugInfo } from '@/components/debug/UserDebugInfo'
import { PerformanceDashboard } from '@/components/debug/PerformanceDashboard'
import { AuthValidationPanel } from '@/components/debug/AuthValidationPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Bug, AlertTriangle } from 'lucide-react'

export default function DebugPage() {
  const { profile } = useAuth()

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Container className="py-8">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Página não disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta página só está disponível em modo de desenvolvimento.</p>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Debug Dashboard
          </h1>
          <p className="text-text-muted">
            Ferramentas de debug para desenvolvimento (apenas em development)
          </p>
        </div>

        <div className="space-y-6">
          {/* Auth Validation Panel */}
          <AuthValidationPanel />
          
          {/* Performance Dashboard */}
          <PerformanceDashboard />
          
          {/* Role Debugger */}
          <RoleDebugger />
          
          {/* User Debug Info */}
          <UserDebugInfo />
          
          {/* Informações adicionais */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-green-700">Como usar:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• <strong>Validação de Auth:</strong> Execute testes automatizados para validar fluxos de autenticação</p>
                <p>• <strong>Performance:</strong> Monitor de métricas de cache, queries e conexões</p>
                <p>• <strong>Role Debugger:</strong> Debug de problemas de permissões e roles</p>
                <p>• <strong>User Info:</strong> Informações detalhadas sobre o usuário logado</p>
                <p>• Acesse via <code className="bg-gray-100 px-1 rounded">/dashboard/debug</code></p>
                <p>• Só funciona em modo development</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}