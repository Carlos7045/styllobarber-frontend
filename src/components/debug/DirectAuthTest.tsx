'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DirectAuthTest() {
  const auth = useAuth()
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }
    // Simular exatamente o que o RouteGuard faz
    const runTest = () => {
      const { user, profile, loading, isAuthenticated, initialized } = auth
      
      console.log('🧪 DirectAuthTest - Estado atual:', {
        initialized,
        loading,
        isAuthenticated,
        hasUser: !!user,
        hasProfile: !!profile,
        userRole: profile?.role || user?.user_metadata?.role || 'client'
      })

      // Condições do RouteGuard
      if (!initialized) {
        setTestResult('❌ Não inicializado')
        return
      }

      if (loading) {
        setTestResult('⏳ Carregando...')
        return
      }

      if (!isAuthenticated || !user) {
        setTestResult('❌ Não autenticado')
        return
      }

      // Verificar role
      const requiredRoles = ['admin', 'barber', 'client']
      const userRole = profile?.role || user?.user_metadata?.role || 'client'
      const hasPermission = requiredRoles.includes(userRole as 'admin' | 'barber' | 'client')

      if (!hasPermission) {
        setTestResult(`❌ Role ${userRole} não permitido`)
        return
      }

      setTestResult('✅ DEVERIA PERMITIR ACESSO')
    }

    runTest()
  }, [auth])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const runManualTest = () => {
    const { user, profile, loading, isAuthenticated, initialized } = auth
    
    console.log('🔍 Teste Manual - Estado completo:', {
      initialized,
      loading,
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      } : null,
      profile: profile ? {
        id: profile.id,
        nome: profile.nome,
        role: profile.role,
        email: profile.email
      } : null
    })

    // Teste de permissão direta
    const requiredRoles = ['admin', 'barber', 'client']
    const userRole = profile?.role || user?.user_metadata?.role || 'client'
    const hasPermission = requiredRoles.includes(userRole as 'admin' | 'barber' | 'client')

    console.log('🔍 Teste de Permissão:', {
      userRole,
      requiredRoles,
      hasPermission,
      profileRole: profile?.role,
      metadataRole: user?.user_metadata?.role
    })

    // Simular condições do RouteGuard
    const shouldAllow = initialized && !loading && isAuthenticated && user && hasPermission

    console.log('🔍 Resultado Final:', {
      shouldAllow,
      conditions: {
        initialized,
        notLoading: !loading,
        isAuthenticated,
        hasUser: !!user,
        hasPermission
      }
    })

    alert(`Resultado: ${shouldAllow ? 'DEVERIA PERMITIR' : 'DEVERIA NEGAR'}\n\nVer console para detalhes`)
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-xs bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Direct Auth Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="p-2 rounded border">
          <div className="font-medium mb-1">Resultado Automático:</div>
          <div className={`${testResult.includes('✅') ? 'text-green-600' : 
                          testResult.includes('⏳') ? 'text-yellow-600' : 'text-red-600'}`}>
            {testResult}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={runManualTest}
          className="w-full text-xs"
        >
          Executar Teste Manual
        </Button>

        <div className="text-xs text-gray-500">
          Simula exatamente a lógica do RouteGuard
        </div>
      </CardContent>
    </Card>
  )
}