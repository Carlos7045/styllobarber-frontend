import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variantes do input usando CVA
const inputVariants = cva(
  // Classes base
  'flex w-full rounded-lg border bg-background-primary px-3 py-2 text-sm text-text-primary transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      // Variantes de estilo
      variant: {
        default: 'border-border-default hover:border-primary-gold',
        error: 'border-error text-error focus-visible:ring-error',
        success: 'border-success text-success focus-visible:ring-success',
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
            className="block text-sm font-medium text-text-primary mb-2"
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
          {/* Ícone à esquerda */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </div>
          )}
          
          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: finalVariant, size, className }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
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
          
          {/* Ícone à direita */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
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
            className="mt-1 text-xs text-text-secondary"
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