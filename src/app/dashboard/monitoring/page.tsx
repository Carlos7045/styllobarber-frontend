
'use client'
/**
 * Página de monitoramento - Carlos Henrique Pereira Salgado
 * Dashboard completo para desenvolvedor e dono do SaaS
 */


import type { Metadata } from 'next'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Container } from '@/shared/components/layout'
import { MonitoringAccess } from '@/components/monitoring/MonitoringAccess'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { AlertTriangle, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Página de monitoramento com controle de acesso rigoroso
 * Apenas Carlos Henrique (SaaS Owner) pode acessar
 */
export default function MonitoringPage() {
  const { profile, user } = useAuth()
  const router = useRouter()

  // Verificação rigorosa de acesso
  const hasAccess = profile?.nome?.includes('Carlos Henrique') && profile?.nome?.includes('Salgado') ||
                   profile?.email === 'carlos@styllobarber.com' ||
                   profile?.email === 'carlos7045@gmail.com' ||
                   profile?.role === 'saas_owner'

  // Redirecionar usuários não autorizados
  useEffect(() => {
    if (profile && !hasAccess) {
      console.log('🚫 Acesso negado ao monitoramento:', {
        nome: profile.nome,
        email: profile.email,
        role: profile.role
      })
      router.replace('/dashboard')
    }
  }, [profile, hasAccess, router])

  // Mostrar loading enquanto verifica permissões
  if (!profile) {
    return (
      <Container className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
          </div>
        </div>
      </Container>
    )
  }

  // Bloquear acesso para usuários não autorizados
  if (!hasAccess) {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Acesso Restrito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Área Restrita
                </h3>
                <p className="text-gray-600 mb-6">
                  Esta área é exclusiva para o proprietário do sistema.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                  <p><strong>Usuário:</strong> {profile.nome}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    )
  }

  // Usuário autorizado - mostrar dashboard
  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Monitoramento do Sistema
          </h1>
          <p className="text-text-muted">
            Dashboard de saúde, performance e alertas do StylloBarber
          </p>
        </div>

        {/* Componente que detecta automaticamente o nível de acesso */}
        <MonitoringAccess />
      </div>
    </Container>
  )
}
