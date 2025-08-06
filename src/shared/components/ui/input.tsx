import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do input usando CVA
const inputVariants = cva(
  // Classes base - usando variáveis CSS padronizadas
  'flex w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      // Variantes de estilo - usando classes CSS padronizadas
      variant: {
        default: 'hover:border-primary-gold',
        error: 'error',
        success: 'success',
        warning: 'border-warning text-warning focus-visible:ring-warning',
      },
      
      // Variantes de tamanho
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Interface das props do input
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  helperText?: string
  label?: string
  required?: boolean
}

// Componente Input
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type = 'text',
    leftIcon,
    rightIcon,
    error,
    helperText,
    label,
    required,
    id,
    ...props 
  }, ref) => {
    // Gerar ID único se não fornecido
    const generatedId = React.useId()
    const inputId = id || generatedId
    
    // Determinar variante baseada no erro
    const finalVariant = error ? 'error' : variant
    
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium mb-2"
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="obrigatório">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Container do input */}
        <div className="relative">
          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: finalVariant, size, className }),
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              'relative z-1'
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />
          
          {/* Ícone à esquerda */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 pointer-events-none z-30">
              {leftIcon}
            </div>
          )}
          
          {/* Ícone à direita */}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 pointer-events-none z-30">
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-1 text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {/* Texto de ajuda */}
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-1 text-xs text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }
