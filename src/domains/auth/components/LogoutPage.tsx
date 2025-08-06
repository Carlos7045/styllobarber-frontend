'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogOut, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

import { useAuth } from '@/domains/auth/hooks/use-auth'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { clearAuthLocalData, prepareForLogout, finalizeLogout } from '@/lib/api/auth-utils'

type LogoutState = 'idle' | 'logging-out' | 'success' | 'error'

export function LogoutPage() {
  const { signOut, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [logoutState, setLogoutState] = useState<LogoutState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  // Parâmetros da URL
  const auto = searchParams.get('auto') === 'true'
  const redirectTo = searchParams.get('redirect') || '/login'
  const reason = searchParams.get('reason')

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      setLogoutState('logging-out')
      setErrorMessage(null)

      console.log('🔄 Iniciando logout da página...')

      // Preparar ambiente
      await prepareForLogout()

      // Fazer logout
      const result = await signOut()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao fazer logout')
      }

      // Limpar dados locais
      clearAuthLocalData()

      setLogoutState('success')
      console.log('✅ Logout realizado com sucesso')

      // Iniciar countdown para redirecionamento
      startCountdown()

    } catch (error) {
      console.error('❌ Erro no logout:', error)
      
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      setErrorMessage(message)
      setLogoutState('error')

      // Mesmo com erro, limpar dados e redirecionar após um tempo
      clearAuthLocalData()
      
      // Remover flag de logout
      sessionStorage.removeItem('logout-in-progress')
      
      setTimeout(() => {
        window.location.replace(redirectTo)
      }, 3000)
    }
  }

  // Função para iniciar countdown
  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.replace(redirectTo)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Logout automático quando a página carrega
  useEffect(() => {
    if (auto && isAuthenticated && !loading) {
      handleLogout()
    }
  }, [auto, isAuthenticated, loading])

  // Se não está autenticado, redirecionar
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [loading, isAuthenticated, redirectTo, router])

  // Função para obter mensagem baseada no motivo
  const getReasonMessage = () => {
    switch (reason) {
      case 'session-expired':
        return 'Sua sessão expirou. Por favor, faça login novamente.'
      case 'security':
        return 'Por motivos de segurança, você foi desconectado.'
      case 'inactivity':
        return 'Você foi desconectado por inatividade.'
      case 'forced':
        return 'Logout forçado pelo sistema.'
      default:
        return null
    }
  }

  // Renderizar estados diferentes
  const renderContent = () => {
    switch (logoutState) {
      case 'logging-out':
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary-gold" />
            <h2 className="text-xl font-semibold mb-2">Fazendo logout...</h2>
            <p className="text-text-muted">
              Aguarde enquanto encerramos sua sessão com segurança.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <h2 className="text-xl font-semibold mb-2">Logout realizado!</h2>
            <p className="text-text-muted mb-4">
              Você foi desconectado com sucesso.
            </p>
            <p className="text-sm text-text-muted">
              Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-error" />
            <h2 className="text-xl font-semibold mb-2">Erro no logout</h2>
            <p className="text-text-muted mb-4">
              {errorMessage || 'Ocorreu um erro ao fazer logout.'}
            </p>
            <p className="text-sm text-text-muted mb-4">
              Seus dados locais foram limpos por segurança.
            </p>
            <Button
              onClick={() => router.replace(redirectTo)}
              className="w-full"
            >
              Ir para Login
            </Button>
          </div>
        )

      default:
        return (
          <div className="text-center">
            <LogOut className="h-12 w-12 mx-auto mb-4 text-primary-gold" />
            <h2 className="text-xl font-semibold mb-2">Sair do Sistema</h2>
            
            {getReasonMessage() && (
              <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                <p className="text-sm text-warning-dark">
                  {getReasonMessage()}
                </p>
              </div>
            )}
            
            <p className="text-text-muted mb-6">
              Tem certeza que deseja sair do StylloBarber?
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-error hover:bg-error-dark text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Confirmar Logout
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )
    }
  }

  // Não renderizar nada se ainda está carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-black via-neutral-dark-gray to-primary-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary-gold">
            StylloBarber
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
