import * as React from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle, Info, CheckCircle, XCircle } from '@/shared/utils/optimized-imports'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { Button } from './button'

// Variantes do confirm dialog
const confirmDialogVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background-primary p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      variant: {
        default: 'border-border-default',
        destructive: 'border-error/20 bg-error/5',
        warning: 'border-warning/20 bg-warning/5',
        success: 'border-success/20 bg-success/5',
        info: 'border-info/20 bg-info/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Interface das props do ConfirmDialog
export interface ConfirmDialogProps extends VariantProps<typeof confirmDialogVariants> {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
}

// Ícones por variante
const variantIcons = {
  default: Info,
  destructive: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

// Cores dos ícones por variante
const iconColors = {
  default: 'text-info',
  destructive: 'text-error',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
}

// Variantes dos botões por tipo
const buttonVariants = {
  default: 'primary',
  destructive: 'destructive',
  warning: 'warning',
  success: 'success',
  info: 'primary',
} as const

// Componente ConfirmDialog
const ConfirmDialog = React.forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    loading = false,
    showIcon = true,
    children,
    variant = 'default',
    className,
  }, ref) => {
    const IconComponent = variantIcons[variant || 'default']
    const iconColor = iconColors[variant || 'default']
    const buttonVariant = buttonVariants[variant || 'default']

    const handleConfirm = () => {
      if (loading) return
      onConfirm()
    }

    return (
      <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
        <AlertDialog.Portal>
          {/* Overlay */}
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          
          {/* Conteúdo do dialog */}
          <AlertDialog.Content
            className={cn(confirmDialogVariants({ variant }), className)}
          >
            <div className="flex gap-4">
              {/* Ícone */}
              {showIcon && (
                <div className="flex-shrink-0">
                  <IconComponent className={cn('h-6 w-6', iconColor)} />
                </div>
              )}
              
              {/* Conteúdo */}
              <div className="flex-1 space-y-2">
                {/* Título */}
                <AlertDialog.Title className="text-lg font-semibold leading-none tracking-tight text-text-primary">
                  {title}
                </AlertDialog.Title>
                
                {/* Descrição */}
                {description && (
                  <AlertDialog.Description className="text-sm text-text-muted">
                    {description}
                  </AlertDialog.Description>
                )}
                
                {/* Conteúdo customizado */}
                {children && (
                  <div className="pt-2">
                    {children}
                  </div>
                )}
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4">
              <AlertDialog.Cancel asChild>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              </AlertDialog.Cancel>
              
              <AlertDialog.Action asChild>
                <Button
                  variant={buttonVariant}
                  onClick={handleConfirm}
                  loading={loading}
                >
                  {confirmText}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    )
  }
)

// Hook para usar o ConfirmDialog de forma imperativa
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    props: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
    onConfirm: () => void
  } | null>(null)

  const confirm = React.useCallback((
    props: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        props,
        onConfirm: () => {
          resolve(true)
          setDialogState(null)
        },
      })
    })
  }, [])

  const close = React.useCallback(() => {
    setDialogState(null)
  }, [])

  const ConfirmDialogComponent = React.useMemo(() => {
    if (!dialogState) return null

    return (
      <ConfirmDialog
        {...dialogState.props}
        isOpen={dialogState.isOpen}
        onClose={close}
        onConfirm={dialogState.onConfirm}
      />
    )
  }, [dialogState, close])

  return {
    confirm,
    ConfirmDialogComponent,
  }
}

// Componentes pré-configurados para casos comuns
export const DeleteConfirmDialog = (props: Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'> & {
  itemName?: string
}) => (
  <ConfirmDialog
    {...props}
    variant="destructive"
    title={`Excluir ${props.itemName || 'item'}?`}
    confirmText="Excluir"
  />
)

export const CancelConfirmDialog = (props: Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'>) => (
  <ConfirmDialog
    {...props}
    variant="warning"
    title="Cancelar ação?"
    confirmText="Sim, cancelar"
  />
)

export const SaveConfirmDialog = (props: Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'>) => (
  <ConfirmDialog
    {...props}
    variant="success"
    title="Salvar alterações?"
    confirmText="Salvar"
  />
)

// Definir display names
ConfirmDialog.displayName = 'ConfirmDialog'
DeleteConfirmDialog.displayName = 'DeleteConfirmDialog'
CancelConfirmDialog.displayName = 'CancelConfirmDialog'
SaveConfirmDialog.displayName = 'SaveConfirmDialog'

export {
  ConfirmDialog,
  confirmDialogVariants,
}
