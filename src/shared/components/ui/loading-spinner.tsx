import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

/**
 * Variantes do loading spinner usando CVA
 * 
 * @description
 * LoadingSpinner component para indicar estados de carregamento.
 * Suporta diferentes tamanhos, cores e estilos de animação.
 */
const loadingSpinnerVariants = cva(
  // Classes base
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      // Variantes de tamanho
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
        '2xl': 'h-16 w-16',
      },
      
      // Variantes de cor
      variant: {
        default: 'text-primary-gold',
        primary: 'text-primary-gold',
        secondary: 'text-secondary-graphite',
        muted: 'text-gray-400 dark:text-gray-500',
        white: 'text-white',
        current: 'text-current',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
      },
      
      // Velocidade da animação
      speed: {
        slow: 'animate-spin-slow',
        normal: 'animate-spin',
        fast: 'animate-spin-fast',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      speed: 'normal',
    },
  }
)

/**
 * Interface das props do LoadingSpinner
 */
export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  /** Texto do label para acessibilidade */
  label?: string
  /** Se deve mostrar o texto do label visualmente */
  showLabel?: boolean
  /** Posição do label em relação ao spinner */
  labelPosition?: 'right' | 'bottom'
  /** Se deve centralizar o spinner no container */
  centered?: boolean
  /** Overlay de fundo (para spinners de página inteira) */
  overlay?: boolean
}

/**
 * Componente LoadingSpinner
 * 
 * @description
 * Um spinner de carregamento animado para indicar que uma operação
 * está em andamento. Suporta diferentes tamanhos, cores e posições.
 * 
 * @example
 * ```tsx
 * <LoadingSpinner 
 *   size="lg"
 *   label="Carregando dados..."
 *   showLabel
 *   centered
 * />
 * ```
 */
const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size, 
    variant, 
    speed,
    label = 'Carregando...',
    showLabel = false,
    labelPosition = 'right',
    centered = false,
    overlay = false,
    ...props 
  }, ref) => {
    const containerClasses = cn(
      'flex items-center',
      {
        'justify-center': centered,
        'flex-col gap-2': labelPosition === 'bottom',
        'gap-2': labelPosition === 'right',
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm': overlay,
      }
    )

    return (
      <div 
        ref={ref} 
        className={cn(containerClasses, className)} 
        {...props}
      >
        <div
          className={cn(loadingSpinnerVariants({ size, variant, speed }))}
          role="status"
          aria-label={label}
        />
        
        {/* Label visível */}
        {showLabel && label && (
          <span className={cn(
            'text-sm text-text-secondary dark:text-gray-400',
            {
              'text-center': labelPosition === 'bottom',
              'text-white': overlay,
            }
          )}>
            {label}
          </span>
        )}
        
        {/* Screen reader only label */}
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

/**
 * Componente LoadingOverlay
 * 
 * @description
 * Um overlay de carregamento que cobre toda a tela ou um container específico.
 * Útil para operações que bloqueiam toda a interface.
 */
const LoadingOverlay = React.forwardRef<HTMLDivElement, Omit<LoadingSpinnerProps, 'overlay'>>(
  (props, ref) => {
    return <LoadingSpinner ref={ref} overlay centered showLabel {...props} />
  }
)

/**
 * Componente LoadingButton
 * 
 * @description
 * Um spinner pequeno ideal para usar dentro de botões durante operações.
 */
const LoadingButton = React.forwardRef<HTMLDivElement, Omit<LoadingSpinnerProps, 'size' | 'showLabel'>>(
  (props, ref) => {
    return (
      <LoadingSpinner 
        ref={ref} 
        size="sm" 
        variant="current" 
        showLabel={false}
        {...props} 
      />
    )
  }
)

// Display names
LoadingSpinner.displayName = 'LoadingSpinner'
LoadingOverlay.displayName = 'LoadingOverlay'
LoadingButton.displayName = 'LoadingButton'

export { 
  LoadingSpinner, 
  LoadingOverlay,
  LoadingButton,
  loadingSpinnerVariants 
}
