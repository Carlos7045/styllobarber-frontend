'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, AlertTriangle } from 'lucide-react'

import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui'
import { 
  clearAuthLocalData, 
  prepareForLogout, 
  shouldShowLogoutConfirmation,
  type LogoutOptions,
  DEFAULT_LOGOUT_OPTIONS
} from '@/lib/api/auth-utils'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  showText?: boolean
  showConfirmation?: boolean
  redirectTo?: string
  className?: string
  onLogoutStart?: () => void
  onLogoutComplete?: () => void
  onLogoutError?: (error: string) => void
}

export function LogoutButton({
  variant = 'ghost',
  size = 'sm',
  showText = true,
  showConfirmation = false,
  redirectTo = '/login',
  className = '',
  onLogoutStart,
  onLogoutComplete,
  onLogoutError,
}: LogoutButtonProps) {
  const { signOut, loading } = useAuth()
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Verificar se deve mostrar confirmação automaticamente
  const shouldConfirm = showConfirmation || shouldShowLogoutConfirmation()

  // Função principal de logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      onLogoutStart?.()

      console.log('🔄 Iniciando processo de logout...')

      // 1. Preparar ambiente para logout
      await prepareForLogout()

      // 2. Fazer logout no Supabase
      const result = await signOut()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao fazer logout')
      }

      console.log('✅ Logout do Supabase realizado')

      // 3. Limpar dados locais
      clearAuthLocalData()

      // 4. Callback de sucesso
      onLogoutComplete?.()

      console.log('✅ Logout concluído com sucesso')

      // 5. Redirecionamento
      // Usar replace para evitar que o usuário volte com o botão "voltar"
      router.replace(redirectTo)

    } catch (error) {
      console.error('❌ Erro no logout:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no logout'
      onLogoutError?.(errorMessage)
      
      // Mesmo com erro, tentar limpar dados locais e redirecionar
      clearAuthLocalData()
      
      // Mostrar erro para o usuário
      alert(`Erro no logout: ${errorMessage}`)
      
      // Redirecionar mesmo assim (logout forçado)
      router.replace(redirectTo)
    } finally {
      setIsLoggingOut(false)
      setShowConfirmDialog(false)
    }
  }

  // Função para iniciar logout (com ou sem confirmação)
  const initiateLogout = () => {
    if (shouldConfirm) {
      setShowConfirmDialog(true)
    } else {
      handleLogout()
    }
  }

  // Função para confirmar logout
  const confirmLogout = () => {
    setShowConfirmDialog(false)
    handleLogout()
  }

  // Função para cancelar logout
  const cancelLogout = () => {
    setShowConfirmDialog(false)
  }

  const isDisabled = loading || isLoggingOut

  return (
    <>
      {/* Botão de logout */}
      <Button
        variant={variant}
        size={size}
        onClick={initiateLogout}
        disabled={isDisabled}
        className={`${className} ${variant === 'ghost' ? 'text-error hover:text-error-dark hover:bg-error/10' : ''}`}
        title="Sair do sistema"
      >
        <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''} ${variant === 'ghost' ? 'text-error' : 'text-current'}`} />
        {showText && size !== 'icon' && (
          <span className="ml-2">
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </span>
        )}
      </Button>

      {/* Dialog de confirmação */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <h3 className="text-lg font-semibold text-text-primary">
                Confirmar Logout
              </h3>
            </div>
            
            <p className="text-text-muted mb-6">
              Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar sua conta.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-error hover:bg-error-dark text-white"
              >
                {isLoggingOut ? 'Saindo...' : 'Sim, Sair'}
              </Button>
              <Button
                variant="outline"
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Hook personalizado para logout programático
export function useLogout() {
  const { signOut } = useAuth()
  const router = useRouter()

  const logout = async (options?: {
    redirectTo?: string
    clearLocalData?: boolean
    onSuccess?: () => void
    onError?: (error: string) => void
  }) => {
    const {
      redirectTo = '/login',
      clearLocalData = true,
      onSuccess,
      onError
    } = options || {}

    try {
      // Fazer logout no Supabase
      const result = await signOut()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao fazer logout')
      }

      // Limpar dados locais se solicitado
      if (clearLocalData) {
        clearAuthLocalData()
      }

      // Callback de sucesso
      onSuccess?.()

      // Redirecionamento
      router.replace(redirectTo)

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado'
      onError?.(errorMessage)
      
      return { success: false, error: errorMessage }
    }
  }

  return { logout }
}
