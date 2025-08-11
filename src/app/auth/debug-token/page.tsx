'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/api/supabase'

export default function DebugTokenPage() {
  const [results, setResults] = useState<any[]>([])
  const searchParams = useSearchParams()

  useEffect(() => {
    const debugToken = async () => {
      const allParams = Object.fromEntries(searchParams.entries())
      const tokenHash = searchParams.get('token_hash')
      
      console.log('🔍 Debug Token - Parâmetros:', allParams)
      
      const newResults = []
      
      // Resultado 1: Parâmetros da URL
      newResults.push({
        test: 'Parâmetros da URL',
        result: allParams,
        status: Object.keys(allParams).length > 0 ? 'success' : 'empty'
      })

      if (tokenHash) {
        // Teste 1: verifyOtp
        try {
          console.log('🧪 Testando verifyOtp...')
          const result1 = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          })
          
          newResults.push({
            test: 'verifyOtp',
            result: {
              hasData: !!result1.data,
              hasSession: !!result1.data?.session,
              hasUser: !!result1.data?.user,
              error: result1.error
            },
            status: result1.error ? 'error' : 'success'
          })
        } catch (error) {
          newResults.push({
            test: 'verifyOtp',
            result: { error: error instanceof Error ? error.message : 'Unknown error' },
            status: 'error'
          })
        }

        // Teste 2: getSession atual
        try {
          console.log('🧪 Testando getSession...')
          const result2 = await supabase.auth.getSession()
          
          newResults.push({
            test: 'getSession',
            result: {
              hasSession: !!result2.data?.session,
              hasUser: !!result2.data?.session?.user,
              error: result2.error
            },
            status: result2.error ? 'error' : 'success'
          })
        } catch (error) {
          newResults.push({
            test: 'getSession',
            result: { error: error instanceof Error ? error.message : 'Unknown error' },
            status: 'error'
          })
        }

        // Teste 3: Informações do token
        newResults.push({
          test: 'Análise do Token',
          result: {
            tokenLength: tokenHash.length,
            tokenPrefix: tokenHash.substring(0, 10),
            tokenSuffix: tokenHash.substring(tokenHash.length - 10),
            isPKCE: tokenHash.includes('pkce_'),
            currentTime: new Date().toISOString(),
            userAgent: navigator.userAgent
          },
          status: 'info'
        })
      }

      setResults(newResults)
    }

    debugToken()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6">
            Debug Token - Análise Detalhada
          </h1>
          
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-medium text-white">
                    {result.test}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-600 text-white' :
                    result.status === 'error' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/auth/reset-password"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Voltar para Reset Password
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}