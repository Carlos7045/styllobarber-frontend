import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do botão usando CVA (Class Variance Authority)
const buttonVariants = cva(
  // Classes base - aplicadas a todos os botões
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      // Variantes de estilo
      variant: {
        // Botão primário - dourado
        primary: 'bg-primary-gold text-primary-black hover:bg-primary-gold-dark shadow-gold hover:shadow-gold-lg',
        
        // Botão secundário - grafite
        secondary: 'bg-secondary-graphite text-neutral-white hover:bg-secondary-graphite-light shadow-dark hover:shadow-dark-lg',
        
        // Botão de contorno - apenas borda
        outline: 'border-2 border-primary-gold text-primary-gold bg-transparent hover:bg-primary-gold hover:text-primary-black',
        
        // Botão fantasma - sem fundo
        ghost: 'text-primary-gold hover:bg-primary-gold/10 hover:text-primary-gold-dark',
        
        // Botão de link - aparência de link
        link: 'text-primary-gold underline-offset-4 hover:underline hover:text-primary-gold-dark',
        
        // Botão destrutivo - vermelho
        destructive: 'bg-error text-neutral-white hover:bg-error-dark shadow-sm hover:shadow-md',
        
        // Botão de sucesso - verde
        success: 'bg-success text-neutral-white hover:bg-success-dark shadow-sm hover:shadow-md',
        
        // Botão de aviso - amarelo
        warning: 'bg-warning text-primary-black hover:bg-warning-dark shadow-sm hover:shadow-md',
      },
      
      // Variantes de tamanho
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0', // Para botões apenas com ícone
      },
      
      // Estado de loading
      loading: {
        true: 'cursor-wait opacity-75',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      loading: false,
    },
  }
)

// Interface das props do botão
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Componente Button
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    asChild = false, 
    children,
    leftIcon,
    rightIcon,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Ícone à esquerda */}
        {leftIcon && !loading && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Indicador de loading */}
        {loading && (
          <span className="flex-shrink-0">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {/* Conteúdo do botão */}
        <span className={cn(loading && 'opacity-0')}>
          {children}
        </span>
        
        {/* Ícone à direita */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
