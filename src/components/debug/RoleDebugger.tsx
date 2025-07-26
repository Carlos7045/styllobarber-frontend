/**
 * Componente para debugar roles e permissões
 * Só aparece em desenvolvimento
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Bug, User, Shield } from 'lucide-react'

export function RoleDebugger() {
  const { user, profile } = useAuth()

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50 mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Bug className="h-5 w-5" />
          Role Debugger (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
              <User className="h-4 w-4" />
              User (Supabase Auth)
            </h4>
            <div className="bg-white p-3 rounded border">
              <div><strong>ID:</strong> {user?.id || 'N/A'}</div>
              <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
              <div><strong>Metadata Role:</strong> {user?.user_metadata?.role || 'N/A'}</div>
              <div><strong>App Metadata:</strong> {JSON.stringify(user?.app_metadata || {})}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Profile (Database)
            </h4>
            <div className="bg-white p-3 rounded border">
              <div><strong>ID:</strong> {profile?.id || 'N/A'}</div>
              <div><strong>Nome:</strong> {profile?.nome || 'N/A'}</div>
              <div><strong>Email:</strong> {profile?.email || 'N/A'}</div>
              <div><strong>Role:</strong> {profile?.role || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
          <h4 className="font-medium text-yellow-800 mb-2">Verificações de Acesso:</h4>
          <div className="text-xs space-y-1">
            <div>✅ Nome inclui "Carlos Henrique": {profile?.nome?.includes('Carlos Henrique') ? 'SIM' : 'NÃO'}</div>
            <div>✅ Nome inclui "Salgado": {profile?.nome?.includes('Salgado') ? 'SIM' : 'NÃO'}</div>
            <div>✅ Email carlos@styllobarber.com: {profile?.email === 'carlos@styllobarber.com' ? 'SIM' : 'NÃO'}</div>
            <div>✅ Email carlos7045@gmail.com: {profile?.email === 'carlos7045@gmail.com' ? 'SIM' : 'NÃO'}</div>
            <div>✅ Role saas_owner: {profile?.role === 'saas_owner' ? 'SIM' : 'NÃO'}</div>
            <div>✅ Environment development: {process.env.NODE_ENV === 'development' ? 'SIM' : 'NÃO'}</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Para João (Cliente):</h4>
          <div className="text-xs">
            <div>• Não deve ver item "Monitoramento" no sidebar</div>
            <div>• Não deve conseguir acessar /monitoring</div>
            <div>• Deve ver apenas: Dashboard, Agendamentos, Histórico, Perfil</div>
            <div>• Role deve ser "client"</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}