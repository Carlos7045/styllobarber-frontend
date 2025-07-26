'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { TestTube, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface TestResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
}

export function AuthFlowTester() {
  const { user, profile, loading, isAuthenticated, initialized, refreshProfile } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const runAuthFlowTest = async () => {
    setIsRunning(true)
    setTestResults([])

    // Teste 1: Verificar inicialização
    addResult({
      step: '1. Inicialização',
      status: initialized ? 'success' : 'error',
      message: initialized ? 'Sistema inicializado' : 'Sistema não inicializado',
      data: { initialized }
    })

    // Teste 2: Verificar loading
    addResult({
      step: '2. Loading State',
      status: !loading ? 'success' : 'warning',
      message: loading ? 'Ainda carregando' : 'Carregamento concluído',
      data: { loading }
    })

    // Teste 3: Verificar autenticação
    addResult({
      step: '3. Autenticação',
      status: isAuthenticated ? 'success' : 'error',
      message: isAuthenticated ? 'Usuário autenticado' : 'Usuário não autenticado',
      data: { isAuthenticated, hasUser: !!user }
    })

    // Teste 4: Verificar dados do usuário
    if (user) {
      addResult({
        step: '4. Dados do Usuário',
        status: 'success',
        message: `Usuário: ${user.email}`,
        data: {
          id: user.id,
          email: user.email,
          metadataRole: user.user_metadata?.role
        }
      })
    } else {
      addResult({
        step: '4. Dados do Usuário',
        status: 'error',
        message: 'Usuário não encontrado',
        data: null
      })
    }

    // Teste 5: Verificar perfil
    if (profile) {
      addResult({
        step: '5. Perfil do Usuário',
        status: 'success',
        message: `Perfil: ${profile.nome} (${profile.role})`,
        data: {
          id: profile.id,
          nome: profile.nome,
          role: profile.role,
          email: profile.email
        }
      })
    } else {
      addResult({
        step: '5. Perfil do Usuário',
        status: 'warning',
        message: 'Perfil não carregado',
        data: null
      })

      // Tentar recarregar perfil
      if (user) {
        try {
          await refreshProfile()
          addResult({
            step: '5.1. Refresh Profile',
            status: 'success',
            message: 'Perfil recarregado com sucesso',
            data: null
          })
        } catch (error) {
          addResult({
            step: '5.1. Refresh Profile',
            status: 'error',
            message: `Erro ao recarregar perfil: ${error}`,
            data: { error }
          })
        }
      }
    }

    // Teste 6: Verificar role efetivo
    const userRole = profile?.role || user?.user_metadata?.role || 'client'
    addResult({
      step: '6. Role Efetivo',
      status: userRole !== 'unknown' ? 'success' : 'warning',
      message: `Role: ${userRole}`,
      data: {
        profileRole: profile?.role,
        metadataRole: user?.user_metadata?.role,
        effectiveRole: userRole
      }
    })

    // Teste 7: Verificar permissões para dashboard
    const requiredRoles = ['admin', 'barber', 'client']
    const hasPermission = requiredRoles.includes(userRole as any)
    addResult({
      step: '7. Verificação de Permissões',
      status: hasPermission ? 'success' : 'error',
      message: hasPermission ? 'Acesso permitido ao dashboard' : 'Acesso negado ao dashboard',
      data: {
        userRole,
        requiredRoles,
        hasPermission
      }
    })

    // Teste 8: Simulação do RouteGuard
    const shouldAllowAccess = initialized && !loading && isAuthenticated && user && hasPermission
    addResult({
      step: '8. Simulação RouteGuard',
      status: shouldAllowAccess ? 'success' : 'error',
      message: shouldAllowAccess ? 'RouteGuard deveria permitir acesso' : 'RouteGuard deveria negar acesso',
      data: {
        initialized,
        loading,
        isAuthenticated,
        hasUser: !!user,
        hasPermission,
        shouldAllowAccess
      }
    })

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
    }
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 max-w-md bg-white/95 backdrop-blur max-h-96 overflow-y-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Auth Flow Tester
          <Button
            size="sm"
            variant="ghost"
            onClick={runAuthFlowTest}
            disabled={isRunning}
            className="ml-auto p-1 h-6 w-6"
          >
            <Play className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {testResults.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Clique no botão play para executar os testes
          </div>
        )}

        {testResults.map((result, index) => (
          <div key={index} className="flex items-start gap-2 p-2 rounded border">
            {getStatusIcon(result.status)}
            <div className="flex-1">
              <div className="font-medium">{result.step}</div>
              <div className={`text-xs ${getStatusColor(result.status)}`}>
                {result.message}
              </div>
              {result.data && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Ver dados
                  </summary>
                  <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}

        {isRunning && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-gold mx-auto"></div>
            <div className="text-xs text-gray-500 mt-1">Executando testes...</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}