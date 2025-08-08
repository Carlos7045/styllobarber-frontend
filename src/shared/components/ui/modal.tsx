import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { createPortal } from 'react-dom'
import { X } from '@/shared/utils/optimized-imports'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do modal usando CVA
const modalVariants = cva(
  // Classes base
  'fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-secondary-graphite-card/30 bg-white dark:bg-secondary-graphite-light p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

// Interface das props do modal
export interface ModalProps extends VariantProps<typeof modalVariants> {
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

// Componente Modal principal
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
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
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => {
        if (!open) onClose()
      }}>
        <Dialog.Portal container={document.body}>
          {/* Overlay com z-index mais alto */}
          <Dialog.Overlay 
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            onClick={closeOnOverlayClick ? onClose : undefined}
            style={{ zIndex: 9998 }}
          />
          
          {/* Conteúdo do modal com z-index ainda mais alto */}
          <Dialog.Content
            ref={ref}
            className={cn(modalVariants({ size }), 'z-[9999]', className)}
            onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
            style={{ zIndex: 9999 }}
          >
            {/* Título obrigatório para acessibilidade */}
            <Dialog.Title className={title ? "text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white" : "sr-only"}>
              {title || "Modal"}
            </Dialog.Title>
            
            {/* Header do modal */}
            {(title || description || showCloseButton) && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col space-y-1.5">
                  {description && (
                    <Dialog.Description className="text-sm text-gray-600 dark:text-gray-300">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                
                {showCloseButton && (
                  <Dialog.Close asChild>
                    <button
                      className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 disabled:pointer-events-none text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      onClick={onClose}
                      aria-label="Fechar modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            )}
            
            {/* Conteúdo */}
            <div className="flex-1">
              {children}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)

// Componente ModalHeader
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
))

// Componente ModalTitle
const ModalTitle = React.forwardRef<
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
const ModalDescription = React.forwardRef<
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
const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-4', className)}
    {...props}
  />
))

// Componente ModalFooter
const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right'
  }
>(({ className, align = 'right', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex gap-2 pt-4',
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
Modal.displayName = 'Modal'
ModalHeader.displayName = 'ModalHeader'
ModalTitle.displayName = 'ModalTitle'
ModalDescription.displayName = 'ModalDescription'
ModalContent.displayName = 'ModalContent'
ModalFooter.displayName = 'ModalFooter'

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  modalVariants,
}
