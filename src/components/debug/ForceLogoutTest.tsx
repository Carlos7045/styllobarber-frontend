'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { LogOut, RefreshCw } from 'lucide-react'

export function ForceLogoutTest() {
  const { signOut } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleForceLogout = async () => {
    try {
      console.log('🔄 Forçando logout para limpar cache...')
      await signOut()
      
      // Limpar localStorage
      localStorage.clear()
      
      // Limpar sessionStorage
      sessionStorage.clear()
      
      // Recarregar página
      window.location.href = '/login'
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }

  const handleClearCacheAndReload = () => {
    console.log('🔄 Limpando cache e recarregando...')
    
    // Limpar localStorage
    localStorage.clear()
    
    // Limpar sessionStorage
    sessionStorage.clear()
    
    // Recarregar página
    window.location.reload()
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-xs bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Force Logout Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <Button
          size="sm"
          variant="outline"
          onClick={handleForceLogout}
          className="w-full text-xs"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Logout + Limpar Cache
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleClearCacheAndReload}
          className="w-full text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Limpar Cache + Reload
        </Button>

        <div className="text-xs text-gray-500 mt-2">
          Use se ainda aparecer "Acesso Negado"
        </div>
      </CardContent>
    </Card>
  )
}