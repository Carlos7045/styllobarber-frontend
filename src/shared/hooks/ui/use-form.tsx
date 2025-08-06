import * as React from 'react'
import { z } from 'zod'

/**
 * Estado do formulário
 */
export interface FormState<T extends Record<string, any>> {
  /** Valores atuais do formulário */
  values: T
  /** Erros de validação por campo */
  errors: Partial<Record<keyof T, string>>
  /** Campos que foram tocados pelo usuário */
  touched: Partial<Record<keyof T, boolean>>
  /** Se o formulário está sendo submetido */
  isSubmitting: boolean
  /** Se o formulário é válido */
  isValid: boolean
  /** Se algum campo foi modificado */
  isDirty: boolean
  /** Número de tentativas de submissão */
  submitCount: number
}

/**
 * Ações do formulário
 */
export interface FormActions<T extends Record<string, any>> {
  /** Definir valor de um campo */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  /** Definir múltiplos valores */
  setValues: (values: Partial<T>) => void
  /** Definir erro de um campo */
  setError: <K extends keyof T>(field: K, error: string) => void
  /** Limpar erro de um campo */
  clearError: <K extends keyof T>(field: K) => void
  /** Limpar todos os erros */
  clearErrors: () => void
  /** Marcar campo como tocado */
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void
  /** Resetar formulário */
  reset: (values?: Partial<T>) => void
  /** Submeter formulário */
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  /** Validar formulário */
  validate: () => boolean
  /** Validar campo específico */
  validateField: <K extends keyof T>(field: K) => boolean
}

/**
 * Configuração do hook useForm
 */
export interface UseFormConfig<T extends Record<string, any>> {
  /** Valores iniciais */
  initialValues: T
  /** Schema de validação Zod */
  validationSchema?: z.ZodSchema<T>
  /** Função de submissão */
  onSubmit?: (values: T) => Promise<void> | void
  /** Validar ao alterar valores */
  validateOnChange?: boolean
  /** Validar ao perder foco */
  validateOnBlur?: boolean
  /** Callback de sucesso */
  onSuccess?: (values: T) => void
  /** Callback de erro */
  onError?: (error: Error) => void
}

/**
 * Resultado do hook useForm
 */
export interface UseFormResult<T extends Record<string, any>> 
  extends FormState<T>, FormActions<T> {
  /** Props para campos do formulário */
  getFieldProps: <K extends keyof T>(field: K) => {
    name: K
    value: T[K]
    onChange: (value: T[K]) => void
    onBlur: () => void
    error: string | null
    touched: boolean
  }
  /** Registrar campo (compatível com react-hook-form) */
  register: <K extends keyof T>(field: K) => {
    name: K
    value: T[K]
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
    onBlur: () => void
  }
}

/**
 * Hook personalizado para gerenciamento de formulários
 * 
 * @description
 * Hook completo para gerenciamento de estado de formulários com validação,
 * tratamento de erros e integração com componentes UI.
 * 
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   validationSchema: z.object({
 *     name: z.string().min(2),
 *     email: z.string().email()
 *   }),
 *   onSubmit: async (values) => {
 *     await api.createUser(values)
 *   }
 * })
 * 
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <Input {...form.getFieldProps('name')} />
 *     <Input {...form.getFieldProps('email')} />
 *     <Button type="submit" disabled={!form.isValid}>
 *       Submit
 *     </Button>
 *   </form>
 * )
 * ```
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  onSuccess,
  onError,
}: UseFormConfig<T>): UseFormResult<T> {
  // Estado do formulário
  const [values, setValuesState] = React.useState<T>(initialValues)
  const [errors, setErrorsState] = React.useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = React.useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitCount, setSubmitCount] = React.useState(0)

  // Valores iniciais para comparação
  const initialValuesRef = React.useRef(initialValues)

  // Calcular propriedades derivadas
  const isValid = React.useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  const isDirty = React.useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current)
  }, [values])

  // Função de validação
  const validateValue = React.useCallback(<K extends keyof T>(
    field: K, 
    value: T[K]
  ): string | null => {
    if (!validationSchema) return null

    try {
      // Validar apenas o campo específico
      // Validar o objeto inteiro e pegar erro do campo específico
      validationSchema.parse({ ...values, [field]: value })
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find((err: any) => 
          err.path.includes(field as string)
        )
        return fieldError?.message || 'Valor inválido'
      }
      return 'Erro de validação'
    }
  }, [validationSchema, values])

  // Validar formulário completo
  const validate = React.useCallback((): boolean => {
    if (!validationSchema) return true

    try {
      validationSchema.parse(values)
      setErrorsState({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {}
        error.issues.forEach((err: any) => {
          const field = err.path[0] as keyof T
          if (field) {
            newErrors[field] = err.message
          }
        })
        setErrorsState(newErrors)
      }
      return false
    }
  }, [validationSchema, values])

  // Validar campo específico
  const validateField = React.useCallback(<K extends keyof T>(field: K): boolean => {
    const error = validateValue(field, values[field])
    
    if (error) {
      setErrorsState(prev => ({ ...prev, [field]: error }))
      return false
    } else {
      setErrorsState(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      return true
    }
  }, [validateValue, values])

  // Ações do formulário
  const setValue = React.useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    
    if (validateOnChange) {
      // Validar após um pequeno delay para evitar validação excessiva
      setTimeout(() => validateField(field), 100)
    }
  }, [validateOnChange, validateField])

  const setValues = React.useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
    
    if (validateOnChange) {
      setTimeout(() => validate(), 100)
    }
  }, [validateOnChange, validate])

  const setError = React.useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearError = React.useCallback(<K extends keyof T>(field: K) => {
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrorsState({})
  }, [])

  const setTouched = React.useCallback(<K extends keyof T>(
    field: K, 
    isTouched: boolean = true
  ) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  const reset = React.useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...initialValues, ...newValues }
    setValuesState(resetValues)
    setErrorsState({})
    setTouchedState({})
    setIsSubmitting(false)
    setSubmitCount(0)
    initialValuesRef.current = resetValues
  }, [initialValues])

  const handleSubmit = React.useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    setSubmitCount(prev => prev + 1)
    
    // Marcar todos os campos como tocados
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Partial<Record<keyof T, boolean>>)
    setTouchedState(allTouched)

    // Validar formulário
    if (!validate()) {
      return
    }

    if (!onSubmit) {
      console.warn('useForm: onSubmit não foi fornecido')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(values)
      onSuccess?.(values)
    } catch (error) {
      console.error('Erro ao submeter formulário:', error)
      onError?.(error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit, onSuccess, onError])

  // Props para campos
  const getFieldProps = React.useCallback(<K extends keyof T>(field: K) => ({
    name: field,
    value: values[field],
    onChange: (value: T[K]) => setValue(field, value),
    onBlur: () => {
      setTouched(field, true)
      if (validateOnBlur) {
        validateField(field)
      }
    },
    error: errors[field] || null,
    touched: touched[field] || false,
  }), [values, errors, touched, setValue, setTouched, validateOnBlur, validateField])

  // Register para compatibilidade com inputs HTML
  const register = React.useCallback(<K extends keyof T>(field: K) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value as T[K]
      setValue(field, value)
    },
    onBlur: () => {
      setTouched(field, true)
      if (validateOnBlur) {
        validateField(field)
      }
    },
  }), [values, setValue, setTouched, validateOnBlur, validateField])

  return {
    // Estado
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    submitCount,
    
    // Ações
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    reset,
    handleSubmit,
    validate,
    validateField,
    
    // Utilitários
    getFieldProps,
    register,
  }
}
