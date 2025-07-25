'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'

// Interface para as props do RouteGuard
interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'barber' | 'client'
  requiredRoles?: ('admin' | 'barber' | 'client')[]
  fallbackUrl?: string
  showUnauthorized?: boolean
}

// Componente de loading para verificação de auth
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-gold mb-4"></div>
          <p className="text-text-muted">Verificando autenticação...</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de acesso negado
function UnauthorizedScreen({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <Container>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-error" />
            </div>
            <CardTitle className="text-error">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h4 className="font-medium text-warning">Permissão Insuficiente</h4>
              </div>
              <p className="text-sm text-text-muted">
                Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isso é um erro.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onGoBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  )
}

// Componente principal RouteGuard
export function RouteGuard({
  children,
  requiredRole,
  requiredRoles,
  fallbackUrl = '/dashboard',
  showUnauthorized = true,
}: RouteGuardProps) {
  const { user, loading, isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // Verificar autorização quando o usuário ou rota mudar
  useEffect(() => {
    if (!initialized || loading) {
      setIsAuthorized(null)
      return
    }

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
      return
    }

    // Se não há restrições de role, usuário está autorizado
    if (!requiredRole && !requiredRoles) {
      setIsAuthorized(true)
      return
    }

    // Obter role do usuário
    const userRole = user?.user_metadata?.role || 'client'

    // Verificar se o usuário tem o role necessário
    let hasPermission = false

    if (requiredRole) {
      hasPermission = userRole === requiredRole
    }

    if (requiredRoles && requiredRoles.length > 0) {
      hasPermission = requiredRoles.includes(userRole as 'admin' | 'barber' | 'client')
    }

    setIsAuthorized(hasPermission)

    // Se não tem permissão e não deve mostrar tela de não autorizado, redirecionar
    if (!hasPermission && !showUnauthorized) {
      router.push(fallbackUrl)
    }
  }, [user, loading, isAuthenticated, initialized, requiredRole, requiredRoles, pathname, router, fallbackUrl, showUnauthorized])

  // Mostrar loading enquanto verifica autenticação
  if (!initialized || loading || isAuthorized === null) {
    return <AuthLoadingScreen />
  }

  // Se não está autorizado, mostrar tela de acesso negado
  if (!isAuthorized) {
    if (showUnauthorized) {
      return (
        <UnauthorizedScreen 
          onGoBack={() => router.back()} 
        />
      )
    }
    return null
  }

  // Se está autorizado, renderizar o conteúdo
  return <>{children}</>
}

// Hook para verificar permissões
export function usePermissions() {
  const { user, isAuthenticated } = useAuth()

  const hasRole = (role: 'admin' | 'barber' | 'client') => {
    if (!isAuthenticated || !user) return false
    const userRole = user.user_metadata?.role || 'client'
    return userRole === role
  }

  const hasAnyRole = (roles: ('admin' | 'barber' | 'client')[]) => {
    if (!isAuthenticated || !user) return false
    const userRole = user.user_metadata?.role || 'client'
    return roles.includes(userRole as 'admin' | 'barber' | 'client')
  }

  const isAdmin = () => hasRole('admin')
  const isBarber = () => hasRole('barber')
  const isClient = () => hasRole('client')

  const canAccess = (requiredRoles: ('admin' | 'barber' | 'client')[]) => {
    return hasAnyRole(requiredRoles)
  }

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isBarber,
    isClient,
    canAccess,
    userRole: user?.user_metadata?.role || 'client',
  }
}

// Componente para renderizar conteúdo baseado em permissões
interface PermissionGateProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'barber' | 'client'
  requiredRoles?: ('admin' | 'barber' | 'client')[]
  fallback?: React.ReactNode
}

export function PermissionGate({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
}: PermissionGateProps) {
  const { hasRole, hasAnyRole } = usePermissions()

  let hasPermission = true

  if (requiredRole) {
    hasPermission = hasRole(requiredRole)
  }

  if (requiredRoles && requiredRoles.length > 0) {
    hasPermission = hasAnyRole(requiredRoles)
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}