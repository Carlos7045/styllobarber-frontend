'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { NoSSR } from '@/shared/components/feedback/NoSSR'
import { useAuth, type LoginData } from '@/domains/auth/hooks/use-auth'
import { schemaLogin, type DadosLogin } from '@/shared/utils/validation'
import { cn } from '@/shared/utils'

// Importar novos componentes de UX
import { AuthFeedback, useAuthFeedback, AuthMessage } from '@/domains/auth/components/AuthFeedback'
import { ButtonLoading } from '@/domains/auth/components/AuthLoadingState'
import { useFieldValidation, validationRules, ValidationDisplay } from '@/domains/auth/components/AuthValidation'
import { useRateLimit } from '@/lib/rate-limiter'

// Interface das props do formulário
interface LoginFormProps {
  onSuccess?: () => void
  className?: string
  redirectTo?: string
}

// Componente do formulário de login
export function LoginForm({ onSuccess, className, redirectTo }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const { signIn, loading, user } = useAuth()
  const router = useRouter()
  
  // Hook para feedback visual
  const { 
    feedback, 
    showSuccess, 
    showError, 
    showEmailConfirmation, 
    showWarning,
    hideFeedback 
  } = useAuthFeedback()

  // Hook para rate limiting
  const { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt } = useRateLimit()

  // Validação em tempo real para email
  const emailValidation = useFieldValidation([
    validationRules.email.required,
    validationRules.email.format
  ])

  // Validação em tempo real para senha
  const passwordValidation = useFieldValidation([
    validationRules.password.required,
    validationRules.password.minLength
  ])

  // Verificar mensagens da URL e mostrar feedback apropriado
  useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlMessage = urlParams.get('message')
      
      if (urlMessage === 'account-created') {
        showSuccess('Conta criada com sucesso! Faça login para continuar.')
      } else if (urlMessage === 'email-confirmation-needed') {
        showEmailConfirmation('Cadastro realizado! Verifique seu email e confirme sua conta antes de fazer login.')
      } else if (urlMessage === 'logout-success') {
        showSuccess('Logout realizado com sucesso. Até logo!')
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
      hideFeedback() // Limpar feedback anterior
      
      // Verificar rate limiting antes de tentar login
      const rateLimitCheck = checkRateLimit(data.email)
      if (rateLimitCheck.blocked && rateLimitCheck.message) {
        showError(rateLimitCheck.message)
        return
      }

      // Mostrar aviso se restam poucas tentativas
      if (!rateLimitCheck.blocked && rateLimitCheck.message) {
        showWarning(rateLimitCheck.message)
      }

      console.log('🔐 Tentando fazer login com:', data.email)
      
      const result = await signIn(data)
      console.log('📋 Resultado do login:', result)

      if (result.success) {
        console.log('✅ Login bem-sucedido, redirecionando...')
        setLoginSuccess(true)
        
        // Registrar tentativa bem-sucedida (limpa rate limiting)
        recordSuccessfulAttempt(data.email)
        
        // Mostrar feedback de sucesso com nome do usuário se disponível
        const userName = result.profile?.nome || result.user?.user_metadata?.nome
        showSuccess(`Bem-vindo${userName ? `, ${userName}` : ''}! Login realizado com sucesso.`)
        
        onSuccess?.()
        
        // Aguardar um pouco para mostrar o feedback antes de redirecionar
        setTimeout(() => {
          console.log('🔄 Redirecionando para dashboard...')
          
          // Redirecionar baseado no role do usuário
          const userRole = result.profile?.role || result.user?.user_metadata?.role
          let redirectPath = '/dashboard'
          
          console.log('🔄 Redirecionando usuário após login:', { userRole, redirectPath })
          
          if (userRole === 'saas_owner') {
            redirectPath = '/saas-admin'
            console.log('👑 SaaS Owner → /saas-admin')
          } else if (userRole === 'admin' || userRole === 'barber') {
            redirectPath = '/dashboard'
            console.log('👨‍💼 Admin/Barbeiro → /dashboard')
          } else if (userRole === 'client') {
            redirectPath = '/dashboard/agendamentos'
            console.log('👥 Cliente → /dashboard/agendamentos')
          } else {
            // Fallback para role desconhecido
            redirectPath = '/dashboard/agendamentos'
            console.log('❓ Role desconhecido, usando fallback → /dashboard/agendamentos')
          }
          
          window.location.replace(redirectPath)
        }, 1500) // Tempo maior para mostrar o feedback
        
      } else {
        console.error('❌ Erro no login:', result.error)
        
        // Registrar tentativa falhada para rate limiting
        recordFailedAttempt(data.email)
        
        // Mostrar mensagens de erro mais específicas
        const errorMessage = result.error?.message || 'Erro desconhecido'
        
        if (errorMessage.includes('Email not confirmed')) {
          showEmailConfirmation('Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.')
        } else if (errorMessage.includes('Invalid login credentials')) {
          // Verificar se ainda há tentativas restantes
          const newRateLimitCheck = checkRateLimit(data.email)
          let message = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          
          if (newRateLimitCheck.attemptsLeft !== undefined && newRateLimitCheck.attemptsLeft <= 2) {
            message += ` Restam ${newRateLimitCheck.attemptsLeft} tentativas.`
          }
          
          showError(message)
          setError('email', { message: 'Credenciais inválidas' })
          setError('senha', { message: 'Credenciais inválidas' })
        } else if (errorMessage.includes('Too many requests')) {
          showError('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.')
        } else {
          showError(`Erro no login: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error('💥 Erro inesperado no login:', error)
      showError('Erro inesperado. Tente novamente em alguns instantes.')
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
          
          {/* Feedback visual melhorado */}
          <div className="mt-4">
            <AuthFeedback
              type={feedback.type}
              message={feedback.message}
              isVisible={feedback.isVisible}
              onClose={hideFeedback}
              autoClose={feedback.type !== 'email'}
              duration={feedback.type === 'success' ? 3000 : 5000}
            />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo Email com validação em tempo real */}
          <div>
            <Input
              {...register('email', {
                onChange: (e) => emailValidation.setValue(e.target.value),
                onBlur: emailValidation.onBlur
              })}
              type="email"
              label="Email"
              placeholder="seu@email.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              required
              disabled={isSubmitting || loading || loginSuccess}
              autoComplete="email"
            />
            <ValidationDisplay 
              results={emailValidation.validationResults} 
              showOnlyErrors={true}
            />
          </div>

          {/* Campo Senha com validação em tempo real */}
          <div>
            <Input
              {...register('senha', {
                onChange: (e) => passwordValidation.setValue(e.target.value),
                onBlur: passwordValidation.onBlur
              })}
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
                  disabled={isSubmitting || loading || loginSuccess}
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
              disabled={isSubmitting || loading || loginSuccess}
              autoComplete="current-password"
            />
            <ValidationDisplay 
              results={passwordValidation.validationResults} 
              showOnlyErrors={true}
            />
          </div>

          {/* Link para recuperar senha */}
          <div className="text-right">
            <Link
              href="/recuperar-senha"
              className={cn(
                "text-sm text-primary-gold hover:text-primary-gold-dark transition-colors",
                (isSubmitting || loading || loginSuccess) && "pointer-events-none opacity-50"
              )}
            >
              Esqueceu sua senha?
            </Link>
          </div>

          {/* Botão de submit com loading melhorado */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || loading || loginSuccess || emailValidation.hasErrors || passwordValidation.hasErrors}
          >
            <ButtonLoading 
              isLoading={isSubmitting || loading}
              loadingText={loginSuccess ? 'Redirecionando...' : 'Entrando...'}
            >
              {loginSuccess ? 'Login realizado!' : 'Entrar'}
            </ButtonLoading>
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
                className={cn(
                  "text-primary-gold hover:text-primary-gold-dark font-medium transition-colors",
                  (isSubmitting || loading || loginSuccess) && "pointer-events-none opacity-50"
                )}
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
