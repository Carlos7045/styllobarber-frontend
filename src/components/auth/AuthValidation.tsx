'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'

// Tipos para validação
export interface ValidationRule {
  test: (value: string) => boolean
  message: string
  type: 'error' | 'warning' | 'success'
}

export interface ValidationResult {
  isValid: boolean
  message: string
  type: 'error' | 'warning' | 'success'
}

// Regras de validação comuns
export const validationRules = {
  email: {
    required: {
      test: (value: string) => value.trim().length > 0,
      message: 'Email é obrigatório',
      type: 'error' as const
    },
    format: {
      test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Formato de email inválido',
      type: 'error' as const
    },
    domain: {
      test: (value: string) => {
        const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com']
        const domain = value.split('@')[1]
        return !domain || commonDomains.includes(domain) || domain.includes('.')
      },
      message: 'Verifique se o domínio do email está correto',
      type: 'warning' as const
    }
  },
  password: {
    required: {
      test: (value: string) => value.length > 0,
      message: 'Senha é obrigatória',
      type: 'error' as const
    },
    minLength: {
      test: (value: string) => value.length >= 6,
      message: 'Senha deve ter pelo menos 6 caracteres',
      type: 'error' as const
    },
    hasUppercase: {
      test: (value: string) => /[A-Z]/.test(value),
      message: 'Senha deve conter pelo menos uma letra maiúscula',
      type: 'warning' as const
    },
    hasNumber: {
      test: (value: string) => /\d/.test(value),
      message: 'Senha deve conter pelo menos um número',
      type: 'warning' as const
    },
    hasSpecial: {
      test: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
      message: 'Senha deve conter pelo menos um caractere especial',
      type: 'warning' as const
    }
  },
  confirmPassword: (originalPassword: string) => ({
    required: {
      test: (value: string) => value.length > 0,
      message: 'Confirmação de senha é obrigatória',
      type: 'error' as const
    },
    match: {
      test: (value: string) => value === originalPassword,
      message: 'Senhas não coincidem',
      type: 'error' as const
    }
  }),
  name: {
    required: {
      test: (value: string) => value.trim().length > 0,
      message: 'Nome é obrigatório',
      type: 'error' as const
    },
    minLength: {
      test: (value: string) => value.trim().length >= 2,
      message: 'Nome deve ter pelo menos 2 caracteres',
      type: 'error' as const
    },
    format: {
      test: (value: string) => /^[a-zA-ZÀ-ÿ\s]+$/.test(value),
      message: 'Nome deve conter apenas letras e espaços',
      type: 'error' as const
    }
  },
  phone: {
    required: {
      test: (value: string) => value.trim().length > 0,
      message: 'Telefone é obrigatório',
      type: 'error' as const
    },
    format: {
      test: (value: string) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
      message: 'Formato: (11) 99999-9999',
      type: 'error' as const
    }
  }
}

// Hook para validação em tempo real
export function useFieldValidation(rules: ValidationRule[]) {
  const [value, setValue] = React.useState('')
  const [validationResults, setValidationResults] = React.useState<ValidationResult[]>([])
  const [touched, setTouched] = React.useState(false)

  const validate = React.useCallback((inputValue: string) => {
    const results = rules.map(rule => ({
      isValid: rule.test(inputValue),
      message: rule.message,
      type: rule.type
    }))
    
    setValidationResults(results)
    return results
  }, [rules])

  const handleChange = React.useCallback((newValue: string) => {
    setValue(newValue)
    if (touched) {
      validate(newValue)
    }
  }, [touched, validate])

  const handleBlur = React.useCallback(() => {
    setTouched(true)
    validate(value)
  }, [value, validate])

  const isValid = validationResults.length === 0 || validationResults.every(result => result.isValid)
  const hasErrors = validationResults.some(result => !result.isValid && result.type === 'error')
  const hasWarnings = validationResults.some(result => !result.isValid && result.type === 'warning')

  return {
    value,
    setValue: handleChange,
    onBlur: handleBlur,
    validationResults: touched ? validationResults : [],
    isValid,
    hasErrors,
    hasWarnings,
    touched
  }
}

// Componente para exibir resultados de validação
interface ValidationDisplayProps {
  results: ValidationResult[]
  showOnlyErrors?: boolean
}

export function ValidationDisplay({ results, showOnlyErrors = false }: ValidationDisplayProps) {
  const filteredResults = showOnlyErrors 
    ? results.filter(result => !result.isValid && result.type === 'error')
    : results.filter(result => !result.isValid)

  if (filteredResults.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1 mt-1"
      >
        {filteredResults.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center gap-2 text-xs
              ${result.type === 'error' ? 'text-red-400' : 'text-amber-400'}
            `}
          >
            {result.type === 'error' ? (
              <X className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{result.message}</span>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

// Componente de força da senha
interface PasswordStrengthProps {
  password: string
  showDetails?: boolean
}

export function PasswordStrength({ password, showDetails = true }: PasswordStrengthProps) {
  const checks = [
    { test: password.length >= 6, label: 'Mínimo 6 caracteres' },
    { test: /[A-Z]/.test(password), label: 'Letra maiúscula' },
    { test: /[a-z]/.test(password), label: 'Letra minúscula' },
    { test: /\d/.test(password), label: 'Número' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'Caractere especial' }
  ]

  const passedChecks = checks.filter(check => check.test).length
  const strength = passedChecks / checks.length

  const getStrengthColor = () => {
    if (strength < 0.4) return 'bg-red-500'
    if (strength < 0.7) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (strength < 0.4) return 'Fraca'
    if (strength < 0.7) return 'Média'
    return 'Forte'
  }

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Força da senha</span>
          <span className={`text-xs font-medium ${
            strength < 0.4 ? 'text-red-400' : 
            strength < 0.7 ? 'text-amber-400' : 'text-green-400'
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-1 rounded-full ${getStrengthColor()}`}
          />
        </div>
      </div>

      {/* Detalhes dos requisitos */}
      {showDetails && (
        <div className="space-y-1">
          {checks.map((check, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-2 text-xs
                ${check.test ? 'text-green-400' : 'text-gray-500'}
              `}
            >
              {check.test ? (
                <Check className="w-3 h-3" />
              ) : (
                <div className="w-3 h-3 border border-gray-500 rounded-full" />
              )}
              <span>{check.label}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}