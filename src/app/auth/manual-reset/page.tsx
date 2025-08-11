'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api/supabase'

export default function ManualResetPage() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const sendResetEmail = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/manual-reset?step=code`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Email enviado! Verifique sua caixa de entrada.')
        setStep('code')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Código verificado! Agora defina sua nova senha.')
        setStep('password')
      }
    } catch (err) {
      setError('Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Senha atualizada com sucesso! Redirecionando...')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err) {
      setError('Erro ao atualizar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Reset Manual de Senha
          </h1>

          {error && (
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
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
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Email
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Digite o código de 6 dígitos enviado para {email}
                </p>
              </div>

              <button
                onClick={verifyCode}
                disabled={loading || !code}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                onClick={() => setStep('email')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-yellow-500 hover:text-yellow-400 text-sm"
            >
              ← Voltar para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}