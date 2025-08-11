'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/api/supabase'
import { ResetPasswordForm } from './reset-password-form'
import { NewPasswordForm } from './new-password-form'

export function ResetPasswordHandler() {
  const [mode, setMode] = useState<'loading' | 'request' | 'reset' | 'expired'>('loading')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const checkResetMode = async () => {
      // Log de todos os parâmetros da URL para debug
      const allParams = Object.fromEntries(searchParams.entries())
      console.log('🔍 Todos os parâmetros da URL:', allParams)
      console.log('🌐 URL completa:', window.location.href)
      console.log('🔗 Hash:', window.location.hash)
      
      // Verificar se há parâmetros de erro na URL
      const error = searchParams.get('error')
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      
      // Se há erro, verificar se é link expirado
      if (error) {
        console.log('❌ Erro detectado na URL:', { error, errorCode, errorDescription })
        
        // Log adicional para debug
        const currentTime = new Date().toISOString()
        console.log('🕐 Timestamp atual:', currentTime)
        console.log('📧 Possível problema: Link pode estar sendo gerado incorretamente')
        
        // Se é link expirado, mostrar mensagem específica
        if (error === 'access_denied' && errorCode === 'otp_expired') {
          console.log('⚠️ ATENÇÃO: Link marcado como expirado imediatamente - possível problema de configuração')
          setMode('expired')
          return
        }
        
        // Outros erros, mostrar formulário de solicitação
        setMode('request')
        return
      }

      // Verificar se há tokens de acesso (indicando que é um link válido)
      let accessToken = searchParams.get('access_token')
      let refreshToken = searchParams.get('refresh_token')
      let type = searchParams.get('type')
      const tokenHash = searchParams.get('token_hash')

      console.log('🔑 Verificando diferentes formatos de token:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        hasTokenHash: !!tokenHash,
        type,
        tokenHashLength: tokenHash?.length || 0
      })

      // Se não encontrou nos query params, verificar no hash (alguns emails podem usar isso)
      if (!accessToken && window.location.hash) {
        console.log('🔍 Verificando tokens no hash fragment...')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        accessToken = hashParams.get('access_token')
        refreshToken = hashParams.get('refresh_token')
        type = hashParams.get('type')
        
        console.log('🔑 Tokens do hash:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        })
      }

      // Verificar se é formato PKCE (apenas token_hash)
      if (tokenHash && !accessToken) {
        console.log('🔐 Detectado formato PKCE com token_hash, aguardando processamento automático...')
        
        // O Supabase processa automaticamente o token_hash quando a página carrega
        // Vamos aguardar esse processamento através do listener de auth state
        
        let timeoutId: NodeJS.Timeout
        
        const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state change durante processamento PKCE:', event, !!session)
          
          if (session) {
            console.log('✅ Sessão criada via processamento automático, modo reset')
            clearTimeout(timeoutId)
            unsubscribe.data.subscription.unsubscribe()
            
            // Limpar a URL dos tokens por segurança
            const cleanUrl = window.location.pathname
            router.replace(cleanUrl)
            
            setMode('reset')
          } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            // Aguardar um pouco mais se houve tentativa de refresh/signin
            console.log('🔄 Evento de auth detectado, aguardando...')
          }
        })
        
        // Timeout de segurança - se não processar em 5 segundos, considerar expirado
        timeoutId = setTimeout(() => {
          console.log('⏰ Timeout atingido, token provavelmente expirado')
          unsubscribe.data.subscription.unsubscribe()
          setMode('expired')
        }, 5000)
        
        return // Aguardar o processamento automático
      }

      console.log('🔑 Verificando tokens tradicionais:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        type,
        accessTokenLength: accessToken?.length || 0
      })

      if (accessToken && refreshToken && type === 'recovery') {
        console.log('✅ Tokens de recuperação detectados, configurando sessão...')
        
        try {
          // Configurar a sessão com os tokens do link
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          console.log('📊 Resultado da configuração de sessão:', { 
            hasData: !!data, 
            hasSession: !!data?.session,
            hasUser: !!data?.user,
            error: sessionError 
          })

          if (sessionError) {
            console.error('❌ Erro ao configurar sessão:', sessionError)
            setMode('request')
            return
          }

          if (data.session) {
            console.log('✅ Sessão configurada com sucesso, modo reset')
            
            // Limpar a URL dos tokens por segurança
            const cleanUrl = window.location.pathname
            router.replace(cleanUrl)
            
            setMode('reset')
          } else {
            console.log('⚠️ Sessão não configurada, modo request')
            setMode('request')
          }
        } catch (error) {
          console.error('❌ Erro inesperado ao configurar sessão:', error)
          setMode('request')
        }
      } else {
        // Verificar se há algum indicativo de que veio de um link de email
        const hasAnyToken = accessToken || refreshToken || tokenHash
        const hasTypeParam = type === 'recovery' || type === 'signup'
        const hasErrorParams = error || errorCode
        
        // Se há qualquer indicativo de link de email mas tokens inválidos/expirados
        if (hasAnyToken || hasTypeParam || hasErrorParams) {
          console.log('⚠️ Possível link de email com tokens inválidos/expirados')
          console.log('📋 Detalhes completos:', {
            accessToken: accessToken ? `presente (${accessToken.length} chars)` : 'ausente',
            refreshToken: refreshToken ? `presente (${refreshToken.length} chars)` : 'ausente',
            tokenHash: tokenHash ? `presente (${tokenHash.length} chars)` : 'ausente',
            type: type || 'ausente',
            error: error || 'ausente',
            errorCode: errorCode || 'ausente',
            errorDescription: errorDescription || 'ausente'
          })
          
          // Se há token_hash mas chegou até aqui, significa que falhou
          if (tokenHash) {
            console.log('🚨 PROBLEMA IDENTIFICADO: Token hash presente mas processamento falhou')
            console.log('💡 Possíveis causas:')
            console.log('   1. Configuração incorreta no painel Supabase')
            console.log('   2. URL de redirect não autorizada')
            console.log('   3. Token realmente expirado')
            console.log('   4. Método de verificação incorreto')
          }
        }
        
        // Não há tokens válidos, mostrar formulário de solicitação
        console.log('ℹ️ Nenhum token válido detectado, modo request')
        setMode('request')
      }
    }

    checkResetMode()
  }, [searchParams, router])

  if (mode === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-background-primary rounded-lg shadow-lg p-8 animate-pulse">
          <div className="text-center mb-6">
            <div className="h-8 bg-neutral-light-gray rounded mb-2" />
            <div className="h-4 bg-neutral-light-gray rounded w-3/4 mx-auto" />
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-neutral-light-gray rounded" />
            <div className="h-12 bg-neutral-light-gray rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return <NewPasswordForm />
  }

  if (mode === 'expired') {
    return <ExpiredLinkMessage />
  }

  return <ResetPasswordForm />
}

// Componente para mostrar quando o link expirou
function ExpiredLinkMessage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-primary rounded-lg shadow-lg p-8 border border-red-500/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading text-red-500 mb-2">
            Link Expirado
          </h2>
          <p className="text-text-muted">
            O link de recuperação de senha expirou. Links de reset são válidos por apenas 1 hora por motivos de segurança.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <h4 className="font-medium text-info mb-2">O que fazer agora:</h4>
            <ol className="text-sm text-text-muted space-y-1 list-decimal list-inside">
              <li>Clique no botão abaixo para solicitar um novo link</li>
              <li>Verifique seu email (pode demorar alguns minutos)</li>
              <li>Clique no novo link rapidamente (válido por 1 hora)</li>
              <li>Defina sua nova senha</li>
            </ol>
          </div>

          <button
            onClick={() => window.location.href = '/auth/reset-password'}
            className="w-full bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Solicitar Novo Link
          </button>

          <div className="text-center">
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para o login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}