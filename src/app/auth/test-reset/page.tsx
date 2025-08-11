'use client'

import { useState } from 'react'
import { supabase } from '@/lib/api/supabase'

export default function TestResetPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testReset = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testando reset com configurações diferentes...')
      
      // Teste 1: Configuração atual
      console.log('📧 Teste 1: Configuração atual')
      const result1 = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      console.log('📊 Resultado 1:', result1)

      // Teste 2: Sem redirectTo
      console.log('📧 Teste 2: Sem redirectTo')
      const result2 = await supabase.auth.resetPasswordForEmail(email)
      
      console.log('📊 Resultado 2:', result2)

      // Teste 3: Com URL diferente
      console.log('📧 Teste 3: Com URL diferente')
      const result3 = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password?test=true`,
      })
      
      console.log('📊 Resultado 3:', result3)

      setResult({
        test1: result1,
        test2: result2,
        test3: result3,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setResult({ error: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Teste Reset Password
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email do Admin SaaS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                placeholder="admin@exemplo.com"
              />
            </div>

            <button
              onClick={testReset}
              disabled={loading || !email}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testando...' : 'Executar Testes'}
            </button>

            {result && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-white font-medium mb-2">Resultados:</h3>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-center">
              <a
                href="/auth/reset-password"
                className="text-yellow-500 hover:text-yellow-400 text-sm"
              >
                ← Voltar para Reset Normal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}