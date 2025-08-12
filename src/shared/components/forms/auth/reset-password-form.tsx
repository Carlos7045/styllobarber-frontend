'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Link as LinkIcon, Mail } from 'lucide-react'
import Link from 'next/link'
import { z } from 'zod'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/shared/utils'

// Schema de validação para recuperação de senha
const schemaRecuperarSenha = z.object({
  email: z.string().email('Email inválido'),
})

type DadosRecuperarSenha = z.infer<typeof schemaRecuperarSenha>

// Interface das props do formulário
interface ResetPasswordFormProps {
  onSuccess?: () => void
  className?: string
}

// Componente do formulário de recuperação de senha
export function ResetPasswordForm({ onSuccess, className }: ResetPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()

  // Configurar React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<DadosRecuperarSenha>({
    resolver: zodResolver(schemaRecuperarSenha),
    defaultValues: {
      email: '',
    },
  })

  // Função para submeter o formulário
  const onSubmit = async (data: DadosRecuperarSenha) => {
    try {
      const result = await resetPassword(data)

      if (result.success) {
        setEmailSent(true)
        onSuccess?.()
      }
    } catch (error) {
      console.error('Erro ao recuperar senha:', error)
    }
  }

  // Função para reenviar email
  const handleResendEmail = async () => {
    const email = getValues('email')
    if (email) {
      await resetPassword({ email })
    }
  }

  // Se email foi enviado, mostrar tela de confirmação
  if (emailSent) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl font-heading text-primary-gold">
            Email Enviado
          </CardTitle>
          <p className="text-text-muted">
            Enviamos um link para redefinir sua senha para{' '}
            <span className="font-medium text-text-primary">
              {getValues('email')}
            </span>
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Instruções */}
            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <h4 className="font-medium text-info mb-2">Próximos passos:</h4>
              <ol className="text-sm text-text-muted space-y-1 list-decimal list-inside">
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link recebido por email</li>
                <li>Defina uma nova senha</li>
                <li>Faça login com a nova senha</li>
              </ol>
            </div>

            {/* Botão para reenviar */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
            >
              Reenviar Email
            </Button>

            {/* Link para voltar */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-primary-gold hover:text-primary-gold-dark transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formulário principal
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-primary-gold">
          Recuperar Senha
        </CardTitle>
        <p className="text-text-muted">
          Digite seu email para receber um link de recuperação
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo Email */}
          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="seu@email.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            required
            disabled={isSubmitting}
            helperText="Enviaremos um link para este email"
          />

          {/* Botão de submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>

          {/* Link para voltar */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Componente de loading para o formulário
export function ResetPasswordFormSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="h-8 bg-neutral-light-gray animate-pulse rounded mb-2" />
        <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-3/4 mx-auto" />
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Email skeleton */}
          <div>
            <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-16 mb-2" />
            <div className="h-10 bg-neutral-light-gray animate-pulse rounded" />
            <div className="h-3 bg-neutral-light-gray animate-pulse rounded w-48 mt-1" />
          </div>

          {/* Botão skeleton */}
          <div className="h-12 bg-neutral-light-gray animate-pulse rounded" />

          {/* Link skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-32 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
