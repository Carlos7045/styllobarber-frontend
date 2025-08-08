/**
 * Type guards e utilitários para validação de tipos em runtime
 */

import { 
  UUID, 
  Email, 
  Phone, 
  Currency, 
  Timestamp,
  BaseEntity,
  ApiResponse,
  ValidationResult
} from '@/shared/types/base'

// Type guards básicos
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isNull(value: unknown): value is null {
  return value === null
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

// Type guards para tipos customizados
export function isUUID(value: unknown): value is UUID {
  if (!isString(value)) return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function isEmail(value: unknown): value is Email {
  if (!isString(value)) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

export function isPhone(value: unknown): value is Phone {
  if (!isString(value)) return false
  
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
}

export function isCurrency(value: unknown): value is Currency {
  return isNumber(value) && value >= 0 && Number.isInteger(value)
}

export function isTimestamp(value: unknown): value is Timestamp {
  if (!isString(value)) return false
  
  const date = new Date(value)
  return !isNaN(date.getTime()) && value === date.toISOString()
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

// Type guards para entidades
export function isBaseEntity(value: unknown): value is BaseEntity {
  if (!isObject(value)) return false
  
  return (
    isUUID(value.id) &&
    isTimestamp(value.created_at) &&
    (isUndefined(value.updated_at) || isTimestamp(value.updated_at)) &&
    (isUndefined(value.version) || isNumber(value.version))
  )
}

export function isApiResponse<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false
  
  const hasValidStructure = (
    (isNull(value.data) || (dataGuard ? dataGuard(value.data) : true)) &&
    (isNull(value.error) || isString(value.error)) &&
    isBoolean(value.success) &&
    isTimestamp(value.timestamp)
  )
  
  return hasValidStructure
}

// Type guards para arrays tipados
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  if (!isArray(value)) return false
  
  return value.every(itemGuard)
}

export function isNonEmptyArray<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T
): value is [T, ...T[]] {
  if (!isArray(value) || value.length === 0) return false
  
  if (itemGuard) {
    return value.every(itemGuard)
  }
  
  return true
}

// Type guards para objetos com propriedades específicas
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj
}

export function hasProperties<K extends string>(
  obj: unknown,
  keys: K[]
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false
  
  return keys.every(key => key in obj)
}

// Type guards para union types
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value as T[number])
}

// Utilitários para validação
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult {
  if (isNullish(value)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        code: 'REQUIRED',
        message: `${fieldName} is required`
      }]
    }
  }
  
  return { success: true, errors: [] }
}

export function validateEmail(email: unknown, fieldName = 'email'): ValidationResult {
  const requiredValidation = validateRequired(email, fieldName)
  if (!requiredValidation.success) return requiredValidation
  
  if (!isEmail(email)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        code: 'INVALID_EMAIL',
        message: `${fieldName} must be a valid email address`,
        value: email
      }]
    }
  }
  
  return { success: true, errors: [] }
}

export function validateUUID(uuid: unknown, fieldName = 'id'): ValidationResult {
  const requiredValidation = validateRequired(uuid, fieldName)
  if (!requiredValidation.success) return requiredValidation
  
  if (!isUUID(uuid)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        code: 'INVALID_UUID',
        message: `${fieldName} must be a valid UUID`,
        value: uuid
      }]
    }
  }
  
  return { success: true, errors: [] }
}

export function validateStringLength(
  value: unknown,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const requiredValidation = validateRequired(value, fieldName)
  if (!requiredValidation.success) return requiredValidation
  
  if (!isString(value)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        code: 'INVALID_TYPE',
        message: `${fieldName} must be a string`,
        value
      }]
    }
  }
  
  const errors = []
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push({
      field: fieldName,
      code: 'MIN_LENGTH',
      message: `${fieldName} must be at least ${minLength} characters long`,
      value
    })
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      field: fieldName,
      code: 'MAX_LENGTH',
      message: `${fieldName} must be at most ${maxLength} characters long`,
      value
    })
  }
  
  return {
    success: errors.length === 0,
    errors
  }
}

export function validateNumberRange(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const requiredValidation = validateRequired(value, fieldName)
  if (!requiredValidation.success) return requiredValidation
  
  if (!isNumber(value)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        code: 'INVALID_TYPE',
        message: `${fieldName} must be a number`,
        value
      }]
    }
  }
  
  const errors = []
  
  if (min !== undefined && value < min) {
    errors.push({
      field: fieldName,
      code: 'MIN_VALUE',
      message: `${fieldName} must be at least ${min}`,
      value
    })
  }
  
  if (max !== undefined && value > max) {
    errors.push({
      field: fieldName,
      code: 'MAX_VALUE',
      message: `${fieldName} must be at most ${max}`,
      value
    })
  }
  
  return {
    success: errors.length === 0,
    errors
  }
}

// Utilitários para transformação de tipos
export function parseUUID(value: unknown): UUID | null {
  return isUUID(value) ? value : null
}

export function parseEmail(value: unknown): Email | null {
  return isEmail(value) ? value : null
}

export function parsePhone(value: unknown): Phone | null {
  return isPhone(value) ? value : null
}

export function parseCurrency(value: unknown): Currency | null {
  if (isNumber(value) && value >= 0) {
    return Math.round(value * 100) // Converter para centavos
  }
  
  if (isString(value)) {
    const numValue = parseFloat(value.replace(/[^\d.-]/g, ''))
    if (!isNaN(numValue) && numValue >= 0) {
      return Math.round(numValue * 100)
    }
  }
  
  return null
}

export function parseTimestamp(value: unknown): Timestamp | null {
  if (isTimestamp(value)) return value
  
  if (isDate(value)) {
    return value.toISOString()
  }
  
  if (isString(value) || isNumber(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  return null
}

// Utilitários para limpeza de dados
export function sanitizeString(value: unknown): string {
  if (!isString(value)) return ''
  
  return value.trim().replace(/\s+/g, ' ')
}

export function sanitizeEmail(value: unknown): string {
  const email = sanitizeString(value)
  return email.toLowerCase()
}

export function sanitizePhone(value: unknown): string {
  const phone = sanitizeString(value)
  return phone.replace(/\D/g, '')
}

// Utilitários para comparação de tipos
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  
  if (a === null || b === null) return false
  if (a === undefined || b === undefined) return false
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return false
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)
  
  if (aKeys.length !== bKeys.length) return false
  
  return aKeys.every(key => deepEqual(aObj[key], bObj[key]))
}

// Utilitários para debugging de tipos
export function getTypeName(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Date) return 'date'
  if (value instanceof RegExp) return 'regexp'
  
  return typeof value
}

export function inspectType(value: unknown): {
  type: string
  isValid: boolean
  details: Record<string, any>
} {
  const type = getTypeName(value)
  
  const details: Record<string, any> = {
    type,
    value: value,
    stringified: JSON.stringify(value, null, 2)
  }
  
  if (type === 'string') {
    details.length = (value as string).length
    details.isEmpty = (value as string).length === 0
    details.isUUID = isUUID(value)
    details.isEmail = isEmail(value)
    details.isPhone = isPhone(value)
    details.isTimestamp = isTimestamp(value)
  }
  
  if (type === 'number') {
    details.isInteger = Number.isInteger(value as number)
    details.isPositive = (value as number) > 0
    details.isCurrency = isCurrency(value)
  }
  
  if (type === 'object') {
    details.keys = Object.keys(value as object)
    details.isBaseEntity = isBaseEntity(value)
  }
  
  if (type === 'array') {
    details.length = (value as unknown[]).length
    details.isEmpty = (value as unknown[]).length === 0
  }
  
  return {
    type,
    isValid: true, // Pode ser customizado baseado em critérios específicos
    details
  }
}