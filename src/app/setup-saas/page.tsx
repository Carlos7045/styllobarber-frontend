'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, User, Mail, Lock, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { AuthFeedback, useAuthFeedback } from '@/components/auth/AuthFeedback'
import { ButtonLoading } from '@/components/auth/AuthLoadingState'
import { useFieldValidation, validationRules, ValidationDisplay, PasswordStrength } from '@/components/auth/AuthValidation'
import { supabase } from '@/lib/supabase'

export default function SetupSaasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nome: 'Carlos Henrique Pereira Salgado',
    email: 'carlos.salgado@styllobarber.com',
    telefone: '(11) 99999-9999',
    senha: 'StyLLo2024!',
    confirmarSenha: 'StyLLo2024!'
  })

  // Hook para feedback visual
  const { 
    feedback, 
    showSuccess, 
    showError, 
    showWarning,
    hideFeedback 
  } = useAuthFeedback()

  // Validações em tempo real
  const emailValidation = useFieldValidation([
    validationRules.email.required,
    validationRules.email.format
  ])

  const passwordValidation = useFieldValidation([
    validationRules.password.required,
    validationRules.password.minLength,
    validationRules.password.hasUppercase,
    validationRules.password.hasNumber
  ])

  const confirmPasswordValidation = useFieldValidation([
    validationRules.confirmPassword(formData.senha).required,
    validationRules.confirmPassword(formData.senha).match
  ])

  const nameValidation = useFieldValidation([
    validationRules.name.required,
    validationRules.name.minLength
  ])

  // Verificar se já existe um SaaS Owner
  const checkExistingSaasOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nome')
        .eq('role', 'saas_owner')
        .limit(1)

      if (error) {
        console.warn('Erro ao verificar SaaS Owner existente:', error)
        return null
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.warn('Erro inesperado ao verificar SaaS Owner:', error)
      return null
    }
  }

  // Criar usuário SaaS Owner
  const createSaasOwner = async () => {
    try {
      setLoading(true)
      hideFeedback()

      console.log('🔧 Iniciando criação do SaaS Owner...')
      console.log('📧 Email:', formData.email)
      console.log('👤 Nome:', formData.nome)
      console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO')
      console.log('🔑 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'NÃO CONFIGURADO')

      // Verificar se já existe um SaaS Owner
      console.log('🔍 Verificando se já existe SaaS Owner...')
      const existingSaasOwner = await checkExistingSaasOwner()
      if (existingSaasOwner) {
        console.log('⚠️ SaaS Owner já existe:', existingSaasOwner)
        showWarning(`Já existe um SaaS Owner: ${existingSaasOwner.nome} (${existingSaasOwner.email})`)
        return
      }

      console.log('✅ Nenhum SaaS Owner existente encontrado')

      // Criar usuário no Supabase Auth
      console.log('🔧 Criando usuário no Supabase Auth...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            telefone: formData.telefone,
            role: 'saas_owner'
          }
        },
      })

      console.log('📊 Resultado do Auth:', {
        hasData: !!authData,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError)
        console.error('❌ Código do erro:', authError.status)
        console.error('❌ Detalhes completos:', JSON.stringify(authError, null, 2))
        
        // Tentar método alternativo via RPC
        console.log('🔄 Tentando método alternativo via RPC...')
        
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_saas_owner_complete', {
            p_email: formData.email,
            p_password: formData.senha,
            p_nome: formData.nome,
            p_telefone: formData.telefone
          })
          
          if (rpcError) {
            console.error('❌ Erro na RPC alternativa:', rpcError)
            throw new Error(rpcError.message)
          }
          
          if (rpcData?.success) {
            console.log('✅ SaaS Owner criado via RPC alternativa:', rpcData)
            setSuccess(true)
            showSuccess('SaaS Owner criado com sucesso! (método alternativo)')
            
            setTimeout(() => {
              router.push('/login?message=saas-owner-created')
            }, 3000)
            return
          } else {
            throw new Error(rpcData?.error || 'Erro desconhecido na RPC')
          }
        } catch (rpcErr) {
          console.error('❌ Falha no método alternativo:', rpcErr)
        }
        
        // Mensagens de erro mais específicas se ambos os métodos falharam
        let errorMessage = authError.message
        if (authError.message?.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Use outro email ou faça login.'
        } else if (authError.message?.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.'
        } else if (authError.message?.includes('Password')) {
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.'
        } else if (authError.message?.includes('Signup is disabled')) {
          errorMessage = 'Cadastro está desabilitado. Tentativa alternativa também falhou.'
        } else if (authError.message?.includes('Email confirmations are enabled')) {
          errorMessage = 'Confirmação de email está habilitada. Tentativa alternativa também falhou.'
        }
        
        showError(`Erro ao criar usuário: ${errorMessage}`)
        return
      }

      if (!authData?.user) {
        console.error('❌ Nenhum usuário retornado do Auth')
        showError('Usuário não foi criado corretamente')
        return
      }

      const userId = authData.user.id
      console.log('✅ Usuário criado no Auth:', userId)

      // Aguardar um pouco para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Criar perfil na tabela profiles
      console.log('🔧 Criando perfil na tabela profiles...')
      const profileData = {
        id: userId,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: 'saas_owner' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📝 Dados do perfil:', profileData)

      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single()

      console.log('📊 Resultado do perfil:', {
        hasData: !!insertedProfile,
        error: profileError
      })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        
        // Tentar criar sem upsert
        console.log('🔄 Tentando inserção simples...')
        const { data: simpleInsert, error: simpleError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single()

        if (simpleError) {
          console.error('❌ Erro na inserção simples:', simpleError)
          showError(`Erro ao criar perfil: ${simpleError.message}`)
          return
        }

        console.log('✅ Perfil criado com inserção simples:', simpleInsert)
      } else {
        console.log('✅ Perfil criado com upsert:', insertedProfile)
      }

      console.log('🎉 SaaS Owner criado com sucesso!')
      setSuccess(true)
      showSuccess('SaaS Owner criado com sucesso! Você pode fazer login agora.')

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login?message=saas-owner-created')
      }, 3000)

    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      showError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Atualizar campo e validação
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Atualizar validações
    switch (field) {
      case 'email':
        emailValidation.setValue(value)
        break
      case 'senha':
        passwordValidation.setValue(value)
        // Revalidar confirmação de senha quando senha muda
        if (formData.confirmarSenha) {
          confirmPasswordValidation.setValue(formData.confirmarSenha)
        }
        break
      case 'confirmarSenha':
        confirmPasswordValidation.setValue(value)
        break
      case 'nome':
        nameValidation.setValue(value)
        break
    }
  }

  // Verificar se formulário é válido
  const isFormValid = !emailValidation.hasErrors && 
                     !passwordValidation.hasErrors && 
                     !confirmPasswordValidation.hasErrors && 
                     !nameValidation.hasErrors &&
                     formData.nome && formData.email && formData.senha && formData.confirmarSenha

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-white">
              Setup SaaS Owner
            </CardTitle>
            <p className="text-gray-400">
              Criar usuário administrador do sistema
            </p>

            {/* Feedback visual */}
            <div className="mt-4">
              <AuthFeedback
                type={feedback.type}
                message={feedback.message}
                isVisible={feedback.isVisible}
                onClose={hideFeedback}
                autoClose={feedback.type !== 'email'}
                duration={feedback.type === 'success' ? 5000 : 7000}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  SaaS Owner Criado!
                </h3>
                <p className="text-gray-400 mb-4">
                  Redirecionando para login...
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-2 bg-green-500 rounded-full"
                  />
                </div>
              </motion.div>
            ) : (
              <>
                {/* Nome */}
                <div>
                  <Input
                    label="Nome Completo"
                    placeholder="Nome do SaaS Owner"
                    leftIcon={<User className="h-4 w-4" />}
                    value={formData.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    onBlur={nameValidation.onBlur}
                    disabled={loading}
                    required
                  />
                  <ValidationDisplay 
                    results={nameValidation.validationResults} 
                    showOnlyErrors={true}
                  />
                </div>

                {/* Email */}
                <div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@styllobarber.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={emailValidation.onBlur}
                    disabled={loading}
                    required
                  />
                  <ValidationDisplay 
                    results={emailValidation.validationResults} 
                    showOnlyErrors={true}
                  />
                </div>

                {/* Telefone */}
                <div>
                  <Input
                    label="Telefone"
                    placeholder="(11) 99999-9999"
                    leftIcon={<Phone className="h-4 w-4" />}
                    value={formData.telefone}
                    onChange={(e) => updateField('telefone', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Senha */}
                <div>
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="Senha segura"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={formData.senha}
                    onChange={(e) => updateField('senha', e.target.value)}
                    onBlur={passwordValidation.onBlur}
                    disabled={loading}
                    required
                  />
                  <ValidationDisplay 
                    results={passwordValidation.validationResults} 
                    showOnlyErrors={true}
                  />
                  <PasswordStrength password={formData.senha} />
                </div>

                {/* Confirmar Senha */}
                <div>
                  <Input
                    label="Confirmar Senha"
                    type="password"
                    placeholder="Confirme a senha"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={formData.confirmarSenha}
                    onChange={(e) => updateField('confirmarSenha', e.target.value)}
                    onBlur={confirmPasswordValidation.onBlur}
                    disabled={loading}
                    required
                  />
                  <ValidationDisplay 
                    results={confirmPasswordValidation.validationResults} 
                    showOnlyErrors={true}
                  />
                </div>

                {/* Botão de criar */}
                <Button
                  onClick={createSaasOwner}
                  className="w-full"
                  size="lg"
                  disabled={loading || !isFormValid}
                >
                  <ButtonLoading 
                    isLoading={loading}
                    loadingText="Criando SaaS Owner..."
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Criar SaaS Owner
                  </ButtonLoading>
                </Button>

                {/* Botão alternativo usando RPC */}
                <Button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      hideFeedback()
                      
                      console.log('🔧 Criando SaaS Owner via RPC...')
                      
                      const { data, error } = await supabase.rpc('create_saas_owner_complete', {
                        p_email: formData.email,
                        p_password: formData.senha,
                        p_nome: formData.nome,
                        p_telefone: formData.telefone
                      })
                      
                      console.log('📊 Resultado RPC:', { data, error })
                      
                      if (error) {
                        console.error('❌ Erro na RPC:', error)
                        showError(`Erro na função RPC: ${error.message}`)
                        return
                      }
                      
                      if (data?.success) {
                        console.log('✅ SaaS Owner criado via RPC:', data)
                        setSuccess(true)
                        showSuccess('SaaS Owner criado com sucesso via RPC!')
                        
                        setTimeout(() => {
                          router.push('/login?message=saas-owner-created')
                        }, 3000)
                      } else {
                        console.error('❌ Falha na criação via RPC:', data)
                        showError(`Erro: ${data?.error || 'Erro desconhecido'}`)
                      }
                    } catch (err) {
                      console.error('❌ Erro inesperado na RPC:', err)
                      showError('Erro inesperado na função RPC')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={loading || !isFormValid}
                >
                  🔧 Criar via RPC (Alternativo)
                </Button>

                {/* Informações */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Informações importantes:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Este usuário terá acesso total ao sistema</li>
                        <li>• Pode criar administradores de barbearias</li>
                        <li>• Acessa relatórios financeiros consolidados</li>
                        <li>• Gerencia todas as barbearias do sistema</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Link para login */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-400">
                    Já tem uma conta?{' '}
                    <button
                      onClick={() => router.push('/login')}
                      className="text-amber-400 hover:text-amber-300 font-medium"
                      disabled={loading}
                    >
                      Fazer Login
                    </button>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}