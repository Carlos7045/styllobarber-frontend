/**
 * Exemplo de hook de formulário com tipagem forte
 */

import { useState, useCallback, useMemo } from 'react'
import { UseFormOptions, UseFormReturn } from '@/shared/types/hooks'
import { ValidationResult, ValidationError } from '@/shared/types/base'

/**
 * Hook de formulário com tipagem genérica forte
 */
export function useTypedForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    initialValues,
    validationSchema,
    validate,
    onSubmit,
    onSubmitSuccess,
    onSubmitError,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnMount = false,
    enableReinitialize = false
  } = options

  // Estados do formulário
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)

  // Estados derivados
  const dirty = useMemo(() => {
    const dirtyFields = {} as Record<keyof T, boolean>
    for (const key in values) {
      dirtyFields[key] = values[key] !== initialValues[key]
    }
    return dirtyFields
  }, [values, initialValues])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  // Função de validação
  const validateForm = useCallback(async (): Promise<Record<keyof T, string>> => {
    setIsValidating(true)
    
    try {
      let formErrors: Record<keyof T, string> = {} as Record<keyof T, string>

      // Validação com schema (Zod, Yup, etc.)
      if (validationSchema) {
        try {
          await validationSchema.validate(values, { abortEarly: false })
        } catch (error: any) {
          if (error.inner) {
            error.inner.forEach((err: any) => {
              if (err.path) {
                formErrors[err.path as keyof T] = err.message
              }
            })
          }
        }
      }

      // Validação customizada
      if (validate) {
        const customErrors = validate(values)
        formErrors = { ...formErrors, ...customErrors }
      }

      setErrors(formErrors)
      return formErrors
    } finally {
      setIsValidating(false)
    }
  }, [values, validationSchema, validate])

  // Validação de campo individual
  const validateField = useCallback(async <K extends keyof T>(field: K): Promise<string> => {
    const fieldValue = values[field]
    let fieldError = ''

    // Validação com schema
    if (validationSchema) {
      try {
        await validationSchema.validateAt(field as string, values)
      } catch (error: any) {
        fieldError = error.message
      }
    }

    // Validação customizada
    if (validate && !fieldError) {
      const customErrors = validate(values)
      fieldError = customErrors[field] || ''
    }

    setErrors(prev => ({ ...prev, [field]: fieldError }))
    return fieldError
  }, [values, validationSchema, validate])

  // Métodos de campo
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    if (validateOnChange) {
      validateField(field)
    }
  }, [validateOnChange, validateField])

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
    
    if (validateOnBlur && isTouched) {
      validateField(field)
    }
  }, [validateOnBlur, validateField])

  // Métodos de formulário
  const handleChange = useCallback((e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    setFieldValue(name as keyof T, fieldValue)
  }, [setFieldValue])

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target
    setFieldTouched(name as keyof T, true)
  }, [setFieldTouched])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setSubmitCount(prev => prev + 1)
    
    // Marcar todos os campos como touched
    const allTouched = {} as Record<keyof T, boolean>
    for (const key in values) {
      allTouched[key] = true
    }
    setTouched(allTouched)

    // Validar formulário
    const formErrors = await validateForm()
    
    if (Object.keys(formErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(values)
      onSubmitSuccess?.(values)
    } catch (error) {
      onSubmitError?.(error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm, onSubmit, onSubmitSuccess, onSubmitError])

  const handleReset = useCallback(() => {
    setValues(initialValues)
    setErrors({} as Record<keyof T, string>)
    setTouched({} as Record<keyof T, boolean>)
    setSubmitCount(0)
  }, [initialValues])

  const resetForm = useCallback((nextState?: Partial<T>) => {
    const newValues = nextState ? { ...initialValues, ...nextState } : initialValues
    setValues(newValues)
    setErrors({} as Record<keyof T, string>)
    setTouched({} as Record<keyof T, boolean>)
    setSubmitCount(0)
  }, [initialValues])

  const submitForm = useCallback(async () => {
    await handleSubmit()
  }, [handleSubmit])

  // Utilitário para props de campo
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    name: field,
    value: values[field],
    onChange: (value: T[K]) => setFieldValue(field, value),
    onBlur: () => setFieldTouched(field, true),
    error: errors[field] || '',
    touched: touched[field] || false
  }), [values, errors, touched, setFieldValue, setFieldTouched])

  return {
    // Estados
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    isValidating,
    submitCount,

    // Métodos de campo
    setFieldValue,
    setFieldError,
    setFieldTouched,

    // Métodos de formulário
    setValues,
    setErrors,
    setTouched,
    setStatus: () => {}, // Implementar se necessário

    // Handlers
    handleSubmit,
    handleReset,
    handleChange,
    handleBlur,

    // Validação
    validateForm,
    validateField,

    // Utilitários
    getFieldProps,
    resetForm,
    submitForm
  }
}

// Exemplo de uso com tipos específicos
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export function useLoginForm() {
  return useTypedForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginFormData, string>> = {}
      
      if (!values.email) {
        errors.email = 'Email é obrigatório'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Email inválido'
      }
      
      if (!values.password) {
        errors.password = 'Senha é obrigatória'
      } else if (values.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres'
      }
      
      return errors as Record<keyof LoginFormData, string>
    },
    onSubmit: async (values) => {
      // Lógica de login
      console.log('Login:', values)
    },
    validateOnChange: true,
    validateOnBlur: true
  })
}

// Exemplo de uso com validação assíncrona
interface UserFormData {
  username: string
  email: string
  firstName: string
  lastName: string
}

export function useUserForm(initialData?: Partial<UserFormData>) {
  return useTypedForm<UserFormData>({
    initialValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      ...initialData
    },
    validate: async (values) => {
      const errors: Partial<Record<keyof UserFormData, string>> = {}
      
      // Validação síncrona
      if (!values.username) {
        errors.username = 'Username é obrigatório'
      }
      
      if (!values.email) {
        errors.email = 'Email é obrigatório'
      }
      
      // Validação assíncrona (exemplo)
      if (values.username && values.username.length >= 3) {
        try {
          // const isAvailable = await checkUsernameAvailability(values.username)
          // if (!isAvailable) {
          //   errors.username = 'Username já está em uso'
          // }
        } catch (error) {
          errors.username = 'Erro ao verificar disponibilidade'
        }
      }
      
      return errors as Record<keyof UserFormData, string>
    },
    onSubmit: async (values) => {
      // Lógica de criação/atualização de usuário
      console.log('User data:', values)
    }
  })
}