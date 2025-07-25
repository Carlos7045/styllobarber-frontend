import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variantes do textarea usando CVA
const textareaVariants = cva(
  // Classes base
  'flex min-h-[80px] w-full rounded-lg border bg-background-primary px-3 py-2 text-sm transition-all duration-200 placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
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
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
        xl: 'min-h-[160px] px-5 py-4 text-lg',
      },
      
      // Controle de resize
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  }
)

// Interface das props do textarea
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: string
  helperText?: string
  label?: string
  required?: boolean
  maxLength?: number
  showCharCount?: boolean
}

// Componente Textarea
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    resize,
    error,
    helperText,
    label,
    required,
    id,
    maxLength,
    showCharCount = false,
    value,
    ...props 
  }, ref) => {
    // Gerar ID único se não fornecido
    const generatedId = React.useId()
    const textareaId = id || generatedId
    
    // Determinar variante baseada no erro
    const finalVariant = error ? 'error' : variant
    
    // Contar caracteres se necessário
    const charCount = typeof value === 'string' ? value.length : 0
    
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label 
            htmlFor={textareaId}
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
        
        {/* Textarea */}
        <textarea
          id={textareaId}
          className={cn(textareaVariants({ variant: finalVariant, size, resize, className }))}
          ref={ref}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : 
            helperText ? `${textareaId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {/* Container para mensagens e contador */}
        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {/* Mensagem de erro */}
            {error && (
              <p 
                id={`${textareaId}-error`}
                className="text-xs text-error"
                role="alert"
              >
                {error}
              </p>
            )}
            
            {/* Texto de ajuda */}
            {helperText && !error && (
              <p 
                id={`${textareaId}-helper`}
                className="text-xs text-text-muted"
              >
                {helperText}
              </p>
            )}
          </div>
          
          {/* Contador de caracteres */}
          {showCharCount && maxLength && (
            <p className={cn(
              'text-xs ml-2 flex-shrink-0',
              charCount > maxLength * 0.9 ? 'text-warning' : 'text-text-muted',
              charCount >= maxLength ? 'text-error' : ''
            )}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }