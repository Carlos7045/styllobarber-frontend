/**
 * Página de teste do sistema de permissões
 * Apenas para desenvolvimento
 */

'use client'

import { Container } from '@/components/layout'
import { PermissionsDebug } from '@/components/debug/PermissionsDebug'
import { PermissionGuard, AdminOnly, BarberOnly, AdminOrBarber } from '@/components/auth/PermissionGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { PERMISSIONS } from '@/hooks/use-permissions'

export default function TestPermissionsPage() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Página não disponível em produção
          </h1>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teste do Sistema de Permissões
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Esta página testa todos os componentes de permissão
          </p>
        </div>

        {/* Debug do sistema */}
        <PermissionsDebug />

        {/* Testes de componentes */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Testes de Componentes de Proteção
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teste AdminOnly */}
            <Card>
              <CardHeader>
                <CardTitle>AdminOnly Component</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminOnly fallback={<p className="text-red-500">❌ Acesso negado - Apenas admins</p>}>
                  <p className="text-green-500">✅ Você é um administrador!</p>
                </AdminOnly>
              </CardContent>
            </Card>

            {/* Teste BarberOnly */}
            <Card>
              <CardHeader>
                <CardTitle>BarberOnly Component</CardTitle>
              </CardHeader>
              <CardContent>
                <BarberOnly fallback={<p className="text-red-500">❌ Acesso negado - Apenas barbeiros</p>}>
                  <p className="text-green-500">✅ Você é um barbeiro!</p>
                </BarberOnly>
              </CardContent>
            </Card>

            {/* Teste AdminOrBarber */}
            <Card>
              <CardHeader>
                <CardTitle>AdminOrBarber Component</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminOrBarber fallback={<p className="text-red-500">❌ Acesso negado - Apenas admin ou barbeiro</p>}>
                  <p className="text-green-500">✅ Você é admin ou barbeiro!</p>
                </AdminOrBarber>
              </CardContent>
            </Card>

            {/* Teste de permissão específica */}
            <Card>
              <CardHeader>
                <CardTitle>Permissão Específica - Gerenciar Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGuard 
                  requiredPermissions={[PERMISSIONS.MANAGE_USERS]}
                  fallback={<p className="text-red-500">❌ Sem permissão para gerenciar usuários</p>}
                >
                  <p className="text-green-500">✅ Você pode gerenciar usuários!</p>
                </PermissionGuard>
              </CardContent>
            </Card>

            {/* Teste de múltiplas permissões */}
            <Card>
              <CardHeader>
                <CardTitle>Múltiplas Permissões - Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGuard 
                  requiredPermissions={[PERMISSIONS.VIEW_FINANCIAL, PERMISSIONS.MANAGE_FINANCIAL]}
                  fallback={<p className="text-red-500">❌ Sem permissões financeiras</p>}
                >
                  <p className="text-green-500">✅ Você tem permissões financeiras!</p>
                </PermissionGuard>
              </CardContent>
            </Card>

            {/* Teste de todas as permissões */}
            <Card>
              <CardHeader>
                <CardTitle>Todas as Permissões - Requer Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGuard 
                  requiredPermissions={[PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_EMPLOYEES, PERMISSIONS.MANAGE_SERVICES]}
                  requireAllPermissions={true}
                  fallback={<p className="text-red-500">❌ Precisa de todas as permissões de gestão</p>}
                >
                  <p className="text-green-500">✅ Você tem todas as permissões de gestão!</p>
                </PermissionGuard>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  )
}