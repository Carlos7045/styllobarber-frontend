// Componente para proteger rotas e componentes baseado em permissões
'use client'

import { ReactNode } from 'react'
import { useBarberPermissions, usePermissionCheck, BarberPermissions } from '@/hooks/use-barber-permissions'
import { Card } from '@/components/ui/card'
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  permission?: keyof BarberPermissions
  customCheck?: (permissions: BarberPermissions) => boolean
  fallback?: ReactNode
  showFallback?: boolean
  requireAll?: boolean // Se true, requer todas as permissões listadas
  permissions?: (keyof BarberPermissions)[] // Lista de permissões
}

// Componente de fallback padrão
const DefaultFallback = ({ 
  message = 'Você não tem permissão para acessar este conteúdo',
  showIcon = true 
}: { 
  message?: string
  showIcon?: boolean 
}) => (
  <Card className="p-6 text-center border-red-200 bg-red-50">
    <div className="flex flex-col items-center space-y-3">
      {showIcon && <Lock className="h-12 w-12 text-red-400" />}
      <div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Acesso Restrito
        </h3>
        <p className="text-red-700">
          {message}
        </p>
      </div>
    </div>
  </Card>
)

// Componente de loading
const LoadingFallback = () => (
  <Card className="p-6 text-center">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Verificando permissões...</p>
    </div>
  </Card>
)

export const PermissionGuard = ({
  children,
  permission,
  customCheck,
  fallback,
  showFallback = true,
  requireAll = false,
  permissions = []
}: PermissionGuardProps) => {
  const { permissions: userPermissions, loading } = useBarberPermissions()
  const permissionCheck = usePermissionCheck()

  // Mostrar loading enquanto carrega permissões
  if (loading) {
    return <LoadingFallback />
  }

  // Verificar permissão customizada
  if (customCheck) {
    const hasPermission = customCheck(userPermissions)
    if (!hasPermission) {
      return showFallback ? (fallback || <DefaultFallback />) : null
    }
    return <>{children}</>
  }

  // Verificar permissão única
  if (permission) {
    const hasPermission = userPermissions[permission]
    if (!hasPermission) {
      return showFallback ? (fallback || <DefaultFallback />) : null
    }
    return <>{children}</>
  }

  // Verificar múltiplas permissões
  if (permissions.length > 0) {
    const hasPermissions = requireAll
      ? permissions.every(perm => userPermissions[perm])
      : permissions.some(perm => userPermissions[perm])

    if (!hasPermissions) {
      const message = requireAll
        ? 'Você precisa de todas as permissões necessárias para acessar este conteúdo'
        : 'Você não tem nenhuma das permissões necessárias para acessar este conteúdo'
      
      return showFallback ? (fallback || <DefaultFallback message={message} />) : null
    }
    return <>{children}</>
  }

  // Se nenhuma verificação foi especificada, mostrar conteúdo
  return <>{children}</>
}

// Componente específico para dados financeiros
export const FinancialDataGuard = ({ 
  children, 
  scope = 'own',
  fallback 
}: { 
  children: ReactNode
  scope?: 'own' | 'all'
  fallback?: ReactNode 
}) => {
  const permissionCheck = usePermissionCheck()
  
  return (
    <PermissionGuard
      customCheck={() => permissionCheck.canAccessFinancialData(scope)}
      fallback={fallback || (
        <DefaultFallback 
          message={`Você não tem permissão para ver ${scope === 'all' ? 'todos os' : 'seus'} dados financeiros`}
        />
      )}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente específico para PDV
export const PDVGuard = ({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) => {
  const permissionCheck = usePermissionCheck()
  
  return (
    <PermissionGuard
      customCheck={() => permissionCheck.canUsePDV()}
      fallback={fallback || (
        <DefaultFallback 
          message="Você não tem permissão para usar o PDV"
        />
      )}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente específico para clientes
export const ClientDataGuard = ({ 
  children, 
  scope = 'own',
  fallback 
}: { 
  children: ReactNode
  scope?: 'own' | 'all'
  fallback?: ReactNode 
}) => {
  const permissionCheck = usePermissionCheck()
  
  return (
    <PermissionGuard
      customCheck={() => permissionCheck.canAccessClients(scope)}
      fallback={fallback || (
        <DefaultFallback 
          message={`Você não tem permissão para ver ${scope === 'all' ? 'todos os' : 'seus'} clientes`}
        />
      )}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente específico para administradores
export const AdminGuard = ({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) => {
  return (
    <PermissionGuard
      permission="canAccessAdminPanel"
      fallback={fallback || (
        <DefaultFallback 
          message="Apenas administradores podem acessar esta área"
        />
      )}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente para mostrar/ocultar elementos baseado em permissões
export const ConditionalRender = ({
  children,
  permission,
  customCheck,
  permissions = [],
  requireAll = false,
  fallback,
  inverse = false // Se true, mostra quando NÃO tem permissão
}: {
  children: ReactNode
  permission?: keyof BarberPermissions
  customCheck?: (permissions: BarberPermissions) => boolean
  permissions?: (keyof BarberPermissions)[]
  requireAll?: boolean
  fallback?: ReactNode
  inverse?: boolean
}) => {
  const { permissions: userPermissions, loading } = useBarberPermissions()

  if (loading) {
    return null
  }

  let hasPermission = false

  // Verificar permissão customizada
  if (customCheck) {
    hasPermission = customCheck(userPermissions)
  }
  // Verificar permissão única
  else if (permission) {
    hasPermission = userPermissions[permission]
  }
  // Verificar múltiplas permissões
  else if (permissions.length > 0) {
    hasPermission = requireAll
      ? permissions.every(perm => userPermissions[perm])
      : permissions.some(perm => userPermissions[perm])
  }
  // Se nenhuma verificação, assumir que tem permissão
  else {
    hasPermission = true
  }

  // Inverter lógica se necessário
  if (inverse) {
    hasPermission = !hasPermission
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Hook para usar em componentes funcionais
export const useConditionalRender = () => {
  const { permissions, loading } = useBarberPermissions()
  const permissionCheck = usePermissionCheck()

  return {
    loading,
    permissions,
    
    // Renderizar condicionalmente
    renderIf: (condition: boolean, content: ReactNode, fallback?: ReactNode) => {
      return condition ? content : (fallback || null)
    },

    // Renderizar se tem permissão
    renderIfPermission: (
      permission: keyof BarberPermissions, 
      content: ReactNode, 
      fallback?: ReactNode
    ) => {
      return permissions[permission] ? content : (fallback || null)
    },

    // Renderizar se pode acessar dados financeiros
    renderIfCanAccessFinancial: (
      scope: 'own' | 'all', 
      content: ReactNode, 
      fallback?: ReactNode
    ) => {
      const canAccess = permissionCheck.canAccessFinancialData(scope)
      return canAccess ? content : (fallback || null)
    },

    // Renderizar se é admin
    renderIfAdmin: (content: ReactNode, fallback?: ReactNode) => {
      return permissionCheck.isAdmin() ? content : (fallback || null)
    },

    // Renderizar se é barbeiro
    renderIfBarber: (content: ReactNode, fallback?: ReactNode) => {
      return permissions.canViewOwnFinancialData && !permissionCheck.isAdmin() 
        ? content : (fallback || null)
    }
  }
}