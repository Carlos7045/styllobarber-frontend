'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { User, AlertCircle, CheckCircle } from 'lucide-react'

export function SimpleAuthTest() {
  const { user, profile, loading, initialized, isAuthenticated } = useAuth()

  if (!initialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
          <span className="ml-2">Inicializando autenticação...</span>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
          <span className="ml-2">Carregando...</span>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Não Autenticado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Usuário não está autenticado. Redirecionando para login...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          Autenticação OK
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Dados do Usuário:</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div><strong>ID:</strong> {user?.id}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Criado em:</strong> {user?.created_at}</div>
          </div>
        </div>

        {profile ? (
          <div>
            <h4 className="font-medium mb-2">Dados do Perfil:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div><strong>Nome:</strong> {profile.nome}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Role:</strong> {profile.role}</div>
              <div><strong>Telefone:</strong> {profile.telefone || 'N/A'}</div>
              <div><strong>Criado em:</strong> {new Date(profile.created_at).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-medium mb-2 text-yellow-600">Perfil não carregado</h4>
            <p className="text-sm text-gray-600">
              O usuário está autenticado mas o perfil não foi carregado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}