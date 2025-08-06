/**
 * Componente para proteção de rotas e componentes baseado em permissões
 * Substitui verificações manuais de role por um sistema centralizado
 */

'use client'

import React from 'react'
import { usePermissions, useRoutePermissions } from '@/domains/auth/hooks/use-permissions'
import { Card, CardContent } from '@/shared/components/ui'
import { Shield, AlertTriangle, Lock } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode

  // Permissões necessárias (qualquer uma)
  requiredPermissions?: string[]

  // Roles necessários (qualquer um)
  requiredRoles?: ('admin' | 'barber' | 'client' | 'saas_owner')[]

  // Se deve exigir TODAS as permissões (ao invés de qualquer uma)
  requireAllPermissions?: boolean

  // Se deve exigir TODOS os roles (ao invés de qualquer um)
  requireAllRoles?: boolean

  // Componente customizado para quando não tem acesso
  fallback?: React.ReactNode

  // Se deve mostrar loading enquanto verifica
  showLoading?: boolean

  // Tipo de proteção
  type?: 'page' | 'component' | 'feature'

  // Mensagem customizada de acesso negado
  accessDeniedMessage?: string
}

export function PermissionGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAllPermissions = false,
  requireAllRoles = false,
  fallback,
  showLoading = true,
  type = 'component',
  accessDeniedMessage,
}: PermissionGuardProps) {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, isAuthenticated, userRole } =
    usePermissions()

  // Se não está autenticado, não mostrar nada (deixar o RouteGuard lidar com isso)
  if (!isAuthenticated) {
    return showLoading ? <LoadingState type={type} /> : null
  }

  // Verificar permissões
  let hasRequiredPermissions = true
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)
  }

  // Verificar roles
  let hasRequiredRoles = true
  if (requiredRoles.length > 0) {
    hasRequiredRoles = requireAllRoles
      ? requiredRoles.every((role) => hasRole(role))
      : requiredRoles.some((role) => hasRole(role))
  }

  // Se tem acesso, mostrar conteúdo
  if (hasRequiredPermissions && hasRequiredRoles) {
    return <>{children}</>
  }

  // Se não tem acesso, mostrar fallback ou mensagem padrão
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <AccessDeniedState
      type={type}
      userRole={userRole}
      requiredPermissions={requiredPermissions}
      requiredRoles={requiredRoles}
      customMessage={accessDeniedMessage}
    />
  )
}

// Componente de loading
function LoadingState({ type }: { type: string }) {
  if (type === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-gold"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-gold"></div>
    </div>
  )
}

// Componente de acesso negado
function AccessDeniedState({
  type,
  userRole,
  requiredPermissions,
  requiredRoles,
  customMessage,
}: {
  type: string
  userRole: string | null
  requiredPermissions: string[]
  requiredRoles: string[]
  customMessage?: string
}) {
  const getIcon = () => {
    switch (type) {
      case 'page':
        return <Lock className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      case 'feature':
        return <Shield className="h-8 w-8 text-gray-400" />
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-400" />
    }
  }

  const getMessage = () => {
    if (customMessage) return customMessage

    if (type === 'page') {
      return 'Você não tem permissão para acessar esta página.'
    }

    return 'Acesso restrito para seu nível de usuário.'
  }

  const getDetails = () => {
    const details = []

    if (requiredRoles.length > 0) {
      details.push(`Roles necessários: ${requiredRoles.join(', ')}`)
    }

    if (requiredPermissions.length > 0) {
      details.push(`Permissões necessárias: ${requiredPermissions.join(', ')}`)
    }

    if (userRole) {
      details.push(`Seu role atual: ${userRole}`)
    }

    return details
  }

  if (type === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background-dark">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-8 text-center">
            {getIcon()}
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Acesso Negado
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">{getMessage()}</p>

            {process.env.NODE_ENV === 'development' && (
              <div className="rounded bg-gray-100 p-3 text-left text-xs dark:bg-gray-800">
                <p className="mb-1 font-semibold">Debug Info:</p>
                {getDetails().map((detail, index) => (
                  <p key={index} className="text-gray-600 dark:text-gray-400">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
              {getMessage()}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                Role: {userRole} | Requer:{' '}
                {requiredRoles.join(', ') || requiredPermissions.join(', ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook para usar o PermissionGuard programaticamente
export function usePermissionGuard(
  requiredPermissions: string[] = [],
  requiredRoles: ('admin' | 'barber' | 'client' | 'saas_owner')[] = []
) {
  const { hasAnyPermission, hasRole, isAuthenticated } = usePermissions()

  const hasRequiredPermissions =
    requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions)

  const hasRequiredRoles = requiredRoles.length === 0 || requiredRoles.some((role) => hasRole(role))

  const hasAccess = isAuthenticated && hasRequiredPermissions && hasRequiredRoles

  return {
    hasAccess,
    hasRequiredPermissions,
    hasRequiredRoles,
    isAuthenticated,
  }
}

// Componentes específicos para casos comuns
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard requiredRoles={['admin', 'saas_owner']} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function BarberOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard requiredRoles={['barber']} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function AdminOrBarber({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard requiredRoles={['admin', 'barber', 'saas_owner']} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function ClientOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard requiredRoles={['client']} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

// Guard específico para PDV
export function PDVGuard({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard
      requiredPermissions={['manage_transactions', 'manage_financial']}
      type="page"
      accessDeniedMessage="Acesso ao PDV restrito a administradores e usuários com permissão financeira."
    >
      {children}
    </PermissionGuard>
  )
}
