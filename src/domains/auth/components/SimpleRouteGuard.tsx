'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Container } from '@/shared/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { Shield, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'

// Interface para as props do SimpleRouteGuard
interface SimpleRouteGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'barber' | 'client' | 'saas_owner'
  requiredRoles?: ('admin' | 'barber' | 'client' | 'saas_owner')[]
  fallbackUrl?: string
  showUnauthorized?: boolean
}

// Componente de loading
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary-gold mb-4" />
          <p className="text-text-muted">Verificando permissões...</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de acesso negado
function UnauthorizedScreen() {
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
                Você não tem permissão para acessar esta página.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
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

// Componente principal SimpleRouteGuard
export function SimpleRouteGuard({
  children,
  requiredRole,
  requiredRoles,
  fallbackUrl = '/dashboard',
  showUnauthorized = true,
}: SimpleRouteGuardProps) {
  const { user, profile, loading, isAuthenticated, initialized } = useAuth()
  const pathname = usePathname()
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized' | 'redirect'>('loading')

  useEffect(() => {
    // Verificar se logout está em andamento
    const logoutInProgress = typeof window !== 'undefined' && 
      sessionStorage.getItem('logout-in-progress') === 'true'
    
    if (logoutInProgress) {
      console.log('🔄 Logout em andamento, permitindo acesso temporário')
      setAuthState('authorized')
      return
    }

    // Aguardar inicialização
    if (!initialized || loading) {
      setAuthState('loading')
      return
    }

    // Se não está autenticado, redirecionar
    if (!isAuthenticated || !user) {
      console.log('🔐 Usuário não autenticado, redirecionando...')
      setAuthState('redirect')
      
      // Redirecionar após um pequeno delay
      setTimeout(() => {
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`
        window.location.replace(loginUrl)
      }, 100)
      return
    }

    // Se não há restrições de role, autorizar
    if (!requiredRole && !requiredRoles) {
      setAuthState('authorized')
      return
    }

    // Obter role do usuário
    const userRole = profile?.role || user?.user_metadata?.role || 'client'

    // Verificar permissões
    let hasPermission = false

    if (requiredRole) {
      hasPermission = userRole === requiredRole
    }

    if (requiredRoles && requiredRoles.length > 0) {
      hasPermission = requiredRoles.includes(userRole as any)
    }

    console.log('🔍 SimpleRouteGuard - Verificação de permissão:', {
      userRole,
      requiredRole,
      requiredRoles,
      hasPermission,
      pathname
    })

    if (hasPermission) {
      setAuthState('authorized')
    } else if (showUnauthorized) {
      setAuthState('unauthorized')
    } else {
      setAuthState('redirect')
      setTimeout(() => {
        window.location.replace(fallbackUrl)
      }, 100)
    }
  }, [user, profile, loading, isAuthenticated, initialized, requiredRole, requiredRoles, pathname, fallbackUrl, showUnauthorized])

  // Renderizar baseado no estado
  switch (authState) {
    case 'loading':
    case 'redirect':
      return <LoadingScreen />
    
    case 'unauthorized':
      return <UnauthorizedScreen />
    
    case 'authorized':
      return <>{children}</>
    
    default:
      return <LoadingScreen />
  }
}

export default SimpleRouteGuard
