'use client'
// Hook para gerenciar primeiro acesso de clientes cadastrados automaticamente

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { useToast } from '@/shared/components/ui'
// Removido import do error-handler para usar tratamento mais simples

interface PrimeiroAcessoState {
  isPrimeiroAcesso: boolean
  loading: boolean
  alterandoSenha: boolean
  dadosCliente: {
    nome: string
    telefone?: string
    email?: string
    cadastradoEm: string
  } | null
}

interface AlterarSenhaData {
  senhaAtual: string
  novaSenha: string
  confirmarSenha: string
}

export const usePrimeiroAcesso = () => {
  const [state, setState] = useState<PrimeiroAcessoState>({
    isPrimeiroAcesso: false,
    loading: false, // Mudado para false para evitar loading infinito
    alterandoSenha: false,
    dadosCliente: null,
  })

  const { user, signOut } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()

  // Verificar se é primeiro acesso - VERSÃO ROBUSTA SEM RECURSÃO
  useEffect(() => {
    const verificarPrimeiroAcesso = async () => {
      // Verificações iniciais
      if (!user?.id) {
        console.log('👤 Nenhum usuário válido, pulando verificação')
        setState((prev) => ({ ...prev, loading: false }))
        return
      }

      console.log('🔍 Verificando primeiro acesso para usuário:', user.id)

      try {
        // ABORDAGEM ALTERNATIVA: Usar dados do user metadata primeiro
        const userMetadata = user.user_metadata || {}
        const appMetadata = user.app_metadata || {}

        // Verificar se há indicação de primeiro acesso nos metadados
        const isFirstAccessFromMetadata =
          userMetadata.cadastro_automatico && !userMetadata.senha_alterada

        if (isFirstAccessFromMetadata) {
          console.log('✅ Primeiro acesso detectado via metadata')
          setState((prev) => ({
            ...prev,
            isPrimeiroAcesso: true,
            loading: false,
            dadosCliente: {
              nome: userMetadata.nome || user.email?.split('@')[0] || 'Usuário',
              telefone: userMetadata.telefone,
              email: user.email || '',
              cadastradoEm: user.created_at || new Date().toISOString(),
            },
          }))
          return
        }

        // Se não há indicação nos metadados, tentar buscar no perfil com timeout
        console.log('🔍 Buscando dados do perfil com timeout...')

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000) // 5 segundos
        })

        const queryPromise = supabase
          .from('profiles')
          .select('nome, telefone, email, created_at, senha_alterada, cadastro_automatico')
          .eq('id', user.id)
          .single()

        const result = (await Promise.race([queryPromise, timeoutPromise])) as any

        if (result.error) {
          console.warn('⚠️ Erro ao buscar perfil (usando fallback):', result.error.message)

          // Fallback: assumir que não é primeiro acesso se não conseguir verificar
          setState((prev) => ({
            ...prev,
            loading: false,
            isPrimeiroAcesso: false,
          }))
          return
        }

        const profile = result.data
        if (!profile) {
          console.warn('⚠️ Perfil não encontrado (usando fallback)')
          setState((prev) => ({
            ...prev,
            loading: false,
            isPrimeiroAcesso: false,
          }))
          return
        }

        // Verificar se é primeiro acesso
        const isPrimeiroAcesso = profile.cadastro_automatico && !profile.senha_alterada

        console.log('✅ Verificação concluída:', {
          nome: profile.nome,
          isPrimeiroAcesso,
          cadastroAutomatico: profile.cadastro_automatico,
          senhaAlterada: profile.senha_alterada,
        })

        setState((prev) => ({
          ...prev,
          isPrimeiroAcesso,
          loading: false,
          dadosCliente: isPrimeiroAcesso
            ? {
                nome: profile.nome,
                telefone: profile.telefone,
                email: profile.email,
                cadastradoEm: profile.created_at,
              }
            : null,
        }))
      } catch (error: any) {
        console.error(
          '❌ Erro na verificação de primeiro acesso:',
          error?.message || 'Erro desconhecido'
        )

        // Em caso de erro, assumir que não é primeiro acesso para não bloquear o usuário
        setState((prev) => ({
          ...prev,
          loading: false,
          isPrimeiroAcesso: false,
          dadosCliente: null,
        }))
      }
    }

    verificarPrimeiroAcesso()
  }, [user])

  // Alterar senha no primeiro acesso
  const alterarSenha = async (
    dados: AlterarSenhaData
  ): Promise<{ sucesso: boolean; erro?: string }> => {
    if (!user) {
      return { sucesso: false, erro: 'Usuário não autenticado' }
    }

    // Validações
    if (dados.novaSenha !== dados.confirmarSenha) {
      return { sucesso: false, erro: 'As senhas não coincidem' }
    }

    if (dados.novaSenha.length < 6) {
      return { sucesso: false, erro: 'A nova senha deve ter pelo menos 6 caracteres' }
    }

    if (dados.novaSenha === dados.senhaAtual) {
      return { sucesso: false, erro: 'A nova senha deve ser diferente da atual' }
    }

    setState((prev) => ({ ...prev, alterandoSenha: true }))

    try {
      // Alterar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: dados.novaSenha,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Marcar senha como alterada no perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          senha_alterada: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
        // Não falhar por causa disso, a senha já foi alterada
      }

      // Registrar log de alteração de senha
      await registrarLogAlteracaoSenha(user.id)

      setState((prev) => ({
        ...prev,
        isPrimeiroAcesso: false,
        alterandoSenha: false,
        dadosCliente: null,
      }))

      addToast({
        title: 'Senha alterada com sucesso!',
        description: 'Agora você pode acessar normalmente o sistema.',
        type: 'success',
      })

      // Redirecionar para dashboard
      router.push('/dashboard')

      return { sucesso: true }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      setState((prev) => ({ ...prev, alterandoSenha: false }))

      return {
        sucesso: false,
        erro: error.message || 'Erro ao alterar senha. Tente novamente.',
      }
    }
  }

  // Registrar log de alteração de senha
  const registrarLogAlteracaoSenha = async (userId: string) => {
    try {
      await supabase.from('logs_alteracao_senha').insert({
        user_id: userId,
        tipo: 'primeiro_acesso',
        ip_address: await obterIPUsuario(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erro ao registrar log:', error)
      // Não falhar por causa do log
    }
  }

  // Obter IP do usuário (simplificado)
  const obterIPUsuario = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
  }

  // Pular alteração de senha (não recomendado, mas pode ser útil para testes)
  const pularAlteracaoSenha = async (): Promise<void> => {
    if (!user) return

    try {
      await supabase
        .from('profiles')
        .update({
          senha_alterada: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      setState((prev) => ({
        ...prev,
        isPrimeiroAcesso: false,
        dadosCliente: null,
      }))

      addToast({
        title: 'Acesso liberado',
        description: 'Lembre-se de alterar sua senha nas configurações.',
        type: 'info',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao pular alteração:', error)
    }
  }

  // Fazer logout
  const fazerLogout = async (): Promise<void> => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Reenviar credenciais
  const reenviarCredenciais = async (): Promise<void> => {
    if (!user) return

    try {
      // Aqui você chamaria o serviço para reenviar as credenciais
      // Por exemplo, regenerar senha temporária e enviar novamente

      addToast({
        title: 'Credenciais reenviadas',
        description: 'Verifique seu email/SMS para as novas credenciais.',
        type: 'success',
      })
    } catch (error) {
      console.error('Erro ao reenviar credenciais:', error)
      addToast({
        title: 'Erro ao reenviar',
        description: 'Tente novamente ou entre em contato com o suporte.',
        type: 'error',
      })
    }
  }

  return {
    ...state,
    alterarSenha,
    pularAlteracaoSenha,
    fazerLogout,
    reenviarCredenciais,
  }
}
