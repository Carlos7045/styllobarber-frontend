import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do modal usando CVA
const modalVariants = cva(
  // Classes base - centralizadas e com animações
  'relative z-[9999] max-h-[90vh] border border-gray-200 dark:border-secondary-graphite-card/30 bg-white dark:bg-secondary-graphite-light shadow-xl duration-200 sm:rounded-lg overflow-hidden flex flex-col',
  {
    variants: {
      size: {
        sm: 'max-w-sm',        // ~384px - Para confirmações simples
        md: 'max-w-md',        // ~448px - Para formulários básicos
        lg: 'max-w-[28rem]',   // ~448px - Padrão do NovoFuncionarioModal (mais controlado)
        xl: 'max-w-xl',        // ~576px - Para formulários maiores
        '2xl': 'max-w-2xl',    // ~672px - Para conteúdo extenso
        '3xl': 'max-w-3xl',    // ~768px - Para tabelas ou listas
        full: 'max-w-[95vw] max-h-[95vh]', // Quase tela cheia
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

// Interface das props do modal
export interface SimpleModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

// Componente Modal principal sem Radix UI
const SimpleModal = React.forwardRef<HTMLDivElement, SimpleModalProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className,
  }, ref) => {
    // Handle escape key
    React.useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose])

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])

    if (!isOpen) return null

    const modalContent = (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
        
        {/* Modal Content */}
        <div
          ref={ref}
          className={cn(
            modalVariants({ size }), 
            'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200',
            className
          )}
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-graphite-card/30">
              <div className="flex flex-col space-y-1.5">
                {title && (
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 disabled:pointer-events-none text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  onClick={onClose}
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    )

    // Use portal to render in document.body
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null
    }
    
    return createPortal(modalContent, document.body)
  }
)

// Componente ModalHeader
const SimpleModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 border-b border-gray-200 dark:border-secondary-graphite-card/30', className)}
    {...props}
  />
))
SimpleModalHeader.displayName = 'SimpleModalHeader'

// Componente ModalTitle
const SimpleModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white', className)}
    {...props}
  />
))

// Componente ModalDescription
const SimpleModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-300', className)}
    {...props}
  />
))

// Componente ModalContent
const SimpleModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto p-6', className)}
    {...props}
  />
))

// Componente ModalFooter
const SimpleModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right'
  }
>(({ className, align = 'right', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex gap-2 p-6 border-t border-gray-200 dark:border-secondary-graphite-card/30',
      {
        'justify-start': align === 'left',
        'justify-center': align === 'center',
        'justify-end': align === 'right',
      },
      className
    )}
    {...props}
  />
))

// Definir display names
SimpleModal.displayName = 'SimpleModal'
SimpleModalHeader.displayName = 'SimpleModalHeader'
SimpleModalTitle.displayName = 'SimpleModalTitle'
SimpleModalDescription.displayName = 'SimpleModalDescription'
SimpleModalContent.displayName = 'SimpleModalContent'
SimpleModalFooter.displayName = 'SimpleModalFooter'

export {
  SimpleModal,
  SimpleModalHeader,
  SimpleModalTitle,
  SimpleModalDescription,
  SimpleModalContent,
  SimpleModalFooter,
  modalVariants,
}