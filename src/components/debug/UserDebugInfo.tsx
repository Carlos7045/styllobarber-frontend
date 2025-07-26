/**
 * Componente de debug para mostrar informações do usuário
 * Temporário para ajudar a identificar o problema
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Bug } from 'lucide-react'

export function UserDebugInfo() {
  const { user, profile } = useAuth()
  const { permissions, isSaasOwner, isDeveloper } = useMonitoringPermissions(
    profile?.role || 'client', 
    profile
  )

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Bug className="h-5 w-5" />
          Debug Info - Usuário Atual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-orange-800">User (Supabase Auth):</h4>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify({
                id: user?.id,
                email: user?.email,
                user_metadata: user?.user_metadata,
                app_metadata: user?.app_metadata
              }, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-orange-800">Profile (Database):</h4>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-orange-800">Permissions:</h4>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify({
                isSaasOwner: isSaasOwner(),
                isDeveloper: isDeveloper(),
                permissions
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-100 p-3 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">Verificações:</h4>
            <div className="space-y-1 text-xs">
              <div>Nome inclui 'Carlos Henrique': {profile?.nome?.includes('Carlos Henrique') ? '✅' : '❌'}</div>
              <div>Nome inclui 'Carlos' e 'Salgado': {(profile?.nome?.includes('Carlos') && profile?.nome?.includes('Salgado')) ? '✅' : '❌'}</div>
              <div>Email carlos@styllobarber.com: {profile?.email === 'carlos@styllobarber.com' ? '✅' : '❌'}</div>
              <div>Email carlos7045@gmail.com: {profile?.email === 'carlos7045@gmail.com' ? '✅' : '❌'}</div>
              <div>Email inclui 'carlos': {profile?.email?.includes('carlos') ? '✅' : '❌'}</div>
              <div>ID inclui 'CAR': {profile?.id?.includes('CAR') ? '✅' : '❌'}</div>
              <div>Role é 'saas_owner': {profile?.role === 'saas_owner' ? '✅' : '❌'}</div>
              <div>Environment é 'development': {process.env.NODE_ENV === 'development' ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}