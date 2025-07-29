'use client'

import { useAuth } from '@/hooks/use-auth'
import { useProfileSync } from '@/hooks/use-profile-sync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { User, CheckCircle, AlertTriangle, Calendar, Phone, Mail, Image } from 'lucide-react'

export function ProfileSummary() {
  const { user, profile, loading } = useAuth()
  const { isInSync, differences } = useProfileSync()

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-gold mr-2"></div>
          <span>Carregando perfil...</span>
        </CardContent>
      </Card>
    )
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-text-muted">Perfil não encontrado</p>
        </CardContent>
      </Card>
    )
  }

  const completionItems = [
    {
      key: 'nome',
      label: 'Nome',
      icon: User,
      completed: !!profile.nome,
      value: profile.nome
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      completed: !!profile.email,
      value: profile.email
    },
    {
      key: 'telefone',
      label: 'Telefone',
      icon: Phone,
      completed: !!profile.telefone,
      value: profile.telefone
    },
    {
      key: 'data_nascimento',
      label: 'Data de Nascimento',
      icon: Calendar,
      completed: !!profile.data_nascimento,
      value: profile.data_nascimento ? new Date(profile.data_nascimento).toLocaleDateString('pt-BR') : null
    },
    {
      key: 'avatar_url',
      label: 'Foto de Perfil',
      icon: Image,
      completed: !!profile.avatar_url,
      value: profile.avatar_url ? 'Configurada' : null
    }
  ]

  const completedItems = completionItems.filter(item => item.completed).length
  const completionPercentage = Math.round((completedItems / completionItems.length) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Resumo do Perfil
          </div>
          
          <div className="flex items-center gap-2">
            {isInSync ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{differences.length} campo(s) dessincronizado(s)</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Perfil Completo</span>
            <span className="text-sm text-text-muted">{completedItems}/{completionItems.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-gold h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">{completionPercentage}% completo</p>
        </div>

        {/* Lista de itens - Responsiva */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 mb-6">
          {completionItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg transition-colors">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  item.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-background-dark-card text-gray-400 dark:text-gray-500'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
                    {item.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  {item.value && (
                    <p className="text-xs sm:text-sm text-text-muted truncate">{item.value}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Informações adicionais - Responsiva */}
        <div className="pt-4 border-t border-border-default">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-text-secondary block">Role:</span>
              <p className="text-text-muted">
                {profile.role === 'admin' ? 'Administrador' : 
                 profile.role === 'barber' ? 'Barbeiro' : 'Cliente'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-text-secondary block">Membro desde:</span>
              <p className="text-text-muted">
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}