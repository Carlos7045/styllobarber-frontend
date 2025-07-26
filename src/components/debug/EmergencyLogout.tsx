'use client'

import { useState } from 'react'
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { logoutManager } from '@/lib/logout-manager'

export function EmergencyLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleEmergencyLogout = async () => {
    if (!confirm('Tem certeza que deseja fazer logout de emergência? Isso irá limpar todos os dados e redirecionar imediatamente.')) {
      return
    }

    setIsLoggingOut(true)
    
    try {
      console.log('🚨 Executando logout de emergência...')
      logoutManager.forceLogout()
    } catch (error) {
      console.error('❌ Erro no logout de emergência:', error)
      
      // Último recurso - redirecionamento direto
      window.location.href = '/login?emergency=true'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleNormalLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      console.log('🔄 Executando logout normal...')
      await logoutManager.logoutAndRedirect()
    } catch (error) {
      console.error('❌ Erro no logout normal:', error)
      logoutManager.forceLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Logout de Emergência
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <p className="text-sm text-gray-600">
          Use estas opções se o logout normal não estiver funcionando ou se você estiver preso em um loop.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleNormalLogout}
            disabled={isLoggingOut}
            className="w-full"
            variant="outline"
          >
            {isLoggingOut ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Logout Normal
          </Button>

          <Button
            onClick={handleEmergencyLogout}
            disabled={isLoggingOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoggingOut ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Logout de Emergência
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Logout Normal:</strong> Processo completo e seguro</p>
          <p><strong>Logout de Emergência:</strong> Força limpeza e redirecionamento imediato</p>
        </div>
      </CardContent>
    </Card>
  )
}