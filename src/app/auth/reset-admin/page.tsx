'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/api/supabase'

export default function ResetAdminPage() {
  const [email, setEmail] = useState('chpsalgado@hotmail.com')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar se chegou via link de reset
  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    
    if (tokenHash && type === 'recovery') {
      console.log('🔗 Link de reset detectado, indo para etapa de senha')
      setStep('password')
      setMessage('Link de reset válido! Defina sua nova senha abaixo.')
    }
  }, [searchParams])

  const sendResetEmail = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      console.log('🔄 Enviando email de reset para:', email)
      
      // Configurações de redirect para testar
      const redirectConfigs = [
        `${window.location.origin}/auth/reset-admin`,
        `http://localhost:3000/auth/reset-admin`,
        `https://qekicxjdhehwzisjpupt.supabase.co/auth/v1/verify`
      ]
      
      let success = false
      let lastError = null
      
      for (const redirectTo of redirectConfigs) {
        try {
          console.log('🧪 Testando redirect:', redirectTo)
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo
          })
          
          if (!error) {
            success = true
            console.log('✅ Email enviado com sucesso para:', redirectTo)
            break
          } else {
            lastError = error
            console.log('❌ Erro com redirect:', redirectTo, error.message)
          }
        } catch (err) {
          lastError = err
          console.log('❌ Erro inesperado:', err)
        }
      }
      
      if (success) {
        setMessage(`
          ✅ Email de recuperação enviado para ${email}!
          
          📧 Verifique sua caixa de entrada e spam
          ⏰ O email pode demorar até 5 minutos para chegar
          🔗 Clique no link do email para continuar
          
          Ou aguarde aqui - a página será atualizada automaticamente quando você clicar no link.
        `)
        
        // Verificar sessão a cada 5 segundos
        const interval = setInterval(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            console.log('✅ Sessão detectada, indo para etapa de senha')
            clearInterval(interval)
            setStep('password')
            setMessage('Sessão ativa detectada! Defina sua nova senha.')
          }
        }, 5000)
        
        // Limpar interval após 10 minutos
        setTimeout(() => clearInterval(interval), 600000)
        
      } else {
        setError(lastError?.message || 'Erro ao enviar email. Verifique se o email está correto.')
      }
    } catch (err) {
      console.error('❌ Erro geral:', err)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      console.log('🔄 Atualizando senha...')
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error)
        setError(`Erro ao atualizar senha: ${error.message}`)
      } else {
        console.log('✅ Senha atualizada com sucesso')
        setMessage('🎉 Senha atualizada com sucesso! Redirecionando para o login...')
        
        // Fazer logout para limpar sessão
        await supabase.auth.signOut()
        
        setTimeout(() => {
          router.push('/auth/login?message=Senha atualizada com sucesso!')
        }, 3000)
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err)
      setError('Erro ao atualizar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📊 Verificação de sessão:', !!session)
      
      if (session) {
        setStep('password')
        setMessage('✅ Sessão ativa detectada! Você pode definir uma nova senha.')
        setError('')
      } else {
        setMessage('❌ Nenhuma sessão ativa encontrada. Clique no link do email primeiro.')
      }
    } catch (err) {
      console.error('❌ Erro ao verificar sessão:', err)
      setError('Erro ao verificar sessão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Reset Admin - StylloBarber
            </h1>
            <p className="text-gray-400 text-sm">
              Recuperação de senha para administradores
            </p>
          </div>

          {error && (
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm whitespace-pre-line">{message}</p>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email do Administrador
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="chpsalgado@hotmail.com"
                />
              </div>

              <button
                onClick={sendResetEmail}
                disabled={loading || !email}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Enviando Email...' : 'Enviar Email de Reset'}
              </button>

              <div className="text-center space-y-2">
                <button
                  onClick={checkSession}
                  disabled={loading}
                  className="text-yellow-500 hover:text-yellow-400 text-sm"
                >
                  Verificar Sessão Ativa
                </button>
                
                <div className="text-xs text-gray-500">
                  Clique acima se já clicou no link do email
                </div>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm">
                  <strong>✅ Pronto para definir nova senha!</strong><br/>
                  Sua sessão está ativa e você pode definir uma nova senha segura.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Atualizando Senha...' : 'Definir Nova Senha'}
              </button>

              <button
                onClick={() => {
                  setStep('email')
                  setMessage('')
                  setError('')
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            </div>
          )}

          <div className="mt-6 text-center space-y-2">
            <a
              href="/auth/login"
              className="block text-yellow-500 hover:text-yellow-400 text-sm"
            >
              ← Voltar para Login
            </a>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>🔧 Outras opções de reset:</div>
              <div>
                <a href="/auth/reset-simple" className="text-gray-400 hover:text-gray-300">
                  Reset Simples
                </a>
                {' | '}
                <a href="/auth/manual-reset" className="text-gray-400 hover:text-gray-300">
                  Reset Manual
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}