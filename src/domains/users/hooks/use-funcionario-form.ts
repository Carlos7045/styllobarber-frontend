/**
 * Hook para gerenciar formulário de funcionário com validações robustas
 */

import { useState, useCallback, useEffect } from 'react'
import { FuncionarioValidator, type ValidationResult } from '@/domains/users/services/funcionario-validator'

export interface FuncionarioFormData {
  nome: string
  email: string
  telefone: string
  role: 'admin' | 'barber'
  especialidades: string[]
}

export interface FuncionarioFormErrors {
  nome?: string
  email?: string
  telefone?: string
  role?: string
  especialidades?: string
  general?: string
}

export interface FuncionarioFormWarnings {
  nome?: string
  email?: string
  telefone?: string
  role?: string
  especialidades?: string
}

export interface UseFuncionarioFormOptions {
  mode: 'create' | 'update'
  funcionarioId?: string
  initialData?: Partial<FuncionarioFormData>
  onValidationChange?: (isValid: boolean) => void
}

export interface UseFuncionarioFormReturn {
  // Dados do formulário
  data: FuncionarioFormData
  errors: FuncionarioFormErrors
  warnings: FuncionarioFormWarnings
  
  // Estados
  isValid: boolean
  isValidating: boolean
  isDirty: boolean
  
  // Ações
  setField: (field: keyof FuncionarioFormData, value: any) => void
  setData: (data: Partial<FuncionarioFormData>) => void
  validate: () => Promise<ValidationResult>
  validateField: (field: keyof FuncionarioFormData) => Promise<void>
  reset: () => void
  
  // Utilitários
  getFieldProps: (field: keyof FuncionarioFormData) => {
    value: any
    onChange: (value: any) => void
    onBlur: () => void
    error: string | undefined
    warning: string | undefined
  }
}

const initialFormData: FuncionarioFormData = {
  nome: '',
  email: '',
  telefone: '',
  role: 'barber',
  especialidades: []
}

export function useFuncionarioForm(options: UseFuncionarioFormOptions): UseFuncionarioFormReturn {
  const { mode, funcionarioId, initialData, onValidationChange } = options
  
  // Estados do formulário
  const [data, setDataState] = useState<FuncionarioFormData>({
    ...initialFormData,
    ...initialData
  })
  
  const [errors, setErrors] = useState<FuncionarioFormErrors>({})
  const [warnings, setWarnings] = useState<FuncionarioFormWarnings>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<keyof FuncionarioFormData>>(new Set())

  // Validação completa do formulário
  const validate = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true)
    
    try {
      let validationResult: ValidationResult
      
      if (mode === 'create') {
        validationResult = await FuncionarioValidator.validateCreate(data)
      } else {
        if (!funcionarioId) {
          throw new Error('ID do funcionário é obrigatório para atualização')
        }
        validationResult = await FuncionarioValidator.validateUpdate({
          id: funcionarioId,
          ...data
        })
      }
      
      // Processar erros
      const newErrors: FuncionarioFormErrors = {}
      const newWarnings: FuncionarioFormWarnings = {}
      
      validationResult.errors.forEach(error => {
        if (error.field === 'general') {
          newErrors.general = error.message
        } else {
          newErrors[error.field as keyof FuncionarioFormErrors] = error.message
        }
      })
      
      validationResult.warnings?.forEach(warning => {
        if (warning.field !== 'general') {
          newWarnings[warning.field as keyof FuncionarioFormWarnings] = warning.message
        }
      })
      
      setErrors(newErrors)
      setWarnings(newWarnings)
      
      return validationResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação'
      setErrors({ general: errorMessage })
      
      return {
        isValid: false,
        errors: [{ field: 'general', message: errorMessage, code: 'VALIDATION_ERROR' }]
      }
    } finally {
      setIsValidating(false)
    }
  }, [data, mode, funcionarioId])

  // Validação de campo específico
  const validateField = useCallback(async (field: keyof FuncionarioFormData): Promise<void> => {
    // Só validar se o campo foi tocado
    if (!touchedFields.has(field)) return
    
    setIsValidating(true)
    
    try {
      // Criar dados temporários apenas com o campo alterado
      const tempData = mode === 'create' ? data : { [field]: data[field] }
      
      let validationResult: ValidationResult
      
      if (mode === 'create') {
        validationResult = await FuncionarioValidator.validateCreate(tempData as FuncionarioFormData)
      } else {
        if (!funcionarioId) return
        validationResult = await FuncionarioValidator.validateUpdate({
          id: funcionarioId,
          ...tempData
        })
      }
      
      // Atualizar apenas o erro/warning deste campo
      setErrors(prev => ({
        ...prev,
        [field]: validationResult.errors.find(e => e.field === field)?.message
      }))
      
      setWarnings(prev => ({
        ...prev,
        [field]: validationResult.warnings?.find(w => w.field === field)?.message
      }))
      
    } catch (error) {
      console.warn(`Erro na validação do campo ${field}:`, error)
    } finally {
      setIsValidating(false)
    }
  }, [data, mode, funcionarioId, touchedFields])

  // Definir campo
  const setField = useCallback((field: keyof FuncionarioFormData, value: any) => {
    setDataState(prev => ({
      ...prev,
      [field]: value
    }))
    
    setIsDirty(true)
    
    // Marcar campo como tocado
    setTouchedFields(prev => new Set(prev).add(field))
    
    // Limpar erro do campo
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }))
    
    // Validar campo após um delay
    setTimeout(() => {
      validateField(field)
    }, 500)
  }, [validateField])

  // Definir dados completos
  const setData = useCallback((newData: Partial<FuncionarioFormData>) => {
    setDataState(prev => ({
      ...prev,
      ...newData
    }))
    setIsDirty(true)
  }, [])

  // Reset do formulário
  const reset = useCallback(() => {
    setDataState({
      ...initialFormData,
      ...initialData
    })
    setErrors({})
    setWarnings({})
    setIsDirty(false)
    setTouchedFields(new Set())
  }, [initialData])

  // Props para campos
  const getFieldProps = useCallback((field: keyof FuncionarioFormData) => ({
    value: data[field],
    onChange: (value: any) => setField(field, value),
    onBlur: () => {
      setTouchedFields(prev => new Set(prev).add(field))
      validateField(field)
    },
    error: errors[field],
    warning: warnings[field]
  }), [data, errors, warnings, setField, validateField])

  // Calcular se é válido
  const isValid = Object.keys(errors).length === 0 && !errors.general

  // Notificar mudanças de validação
  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return {
    data,
    errors,
    warnings,
    isValid,
    isValidating,
    isDirty,
    setField,
    setData,
    validate,
    validateField,
    reset,
    getFieldProps
  }
}

// Hook para formatação de telefone brasileiro
export function usePhoneFormatter() {
  const formatPhone = useCallback((value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica formatação baseada no tamanho
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }, [])

  return { formatPhone }
}

// Hook para validação em tempo real
export function useRealTimeValidation(
  field: keyof FuncionarioFormData,
  value: any,
  validator: (value: any) => string | undefined
) {
  const [error, setError] = useState<string>()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!value) {
      setError(undefined)
      return
    }

    setIsValidating(true)
    
    const timeoutId = setTimeout(() => {
      const validationError = validator(value)
      setError(validationError)
      setIsValidating(false)
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      setIsValidating(false)
    }
  }, [value, validator])

  return { error, isValidating }
}