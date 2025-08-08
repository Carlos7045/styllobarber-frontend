import { useCallback, useMemo, useRef } from 'react'
import { useStableCallback } from '@/shared/utils/memoization'

interface FormField {
  name: string
  value: any
  error?: string
  touched?: boolean
}

interface UseMemoizedFormProps<T extends Record<string, any>> {
  initialValues: T
  onSubmit: (values: T) => void | Promise<void>
  validate?: (values: T) => Record<string, string>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

interface UseMemoizedFormReturn<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (name: keyof T, value: any) => void
  handleBlur: (name: keyof T) => void
  handleSubmit: (e?: React.FormEvent) => void
  resetForm: () => void
  setFieldValue: (name: keyof T, value: any) => void
  setFieldError: (name: keyof T, error: string) => void
  getFieldProps: (name: keyof T) => {
    name: keyof T
    value: T[keyof T]
    onChange: (value: any) => void
    onBlur: () => void
    error: string | undefined
    touched: boolean
  }
}

/**
 * Hook memoizado para gerenciamento de formulários
 */
export function useMemoizedForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  validateOnChange = false,
  validateOnBlur = true
}: UseMemoizedFormProps<T>): UseMemoizedFormReturn<T> {
  const valuesRef = useRef<T>(initialValues)
  const errorsRef = useRef<Record<string, string>>({})
  const touchedRef = useRef<Record<string, boolean>>({})
  const isSubmittingRef = useRef(false)

  // Memoizar validação
  const validateForm = useCallback((values: T) => {
    if (!validate) return {}
    return validate(values)
  }, [validate])

  // Memoizar handler de mudança
  const handleChange = useStableCallback((name: keyof T, value: any) => {
    valuesRef.current = { ...valuesRef.current, [name]: value }
    
    if (validateOnChange) {
      const errors = validateForm(valuesRef.current)
      errorsRef.current = { ...errorsRef.current, [name as string]: errors[name as string] || '' }
    }
  }, [validateOnChange, validateForm])

  // Memoizar handler de blur
  const handleBlur = useStableCallback((name: keyof T) => {
    touchedRef.current = { ...touchedRef.current, [name as string]: true }
    
    if (validateOnBlur) {
      const errors = validateForm(valuesRef.current)
      errorsRef.current = { ...errorsRef.current, [name as string]: errors[name as string] || '' }
    }
  }, [validateOnBlur, validateForm])

  // Memoizar handler de submit
  const handleSubmit = useStableCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    isSubmittingRef.current = true
    
    // Validar todos os campos
    const errors = validateForm(valuesRef.current)
    errorsRef.current = errors
    
    // Marcar todos os campos como touched
    const touchedFields = Object.keys(valuesRef.current).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    touchedRef.current = touchedFields
    
    // Se não há erros, submeter
    if (Object.keys(errors).length === 0) {
      try {
        await onSubmit(valuesRef.current)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
    
    isSubmittingRef.current = false
  }, [onSubmit, validateForm])

  // Memoizar reset do formulário
  const resetForm = useStableCallback(() => {
    valuesRef.current = initialValues
    errorsRef.current = {}
    touchedRef.current = {}
    isSubmittingRef.current = false
  }, [initialValues])

  // Memoizar setter de valor de campo
  const setFieldValue = useStableCallback((name: keyof T, value: any) => {
    valuesRef.current = { ...valuesRef.current, [name]: value }
  }, [])

  // Memoizar setter de erro de campo
  const setFieldError = useStableCallback((name: keyof T, error: string) => {
    errorsRef.current = { ...errorsRef.current, [name as string]: error }
  }, [])

  // Memoizar props de campo
  const getFieldProps = useCallback((name: keyof T) => ({
    name,
    value: valuesRef.current[name],
    onChange: (value: any) => handleChange(name, value),
    onBlur: () => handleBlur(name),
    error: errorsRef.current[name as string],
    touched: touchedRef.current[name as string] || false
  }), [handleChange, handleBlur])

  // Memoizar estado de validação
  const isValid = useMemo(() => {
    return Object.keys(errorsRef.current).length === 0
  }, [errorsRef.current])

  return {
    values: valuesRef.current,
    errors: errorsRef.current,
    touched: touchedRef.current,
    isSubmitting: isSubmittingRef.current,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    getFieldProps
  }
}

/**
 * Hook para memoização de opções de select/dropdown
 */
export function useMemoizedOptions<T>(
  items: T[],
  labelKey: keyof T,
  valueKey: keyof T,
  filter?: (item: T) => boolean
) {
  return useMemo(() => {
    const filteredItems = filter ? items.filter(filter) : items
    
    return filteredItems.map(item => ({
      label: String(item[labelKey]),
      value: item[valueKey],
      item
    }))
  }, [items, labelKey, valueKey, filter])
}

/**
 * Hook para memoização de dados agrupados
 */
export function useMemoizedGroupBy<T>(
  items: T[],
  groupKey: keyof T | ((item: T) => string)
) {
  return useMemo(() => {
    const groups: Record<string, T[]> = {}
    
    items.forEach(item => {
      const key = typeof groupKey === 'function' 
        ? groupKey(item)
        : String(item[groupKey])
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    })
    
    return groups
  }, [items, groupKey])
}