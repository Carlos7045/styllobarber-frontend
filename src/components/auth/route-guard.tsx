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
  requiredRole?: 'admin' | 'barber' | 'client' | 'saas_owner'
  requiredRoles?: ('admin' | 'barber' | 'client' | 'saas_owner')[]
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
  const { user, profile, loading, isAuthenticated, initialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Verificar autorização quando o usuário ou rota mudar
  useEffect(() => {
    console.log('🔄 RouteGuard useEffect iniciado:', {
      initialized,
      loading,
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      pathname,
      currentAuthorized: isAuthorized,
      hasRedirected
    })

    // Reset do estado de redirecionamento quando a rota muda
    if (hasRedirected) {
      setHasRedirected(false)
    }

    // Aguardar inicialização completa
    if (!initialized) {
      console.log('⏳ Aguardando inicialização...')
      setIsAuthorized(null)
      return
    }

    // Se ainda está carregando, aguardar
    if (loading) {
      console.log('⏳ Aguardando carregamento...')
      setIsAuthorized(null)
      return
    }

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated || !user) {
      if (!hasRedirected) {
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`
        console.log('🔐 Usuário não autenticado, redirecionando para:', loginUrl)
        setHasRedirected(true)
        router.push(loginUrl)
      }
      return
    }

    // Se não há restrições de role, usuário está autorizado
    if (!requiredRole && !requiredRoles) {
      console.log('✅ Sem restrições de role, acesso liberado')
      setIsAuthorized(true)
      return
    }

    // Aguardar perfil carregar se necessário (mas não indefinidamente)
    if (user && !profile && !user.user_metadata?.role) {
      console.log('⏳ Aguardando perfil carregar...')
      setIsAuthorized(null)
      return
    }

    // Obter role do usuário (priorizar profile, fallback para user_metadata)
    const userRole = profile?.role || user?.user_metadata?.role || 'client'

    console.log('🔍 RouteGuard verificando permissões:', {
      userRole,
      requiredRole,
      requiredRoles,
      hasProfile: !!profile,
      profileRole: profile?.role,
      metadataRole: user?.user_metadata?.role,
      userId: user?.id,
      userEmail: user?.email,
      pathname
    })

    // Verificar se o usuário tem o role necessário
    let hasPermission = false

    if (requiredRole) {
      hasPermission = userRole === requiredRole
      console.log(`🔐 Verificando role específico: ${userRole} === ${requiredRole} = ${hasPermission}`)
    }

    if (requiredRoles && requiredRoles.length > 0) {
      hasPermission = requiredRoles.includes(userRole as 'admin' | 'barber' | 'client' | 'saas_owner')
      console.log(`🔐 Verificando roles permitidos: ${userRole} in [${requiredRoles.join(', ')}] = ${hasPermission}`)
    }

    console.log('🔐 Resultado FINAL da verificação de permissão:', {
      hasPermission,
      userRole,
      requiredRole,
      requiredRoles,
      willAuthorize: hasPermission,
      currentIsAuthorized: isAuthorized,
      willChangeState: isAuthorized !== hasPermission
    })

    // Só atualizar o estado se realmente mudou
    if (isAuthorized !== hasPermission) {
      console.log(`🔄 Mudando isAuthorized de ${isAuthorized} para ${hasPermission}`)
      setIsAuthorized(hasPermission)
    }

    // Se não tem permissão e não deve mostrar tela de não autorizado, redirecionar
    if (!hasPermission && !showUnauthorized && !hasRedirected) {
      console.log('🚫 Redirecionando para fallback:', fallbackUrl)
      setHasRedirected(true)
      router.push(fallbackUrl)
    }
  }, [user, profile, loading, isAuthenticated, initialized, requiredRole, requiredRoles, pathname, router, fallbackUrl, showUnauthorized, hasRedirected])

  // Log do estado final antes de renderizar
  console.log('🎯 RouteGuard - Estado final antes de renderizar:', {
    initialized,
    loading,
    isAuthorized,
    willShowLoading: !initialized || loading || isAuthorized === null,
    willShowUnauthorized: isAuthorized === false && showUnauthorized,
    willShowChildren: isAuthorized === true
  })

  // Mostrar loading enquanto verifica autenticação
  if (!initialized || loading || isAuthorized === null) {
    console.log('📺 Renderizando AuthLoadingScreen')
    return <AuthLoadingScreen />
  }

  // Se não está autorizado, mostrar tela de acesso negado
  if (isAuthorized === false) {
    console.log('📺 Renderizando UnauthorizedScreen')
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
  console.log('📺 Renderizando children (conteúdo autorizado)')
  return <>{children}</>
}

// Hook para verificar permissões
export function usePermissions() {
  const { user, profile, isAuthenticated } = useAuth()

  const hasRole = (role: 'admin' | 'barber' | 'client' | 'saas_owner') => {
    if (!isAuthenticated || !user) return false
    const userRole = profile?.role || user.user_metadata?.role || 'client'
    return userRole === role
  }

  const hasAnyRole = (roles: ('admin' | 'barber' | 'client' | 'saas_owner')[]) => {
    if (!isAuthenticated || !user) return false
    const userRole = profile?.role || user.user_metadata?.role || 'client'
    return roles.includes(userRole as 'admin' | 'barber' | 'client' | 'saas_owner')
  }

  const isAdmin = () => hasRole('admin')
  const isBarber = () => hasRole('barber')
  const isClient = () => hasRole('client')
  const isSaasOwner = () => hasRole('saas_owner')

  const canAccess = (requiredRoles: ('admin' | 'barber' | 'client' | 'saas_owner')[]) => {
    return hasAnyRole(requiredRoles)
  }

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isBarber,
    isClient,
    isSaasOwner,
    canAccess,
    userRole: profile?.role || user?.user_metadata?.role || 'client',
  }
}

// Componente para renderizar conteúdo baseado em permissões
interface PermissionGateProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'barber' | 'client' | 'saas_owner'
  requiredRoles?: ('admin' | 'barber' | 'client' | 'saas_owner')[]
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