'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

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

  // Handler para logout
  const handleLogout = async () => {
    setIsOpen(false)
    try {
      console.log('🔄 Iniciando logout via UserMenu...')
      const result = await signOut()
      if (result.success) {
        console.log('✅ Logout bem-sucedido, redirecionando...')
        router.push('/login')
      } else {
        console.error('❌ Erro no logout:', result.error)
        // Mesmo com erro, redirecionar para login
        router.push('/login')
      }
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error)
      // Forçar redirecionamento mesmo com erro
      router.push('/login')
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
          'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-gold',
          isOpen && 'bg-background-secondary'
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
        <div className="absolute right-0 top-full mt-2 w-56 bg-background-primary border border-border-default rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border-default">
            <p className="text-sm font-medium text-text-primary">
              {userName}
            </p>
            <p className="text-xs text-text-muted">
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
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors"
            >
              <User className="h-4 w-4" />
              Meu Perfil
            </button>

            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-border-default py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-semantic-error hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}