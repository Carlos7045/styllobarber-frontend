'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, UserCheck } from 'lucide-react'

interface CriarFuncionarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const CriarFuncionarioModal: React.FC<CriarFuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'barber' as 'admin' | 'barber'
  })

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        role: 'barber'
      })
      setError(undefined)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios')
      return
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      // Verificar se email já existe na tabela profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single()

      // Se não houve erro ou o erro foi "not found", está ok
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar email existente:', checkError)
        setError('Erro ao verificar se email já existe')
        setLoading(false)
        return
      }

      if (existingProfile) {
        setError('Este email já está cadastrado no sistema')
        setLoading(false)
        return
      }

      // Criar usuário usando signup normal
      // O trigger handle_new_user criará automaticamente o perfil
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: 'bemvindo123', // Senha temporária
        options: {
          data: {
            nome: formData.nome.trim(),
            telefone: formData.telefone.trim() || null,
            role: formData.role
          }
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário:', authError)
        setError(`Erro ao criar usuário: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro: usuário não foi criado corretamente')
        setLoading(false)
        return
      }

      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verificar se o perfil foi criado corretamente
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileCheckError || !profileData) {
        console.error('Erro ao verificar perfil criado:', profileCheckError)
        setError('Funcionário criado, mas houve um problema na configuração do perfil. Verifique na lista de funcionários.')
      } else {
        console.log('Perfil criado com sucesso:', profileData)
      }

      // Sucesso!
      const emailStatus = authData.user.email_confirmed_at 
        ? 'Email confirmado automaticamente.' 
        : 'Email de confirmação enviado. O funcionário deve verificar sua caixa de entrada.'

      alert(`Funcionário criado com sucesso!\n\nCredenciais de acesso:\nEmail: ${formData.email}\nSenha: bemvindo123\n\nO funcionário deve alterar a senha no primeiro acesso.\n\n${emailStatus}`)
      
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Erro ao criar funcionário:', err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao criar funcionário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Criar Novo Funcionário</ModalTitle>
        </ModalHeader>

        <ModalContent className="space-y-4">
          <p className="text-text-secondary text-sm">
            Crie uma nova conta para funcionário. A senha padrão será <strong>bemvindo123</strong> e deve ser alterada no primeiro acesso.
          </p>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Nome Completo *
            </label>
            <Input
              leftIcon={<User className="h-4 w-4" />}
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome completo"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Email *
            </label>
            <Input
              leftIcon={<Mail className="h-4 w-4" />}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Digite o email"
              required
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Telefone
            </label>
            <Input
              leftIcon={<Phone className="h-4 w-4" />}
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Cargo *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'barber' }))}
              disabled={loading}
              className="w-full px-3 py-2 border border-border-default rounded-md bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent disabled:opacity-50"
              required
            >
              <option value="barber">Barbeiro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Informações sobre credenciais */}
          <div className="p-3 bg-primary-gold/10 border border-primary-gold/20 rounded-lg">
            <div className="flex items-start gap-2">
              <UserCheck className="h-4 w-4 text-primary-gold mt-0.5" />
              <div className="text-sm">
                <p className="text-text-primary font-medium">Credenciais de Acesso:</p>
                <p className="text-text-secondary">
                  • Email: {formData.email || 'será o email informado'}
                </p>
                <p className="text-text-secondary">
                  • Senha: <strong>bemvindo123</strong>
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  O funcionário deve alterar a senha no primeiro acesso.
                </p>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
            >
              Criar Funcionário
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default CriarFuncionarioModal