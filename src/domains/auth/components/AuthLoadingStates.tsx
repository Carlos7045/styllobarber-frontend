'use client'

// import { motion } from 'framer-motion'
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
import { Loader2, CheckCircle, XCircle, AlertCircle, Key, User, Shield } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui'

// Interface para estado de loading
interface LoadingState {
  type: 'loading' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  progress?: number
}

// Props para componente de loading
interface AuthLoadingProps {
  state: LoadingState
  className?: string
}

/**
 * Componente de loading elegante para autenticação
 */
export function AuthLoading({ state, className }: AuthLoadingProps) {
  const getIcon = () => {
    switch (state.type) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary-gold" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-8 w-8 text-yellow-500" />
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-primary-gold" />
    }
  }

  const getBackgroundColor = () => {
    switch (state.type) {
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card className={`${getBackgroundColor()} shadow-lg`}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {getIcon()}
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold mt-4 text-center"
          >
            {state.message}
          </motion.h3>
          
          {state.details && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-600 mt-2 text-center"
            >
              {state.details}
            </motion.p>
          )}
          
          {state.progress !== undefined && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.4 }}
              className="w-full mt-4"
            >
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${state.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-2 bg-primary-gold rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {state.progress}% concluído
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Loading específico para login
 */
export function LoginLoading({ message = 'Fazendo login...' }: { message?: string }) {
  return (
    <AuthLoading
      state={{
        type: 'loading',
        message,
        details: 'Verificando suas credenciais'
      }}
    />
  )
}

/**
 * Loading específico para logout
 */
export function LogoutLoading({ message = 'Fazendo logout...' }: { message?: string }) {
  return (
    <AuthLoading
      state={{
        type: 'loading',
        message,
        details: 'Encerrando sua sessão com segurança'
      }}
    />
  )
}

/**
 * Loading específico para cadastro
 */
export function SignupLoading({ message = 'Criando conta...' }: { message?: string }) {
  return (
    <AuthLoading
      state={{
        type: 'loading',
        message,
        details: 'Configurando seu perfil'
      }}
    />
  )
}

/**
 * Loading específico para recuperação de senha
 */
export function PasswordRecoveryLoading({ message = 'Enviando email...' }: { message?: string }) {
  return (
    <AuthLoading
      state={{
        type: 'loading',
        message,
        details: 'Preparando link de recuperação'
      }}
    />
  )
}

/**
 * Componente de loading com etapas
 */
interface StepLoadingProps {
  steps: Array<{
    id: string
    label: string
    status: 'pending' | 'loading' | 'completed' | 'error'
  }>
  className?: string
}

export function StepLoading({ steps, className }: StepLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="shadow-lg">
        <CardContent className="py-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0">
                  {step.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                  {step.status === 'loading' && (
                    <Loader2 className="w-6 h-6 animate-spin text-primary-gold" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {step.status === 'error' && (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                
                <span className={`text-sm ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-700' :
                  step.status === 'loading' ? 'text-primary-gold' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Loading para processo de autenticação completo
 */
export function AuthProcessLoading({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 'validate', label: 'Validando credenciais', status: 'pending' as const },
    { id: 'authenticate', label: 'Autenticando usuário', status: 'pending' as const },
    { id: 'profile', label: 'Carregando perfil', status: 'pending' as const },
    { id: 'permissions', label: 'Verificando permissões', status: 'pending' as const },
    { id: 'redirect', label: 'Redirecionando', status: 'pending' as const }
  ]

  const updatedSteps = steps.map((step, index) => ({
    ...step,
    status: index < currentStep ? 'completed' as const :
            index === currentStep ? 'loading' as const :
            'pending' as const
  }))

  return <StepLoading steps={updatedSteps} />
}

/**
 * Skeleton loading para formulários de auth
 */
export function AuthFormSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      
      <div className="flex justify-center">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
      </div>
    </motion.div>
  )
}

/**
 * Loading overlay para páginas inteiras
 */
interface AuthOverlayProps {
  isVisible: boolean
  message?: string
  onCancel?: () => void
}

export function AuthOverlay({ isVisible, message = 'Carregando...', onCancel }: AuthOverlayProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-sm mx-4"
      >
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-gold mb-4" />
          <h3 className="text-lg font-semibold mb-2">{message}</h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            Por favor, aguarde...
          </p>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
