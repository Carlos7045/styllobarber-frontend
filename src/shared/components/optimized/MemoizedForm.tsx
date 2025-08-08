import React, { memo, useCallback } from 'react'
import { useStableCallback } from '@/shared/utils/memoization'

interface MemoizedFormProps {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  className?: string
  loading?: boolean
}

/**
 * Formulário memoizado com callbacks estáveis
 */
const MemoizedFormComponent = memo<MemoizedFormProps>(({
  children,
  onSubmit,
  className,
  loading = false
}) => {
  // Callback estável para submit
  const handleSubmit = useStableCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) {
      onSubmit(e)
    }
  }, [onSubmit, loading], 'FormSubmit')

  return (
    <form 
      onSubmit={handleSubmit}
      className={className}
      noValidate
    >
      <fieldset disabled={loading}>
        {children}
      </fieldset>
    </form>
  )
})

MemoizedFormComponent.displayName = 'MemoizedForm'

export const MemoizedForm = MemoizedFormComponent

interface MemoizedFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Campo de formulário memoizado
 */
const MemoizedFieldComponent = memo<MemoizedFieldProps>(({
  label,
  error,
  required = false,
  children,
  className
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.error === nextProps.error &&
    prevProps.required === nextProps.required &&
    prevProps.className === nextProps.className &&
    React.isValidElement(prevProps.children) &&
    React.isValidElement(nextProps.children) &&
    prevProps.children.key === nextProps.children.key
  )
})

MemoizedFieldComponent.displayName = 'MemoizedField'

export const MemoizedField = MemoizedFieldComponent