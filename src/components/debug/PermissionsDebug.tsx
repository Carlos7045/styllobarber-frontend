/**
 * Componente de debug para testar o sistema de permissões
 * Apenas para desenvolvimento - remover em produção
 */

'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Shield, User, CheckCircle, XCircle } from 'lucide-react'

export function PermissionsDebug() {
  const { user, profile, hasRole, hasPermission } = useAuth()
  const permissions = usePermissions()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const allPermissions = Object.values(PERMISSIONS)
  const allRoles = ['admin', 'barber', 'client', 'saas_owner'] as const

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Permissões - Debug
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Apenas visível em desenvolvimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>ID:</strong> {user?.id || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || 'N/A'}
            </div>
            <div>
              <strong>Nome:</strong> {profile?.nome || 'N/A'}
            </div>
            <div>
              <strong>Role:</strong> {profile?.role || 'N/A'}
            </div>
            <div>
              <strong>Autenticado:</strong> {permissions.isAuthenticated ? '✅' : '❌'}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status dos Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allRoles.map(role => (
              <div key={role} className="flex items-center justify-between">
                <span className="capitalize">{role}:</span>
                <div className="flex items-center gap-2">
                  {hasRole(role) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {hasRole(role) ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permissões Específicas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permissões Específicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPermissions.map(permission => (
                <div key={permission} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <span className="text-xs font-mono">{permission}</span>
                  {hasPermission(permission) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verificações de Funcionalidades */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Verificações de Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Gestão</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Pode gerenciar usuários:</span>
                    <span>{permissions.canManageUsers ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pode gerenciar funcionários:</span>
                    <span>{permissions.canManageEmployees ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pode gerenciar serviços:</span>
                    <span>{permissions.canManageServices ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Financeiro & Relatórios</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Pode gerenciar financeiro:</span>
                    <span>{permissions.canManageFinancial ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pode ver relatórios:</span>
                    <span>{permissions.canViewReports ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pode exportar dados:</span>
                    <span>{permissions.canExportData ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Hook para mostrar debug de permissões no console
export function usePermissionsDebug() {
  const { user, profile, hasRole, hasPermission } = useAuth()
  const permissions = usePermissions()

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Sistema de Permissões - Debug')
      console.log('Usuário:', user)
      console.log('Perfil:', profile)
      console.log('Permissões:', permissions)
      console.log('hasRole function:', hasRole)
      console.log('hasPermission function:', hasPermission)
      console.groupEnd()
    }
  }, [user, profile, permissions, hasRole, hasPermission])

  return permissions
}