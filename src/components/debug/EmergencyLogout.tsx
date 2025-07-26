/**
 * Botão de logout de emergência para casos onde o logout normal falha
 */

'use client'

import { Button } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'

export function EmergencyLogout() {
  const handleEmergencyLogout = () => {
    try {
      console.log('🚨 Emergency logout initiated...')
      
      // Limpar localStorage
      localStorage.clear()
      
      // Limpar sessionStorage
      sessionStorage.clear()
      
      // Limpar cookies (se possível)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })
      
      // Forçar reload da página
      window.location.href = '/login?message=emergency-logout'
      
    } catch (error) {
      console.error('Erro no emergency logout:', error)
      // Último recurso
      window.location.reload()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEmergencyLogout}
      className="border-red-500 text-red-600 hover:bg-red-50"
    >
      <AlertTriangle className="h-4 w-4 mr-2" />
      Logout de Emergência
    </Button>
  )
}