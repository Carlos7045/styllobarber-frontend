// Utilitários específicos do módulo financeiro

import { formatConfig } from '../config'
import { DEFAULT_LIMITS } from '../constants'

// Formatação de valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(formatConfig.currency.locale, {
    style: 'currency',
    currency: formatConfig.currency.currency,
    minimumFractionDigits: formatConfig.currency.minimumFractionDigits,
    maximumFractionDigits: formatConfig.currency.maximumFractionDigits
  }).format(value)
}

// Formatação de percentuais
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: formatConfig.percentage.minimumFractionDigits,
    maximumFractionDigits: formatConfig.percentage.maximumFractionDigits
  }).format(value / 100)
}

// Formatação de datas
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(formatConfig.date.locale, {
    timeZone: formatConfig.date.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj)
}

// Formatação de data e hora
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(formatConfig.date.locale, {
    timeZone: formatConfig.date.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

// Validação de valores monetários
export const isValidCurrencyValue = (value: number): boolean => {
  return (
    !isNaN(value) &&
    isFinite(value) &&
    value >= DEFAULT_LIMITS.MIN_TRANSACTION_VALUE &&
    value <= DEFAULT_LIMITS.MAX_TRANSACTION_VALUE
  )
}

// Validação de percentuais
export const isValidPercentage = (value: number): boolean => {
  return (
    !isNaN(value) &&
    isFinite(value) &&
    value >= DEFAULT_LIMITS.MIN_COMMISSION_PERCENTAGE &&
    value <= DEFAULT_LIMITS.MAX_COMMISSION_PERCENTAGE
  )
}

// Cálculo de comissão
export const calculateCommission = (
  serviceValue: number,
  percentage: number,
  minValue?: number,
  maxValue?: number
): number => {
  if (!isValidCurrencyValue(serviceValue) || !isValidPercentage(percentage)) {
    return 0
  }

  let commission = (serviceValue * percentage) / 100

  if (minValue && commission < minValue) {
    commission = minValue
  }

  if (maxValue && commission > maxValue) {
    commission = maxValue
  }

  return Math.round(commission * 100) / 100 // Arredondar para 2 casas decimais
}

// Cálculo de taxa de crescimento
export const calculateGrowthRate = (currentValue: number, previousValue: number): number => {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0
  }

  const growthRate = ((currentValue - previousValue) / previousValue) * 100
  return Math.round(growthRate * 100) / 100
}

// Geração de período de datas
export const generateDateRange = (days: number): { inicio: string; fim: string } => {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - days)

  return {
    inicio: inicio.toISOString().split('T')[0],
    fim: fim.toISOString().split('T')[0]
  }
}

// Obter primeiro e último dia do mês
export const getMonthRange = (date: Date = new Date()): { inicio: string; fim: string } => {
  const inicio = new Date(date.getFullYear(), date.getMonth(), 1)
  const fim = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return {
    inicio: inicio.toISOString().split('T')[0],
    fim: fim.toISOString().split('T')[0]
  }
}

// Obter primeiro e último dia do ano
export const getYearRange = (date: Date = new Date()): { inicio: string; fim: string } => {
  const inicio = new Date(date.getFullYear(), 0, 1)
  const fim = new Date(date.getFullYear(), 11, 31)

  return {
    inicio: inicio.toISOString().split('T')[0],
    fim: fim.toISOString().split('T')[0]
  }
}

// Validação de range de datas
export const isValidDateRange = (inicio: string, fim: string): boolean => {
  const startDate = new Date(inicio)
  const endDate = new Date(fim)

  return (
    !isNaN(startDate.getTime()) &&
    !isNaN(endDate.getTime()) &&
    startDate <= endDate
  )
}

// Conversão de string para número monetário
export const parseCurrencyString = (value: string): number => {
  // Remove formatação brasileira (R$ 1.234,56 -> 1234.56)
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const numericValue = parseFloat(cleanValue)
  return isNaN(numericValue) ? 0 : numericValue
}

// Geração de ID único para transações
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `txn_${timestamp}_${randomStr}`
}

// Validação de CPF/CNPJ (simplificada)
export const isValidCpfCnpj = (value: string): boolean => {
  const cleanValue = value.replace(/\D/g, '')
  return cleanValue.length === 11 || cleanValue.length === 14
}

// Formatação de CPF/CNPJ
export const formatCpfCnpj = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '')

  if (cleanValue.length === 11) {
    // CPF: 000.000.000-00
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleanValue.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  return value
}

// Formatação de telefone brasileiro
export const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '')

  if (cleanValue.length === 10) {
    // (00) 0000-0000
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (cleanValue.length === 11) {
    // (00) 00000-0000
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return value
}

// Debounce para otimizar chamadas de API
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle para limitar frequência de chamadas
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Função para retry com backoff exponencial
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
      attempt++
    }
  }

  throw new Error('Máximo de tentativas excedido')
}