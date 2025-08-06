'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import Link from 'next/link'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { NoSSR } from '@/shared/components/feedback/NoSSR'
import { useAuth, type SignUpData } from '@/domains/auth/hooks/use-auth'
import { schemaCadastro, type DadosCadastro } from '@/shared/utils/validation'
import { cn, formatarTelefone } from '@/shared/utils'

// Interface das props do formulário
interface SignUpFormProps {
  onSuccess?: () => void
  className?: string
  redirectTo?: string
}

// Componente do formulário de cadastro
export function SignUpForm({ onSuccess, className, redirectTo }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, loading } = useAuth()

  // Configurar React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<DadosCadastro>({
    resolver: zodResolver(schemaCadastro),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
    },
  })

  // Observar valor do telefone para formatação
  const telefoneValue = watch('telefone')

  // Função para formatar telefone em tempo real
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value)
    setValue('telefone', formatted)
  }

  // Função para submeter o formulário
  const onSubmit = async (data: DadosCadastro) => {
    try {
      const result = await signUp(data)

      if (result.success) {
        onSuccess?.()
        
        // Verificar se precisa confirmar email
        if (result.message?.includes('Verifique seu email')) {
          // Redirecionar para login com mensagem de confirmação
          window.location.href = '/login?message=email-confirmation-needed'
        } else {
          // Redirecionar para login normalmente
          window.location.href = '/login?message=account-created'
        }
      } else {
        // Mostrar erro
        console.error('Erro no cadastro:', result.error)
        // Aqui você pode adicionar um toast ou estado de erro
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
    }
  }

  return (
    <NoSSR fallback={<SignUpFormSkeleton />}>
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-primary-gold">
            Criar Conta
          </CardTitle>
          <p className="text-text-muted">
            Cadastre-se para acessar o StylloBarber
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo Nome */}
          <Input
            {...register('nome')}
            type="text"
            label="Nome Completo"
            placeholder="Seu nome completo"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.nome?.message}
            required
            disabled={isSubmitting || loading}
          />

          {/* Campo Email */}
          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="seu@email.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            required
            disabled={isSubmitting || loading}
          />

          {/* Campo Telefone */}
          <Input
            {...register('telefone')}
            type="tel"
            label="Telefone"
            placeholder="(11) 99999-9999"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.telefone?.message}
            required
            disabled={isSubmitting || loading}
            onChange={handleTelefoneChange}
            value={telefoneValue}
            maxLength={15}
          />

          {/* Campo Senha */}
          <Input
            {...register('senha')}
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            error={errors.senha?.message}
            required
            disabled={isSubmitting || loading}
            helperText="A senha deve ter pelo menos 6 caracteres"
          />

          {/* Campo Confirmar Senha */}
          <Input
            {...register('confirmarSenha')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar Senha"
            placeholder="Digite a senha novamente"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            error={errors.confirmarSenha?.message}
            required
            disabled={isSubmitting || loading}
          />

          {/* Termos de uso */}
          <div className="text-xs text-text-muted">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link
              href="/termos"
              className="text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link
              href="/privacidade"
              className="text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              Política de Privacidade
            </Link>
            .
          </div>

          {/* Botão de submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background-primary px-2 text-text-muted">
                ou
              </span>
            </div>
          </div>

          {/* Link para login */}
          <div className="text-center">
            <p className="text-sm text-text-muted">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="text-primary-gold hover:text-primary-gold-dark font-medium transition-colors"
              >
                Faça login
              </Link>
            </p>
          </div>
          </form>
        </CardContent>
      </Card>
    </NoSSR>
  )
}

// Componente de loading para o formulário
export function SignUpFormSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="h-8 bg-neutral-light-gray animate-pulse rounded mb-2" />
        <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-3/4 mx-auto" />
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Campos skeleton */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-20 mb-2" />
              <div className="h-10 bg-neutral-light-gray animate-pulse rounded" />
            </div>
          ))}

          {/* Termos skeleton */}
          <div className="h-8 bg-neutral-light-gray animate-pulse rounded" />

          {/* Botão skeleton */}
          <div className="h-12 bg-neutral-light-gray animate-pulse rounded" />

          {/* Divisor skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-8 mx-auto" />

          {/* Link login skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-40 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
