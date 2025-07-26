'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function RouteGuardDebugger() {
  const { user, profile, loading, isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const requiredRoles = ['admin', 'barber', 'client']
    const userRole = profile?.role || user?.user_metadata?.role || 'client'
    const hasPermission = requiredRoles.includes(userRole as any)

    setDebugInfo({
      initialized,
      loading,
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      userRole,
      requiredRoles,
      hasPermission,
      pathname,
      timestamp: new Date().toLocaleTimeString()
    })
  }, [user, profile, loading, isAuthenticated, initialized, pathname])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card className="fixed top-4 right-4 z-50 max-w-sm bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          RouteGuard Debugger
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.location.reload()}
            className="ml-auto p-1 h-6 w-6"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Estado de Inicialização */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Estado de Inicialização</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(debugInfo.initialized)}
              <span className={getStatusColor(debugInfo.initialized)}>
                Initialized: {debugInfo.initialized ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(!debugInfo.loading)}
              <span className={getStatusColor(!debugInfo.loading)}>
                Loading: {debugInfo.loading ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Estado de Autenticação */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Estado de Autenticação</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(debugInfo.isAuthenticated)}
              <span className={getStatusColor(debugInfo.isAuthenticated)}>
                Authenticated: {debugInfo.isAuthenticated ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(debugInfo.hasUser)}
              <span className={getStatusColor(debugInfo.hasUser)}>
                Has User: {debugInfo.hasUser ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Estado do Perfil */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Estado do Perfil</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(debugInfo.hasProfile)}
              <span className={getStatusColor(debugInfo.hasProfile)}>
                Has Profile: {debugInfo.hasProfile ? 'Sim' : 'Não'}
              </span>
            </div>
            <div>
              <span className="font-medium">Role:</span>
              <span className={`ml-1 px-1 rounded text-xs ${
                debugInfo.userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                debugInfo.userRole === 'barber' ? 'bg-blue-100 text-blue-800' :
                debugInfo.userRole === 'client' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {debugInfo.userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Verificação de Permissões */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Verificação de Permissões</h4>
          <div className="space-y-1">
            <div>
              <span className="font-medium">Required Roles:</span>
              <span className="ml-1 text-xs">
                [{debugInfo.requiredRoles?.join(', ')}]
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(debugInfo.hasPermission)}
              <span className={getStatusColor(debugInfo.hasPermission)}>
                Has Permission: {debugInfo.hasPermission ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Rota */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Informações da Rota</h4>
          <div>
            <span className="font-medium">Pathname:</span>
            <span className="ml-1 font-mono text-xs">{debugInfo.pathname}</span>
          </div>
        </div>

        {/* Resultado Final */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="font-medium">Resultado Final:</span>
            {debugInfo.initialized && !debugInfo.loading && debugInfo.isAuthenticated && debugInfo.hasPermission ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">ACESSO PERMITIDO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">ACESSO NEGADO</span>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="pt-1 border-t text-xs text-gray-500">
          Última atualização: {debugInfo.timestamp}
        </div>
      </CardContent>
    </Card>
  )
}