'use client'

import { useState } from 'react'
import { supabase } from '@/lib/api/supabase'
import { useRouter } from 'next/navigation'

export default function ResetSQLPage() {
  const [email, setEmail] = useState('chpsalgado@hotmail.com')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const resetPasswordSQL = async () => {
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
      console.log('🔄 Resetando senha via SQL para:', email)
      
      // Tentar usar a função RPC criada
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        user_email: email,
        new_password: newPassword
      })

      if (error) {
        console.error('❌ Erro RPC:', error)
        setError(`Erro ao resetar senha: ${error.message}`)
      } else if (data?.error) {
        console.error('❌ Erro na função:', data.error)
        setError(data.error)
      } else {
        console.log('✅ Senha resetada com sucesso:', data)
        setMessage('🎉 Senha resetada com sucesso! Você pode fazer login agora.')
        
        setTimeout(() => {
          router.push('/auth/login?message=Senha resetada com sucesso!')
        }, 3000)
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err)
      setError('Erro inesperado ao resetar senha.')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      // Testar conexão básica
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .single()

      if (error) {
        setError(`Erro de conexão: ${error.message}`)
      } else if (data) {
        setMessage(`✅ Usuário encontrado: ${data.email} (${data.role})`)
      } else {
        setError('Usuário não encontrado.')
      }
    } catch (err) {
      setError('Erro ao testar conexão.')
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
              🛠️ Reset SQL - StylloBarber
            </h1>
            <p className="text-gray-400 text-sm">
              Reset direto via SQL (apenas para emergências)
            </p>
          </div>

          {error && (
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email do Usuário
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
              onClick={testConnection}
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testando...' : 'Testar Conexão'}
            </button>

            <div className="border-t border-gray-700 pt-4">
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

              <div className="mt-4">
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
                onClick={resetPasswordSQL}
                disabled={loading || !newPassword || !confirmPassword || !email}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Resetando Senha...' : '🛠️ Resetar Senha (SQL)'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <div className="text-xs text-yellow-400 bg-yellow-600/10 border border-yellow-600/20 rounded p-2">
              ⚠️ Esta é uma função de emergência que bypassa o sistema normal de autenticação.
              Use apenas se os outros métodos falharem.
            </div>
            
            <a
              href="/auth/reset-admin"
              className="block text-yellow-500 hover:text-yellow-400 text-sm"
            >
              ← Tentar Reset Normal
            </a>
            
            <a
              href="/auth/test-supabase"
              className="block text-blue-400 hover:text-blue-300 text-sm"
            >
              🧪 Executar Testes
            </a>
            
            <a
              href="/auth/login"
              className="block text-gray-400 hover:text-gray-300 text-sm"
            >
              ← Voltar para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}