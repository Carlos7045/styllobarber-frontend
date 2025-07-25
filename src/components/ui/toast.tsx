'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Provider do Toast
const ToastProvider = ToastPrimitives.Provider

// Viewport do Toast
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
))

// Variantes do toast
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-slide-in-right data-[state=closed]:animate-fade-out data-[swipe=end]:animate-fade-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border-border-default bg-background-primary text-text-primary',
        success: 'border-success/20 bg-success/10 text-success-dark',
        error: 'border-error/20 bg-error/10 text-error-dark',
        warning: 'border-warning/20 bg-warning/10 text-warning-dark',
        info: 'border-info/20 bg-info/10 text-info-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Componente Toast principal
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})

// Ação do Toast (botão de fechar)
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className
    )}
    {...props}
  />
))

// Botão de fechar do Toast
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-text-muted opacity-0 transition-opacity hover:text-text-primary focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))

// Título do Toast
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))

// Descrição do Toast
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))

// Ícones para cada tipo de toast
const ToastIcon = ({ variant }: { variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | null }) => {
  const iconProps = { className: 'h-5 w-5 flex-shrink-0' }
  
  switch (variant) {
    case 'success':
      return <CheckCircle {...iconProps} className={cn(iconProps.className, 'text-success')} />
    case 'error':
      return <AlertCircle {...iconProps} className={cn(iconProps.className, 'text-error')} />
    case 'warning':
      return <AlertTriangle {...iconProps} className={cn(iconProps.className, 'text-warning')} />
    case 'info':
      return <Info {...iconProps} className={cn(iconProps.className, 'text-info')} />
    default:
      return null
  }
}

// Componente Toast completo com ícone
const ToastWithIcon = React.forwardRef<
  React.ElementRef<typeof Toast>,
  React.ComponentPropsWithoutRef<typeof Toast> & {
    title?: string
    description?: string
    action?: React.ReactNode
  }
>(({ variant, title, description, action, children, ...props }, ref) => (
  <Toast ref={ref} variant={variant} {...props}>
    <div className="flex items-start space-x-3">
      <ToastIcon variant={variant} />
      <div className="flex-1 space-y-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
        {children}
      </div>
    </div>
    {action && <div className="ml-auto">{action}</div>}
    <ToastClose />
  </Toast>
))

// Hook para usar toast
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

interface ToastOptions {
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: ToastProps['variant']
  duration?: number
}

// Context para gerenciar toasts
const ToastContext = React.createContext<{
  toast: (options: ToastOptions) => void
  dismiss: (toastId?: string) => void
}>({
  toast: () => {},
  dismiss: () => {},
})

// Provider personalizado para toasts
export const ToastProviderCustom: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Array<ToastOptions & { id: string }>>([])

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...options, id }])
    
    // Auto dismiss após duração especificada
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, options.duration || 5000)
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastProvider>
        {children}
        {toasts.map((toastData) => (
          <ToastWithIcon
            key={toastData.id}
            variant={toastData.variant}
            title={toastData.title}
            description={toastData.description}
            action={toastData.action}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

// Hook para usar o toast
export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProviderCustom')
  }
  return context
}

// Definir display names
ToastViewport.displayName = ToastPrimitives.Viewport.displayName
Toast.displayName = ToastPrimitives.Root.displayName
ToastAction.displayName = ToastPrimitives.Action.displayName
ToastClose.displayName = ToastPrimitives.Close.displayName
ToastTitle.displayName = ToastPrimitives.Title.displayName
ToastDescription.displayName = ToastPrimitives.Description.displayName
ToastWithIcon.displayName = 'ToastWithIcon'

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastWithIcon,
  ToastIcon,
}