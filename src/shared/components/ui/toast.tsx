'use client'

import { useState, useEffect, createContext, useContext, ReactNode, memo, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from '@/shared/utils/optimized-imports'
import { cn } from '@/shared/utils'

// Tipos de toast
export type ToastType = 'success' | 'error' | 'warning' | 'info'

// Interface do toast
export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Interface do contexto
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

// Contexto dos toasts
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Hook para usar toasts com fallback
export function useToast() {
  const context = useContext(ToastContext)
  
  // Fallback se não estiver dentro do provider
  if (!context) {
    console.warn('useToast usado fora do ToastProvider, usando fallback')
    return {
      toasts: [],
      addToast: (toast: Omit<Toast, 'id'>) => {
        // Fallback para alert simples
        alert(`${toast.title}${toast.description ? '\n' + toast.description : ''}`)
      },
      removeToast: () => {},
      clearToasts: () => {}
    }
  }
  
  return context
}

// Provider dos toasts
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Adicionar toast
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remover após duração especificada
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  // Remover toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Limpar todos os toasts
  const clearToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Container dos toasts
function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Item individual do toast - Memoizado para performance
const ToastItem = memo(({ toast }: { toast: Toast }) => {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Obter ícone do tipo
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  // Obter classes de estilo
  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white dark:bg-secondary-graphite-light shadow-lg rounded-lg"
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-l-green-500`
      case 'error':
        return `${baseStyles} border-l-red-500`
      case 'warning':
        return `${baseStyles} border-l-yellow-500`
      case 'info':
        return `${baseStyles} border-l-blue-500`
    }
  }

  return (
    <div
      className={cn(
        getStyles(),
        "p-4 transition-all duration-300 transform",
        isVisible 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {toast.description}
            </p>
          )}
          
          {/* Ação */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Botão de fechar */}
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.toast.id === nextProps.toast.id &&
    prevProps.toast.type === nextProps.toast.type &&
    prevProps.toast.title === nextProps.toast.title &&
    prevProps.toast.message === nextProps.toast.message
  )
})

// Componente de toast simples para compatibilidade
export function SimpleToast() {
  return null // Não usado mais, mantido para compatibilidade
}
