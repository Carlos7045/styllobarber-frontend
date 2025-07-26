/**
 * Componente que detecta automaticamente o acesso de monitoramento
 * Mostra o dashboard apropriado baseado no usuário logado
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
import { SaasOwnerDashboard } from '@/components/saas/SaasOwnerDashboard'
import { SystemStatusCard } from '@/components/admin/SystemStatusCard'
import { AuthHealthDashboard } from '@/components/debug/AuthHealthDashboard'
import { WelcomeNotification } from '@/components/monitoring/WelcomeNotification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Crown, Shield, Code, AlertTriangle } from 'lucide-react'

export function MonitoringAccess() {
  const { profile, user } = useAuth()
  const { permissions, isSaasOwner, isDeveloper, canAccess } = useMonitoringPermissions(
    profile?.role || 'client', 
    profile
  )

  // Debug info para você
  console.log('🔍 Monitoring Access Debug:', {
    user: {
      email: user?.email,
      id: user?.id,
      user_metadata: user?.user_metadata
    },
    profile: {
      nome: profile?.nome,
      email: profile?.email,
      role: profile?.role,
      id: profile?.id
    },
    permissions: {
      isSaasOwner: isSaasOwner(),
      isDeveloper: isDeveloper(),
      canViewSystemHealth: canAccess('canViewSystemHealth'),
      canViewDetailedMetrics: canAccess('canViewDetailedMetrics')
    },
    environment: process.env.NODE_ENV
  })

  return (
    <div className="space-y-6">
      {/* Se é o Carlos (SaaS Owner + Developer) */}
      {isSaasOwner() && (
        <div className="space-y-6">
          {/* Notificação de boas-vindas */}
          <WelcomeNotification />
          
          {/* Header especial para você */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-purple-600" />
                Bem-vindo, Carlos! 👋
              </CardTitle>
              <p className="text-sm text-gray-600">
                Acesso completo como desenvolvedor e proprietário do SaaS StylloBarber
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <span>SaaS Owner</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-blue-500" />
                  <span>Developer</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Acesso Total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard completo do SaaS */}
          <SaasOwnerDashboard />
        </div>
      )}

      {/* Se é admin da barbearia */}
      {!isSaasOwner() && profile?.role === 'admin' && canAccess('canViewSystemHealth') && (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Monitoramento - Administrador
              </CardTitle>
              <p className="text-sm text-gray-600">
                Status simplificado do sistema para administradores da barbearia
              </p>
            </CardHeader>
          </Card>

          <SystemStatusCard />
        </div>
      )}

      {/* Se é desenvolvedor (mas não SaaS owner) */}
      {!isSaasOwner() && isDeveloper() && canAccess('canViewDetailedMetrics') && (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Monitoramento - Desenvolvedor
              </CardTitle>
              <p className="text-sm text-gray-600">
                Dashboard técnico completo para desenvolvimento e debugging
              </p>
            </CardHeader>
          </Card>

          <AuthHealthDashboard />
        </div>
      )}

      {/* Acesso negado */}
      {!isSaasOwner() && !canAccess('canViewSystemHealth') && !canAccess('canViewDetailedMetrics') && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acesso Não Autorizado
              </h3>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para acessar o sistema de monitoramento.
              </p>
              <div className="text-sm text-gray-500">
                <p>Usuário: {user?.email}</p>
                <p>Role: {profile?.role || 'Não definido'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}