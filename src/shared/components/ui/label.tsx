import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

/**
 * Variantes do label usando CVA
 * 
 * @description
 * Label component para identificar campos de formulário e outros elementos.
 * Suporta diferentes tamanhos, variantes de cor e estados.
 */
const labelVariants = cva(
  // Classes base
  'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200',
  {
    variants: {
      // Variantes de tamanho
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      
      // Variantes de cor/estado
      variant: {
        default: 'text-text-primary dark:text-white',
        secondary: 'text-text-secondary dark:text-gray-300',
        muted: 'text-text-muted dark:text-gray-400',
        error: 'text-error',
        success: 'text-success',
        warning: 'text-warning',
      },
      
      // Peso da fonte
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'default',
      weight: 'medium',
    },
  }
)

/**
 * Interface das props do Label
 */
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /** Se o campo é obrigatório (mostra asterisco) */
  required?: boolean
  /** Texto de ajuda opcional */
  helperText?: string
  /** Se deve mostrar dois pontos após o texto */
  showColon?: boolean
  /** Ícone opcional antes do texto */
  icon?: React.ReactNode
}

/**
 * Componente Label
 * 
 * @description
 * Um label identifica e descreve um elemento de interface, especialmente
 * campos de formulário. Suporta indicação de campos obrigatórios,
 * texto de ajuda e diferentes estilos visuais.
 * 
 * @example
 * ```tsx
 * <Label 
 *   htmlFor="email"
 *   required
 *   helperText="Seu email principal"
 * >
 *   Email
 * </Label>
 * ```
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ 
    className, 
    size,
    variant,
    weight,
    required = false,
    helperText,
    showColon = false,
    icon,
    children, 
    ...props 
  }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label
          ref={ref}
          className={cn(labelVariants({ size, variant, weight }), className)}
          {...props}
        >
          <span className="flex items-center gap-2">
            {/* Ícone opcional */}
            {icon && (
              <span className="flex-shrink-0">
                {icon}
              </span>
            )}
            
            {/* Texto do label */}
            <span>
              {children}
              {showColon && ':'}
            </span>
            
            {/* Indicador de obrigatório */}
            {required && (
              <span 
                className="text-error ml-1" 
                aria-label="campo obrigatório"
                title="Campo obrigatório"
              >
                *
              </span>
            )}
          </span>
        </label>
        
        {/* Texto de ajuda */}
        {helperText && (
          <p className="text-xs text-text-secondary dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Label.displayName = 'Label'

export { Label, labelVariants }
