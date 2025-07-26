'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'
import { isLogoutInProgress, forceLogout, clearAuthLocalData } from '@/lib/auth-utils'

export function LogoutDebugger() {
  const { user, profile, session, isAuthenticated } = useAuth()
  const [logoutInProgress, setLogoutInProgress] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Atualizar estado a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoutInProgress(isLogoutInProgress())
      setDebugInfo({
        hasUser: !!user,
        hasProfile: !!profile,
        hasSession: !!session,
        isAuthenticated,
        timestamp: new Date().toLocaleTimeString(),
        localStorage: {
          logoutInProgress: sessionStorage.getItem('logout-in-progress'),
          hasAuthToken: !!localStorage.getItem('supabase.auth.token'),
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [user, profile, session, isAuthenticated])

  const handleForceLogout = () => {
    if (confirm('Tem certeza que deseja forçar o logout? Isso irá limpar todos os dados e redirecionar.')) {
      forceLogout()
    }
  }

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados locais?')) {
      clearAuthLocalData()
      sessionStorage.removeItem('logout-in-progress')
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Logout Debugger
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status do Logout */}
        <div className="flex items-center gap-2">
          {logoutInProgress ? (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600">Logout em andamento</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Sistema normal</span>
            </>
          )}
        </div>

        {/* Estado da Autenticação */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">Estado da Auth:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Usuário:</span>
                <span className={debugInfo.hasUser ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.hasUser ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Perfil:</span>
                <span className={debugInfo.hasProfile ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.hasProfile ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sessão:</span>
                <span className={debugInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.hasSession ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Autenticado:</span>
                <span className={debugInfo.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.isAuthenticated ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Storage:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Logout Flag:</span>
                <span className={debugInfo.localStorage?.logoutInProgress ? 'text-orange-600' : 'text-gray-600'}>
                  {debugInfo.localStorage?.logoutInProgress || 'null'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Auth Token:</span>
                <span className={debugInfo.localStorage?.hasAuthToken ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.localStorage?.hasAuthToken ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Usuário */}
        {profile && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Usuário Atual:</h4>
            <div className="text-sm space-y-1">
              <div>Nome: {profile.nome}</div>
              <div>Email: {profile.email}</div>
              <div>Role: {profile.role}</div>
              <div>ID: {profile.id}</div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500">
          Última atualização: {debugInfo.timestamp}
        </div>

        {/* Ações de Debug */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleForceLogout}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Forçar Logout
          </Button>
          
          <Button
            onClick={handleClearData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar Dados
          </Button>
        </div>

        {/* Aviso */}
        {logoutInProgress && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Logout em andamento</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Se o logout estiver travado, use "Forçar Logout" para resolver.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}