/**
 * Formulário para cadastro de funcionários (apenas admins)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus } from 'lucide-react'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth, type SignUpData } from '@/hooks/use-auth'
import { schemaCadastro, type DadosCadastro } from '@/lib/validations'
import { cn, formatarTelefone } from '@/lib/utils'

interface CreateEmployeeFormProps {
  onSuccess?: (employee: any) => void
  onCancel?: () => void
  className?: string
  barbeariaId: string
}

export function CreateEmployeeForm({ 
  onSuccess, 
  onCancel, 
  className, 
  barbeariaId 
}: CreateEmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const { createEmployee, loading } = useAuth()

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
      
      const result = await createEmployee({
        ...data,
        barbeariaId
      })

      if (result.success) {
        setMessage(result.message || 'Funcionário cadastrado com sucesso!')
        setMessageType('success')
        reset()
        onSuccess?.(result.user)
      } else {
        setMessage(result.error?.message || 'Erro ao cadastrar funcionário')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro no cadastro de funcionário:', error)
      setMessage('Erro inesperado ao cadastrar funcionário')
      setMessageType('error')
    }
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-primary-gold flex items-center justify-center gap-2">
          <UserPlus className="h-6 w-6" />
          Cadastrar Funcionário
        </CardTitle>
        <p className="text-text-secondary">
          Adicione um novo funcionário à sua barbearia
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
            placeholder="Nome completo"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.nome?.message}
            disabled={loading}
          />

          {/* Campo Email */}
          <Input
            {...register('email')}
            type="email"
            placeholder="Email"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            disabled={loading}
          />

          {/* Campo Telefone */}
          <Input
            {...register('telefone')}
            type="tel"
            placeholder="Telefone"
            leftIcon={<Phone className="h-4 w-4" />}
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
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            onRightIconClick={() => setShowPassword(!showPassword)}
            error={errors.senha?.message}
            disabled={loading}
          />

          {/* Campo Confirmar Senha */}
          <Input
            {...register('confirmarSenha')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirmar senha"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmarSenha?.message}
            disabled={loading}
          />

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
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Funcionário
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}