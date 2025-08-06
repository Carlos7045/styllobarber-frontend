'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { FormActions, FormSkeleton } from './form-field'

/**
 * Variantes do form usando CVA
 */
const formVariants = cva(
  // Classes base
  'space-y-6',
  {
    variants: {
      // Layout do formulário
      layout: {
        default: '',
        card: '',
        inline: 'space-y-4',
        compact: 'space-y-3',
      },
      
      // Tamanho do formulário
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'w-full',
      },
    },
    defaultVariants: {
      layout: 'default',
      size: 'lg',
    },
  }
)

/**
 * Interface das props do Form
 */
export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>,
    VariantProps<typeof formVariants> {
  /** Título do formulário */
  title?: string
  /** Descrição do formulário */
  description?: string
  /** Ícone do título */
  icon?: React.ReactNode
  /** Se está carregando */
  loading?: boolean
  /** Mensagem de erro geral */
  error?: string | null
  /** Mensagem de sucesso */
  success?: string | null
  /** Função de submissão */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  /** Botões de ação customizados */
  actions?: React.ReactNode
  /** Se deve mostrar ações padrão */
  showDefaultActions?: boolean
  /** Texto do botão de submit */
  submitText?: string
  /** Texto do botão de cancel */
  cancelText?: string
  /** Função de cancelamento */
  onCancel?: () => void
  /** Se o botão de submit está desabilitado */
  submitDisabled?: boolean
  /** Se está submetendo */
  isSubmitting?: boolean
  /** Se deve centralizar o formulário */
  centered?: boolean
  /** Skeleton durante carregamento inicial */
  skeleton?: boolean
  /** Número de campos no skeleton */
  skeletonFields?: number
}

/**
 * Componente Form
 * 
 * @description
 * Componente principal para formulários que inclui título, descrição,
 * tratamento de erros/sucesso, ações e estados de carregamento.
 * 
 * @example
 * ```tsx
 * <Form
 *   title="Criar Usuário"
 *   description="Preencha os dados do novo usuário"
 *   onSubmit={handleSubmit}
 *   submitText="Criar"
 *   onCancel={() => router.back()}
 *   isSubmitting={isLoading}
 *   error={error}
 * >
 *   <FormField label="Nome" required>
 *     <Input {...form.getFieldProps('name')} />
 *   </FormField>
 *   
 *   <FormField label="Email" required>
 *     <Input {...form.getFieldProps('email')} />
 *   </FormField>
 * </Form>
 * ```
 */
const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({
    className,
    layout,
    size,
    title,
    description,
    icon,
    loading = false,
    error,
    success,
    onSubmit,
    actions,
    showDefaultActions = true,
    submitText = 'Salvar',
    cancelText = 'Cancelar',
    onCancel,
    submitDisabled = false,
    isSubmitting = false,
    centered = false,
    skeleton = false,
    skeletonFields = 4,
    children,
    ...props
  }, ref) => {
    // Handler de submit
    const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (onSubmit) {
        await onSubmit(e)
      }
    }, [onSubmit])

    // Renderizar skeleton se necessário
    if (skeleton || loading) {
      const skeletonContent = (
        <FormSkeleton 
          fields={skeletonFields} 
          showActions={showDefaultActions}
        />
      )

      if (layout === 'card') {
        return (
          <div className={cn(
            formVariants({ size }),
            centered && 'mx-auto',
            className
          )}>
            <Card>
              {(title || description) && (
                <CardHeader>
                  {title && (
                    <CardTitle className="flex items-center gap-2">
                      {icon}
                      <div className="h-6 bg-neutral-light-gray animate-pulse rounded w-48" />
                    </CardTitle>
                  )}
                  {description && (
                    <CardDescription>
                      <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-64" />
                    </CardDescription>
                  )}
                </CardHeader>
              )}
              <CardContent>
                {skeletonContent}
              </CardContent>
            </Card>
          </div>
        )
      }

      return (
        <div className={cn(
          formVariants({ layout, size }),
          centered && 'mx-auto',
          className
        )}>
          {skeletonContent}
        </div>
      )
    }

    // Conteúdo do formulário
    const formContent = (
      <>
        {/* Mensagens globais */}
        {(error || success) && (
          <div className="space-y-2">
            {error && (
              <div className="flex items-start gap-2 p-4 bg-error/10 border border-error/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
                <p className="text-sm text-error">
                  {error}
                </p>
              </div>
            )}
            
            {success && (
              <div className="flex items-start gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-success">
                  {success}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo dos campos */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Ações */}
        {(actions || showDefaultActions) && (
          <FormActions>
            {actions || (
              <>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    {cancelText}
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={submitDisabled || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" variant="current" />
                      Salvando...
                    </div>
                  ) : (
                    submitText
                  )}
                </Button>
              </>
            )}
          </FormActions>
        )}
      </>
    )

    // Renderizar com card se necessário
    if (layout === 'card') {
      return (
        <div className={cn(
          formVariants({ size }),
          centered && 'mx-auto',
          className
        )}>
          <Card>
            {(title || description) && (
              <CardHeader>
                {title && (
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription>
                    {description}
                  </CardDescription>
                )}
              </CardHeader>
            )}
            <CardContent>
              <form
                ref={ref}
                onSubmit={handleSubmit}
                className={formVariants({ layout })}
                {...props}
              >
                {formContent}
              </form>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Renderizar formulário simples
    return (
      <div className={cn(
        formVariants({ size }),
        centered && 'mx-auto',
        className
      )}>
        {/* Header fora do card */}
        {(title || description) && (
          <div className="space-y-2 mb-6">
            {title && (
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                {icon}
                {title}
              </h1>
            )}
            {description && (
              <p className="text-text-secondary">
                {description}
              </p>
            )}
          </div>
        )}

        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={formVariants({ layout })}
          {...props}
        >
          {formContent}
        </form>
      </div>
    )
  }
)

/**
 * Componente FormProvider
 * 
 * @description
 * Context provider para compartilhar estado do formulário entre componentes.
 */
interface FormContextValue {
  isSubmitting: boolean
  hasErrors: boolean
  isDirty: boolean
}

const FormContext = React.createContext<FormContextValue | null>(null)

const useFormContextInternal = () => {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext deve ser usado dentro de um FormProvider')
  }
  return context
}

interface FormProviderProps {
  value: FormContextValue
  children: React.ReactNode
}

const FormProvider: React.FC<FormProviderProps> = ({ value, children }) => {
  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  )
}

// Display names
Form.displayName = 'Form'

export {
  Form,
  FormProvider,
  useFormContextInternal as useFormContext,
  formVariants,
}
