'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Mail,
  Key,
  User,
  Shield,
  Clock
} from 'lucide-react'

// Tipos de feedback
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// Interface para feedback
interface FeedbackMessage {
  id: string
  type: FeedbackType
  title: string
  message: string
  details?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  persistent?: boolean
  icon?: React.ReactNode
}

// Props do componente
interface AuthFeedbackEnhancedProps {
  messages: FeedbackMessage[]
  onDismiss: (id: string) => void
  position?: 'top' | 'bottom' | 'center'
  maxMessages?: number
}

/**
 * Sistema de feedback visual melhorado para autenticação
 */
export function AuthFeedbackEnhanced({ 
  messages, 
  onDismiss, 
  position = 'top',
  maxMessages = 3 
}: AuthFeedbackEnhancedProps) {
  const [visibleMessages, setVisibleMessages] = useState<FeedbackMessage[]>([])

  useEffect(() => {
    // Limitar número de mensagens visíveis
    setVisibleMessages(messages.slice(0, maxMessages))
  }, [messages, maxMessages])

  // Auto-dismiss para mensagens não persistentes
  useEffect(() => {
    visibleMessages.forEach(message => {
      if (!message.persistent && message.duration !== 0) {
        const timeout = setTimeout(() => {
          onDismiss(message.id)
        }, message.duration || 5000)

        return () => clearTimeout(timeout)
      }
    })
  }, [visibleMessages, onDismiss])

  const getIcon = (type: FeedbackType, customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon

    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      case 'loading':
        return <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getColors = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          button: 'text-green-600 hover:text-green-800'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          button: 'text-red-600 hover:text-red-800'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          button: 'text-yellow-600 hover:text-yellow-800'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-600 hover:text-blue-800'
        }
      case 'loading':
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'text-gray-600 hover:text-gray-800'
        }
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'text-gray-600 hover:text-gray-800'
        }
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4'
      case 'bottom':
        return 'bottom-4'
      case 'center':
        return 'top-1/2 -translate-y-1/2'
      default:
        return 'top-4'
    }
  }

  return (
    <div className={`fixed right-4 ${getPositionClasses()} z-50 space-y-2 max-w-md`}>
      <AnimatePresence>
        {visibleMessages.map((message) => {
          const colors = getColors(message.type)
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`${colors.bg} border rounded-lg shadow-lg p-4 relative overflow-hidden`}
            >
              {/* Barra de progresso para auto-dismiss */}
              {!message.persistent && message.duration && message.duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: message.duration / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
                />
              )}

              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {getIcon(message.type, message.icon)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${colors.text}`}>
                    {message.title}
                  </h4>
                  
                  <p className={`text-sm mt-1 ${colors.text} opacity-90`}>
                    {message.message}
                  </p>
                  
                  {message.details && (
                    <p className={`text-xs mt-2 ${colors.text} opacity-75`}>
                      {message.details}
                    </p>
                  )}
                  
                  {message.action && (
                    <button
                      onClick={message.action.onClick}
                      className={`text-sm font-medium mt-2 ${colors.button} transition-colors`}
                    >
                      {message.action.label}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => onDismiss(message.id)}
                  className={`flex-shrink-0 ${colors.button} transition-colors`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/**
 * Hook para gerenciar mensagens de feedback
 */
export function useAuthFeedback() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([])

  const addMessage = (message: Omit<FeedbackMessage, 'id'>) => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setMessages(prev => [...prev, { ...message, id }])
    return id
  }

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearAll = () => {
    setMessages([])
  }

  // Métodos de conveniência
  const showSuccess = (title: string, message: string, options?: Partial<FeedbackMessage>) => {
    return addMessage({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    })
  }

  const showError = (title: string, message: string, options?: Partial<FeedbackMessage>) => {
    return addMessage({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    })
  }

  const showWarning = (title: string, message: string, options?: Partial<FeedbackMessage>) => {
    return addMessage({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    })
  }

  const showInfo = (title: string, message: string, options?: Partial<FeedbackMessage>) => {
    return addMessage({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    })
  }

  const showLoading = (title: string, message: string, options?: Partial<FeedbackMessage>) => {
    return addMessage({
      type: 'loading',
      title,
      message,
      persistent: true,
      ...options
    })
  }

  // Mensagens específicas para autenticação
  const showLoginSuccess = (userName: string) => {
    return showSuccess(
      'Login realizado!',
      `Bem-vindo de volta, ${userName}`,
      {
        icon: <User className="h-5 w-5" />,
        duration: 3000
      }
    )
  }

  const showLoginError = (error: string) => {
    return showError(
      'Erro no login',
      error,
      {
        icon: <Key className="h-5 w-5" />,
        action: {
          label: 'Tentar novamente',
          onClick: () => window.location.reload()
        }
      }
    )
  }

  const showLogoutSuccess = () => {
    return showSuccess(
      'Logout realizado',
      'Você foi desconectado com segurança',
      {
        icon: <Shield className="h-5 w-5" />,
        duration: 2000
      }
    )
  }

  const showPasswordRecovery = (email: string) => {
    return showInfo(
      'Email enviado',
      `Instruções de recuperação enviadas para ${email}`,
      {
        icon: <Mail className="h-5 w-5" />,
        duration: 8000
      }
    )
  }

  const showSessionExpired = () => {
    return showWarning(
      'Sessão expirada',
      'Sua sessão expirou. Faça login novamente.',
      {
        icon: <Clock className="h-5 w-5" />,
        persistent: true,
        action: {
          label: 'Fazer login',
          onClick: () => window.location.href = '/login'
        }
      }
    )
  }

  return {
    messages,
    addMessage,
    removeMessage,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showLoginSuccess,
    showLoginError,
    showLogoutSuccess,
    showPasswordRecovery,
    showSessionExpired
  }
}

/**
 * Componente wrapper que inclui o sistema de feedback
 */
interface AuthFeedbackProviderProps {
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'center'
}

export function AuthFeedbackProvider({ children, position = 'top' }: AuthFeedbackProviderProps) {
  const { messages, removeMessage } = useAuthFeedback()

  return (
    <>
      {children}
      <AuthFeedbackEnhanced
        messages={messages}
        onDismiss={removeMessage}
        position={position}
      />
    </>
  )
}
