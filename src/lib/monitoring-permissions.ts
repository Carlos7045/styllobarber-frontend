/**
 * Sistema de permissões para monitoramento
 * Define o que cada tipo de usuário pode ver
 */

export enum MonitoringRole {
  DEVELOPER = 'developer',
  BUSINESS_ADMIN = 'business_admin', // Admin da barbearia
  SAAS_OWNER = 'saas_owner',        // Dono do SaaS
  SUPPORT = 'support'               // Suporte técnico
}

export interface MonitoringPermissions {
  canViewLogs: boolean
  canViewDetailedMetrics: boolean
  canViewSystemHealth: boolean
  canViewPerformanceMetrics: boolean
  canViewAlerts: boolean
  canExecuteActions: boolean
  canExportData: boolean
  canClearData: boolean
  canViewSensitiveData: boolean
  logLevels: string[]
  alertTypes: string[]
}

/**
 * Definir permissões por role
 */
export function getMonitoringPermissions(
  userRole: string,
  environment: 'development' | 'production' = 'production',
  userProfile?: any
): MonitoringPermissions {
  
  // Carlos Henrique Pereira Salgado - Desenvolvedor e Dono do SaaS
  // Acesso total em qualquer ambiente
  console.log('🔍 Checking SaaS Owner permissions:', {
    userProfile,
    nome: userProfile?.nome,
    email: userProfile?.email,
    role: userRole,
    environment
  })
  
  // Verificações específicas para Carlos (SaaS Owner)
  const isCarlos = (userProfile?.nome?.includes('Carlos Henrique') && userProfile?.nome?.includes('Salgado')) || 
                   userProfile?.email === 'carlos@styllobarber.com' ||
                   userProfile?.email === 'carlos7045@gmail.com' ||
                   userRole === 'saas_owner'
  
  // Em desenvolvimento, apenas Carlos tem acesso total
  const isDevelopmentOwner = environment === 'development' && isCarlos
  
  if (isCarlos || isDevelopmentOwner) {
    console.log('✅ SaaS Owner detected! Granting full permissions.');
    return {
      canViewLogs: true,
      canViewDetailedMetrics: true,
      canViewSystemHealth: true,
      canViewPerformanceMetrics: true,
      canViewAlerts: true,
      canExecuteActions: true,
      canExportData: true,
      canClearData: true,
      canViewSensitiveData: true,
      logLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'],
      alertTypes: ['*'] // Todos os tipos
    }
  }
  
  // Em desenvolvimento, desenvolvedores têm acesso total
  if (environment === 'development') {
    return {
      canViewLogs: true,
      canViewDetailedMetrics: true,
      canViewSystemHealth: true,
      canViewPerformanceMetrics: true,
      canViewAlerts: true,
      canExecuteActions: true,
      canExportData: true,
      canClearData: true,
      canViewSensitiveData: true,
      logLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'],
      alertTypes: ['*'] // Todos os tipos
    }
  }

  switch (userRole) {
    case 'admin': // Admin da barbearia
      return {
        canViewLogs: false, // Logs técnicos não são relevantes
        canViewDetailedMetrics: false,
        canViewSystemHealth: true, // Status geral: "Sistema OK" ou "Problemas"
        canViewPerformanceMetrics: true, // Métricas básicas de uptime
        canViewAlerts: true, // Apenas alertas que afetam o negócio
        canExecuteActions: false, // Não pode executar ações técnicas
        canExportData: false,
        canClearData: false,
        canViewSensitiveData: false,
        logLevels: ['ERROR', 'CRITICAL'], // Apenas erros críticos
        alertTypes: [
          'HIGH_ERROR_RATE',
          'SYSTEM_OVERLOAD',
          'SECURITY_INCIDENT'
        ]
      }

    case 'saas_owner': // Dono do SaaS (você)
      return {
        canViewLogs: true,
        canViewDetailedMetrics: true,
        canViewSystemHealth: true,
        canViewPerformanceMetrics: true,
        canViewAlerts: true,
        canExecuteActions: true,
        canExportData: true,
        canClearData: true,
        canViewSensitiveData: true,
        logLevels: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
        alertTypes: ['*'] // Todos os alertas
      }

    case 'support': // Suporte técnico
      return {
        canViewLogs: true,
        canViewDetailedMetrics: true,
        canViewSystemHealth: true,
        canViewPerformanceMetrics: true,
        canViewAlerts: true,
        canExecuteActions: false, // Pode ver mas não executar ações
        canExportData: true,
        canClearData: false,
        canViewSensitiveData: false,
        logLevels: ['WARN', 'ERROR', 'CRITICAL'],
        alertTypes: [
          'PERFORMANCE_DEGRADATION',
          'HIGH_ERROR_RATE',
          'CIRCUIT_BREAKER_OPEN',
          'SYSTEM_OVERLOAD'
        ]
      }

    default: // Usuários normais (barber, client)
      return {
        canViewLogs: false,
        canViewDetailedMetrics: false,
        canViewSystemHealth: false,
        canViewPerformanceMetrics: false,
        canViewAlerts: false,
        canExecuteActions: false,
        canExportData: false,
        canClearData: false,
        canViewSensitiveData: false,
        logLevels: [],
        alertTypes: []
      }
  }
}

/**
 * Hook para verificar permissões de monitoramento
 */
export function useMonitoringPermissions(userRole: string, userProfile?: any) {
  const environment = process.env.NODE_ENV as 'development' | 'production'
  const permissions = getMonitoringPermissions(userRole, environment, userProfile)

  return {
    permissions,
    canAccess: (feature: keyof MonitoringPermissions) => {
      return permissions[feature] === true
    },
    canViewLogLevel: (level: string) => {
      return permissions.logLevels.includes(level) || permissions.logLevels.includes('*')
    },
    canViewAlertType: (type: string) => {
      return permissions.alertTypes.includes(type) || permissions.alertTypes.includes('*')
    },
    isSaasOwner: () => {
      return userProfile?.nome === 'Carlos Henrique Pereira Salgado' || 
             userProfile?.email === 'carlos@styllobarber.com' ||
             userProfile?.email === 'carlos7045@gmail.com' ||
             userRole === 'saas_owner'
    },
    isDeveloper: () => {
      return userProfile?.nome === 'Carlos Henrique Pereira Salgado' || 
             environment === 'development'
    }
  }
}
