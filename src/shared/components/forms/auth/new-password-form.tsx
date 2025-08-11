'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { supabase } from '@/lib/api/supabase'
import { cn } from '@/shared/utils'

// Schema de validação para nova senha
const schemaNewPassword = z.object({
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

type DadosNewPassword = z.infer<typeof schemaNewPassword>

// Interface das props do formulário
interface NewPasswordFormProps {
  onSuccess?: () => void
  className?: string
}

// Componente do formulário de nova senha
export function NewPasswordForm({ onSuccess, className }: NewPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar se há erro nos parâmetros da URL
  useEffect(() => {
    const urlError = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (urlError) {
      if (urlError === 'access_denied' && errorDescription?.includes('expired')) {
        setError('O link de recuperação expirou. Solicite um novo link.')
      } else {
        setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
      }
    }
  }, [searchParams])

  // Configurar React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosNewPassword>({
    resolver: zodResolver(schemaNewPassword),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Função para submeter o formulário
  const onSubmit = async (data: DadosNewPassword) => {
    try {
      setError(null)
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        setError('Erro ao atualizar senha. Tente novamente.')
        return
      }

      setSuccess(true)
      onSuccess?.()

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error) {
      console.error('Erro inesperado:', error)
      setError('Erro inesperado. Tente novamente.')
    }
  }

  // Se houve sucesso, mostrar tela de confirmação
  if (success) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-heading text-primary-gold">
            Senha Atualizada!
          </CardTitle>
          <p className="text-text-muted">
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login.
          </p>
        </CardHeader>

        <CardContent>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              Ir para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se há erro na URL, mostrar mensagem de erro
  if (error) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-red-500">
            Link Inválido
          </CardTitle>
          <p className="text-text-muted">
            {error}
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Link href="/auth/reset-password">
              <Button className="w-full">
                Solicitar Novo Link
              </Button>
            </Link>

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

  // Formulário principal para definir nova senha
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-primary-gold">
          Nova Senha
        </CardTitle>
        <p className="text-text-muted">
          Digite sua nova senha para continuar
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo Nova Senha */}
          <div className="relative">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Nova Senha"
              placeholder="Digite sua nova senha"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              required
              disabled={isSubmitting}
              helperText="Mínimo 8 caracteres, com maiúscula, minúscula e número"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-text-muted hover:text-text-primary transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Campo Confirmar Senha */}
          <div className="relative">
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirmar Senha"
              placeholder="Confirme sua nova senha"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-text-muted hover:text-text-primary transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Botão de submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
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
export function NewPasswordFormSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="h-8 bg-neutral-light-gray animate-pulse rounded mb-2" />
        <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-3/4 mx-auto" />
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Password fields skeleton */}
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-24 mb-2" />
              <div className="h-10 bg-neutral-light-gray animate-pulse rounded" />
            </div>
          ))}

          {/* Botão skeleton */}
          <div className="h-12 bg-neutral-light-gray animate-pulse rounded" />

          {/* Link skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-32 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}