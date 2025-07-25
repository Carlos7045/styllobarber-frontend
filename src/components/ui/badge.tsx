import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variantes do badge usando CVA
const badgeVariants = cva(
  // Classes base
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      // Variantes de estilo
      variant: {
        default: 'border-transparent bg-neutral-light-gray text-text-secondary hover:bg-neutral-medium-gray/20',
        primary: 'border-transparent bg-primary-gold text-primary-black hover:bg-primary-gold-dark',
        secondary: 'border-transparent bg-secondary-graphite text-neutral-white hover:bg-secondary-graphite-light',
        success: 'border-transparent bg-success text-neutral-white hover:bg-success-dark',
        warning: 'border-transparent bg-warning text-primary-black hover:bg-warning-dark',
        error: 'border-transparent bg-error text-neutral-white hover:bg-error-dark',
        info: 'border-transparent bg-info text-neutral-white hover:bg-info-dark',
        outline: 'border-border-default text-text-primary hover:bg-neutral-light-gray',
        'outline-primary': 'border-primary-gold text-primary-gold hover:bg-primary-gold/10',
        'outline-success': 'border-success text-success hover:bg-success/10',
        'outline-warning': 'border-warning text-warning hover:bg-warning/10',
        'outline-error': 'border-error text-error hover:bg-error/10',
        'outline-info': 'border-info text-info hover:bg-info/10',
      },
      
      // Variantes de tamanho
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      
      // Forma do badge
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
    },
  }
)

// Interface das props do badge
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

// Componente Badge
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    shape,
    leftIcon,
    rightIcon,
    removable = false,
    onRemove,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape, className }))}
        {...props}
      >
        {/* Ícone à esquerda */}
        {leftIcon && (
          <span className="mr-1 flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Conteúdo do badge */}
        <span className="truncate">
          {children}
        </span>
        
        {/* Ícone à direita */}
        {rightIcon && !removable && (
          <span className="ml-1 flex-shrink-0">
            {rightIcon}
          </span>
        )}
        
        {/* Botão de remover */}
        {removable && (
          <button
            type="button"
            className="ml-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
            onClick={onRemove}
            aria-label="Remover"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

// Componente BadgeGroup para agrupar badges
const BadgeGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'tight' | 'normal' | 'loose'
    wrap?: boolean
  }
>(({ className, spacing = 'normal', wrap = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      {
        'gap-1': spacing === 'tight',
        'gap-2': spacing === 'normal',
        'gap-3': spacing === 'loose',
        'flex-wrap': wrap,
        'flex-nowrap': !wrap,
      },
      className
    )}
    {...props}
  />
))

// Componente BadgeStatus para status específicos
const BadgeStatus = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, 'variant'> & {
    status: 'online' | 'offline' | 'busy' | 'away' | 'pending'
  }
>(({ status, className, ...props }, ref) => {
  const statusConfig = {
    online: { variant: 'success' as const, text: 'Online' },
    offline: { variant: 'default' as const, text: 'Offline' },
    busy: { variant: 'error' as const, text: 'Ocupado' },
    away: { variant: 'warning' as const, text: 'Ausente' },
    pending: { variant: 'info' as const, text: 'Pendente' },
  }
  
  const config = statusConfig[status]
  
  return (
    <Badge
      ref={ref}
      variant={config.variant}
      className={cn('gap-1', className)}
      {...props}
    >
      <div className={cn(
        'h-2 w-2 rounded-full',
        {
          'bg-success-light': status === 'online',
          'bg-neutral-medium-gray': status === 'offline',
          'bg-error-light': status === 'busy',
          'bg-warning-light': status === 'away',
          'bg-info-light': status === 'pending',
        }
      )} />
      {config.text}
    </Badge>
  )
})

// Definir display names
Badge.displayName = 'Badge'
BadgeGroup.displayName = 'BadgeGroup'
BadgeStatus.displayName = 'BadgeStatus'

export { Badge, BadgeGroup, BadgeStatus, badgeVariants }