'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { User, Shield, RefreshCw, AlertTriangle } from 'lucide-react'

export function UserRoleDebugger() {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile()
      console.log('🔄 Perfil atualizado')
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
    }
  }

  const userRole = profile?.role || user?.user_metadata?.role || 'unknown'
  const hasRoleConflict = profile?.role && user?.user_metadata?.role && 
                         profile.role !== user.user_metadata.role

  return (
    <Card className="fixed top-4 left-4 z-50 max-w-sm bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Role Debugger
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefreshProfile}
            className="ml-auto p-1 h-6 w-6"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Autenticado:</span>
            <span className={`ml-1 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated ? 'Sim' : 'Não'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Loading:</span>
            <span className={`ml-1 ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
              {loading ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>

        {user && (
          <div className="space-y-1">
            <div>
              <span className="font-medium">User ID:</span>
              <span className="ml-1 font-mono text-xs">{user.id.slice(0, 8)}...</span>
            </div>
            
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-1">{user.email}</span>
            </div>
            
            <div>
              <span className="font-medium">Metadata Role:</span>
              <span className={`ml-1 px-1 rounded text-xs ${
                user.user_metadata?.role ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.user_metadata?.role || 'undefined'}
              </span>
            </div>
          </div>
        )}

        {profile && (
          <div className="space-y-1">
            <div>
              <span className="font-medium">Profile Role:</span>
              <span className={`ml-1 px-1 rounded text-xs ${
                profile.role ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {profile.role || 'undefined'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Nome:</span>
              <span className="ml-1">{profile.nome}</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div>
            <span className="font-medium">Role Efetivo:</span>
            <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
              userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
              userRole === 'barber' ? 'bg-blue-100 text-blue-800' :
              userRole === 'client' ? 'bg-green-100 text-green-800' :
              userRole === 'saas_owner' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {userRole}
            </span>
          </div>
        </div>

        {hasRoleConflict && (
          <div className="pt-2 border-t border-red-200 bg-red-50 p-2 rounded">
            <div className="flex items-center gap-1 text-red-700">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium text-xs">Conflito de Role!</span>
            </div>
            <div className="text-xs text-red-600 mt-1">
              Profile: {profile?.role} ≠ Metadata: {user?.user_metadata?.role}
            </div>
          </div>
        )}

        {!profile && user && (
          <div className="pt-2 border-t border-yellow-200 bg-yellow-50 p-2 rounded">
            <div className="flex items-center gap-1 text-yellow-700">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium text-xs">Perfil não carregado</span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Usuário autenticado mas perfil não foi carregado
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-gray-500">
          <div>Dashboard: {userRole === 'saas_owner' ? '/saas-admin' : '/dashboard'}</div>
          <div>Acesso: {['admin', 'barber', 'client'].includes(userRole) ? '✅ Dashboard' : '❌ Negado'}</div>
        </div>
      </CardContent>
    </Card>
  )
}