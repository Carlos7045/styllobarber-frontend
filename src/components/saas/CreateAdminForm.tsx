/**
 * Formulário para cadastro de administradores (apenas SaaS Owner)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, Crown, Building } from 'lucide-react'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth, type SignUpData } from '@/hooks/use-auth'
import { schemaCadastro, type DadosCadastro } from '@/lib/validations'
import { cn, formatarTelefone } from '@/lib/utils'

interface CreateAdminFormProps {
  onSuccess?: (admin: any) => void
  onCancel?: () => void
  className?: string
  barbeariaId?: string
}

export function CreateAdminForm({ 
  onSuccess, 
  onCancel, 
  className, 
  barbeariaId 
}: CreateAdminFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const { createAdmin, loading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<DadosCadastro>({
    resolver: zodResolver(schemaCadastro),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: ''
    }
  })

  const telefoneValue = watch('telefone')

  // Função para submeter o formulário
  const onSubmit = async (data: DadosCadastro) => {
    try {
      setMessage(null)
      
      const result = await createAdmin({
        ...data,
        barbeariaId
      })

      if (result.success) {
        setMessage(result.message || 'Administrador cadastrado com sucesso!')
        setMessageType('success')
        reset()
        onSuccess?.(result.user)
      } else {
        setMessage(result.error?.message || 'Erro ao cadastrar administrador')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro no cadastro de administrador:', error)
      setMessage('Erro inesperado ao cadastrar administrador')
      setMessageType('error')
    }
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-primary-gold flex items-center justify-center gap-2">
          <Crown className="h-6 w-6" />
          Cadastrar Administrador
        </CardTitle>
        <p className="text-text-muted">
          Crie uma conta de administrador para uma barbearia
        </p>
        
        {/* Mensagem de feedback */}
        {message && (
          <div className={cn(
            'mt-4 p-3 rounded-lg text-sm',
            messageType === 'success' && 'bg-green-50 text-green-700 border border-green-200',
            messageType === 'error' && 'bg-red-50 text-red-700 border border-red-200'
          )}>
            {message}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo Nome */}
          <Input
            {...register('nome')}
            type="text"
            placeholder="Nome completo do administrador"
            icon={User}
            error={errors.nome?.message}
            disabled={loading}
          />

          {/* Campo Email */}
          <Input
            {...register('email')}
            type="email"
            placeholder="Email do administrador"
            icon={Mail}
            error={errors.email?.message}
            disabled={loading}
          />

          {/* Campo Telefone */}
          <Input
            {...register('telefone')}
            type="tel"
            placeholder="Telefone"
            icon={Phone}
            value={telefoneValue}
            onChange={(e) => {
              const formatted = formatarTelefone(e.target.value)
              setValue('telefone', formatted)
            }}
            error={errors.telefone?.message}
            disabled={loading}
          />

          {/* Campo Senha */}
          <Input
            {...register('senha')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            icon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            error={errors.senha?.message}
            disabled={loading}
          />

          {/* Campo Confirmar Senha */}
          <Input
            {...register('confirmarSenha')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirmar senha"
            icon={Lock}
            rightIcon={showConfirmPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmarSenha?.message}
            disabled={loading}
          />

          {/* Info sobre privilégios */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Privilégios do Administrador:</p>
                <ul className="space-y-1">
                  <li>• Gerenciar funcionários da barbearia</li>
                  <li>• Visualizar agendamentos e relatórios</li>
                  <li>• Configurar serviços e preços</li>
                  <li>• Acesso completo ao sistema da barbearia</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              Cadastrar Admin
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}