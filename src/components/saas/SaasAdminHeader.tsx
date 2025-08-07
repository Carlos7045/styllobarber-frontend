
'use client'
/**
 * Header do painel administrativo do SaaS Owner
 */


import { Bell, Settings, User, LogOut, Crown } from 'lucide-react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Button, Badge } from '@/shared/components/ui'

export function SaasAdminHeader() {
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="bg-white dark:bg-secondary-graphite-light border-b border-gray-200 dark:border-secondary-graphite-card/30 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo e Título */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Crown className="h-8 w-8 text-primary-gold" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              StylloBarber
            </h1>
            <p className="text-xs text-text-muted">
              Painel Administrativo SaaS
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            variant="error" 
            className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            3
          </Badge>
        </Button>

        {/* Configurações */}
        <Button variant="ghost" size="sm">
          <Settings className="h-5 w-5" />
        </Button>

        {/* Divisor */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Perfil do usuário */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">
              {profile?.nome || user?.email}
            </p>
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-primary-gold" />
              <p className="text-xs text-text-muted">
                SaaS Owner
              </p>
            </div>
          </div>
          
          <div className="w-8 h-8 bg-primary-gold/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-gold" />
          </div>
        </div>

        {/* Logout */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
