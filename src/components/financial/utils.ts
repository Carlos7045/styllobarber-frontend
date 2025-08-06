// Utilitários para o sistema financeiro

// Formatação de moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Formatação de data brasileira
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(dateObj)
}

// Formatação de data e hora brasileira
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

// Calcular porcentagem
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return (value / total) * 100
}

// Validar valor monetário
export const isValidCurrency = (value: string): boolean => {
  const numericValue = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return !isNaN(numericValue) && numericValue >= 0
}

// Converter string para número monetário
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// Gerar cores para categorias
export const generateCategoryColor = (index: number): string => {
  const colors = [
    '#10B981', // green-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#EC4899', // pink-500
    '#6366F1'  // indigo-500
  ]
  return colors[index % colors.length]
}

// Calcular diferença em dias
export const daysDifference = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Obter período padrão (últimos 30 dias)
export const getDefaultDateRange = (): { inicio: string; fim: string } => {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 30)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}

// Obter período do mês atual
export const getCurrentMonthRange = (): { inicio: string; fim: string } => {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}

// Alias para getCurrentMonthRange (compatibilidade)
export const getMonthRange = getCurrentMonthRange

// Obter período do ano atual
export const getYearRange = (): { inicio: string; fim: string } => {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), 0, 1)
  const fim = new Date(now.getFullYear(), 11, 31)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}

// Gerar período baseado em número de dias
export const generateDateRange = (days: number): { inicio: string; fim: string } => {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - days)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}

// Obter período da semana atual
export const getCurrentWeekRange = (): { inicio: string; fim: string } => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const inicio = new Date(now)
  inicio.setDate(now.getDate() - dayOfWeek)
  inicio.setHours(0, 0, 0, 0)
  
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23, 59, 59, 999)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}
