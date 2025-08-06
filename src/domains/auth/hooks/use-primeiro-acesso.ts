// Hook para gerenciar primeiro acesso de clientes cadastrados automaticamente
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api/supabase'
import { useAuth } from './use-auth'
import { useToast } from '@/shared/components/ui'

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
    loading: true,
    alterandoSenha: false,
    dadosCliente: null
  })

  const { user, signOut } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()

  // Verificar se é primeiro acesso
  useEffect(() => {
    const verificarPrimeiroAcesso = async () => {
      if (!user) {
        setState(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        // Buscar dados do perfil
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nome, telefone, email, created_at, senha_alterada, cadastro_automatico')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar perfil:', error)
          setState(prev => ({ ...prev, loading: false }))
          return
        }

        // Verificar se é primeiro acesso (cadastro automático + senha não alterada)
        const isPrimeiroAcesso = profile.cadastro_automatico && !profile.senha_alterada

        setState(prev => ({
          ...prev,
          isPrimeiroAcesso,
          loading: false,
          dadosCliente: isPrimeiroAcesso ? {
            nome: profile.nome,
            telefone: profile.telefone,
            email: profile.email,
            cadastradoEm: profile.created_at
          } : null
        }))

      } catch (error) {
        console.error('Erro ao verificar primeiro acesso:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    verificarPrimeiroAcesso()
  }, [user])

  // Alterar senha no primeiro acesso
  const alterarSenha = async (dados: AlterarSenhaData): Promise<{ sucesso: boolean; erro?: string }> => {
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

    setState(prev => ({ ...prev, alterandoSenha: true }))

    try {
      // Alterar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: dados.novaSenha
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Marcar senha como alterada no perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          senha_alterada: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
        // Não falhar por causa disso, a senha já foi alterada
      }

      // Registrar log de alteração de senha
      await registrarLogAlteracaoSenha(user.id)

      setState(prev => ({
        ...prev,
        isPrimeiroAcesso: false,
        alterandoSenha: false,
        dadosCliente: null
      }))

      addToast({
        title: 'Senha alterada com sucesso!',
        description: 'Agora você pode acessar normalmente o sistema.',
        type: 'success'
      })

      // Redirecionar para dashboard
      router.push('/dashboard')

      return { sucesso: true }

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      setState(prev => ({ ...prev, alterandoSenha: false }))
      
      return { 
        sucesso: false, 
        erro: error.message || 'Erro ao alterar senha. Tente novamente.' 
      }
    }
  }

  // Registrar log de alteração de senha
  const registrarLogAlteracaoSenha = async (userId: string) => {
    try {
      await supabase
        .from('logs_alteracao_senha')
        .insert({
          user_id: userId,
          tipo: 'primeiro_acesso',
          ip_address: await obterIPUsuario(),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
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
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      setState(prev => ({
        ...prev,
        isPrimeiroAcesso: false,
        dadosCliente: null
      }))

      addToast({
        title: 'Acesso liberado',
        description: 'Lembre-se de alterar sua senha nas configurações.',
        type: 'info'
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
        type: 'success'
      })

    } catch (error) {
      console.error('Erro ao reenviar credenciais:', error)
      addToast({
        title: 'Erro ao reenviar',
        description: 'Tente novamente ou entre em contato com o suporte.',
        type: 'error'
      })
    }
  }

  return {
    ...state,
    alterarSenha,
    pularAlteracaoSenha,
    fazerLogout,
    reenviarCredenciais
  }
}