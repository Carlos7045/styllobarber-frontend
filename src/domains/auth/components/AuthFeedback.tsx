
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}

const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>

import React from 'react'

import { CheckCircle, XCircle, AlertCircle, Info, Mail } from 'lucide-react'

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'email'

interface AuthFeedbackProps {
  type: FeedbackType
  message: string
  isVisible: boolean
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

const feedbackConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-400',
    iconColor: 'text-green-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-400',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500'
  },
  email: {
    icon: Mail,
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-500'
  }
}

export function AuthFeedback({ 
  type, 
  message, 
  isVisible, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: AuthFeedbackProps) {
  const config = feedbackConfig[type]
  const Icon = config.icon

  React.useEffect(() => {
    if (isVisible && autoClose && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, onClose, duration])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            flex items-start gap-3 p-4 rounded-lg border
            ${config.bgColor} ${config.borderColor}
            backdrop-blur-sm
          `}
        >
          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {message}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`
                flex-shrink-0 p-1 rounded-md transition-colors
                hover:bg-white/5 ${config.textColor}
              `}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para gerenciar feedback de autenticação
export function useAuthFeedback() {
  const [feedback, setFeedback] = React.useState<{
    type: FeedbackType
    message: string
    isVisible: boolean
  }>({
    type: 'info',
    message: '',
    isVisible: false
  })

  const showFeedback = React.useCallback((type: FeedbackType, message: string) => {
    setFeedback({ type, message, isVisible: true })
  }, [])

  const hideFeedback = React.useCallback(() => {
    setFeedback(prev => ({ ...prev, isVisible: false }))
  }, [])

  const showSuccess = React.useCallback((message: string) => {
    showFeedback('success', message)
  }, [showFeedback])

  const showError = React.useCallback((message: string) => {
    showFeedback('error', message)
  }, [showFeedback])

  const showWarning = React.useCallback((message: string) => {
    showFeedback('warning', message)
  }, [showFeedback])

  const showInfo = React.useCallback((message: string) => {
    showFeedback('info', message)
  }, [showFeedback])

  const showEmailConfirmation = React.useCallback((message: string) => {
    showFeedback('email', message)
  }, [showFeedback])

  return {
    feedback,
    showFeedback,
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showEmailConfirmation
  }
}

// Componente para mensagens específicas de autenticação
interface AuthMessageProps {
  type: 'login-success' | 'signup-success' | 'email-confirmation' | 'logout-success' | 'password-reset'
  userName?: string
  userRole?: string
}

export function AuthMessage({ type, userName, userRole }: AuthMessageProps) {
  const messages = {
    'login-success': {
      type: 'success' as FeedbackType,
      message: `Bem-vindo${userName ? `, ${userName}` : ''}! Login realizado com sucesso.`
    },
    'signup-success': {
      type: 'email' as FeedbackType,
      message: 'Cadastro realizado! Verifique seu email para confirmar a conta antes de fazer login.'
    },
    'email-confirmation': {
      type: 'email' as FeedbackType,
      message: 'Verifique sua caixa de entrada e confirme seu email para ativar sua conta.'
    },
    'logout-success': {
      type: 'info' as FeedbackType,
      message: 'Logout realizado com sucesso. Até logo!'
    },
    'password-reset': {
      type: 'email' as FeedbackType,
      message: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
    }
  }

  const config = messages[type]

  return (
    <AuthFeedback
      type={config.type}
      message={config.message}
      isVisible={true}
      autoClose={type !== 'email-confirmation' && type !== 'signup-success'}
      duration={type === 'login-success' ? 3000 : 5000}
    />
  )
}
