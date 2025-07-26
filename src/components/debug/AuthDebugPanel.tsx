'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { authInterceptor } from '@/lib/auth-interceptor'
import { sessionManager } from '@/lib/session-manager'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react'

export function AuthDebugPanel() {
  const { user, profile, session, loading, initialized, isAuthenticated } = useAuth()
  const [circuitState, setCircuitState] = useState<string>('unknown')
  const [failureCount, setFailureCount] = useState(0)
  const [sessionHealth, setSessionHealth] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Atualizar informações de debug
  const updateDebugInfo = () => {
    setCircuitState(authInterceptor.getCircuitState())
    setFailureCount(authInterceptor.getFailureCount())
    setSessionHealth(sessionManager.getSessionHealth())
  }

  useEffect(() => {
    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 5000) // Atualizar a cada 5s
    return () => clearInterval(interval)
  }, [])

  // Função para forçar refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await sessionManager.refreshSession()
      updateDebugInfo()
    } catch (error) {
      console.error('Erro no refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Função para resetar circuit breaker
  const handleResetCircuit = () => {
    authInterceptor.resetCircuit()
    updateDebugInfo()
  }

  // Função para testar recovery
  const handleTestRecovery = async () => {
    try {
      const result = await sessionManager.recoverFromError()
      console.log('Teste de recovery:', result)
      updateDebugInfo()
    } catch (error) {
      console.error('Erro no teste de recovery:', error)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Activity className="h-4 w-4 text-yellow-500" />
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getCircuitColor = (state: string) => {
    switch (state) {
      case 'closed': return 'text-green-500'
      case 'open': return 'text-red-500'
      case 'half_open': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Debug de Autenticação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado da Autenticação */}
        <div>
          <h4 className="font-medium mb-3">Estado da Autenticação</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(initialized)}
              <span>Inicializado: {initialized ? 'Sim' : 'Não'}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(isAuthenticated)}
              <span>Autenticado: {isAuthenticated ? 'Sim' : 'Não'}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!loading)}
              <span>Loading: {loading ? 'Sim' : 'Não'}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!!profile)}
              <span>Perfil: {profile ? 'Carregado' : 'Não carregado'}</span>
            </div>
          </div>
        </div>

        {/* Informações do Usuário */}
        {user && (
          <div>
            <h4 className="font-medium mb-3">Informações do Usuário</h4>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.user_metadata?.role || 'N/A'}</div>
              {profile && (
                <>
                  <div><strong>Nome:</strong> {profile.nome}</div>
                  <div><strong>Telefone:</strong> {profile.telefone || 'N/A'}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Circuit Breaker */}
        <div>
          <h4 className="font-medium mb-3">Circuit Breaker</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  circuitState === 'closed' ? 'bg-green-500' : 
                  circuitState === 'open' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className={`font-medium ${getCircuitColor(circuitState)}`}>
                  {circuitState.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Falhas: {failureCount}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCircuit}
              disabled={circuitState === 'closed'}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Saúde da Sessão */}
        {sessionHealth && (
          <div>
            <h4 className="font-medium mb-3">Saúde da Sessão</h4>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(sessionHealth.isValid)}
                <span><strong>Válida:</strong> {sessionHealth.isValid ? 'Sim' : 'Não'}</span>
              </div>
              <div><strong>Última Validação:</strong> {new Date(sessionHealth.lastValidated).toLocaleString()}</div>
              <div><strong>Contagem de Erros:</strong> {sessionHealth.errorCount}</div>
              {sessionHealth.lastError && (
                <div className="text-red-600">
                  <strong>Último Erro:</strong> {sessionHealth.lastError.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações de Debug */}
        <div>
          <h4 className="font-medium mb-3">Ações de Debug</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Sessão
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestRecovery}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Testar Recovery
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Auth Debug Info:', {
                  user,
                  profile,
                  session,
                  loading,
                  initialized,
                  isAuthenticated,
                  circuitState,
                  failureCount,
                  sessionHealth
                })
              }}
            >
              Log Console
            </Button>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">
              <strong>Debug Mode:</strong> Este painel é apenas para desenvolvimento e deve ser removido em produção.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}