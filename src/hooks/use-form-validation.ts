/**
 * Hook personalizado para formulários com validação robusta
 * Integra Zod, React Hook Form e tratamento de erros
 */

import { useState, useCallback } from 'react'
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { errorHandler, OperationResult } from '@/lib/error-handler'

interface UseFormValidationOptions<T extends FieldValues>
  extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<OperationResult<any>> | OperationResult<any>
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showSuccessToast?: boolean
  successMessage?: string
}

interface FormState {
  isSubmitting: boolean
  isValidating: boolean
  submitCount: number
  lastSubmitTime?: Date
}

export function useFormValidation<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  showSuccessToast = true,
  successMessage = 'Operação realizada com sucesso!',
  ...formOptions
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
  })

  // Configurar React Hook Form com Zod
  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    mode: 'onChange',
    ...formOptions,
  })

  // Validação em tempo real de campo individual
  const validateField = useCallback(
    async (fieldName: Path<T>, value: any): Promise<string | null> => {
      setFormState((prev) => ({ ...prev, isValidating: true }))

      try {
        // Criar objeto de teste com apenas o campo
        const testData = { [fieldName]: value } as any
        await schema.parseAsync(testData)
        return null
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.issues.find((issue) => issue.path.includes(fieldName as string))
          return fieldError?.message || 'Valor inválido'
        }
        return 'Erro de validação'
      } finally {
        setFormState((prev) => ({ ...prev, isValidating: false }))
      }
    },
    [schema]
  )

  // Validação completa do formulário
  const validateForm = useCallback(
    async (
      data: T
    ): Promise<{
      isValid: boolean
      errors?: Record<string, string>
    }> => {
      try {
        await schema.parseAsync(data)
        return { isValid: true }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Record<string, string> = {}

          error.issues.forEach((err) => {
            const path = err.path.join('.')
            errors[path] = err.message
          })

          return { isValid: false, errors }
        }

        return {
          isValid: false,
          errors: { general: 'Erro de validação desconhecido' },
        }
      }
    },
    [schema]
  )

  // Handler de submit com tratamento robusto de erros
  const handleSubmit = form.handleSubmit(async (data) => {
    // Prevenir múltiplos submits
    if (formState.isSubmitting) return

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
      lastSubmitTime: new Date(),
    }))

    try {
      // Validação final antes do submit
      const validation = await validateForm(data)
      if (!validation.isValid) {
        // Definir erros no formulário
        if (validation.errors) {
          Object.entries(validation.errors).forEach(([field, message]) => {
            form.setError(field as Path<T>, {
              type: 'validation',
              message,
            })
          })
        }
        return
      }

      // Executar operação com retry automático
      const result = await errorHandler.executeWithRetry(
        () => Promise.resolve(onSubmit(data as T)),
        {
          formData: data,
          submitCount: formState.submitCount,
          component: 'form-validation',
        }
      )

      if (result.success) {
        // Sucesso
        if (showSuccessToast && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('show-error-toast', {
              detail: {
                type: 'success',
                title: 'Sucesso',
                description: successMessage,
              },
            })
          )
        }

        // Callback de sucesso
        if (onSuccess) {
          onSuccess(result.data)
        }

        // Reset do formulário se necessário
        if (formOptions.shouldUnregister !== false) {
          form.reset()
        }
      } else {
        // Erro
        const error = result.error!

        // Tratar erros de validação específicos
        if (error.type === 'validation' && error.context?.fieldErrors) {
          Object.entries(error.context.fieldErrors).forEach(([field, message]) => {
            form.setError(field as Path<T>, {
              type: 'server',
              message: message as string,
            })
          })
        } else {
          // Erro geral
          form.setError('root', {
            type: 'server',
            message: error.message,
          })
        }

        // Callback de erro
        if (onError) {
          onError(error)
        }
      }
    } catch (error) {
      // Erro não tratado
      const structuredError = errorHandler.handleError(error as Error, true, {
        formData: data,
        component: 'form-validation',
      })

      form.setError('root', {
        type: 'unexpected',
        message: structuredError.message,
      })

      if (onError) {
        onError(structuredError)
      }
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }))
    }
  })

  // Limpar erro específico
  const clearFieldError = useCallback(
    (fieldName: Path<T>) => {
      form.clearErrors(fieldName)
    },
    [form]
  )

  // Limpar todos os erros
  const clearAllErrors = useCallback(() => {
    form.clearErrors()
  }, [form])

  // Reset do formulário com estado
  const resetForm = useCallback(
    (values?: T) => {
      form.reset(values)
      setFormState({
        isSubmitting: false,
        isValidating: false,
        submitCount: 0,
      })
    },
    [form]
  )

  // Validar e definir valor de campo
  const setFieldValue = useCallback(
    async (fieldName: Path<T>, value: any, shouldValidate = true) => {
      form.setValue(fieldName, value)

      if (shouldValidate) {
        const error = await validateField(fieldName, value)
        if (error) {
          form.setError(fieldName, { type: 'validation', message: error })
        } else {
          form.clearErrors(fieldName)
        }
      }
    },
    [form, validateField]
  )

  // Obter estado do campo
  const getFieldState = useCallback(
    (fieldName: Path<T>) => {
      const fieldState = form.getFieldState(fieldName)
      const value = form.getValues(fieldName)

      return {
        ...fieldState,
        value,
        hasError: !!fieldState.error,
        errorMessage: fieldState.error?.message,
      }
    },
    [form]
  )

  // Verificar se formulário pode ser submetido
  const canSubmit = useCallback(() => {
    return !formState.isSubmitting && !formState.isValidating && form.formState.isValid
  }, [formState, form.formState.isValid])

  return {
    // React Hook Form
    ...form,

    // Estado customizado
    formState: {
      ...form.formState,
      ...formState,
      canSubmit: canSubmit(),
    },

    // Handlers
    handleSubmit,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    resetForm,
    setFieldValue,
    getFieldState,

    // Utilitários
    canSubmit,
  }
}

// Hook simplificado para casos básicos
export function useSimpleForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void> | void,
  options?: Partial<UseFormValidationOptions<T>>
) {
  return useFormValidation({
    schema,
    onSubmit: async (data: T) => {
      await onSubmit(data)
      return { success: true } as OperationResult<any>
    },
    ...options,
  })
}
