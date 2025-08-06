import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { Label } from '@/shared/components/ui/label'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

/**
 * Variantes do form field usando CVA
 */
const formFieldVariants = cva(
  // Classes base
  'space-y-2',
  {
    variants: {
      // Estado do campo
      state: {
        default: '',
        error: '',
        success: '',
        warning: '',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
)

/**
 * Interface das props do FormField
 */
export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  /** Label do campo */
  label?: string
  /** Se o campo é obrigatório */
  required?: boolean
  /** Mensagem de erro */
  error?: string | null
  /** Mensagem de sucesso */
  success?: string | null
  /** Texto de ajuda */
  helperText?: string
  /** Se deve mostrar indicador de validação */
  showValidation?: boolean
  /** ID do campo para associar com label */
  htmlFor?: string
  /** Ícone customizado */
  icon?: React.ReactNode
  /** Posição do label */
  labelPosition?: 'top' | 'left' | 'floating'
  /** Tamanho do label quando em posição left */
  labelWidth?: 'sm' | 'md' | 'lg'
}

/**
 * Componente FormField
 * 
 * @description
 * Container para campos de formulário que inclui label, mensagens de erro/sucesso,
 * texto de ajuda e indicadores visuais de validação.
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   required
 *   error={errors.email}
 *   helperText="Seu email principal"
 *   htmlFor="email"
 * >
 *   <Input id="email" type="email" />
 * </FormField>
 * ```
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    className,
    state,
    label,
    required = false,
    error,
    success,
    helperText,
    showValidation = true,
    htmlFor,
    icon,
    labelPosition = 'top',
    labelWidth = 'md',
    children,
    ...props
  }, ref) => {
    // Determinar estado baseado nas props
    const fieldState = error ? 'error' : success ? 'success' : state || 'default'
    
    // Gerar ID único se não fornecido
    const generatedId = React.useId()
    const fieldId = htmlFor || generatedId

    // Classes do label baseado na posição
    const labelClasses = cn(
      labelPosition === 'left' && 'flex items-center',
      labelPosition === 'left' && {
        'w-24': labelWidth === 'sm',
        'w-32': labelWidth === 'md',
        'w-40': labelWidth === 'lg',
      }
    )

    // Container classes baseado na posição do label
    const containerClasses = cn(
      labelPosition === 'left' && 'flex gap-4 items-start',
      labelPosition === 'floating' && 'relative'
    )

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ state: fieldState }), containerClasses, className)}
        {...props}
      >
        {/* Label */}
        {label && labelPosition !== 'floating' && (
          <div className={labelClasses}>
            {icon && (
              <span className="mr-2 text-text-secondary">
                {icon}
              </span>
            )}
            <Label
              htmlFor={fieldId}
              required={required}
              variant={fieldState === 'error' ? 'error' : 'default'}
              className={labelPosition === 'left' ? 'mb-0' : ''}
            >
              {label}
            </Label>
          </div>
        )}

        {/* Campo e mensagens */}
        <div className={cn(
          'flex-1 space-y-1',
          labelPosition === 'floating' && 'relative'
        )}>
          {/* Container do campo */}
          <div className="relative">
            {children}
            
            {/* Label flutuante */}
            {label && labelPosition === 'floating' && (
              <Label
                htmlFor={fieldId}
                required={required}
                variant={fieldState === 'error' ? 'error' : 'default'}
                className="absolute left-3 top-2 text-xs text-text-secondary transition-all duration-200 pointer-events-none"
              >
                {label}
              </Label>
            )}
            
            {/* Indicador de validação */}
            {showValidation && (fieldState === 'error' || fieldState === 'success') && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {fieldState === 'error' && (
                  <AlertCircle className="h-4 w-4 text-error" />
                )}
                {fieldState === 'success' && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
            )}
          </div>

          {/* Mensagens */}
          <div className="min-h-[1.25rem]">
            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-start gap-1">
                <AlertCircle className="h-3 w-3 text-error mt-0.5 flex-shrink-0" />
                <p className="text-xs text-error leading-tight">
                  {error}
                </p>
              </div>
            )}
            
            {/* Mensagem de sucesso */}
            {success && !error && (
              <div className="flex items-start gap-1">
                <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-success leading-tight">
                  {success}
                </p>
              </div>
            )}
            
            {/* Texto de ajuda */}
            {helperText && !error && !success && (
              <div className="flex items-start gap-1">
                <Info className="h-3 w-3 text-text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-secondary leading-tight">
                  {helperText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

/**
 * Componente FormFieldGroup
 * 
 * @description
 * Agrupa múltiplos FormFields com espaçamento consistente.
 */
const FormFieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string
    description?: string
    spacing?: 'tight' | 'normal' | 'loose'
    columns?: 1 | 2 | 3 | 4
    responsive?: boolean
  }
>(({ 
  className, 
  title, 
  description, 
  spacing = 'normal',
  columns = 1,
  responsive = true,
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('space-y-4', className)}
    {...props}
  >
    {/* Header do grupo */}
    {(title || description) && (
      <div className="space-y-1">
        {title && (
          <h3 className="text-lg font-semibold text-text-primary">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
    )}

    {/* Grid de campos */}
    <div className={cn(
      'grid gap-4',
      {
        'gap-2': spacing === 'tight',
        'gap-4': spacing === 'normal',
        'gap-6': spacing === 'loose',
      },
      {
        'grid-cols-1': columns === 1,
        'grid-cols-2': columns === 2,
        'grid-cols-3': columns === 3,
        'grid-cols-4': columns === 4,
      },
      responsive && {
        'sm:grid-cols-2': columns >= 2,
        'md:grid-cols-3': columns >= 3,
        'lg:grid-cols-4': columns >= 4,
      }
    )}>
      {children}
    </div>
  </div>
))

/**
 * Componente FormActions
 * 
 * @description
 * Container para ações do formulário (botões de submit, cancel, etc.).
 */
const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right' | 'between'
    spacing?: 'tight' | 'normal' | 'loose'
    sticky?: boolean
  }
>(({ 
  className, 
  align = 'right',
  spacing = 'normal',
  sticky = false,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center border-t border-border-default pt-6 mt-8',
      {
        'justify-start': align === 'left',
        'justify-center': align === 'center',
        'justify-end': align === 'right',
        'justify-between': align === 'between',
      },
      {
        'gap-2': spacing === 'tight',
        'gap-3': spacing === 'normal',
        'gap-4': spacing === 'loose',
      },
      sticky && 'sticky bottom-0 bg-background-primary z-10 -mx-6 px-6 py-4 border-t shadow-lg',
      className
    )}
    {...props}
  />
))

/**
 * Componente FormSkeleton
 * 
 * @description
 * Skeleton loader para formulários durante carregamento.
 */
const FormSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    fields?: number
    showActions?: boolean
  }
>(({ className, fields = 4, showActions = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-6 animate-pulse', className)}
    {...props}
  >
    {/* Campos skeleton */}
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        {/* Label skeleton */}
        <div className="h-4 bg-neutral-light-gray rounded w-24" />
        {/* Input skeleton */}
        <div className="h-10 bg-neutral-light-gray rounded" />
        {/* Helper text skeleton */}
        <div className="h-3 bg-neutral-light-gray rounded w-48" />
      </div>
    ))}

    {/* Actions skeleton */}
    {showActions && (
      <div className="flex justify-end gap-3 border-t pt-6">
        <div className="h-10 bg-neutral-light-gray rounded w-20" />
        <div className="h-10 bg-neutral-light-gray rounded w-32" />
      </div>
    )}
  </div>
))

// Display names
FormField.displayName = 'FormField'
FormFieldGroup.displayName = 'FormFieldGroup'
FormActions.displayName = 'FormActions'
FormSkeleton.displayName = 'FormSkeleton'

export {
  FormField,
  FormFieldGroup,
  FormActions,
  FormSkeleton,
  formFieldVariants,
}
