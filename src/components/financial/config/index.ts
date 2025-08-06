// Configurações específicas do módulo financeiro

import { DEFAULT_LIMITS, FORMAT_CONFIG, RETRY_CONFIG, CACHE_CONFIG } from '../constants'

// Configuração da API Asaas
export const asaasConfig = {
  baseUrl: process.env.NEXT_PUBLIC_ASAAS_API_URL || 'https://www.asaas.com/api/v3',
  apiKey: process.env.ASAAS_API_KEY || '',
  environment: process.env.ASAAS_ENVIRONMENT || 'sandbox', // 'sandbox' ou 'production'
  webhookUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/asaas` : '',
  timeout: 30000, // 30 segundos
  retryConfig: RETRY_CONFIG
} as const

// Configuração de formatação de valores
export const formatConfig = {
  currency: FORMAT_CONFIG.CURRENCY,
  date: FORMAT_CONFIG.DATE,
  percentage: FORMAT_CONFIG.PERCENTAGE
} as const

// Configuração de limites do sistema
export const systemLimits = {
  ...DEFAULT_LIMITS,
  // Limites específicos podem ser sobrescritos aqui
} as const

// Configuração de cache
export const cacheConfig = {
  ...CACHE_CONFIG,
  // Configurações específicas de cache podem ser sobrescritas aqui
} as const

// Configuração de permissões por role
export const permissionsConfig = {
  admin: {
    canViewAllFinancials: true,
    canManageCommissions: true,
    canManageExpenses: true,
    canViewReports: true,
    canExportReports: true,
    canManageCategories: true,
    canManageAsaasConfig: true,
    canViewCashFlow: true,
    canManageAlerts: true
  },
  barbeiro: {
    canViewAllFinancials: false,
    canManageCommissions: false,
    canManageExpenses: false,
    canViewReports: true, // Apenas seus próprios dados
    canExportReports: false,
    canManageCategories: false,
    canManageAsaasConfig: false,
    canViewCashFlow: false,
    canManageAlerts: false
  },
  cliente: {
    canViewAllFinancials: false,
    canManageCommissions: false,
    canManageExpenses: false,
    canViewReports: false,
    canExportReports: false,
    canManageCategories: false,
    canManageAsaasConfig: false,
    canViewCashFlow: false,
    canManageAlerts: false
  }
} as const

// Configuração de notificações
export const notificationConfig = {
  whatsapp: {
    enabled: process.env.WHATSAPP_API_ENABLED === 'true',
    apiUrl: process.env.WHATSAPP_API_URL || '',
    apiKey: process.env.WHATSAPP_API_KEY || ''
  },
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    provider: process.env.EMAIL_PROVIDER || 'supabase', // 'supabase', 'sendgrid', etc.
    fromEmail: process.env.EMAIL_FROM || 'noreply@styllobarber.com'
  },
  push: {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true'
  }
} as const

// Configuração de relatórios
export const reportsConfig = {
  maxExportRows: 10000,
  defaultPageSize: 50,
  allowedFormats: ['PDF', 'EXCEL', 'CSV'] as const,
  maxDateRange: 365, // dias
  cacheEnabled: true,
  cacheTTL: 600 // 10 minutos
} as const

// Configuração de dashboard
export const dashboardConfig = {
  refreshInterval: 30000, // 30 segundos
  metricsUpdateInterval: 60000, // 1 minuto
  chartAnimationDuration: 750,
  defaultDateRange: 30, // últimos 30 dias
  maxDataPoints: 100
} as const

// Configuração de validação
export const validationConfig = {
  minTransactionValue: 0.01,
  maxTransactionValue: 999999.99,
  minCommissionPercentage: 0,
  maxCommissionPercentage: 100,
  maxDescriptionLength: 500,
  maxObservationsLength: 1000,
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFilesPerExpense: 5
} as const

// Configuração de segurança
export const securityConfig = {
  encryptSensitiveData: true,
  auditLogEnabled: true,
  sessionTimeout: 3600000, // 1 hora para dados financeiros
  requireTwoFactorForFinancials: false, // Pode ser habilitado no futuro
  ipWhitelistEnabled: false,
  rateLimitEnabled: true,
  rateLimitRequests: 100,
  rateLimitWindow: 900000 // 15 minutos
} as const

// Configuração de backup
export const backupConfig = {
  enabled: true,
  frequency: 'daily', // 'hourly', 'daily', 'weekly'
  retention: 30, // dias
  includeAttachments: true,
  encryptBackups: true
} as const

// Configuração de monitoramento
export const monitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  logLevel: process.env.LOG_LEVEL || 'info',
  metricsEnabled: true,
  alertsEnabled: true,
  performanceTracking: true,
  errorTracking: true
} as const

// Função para obter configuração baseada no ambiente
export const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    isProduction,
    isDevelopment,
    apiTimeout: isProduction ? 30000 : 10000,
    enableDebugLogs: isDevelopment,
    enableMockData: isDevelopment && process.env.ENABLE_MOCK_DATA === 'true',
    strictValidation: isProduction,
    cacheEnabled: isProduction,
    compressionEnabled: isProduction
  }
}

// Função para validar configurações obrigatórias
export const validateRequiredConfig = () => {
  const errors: string[] = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL é obrigatório')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatório')
  }
  
  if (process.env.NODE_ENV === 'production' && !asaasConfig.apiKey) {
    errors.push('ASAAS_API_KEY é obrigatório em produção')
  }
  
  if (errors.length > 0) {
    throw new Error(`Configurações obrigatórias ausentes: ${errors.join(', ')}`)
  }
}

// Exportar todas as configurações
export const financialConfig = {
  asaas: asaasConfig,
  format: formatConfig,
  limits: systemLimits,
  cache: cacheConfig,
  permissions: permissionsConfig,
  notifications: notificationConfig,
  reports: reportsConfig,
  dashboard: dashboardConfig,
  validation: validationConfig,
  security: securityConfig,
  backup: backupConfig,
  monitoring: monitoringConfig,
  environment: getEnvironmentConfig()
} as const
