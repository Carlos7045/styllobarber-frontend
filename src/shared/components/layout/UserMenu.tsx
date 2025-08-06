'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import { logoutManager } from '@/lib/logout-manager'

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handler para logout usando LogoutManager
  const handleLogout = async () => {
    setIsOpen(false)
    
    try {
      console.log('🔄 Iniciando logout via UserMenu...')
      
      // Verificar se logout já está em andamento
      if (logoutManager.isLogoutInProgress()) {
        console.log('⚠️ Logout já em andamento, ignorando...')
        return
      }
      
      // Usar LogoutManager para logout seguro
      await logoutManager.logoutAndRedirect()
      
    } catch (error) {
      console.error('❌ Erro no logout via UserMenu:', error)
      
      // Em caso de erro, forçar logout
      logoutManager.forceLogout()
    }
  }

  // Handler para ir ao perfil
  const handleProfile = () => {
    setIsOpen(false)
    router.push('/dashboard/perfil')
  }

  // Handler para configurações
  const handleSettings = () => {
    setIsOpen(false)
    router.push('/dashboard/configuracoes')
  }

  if (!user || !profile) {
    return null
  }

  const userName = profile.nome || user.email || 'Usuário'
  const userInitial = userName.charAt(0).toUpperCase()
  const userRole = profile.role === 'admin' ? 'Administrador' : 
                   profile.role === 'barber' ? 'Barbeiro' : 
                   profile.role === 'client' ? 'Cliente' :
                   profile.role === 'saas_owner' ? 'SaaS Owner' : 'Usuário'

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-colors',
          'hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 focus:outline-none focus:ring-2 focus:ring-primary-gold',
          isOpen && 'bg-primary-gold/10 dark:bg-primary-gold/20'
        )}
      >
        {/* Avatar */}
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`Avatar de ${userName}`}
              className="w-8 h-8 rounded-full object-cover border-2 border-primary-gold"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-gold rounded-full flex items-center justify-center border-2 border-primary-gold">
              <span className="text-xs font-semibold text-primary-black">
                {userInitial}
              </span>
            </div>
          )}
          
          {/* Status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background-primary" />
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-text-primary truncate max-w-32">
            {userName}
          </p>
          <p className="text-xs text-text-muted">
            {userRole}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={cn(
            'h-4 w-4 text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-secondary-graphite-light border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-secondary-graphite-card/30">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {user.email}
            </p>
            <p className="text-xs text-primary-gold font-medium mt-1">
              {userRole}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleProfile}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 transition-colors"
            >
              <User className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              Meu Perfil
            </button>

            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              Configurações
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-secondary-graphite py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
