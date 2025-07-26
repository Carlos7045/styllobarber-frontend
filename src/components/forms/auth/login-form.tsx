'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { NoSSR } from '@/components/common/NoSSR'
import { useAuth, type LoginData } from '@/hooks/use-auth'
import { schemaLogin, type DadosLogin } from '@/lib/validations'
import { cn } from '@/lib/utils'

// Interface das props do formulário
interface LoginFormProps {
  onSuccess?: () => void
  className?: string
  redirectTo?: string
}

// Componente do formulário de login
export function LoginForm({ onSuccess, className, redirectTo }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info')
  const { signIn, loading } = useAuth()
  const router = useRouter()

  // Verificar mensagens da URL
  useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlMessage = urlParams.get('message')
      
      if (urlMessage === 'account-created') {
        setMessage('Conta criada com sucesso! Faça login para continuar.')
        setMessageType('success')
      } else if (urlMessage === 'email-confirmation-needed') {
        setMessage('Cadastro realizado! Verifique seu email e confirme sua conta antes de fazer login.')
        setMessageType('info')
      }
    }
  })

  // Configurar React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<DadosLogin>({
    resolver: zodResolver(schemaLogin),
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  // Função para submeter o formulário
  const onSubmit = async (data: DadosLogin) => {
    try {
      console.log('🔐 Tentando fazer login com:', data.email)
      const result = await signIn(data)

      console.log('📋 Resultado do login:', result)

      if (result.success) {
        console.log('✅ Login bem-sucedido, redirecionando...')
        onSuccess?.()
        
        // Aguardar mais tempo para garantir que a sessão foi salva
        setTimeout(() => {
          console.log('🔄 Redirecionando para dashboard...')
          // Usar window.location.replace para forçar redirecionamento
          window.location.replace('/dashboard')
        }, 500)
      } else {
        console.error('❌ Erro no login:', result.error)
        // Definir erros específicos nos campos se necessário
        if (result.error?.message.includes('credentials')) {
          setError('email', { message: 'Email ou senha incorretos' })
          setError('senha', { message: 'Email ou senha incorretos' })
        }
      }
    } catch (error) {
      console.error('💥 Erro no login:', error)
    }
  }

  return (
    <NoSSR fallback={<LoginFormSkeleton />}>
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-primary-gold">
            Entrar no StylloBarber
          </CardTitle>
          <p className="text-text-muted">
            Faça login para acessar sua conta
          </p>
          
          {/* Mensagem de feedback */}
          {message && (
            <div className={cn(
              'mt-4 p-3 rounded-lg text-sm',
              messageType === 'success' && 'bg-green-50 text-green-700 border border-green-200',
              messageType === 'info' && 'bg-blue-50 text-blue-700 border border-blue-200',
              messageType === 'error' && 'bg-red-50 text-red-700 border border-red-200'
            )}>
              {message}
            </div>
          )}
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
            disabled={isSubmitting || loading}
          />

          {/* Campo Senha */}
          <Input
            {...register('senha')}
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="Sua senha"
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
          />

          {/* Link para recuperar senha */}
          <div className="text-right">
            <Link
              href="/recuperar-senha"
              className="text-sm text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          {/* Botão de submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Entrando...' : 'Entrar'}
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

          {/* Link para cadastro */}
          <div className="text-center">
            <p className="text-sm text-text-muted">
              Não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="text-primary-gold hover:text-primary-gold-dark font-medium transition-colors"
              >
                Cadastre-se
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
export function LoginFormSkeleton() {
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
          </div>

          {/* Senha skeleton */}
          <div>
            <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-16 mb-2" />
            <div className="h-10 bg-neutral-light-gray animate-pulse rounded" />
          </div>

          {/* Link skeleton */}
          <div className="text-right">
            <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-32 ml-auto" />
          </div>

          {/* Botão skeleton */}
          <div className="h-12 bg-neutral-light-gray animate-pulse rounded" />

          {/* Divisor skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-8 mx-auto" />

          {/* Link cadastro skeleton */}
          <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-48 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}