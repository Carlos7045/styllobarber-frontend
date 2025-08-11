'use client'

import { useState } from 'react'
import { supabase } from '@/lib/api/supabase'

export default function TestSupabasePage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])

    try {
      // Teste 1: Verificar conexão
      console.log('🧪 Teste 1: Verificar conexão com Supabase')
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        addResult('Conexão Supabase', !error, error || 'Conectado com sucesso')
      } catch (err) {
        addResult('Conexão Supabase', false, err)
      }

      // Teste 2: Verificar usuário admin
      console.log('🧪 Teste 2: Verificar usuário admin')
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('email', 'chpsalgado@hotmail.com')
          .single()
        
        addResult('Usuário Admin', !error && data, data || error)
      } catch (err) {
        addResult('Usuário Admin', false, err)
      }

      // Teste 3: Verificar auth.users
      console.log('🧪 Teste 3: Verificar auth.users')
      try {
        const { data, error } = await supabase.rpc('get_auth_user', {
          user_email: 'chpsalgado@hotmail.com'
        })
        
        addResult('Auth Users', !error, data || error)
      } catch (err) {
        // Fallback: tentar query direta
        try {
          const { data, error } = await supabase
            .from('auth.users')
            .select('id, email, email_confirmed_at')
            .eq('email', 'chpsalgado@hotmail.com')
            .single()
          
          addResult('Auth Users (direto)', !error, data || error)
        } catch (err2) {
          addResult('Auth Users', false, 'Não foi possível acessar auth.users')
        }
      }

      // Teste 4: Testar reset de senha
      console.log('🧪 Teste 4: Testar reset de senha')
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          'chpsalgado@hotmail.com',
          {
            redirectTo: `${window.location.origin}/auth/reset-admin`
          }
        )
        
        addResult('Reset Password', !error, error || 'Email enviado com sucesso')
      } catch (err) {
        addResult('Reset Password', false, err)
      }

      // Teste 5: Verificar sessão atual
      console.log('🧪 Teste 5: Verificar sessão atual')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        addResult('Sessão Atual', !error, {
          hasSession: !!session,
          user: session?.user?.email || 'Nenhum usuário logado',
          error
        })
      } catch (err) {
        addResult('Sessão Atual', false, err)
      }

      // Teste 6: Verificar configurações do projeto
      console.log('🧪 Teste 6: Verificar configurações')
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const projectKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      addResult('Configurações', true, {
        url: projectUrl,
        keyPrefix: projectKey?.substring(0, 20) + '...',
        origin: window.location.origin
      })

    } catch (err) {
      addResult('Erro Geral', false, err)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6">
            🧪 Teste Supabase - StylloBarber
          </h1>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Executando Testes...' : 'Executar Testes'}
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Limpar Resultados
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Resultados dos Testes:</h2>
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-600/10 border-green-600/20'
                      : 'bg-red-600/10 border-red-600/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.test}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>
                  
                  <pre className={`text-sm overflow-x-auto ${
                    result.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center space-y-2">
            <a
              href="/auth/reset-admin"
              className="block text-yellow-500 hover:text-yellow-400 text-sm"
            >
              → Ir para Reset Admin
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