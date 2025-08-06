import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

/**
 * Variantes do switch usando CVA
 * 
 * @description
 * Switch component para alternar entre estados on/off.
 * Suporta diferentes tamanhos, variantes de cor e estados.
 */
const switchVariants = cva(
  // Classes base
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-secondary-graphite-light disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      // Variantes de cor
      variant: {
        default: 'data-[state=checked]:bg-primary-gold data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
        success: 'data-[state=checked]:bg-success data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
        warning: 'data-[state=checked]:bg-warning data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
        error: 'data-[state=checked]:bg-error data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
      },
      
      // Variantes de tamanho
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Variantes do thumb (bolinha interna)
const thumbVariants = cva(
  // Classes base
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

/**
 * Interface das props do Switch
 */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  /** Estado checked do switch */
  checked?: boolean
  /** Callback chamado quando o estado muda */
  onCheckedChange?: (checked: boolean) => void
  /** Label para acessibilidade */
  label?: string
  /** Texto de ajuda */
  helperText?: string
  /** Se deve mostrar o estado como texto */
  showStateText?: boolean
  /** Textos customizados para os estados */
  stateTexts?: {
    checked: string
    unchecked: string
  }
}

/**
 * Componente Switch
 * 
 * @description
 * Um switch (interruptor) permite ao usuário alternar entre dois estados.
 * Ideal para configurações on/off, ativar/desativar funcionalidades, etc.
 * 
 * @example
 * ```tsx
 * <Switch 
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 *   label="Ativar notificações"
 *   helperText="Receba notificações por email"
 * />
 * ```
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ 
    id,
    checked = false, 
    onCheckedChange, 
    disabled = false, 
    variant,
    size,
    label,
    helperText,
    showStateText = false,
    stateTexts = { checked: 'Ativado', unchecked: 'Desativado' },
    className, 
    ...props 
  }, ref) => {
    // Gerar ID único se não fornecido
    const generatedId = React.useId()
    const switchId = id || generatedId
    
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        handleClick()
      }
    }

    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label ? `${switchId}-label` : undefined}
          aria-describedby={helperText ? `${switchId}-helper` : undefined}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          data-state={checked ? 'checked' : 'unchecked'}
          className={cn(switchVariants({ variant, size }), className)}
          {...props}
        >
          <span
            data-state={checked ? 'checked' : 'unchecked'}
            className={cn(thumbVariants({ size }))}
          />
        </button>
        
        {/* Label e textos */}
        {(label || showStateText) && (
          <div className="flex flex-col">
            {label && (
              <label 
                id={`${switchId}-label`}
                htmlFor={switchId}
                className="text-sm font-medium text-text-primary dark:text-white cursor-pointer"
              >
                {label}
              </label>
            )}
            
            {showStateText && (
              <span className="text-xs text-text-secondary dark:text-gray-400">
                {checked ? stateTexts.checked : stateTexts.unchecked}
              </span>
            )}
            
            {helperText && (
              <p 
                id={`${switchId}-helper`}
                className="text-xs text-text-secondary dark:text-gray-400 mt-1"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch, switchVariants }
