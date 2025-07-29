/**
 * Hook para gerenciamento de permissões do usuário
 * Centraliza toda a lógica de verificação de roles e permissões
 */

import { useAuth } from '@/hooks/use-auth'

// Definição de todas as permissões do sistema
export const PERMISSIONS = {
  // Permissões de usuários
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',

  // Permissões de funcionários
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_EMPLOYEES: 'view_employees',
  CREATE_EMPLOYEES: 'create_employees',
  EDIT_EMPLOYEES: 'edit_employees',
  DELETE_EMPLOYEES: 'delete_employees',

  // Permissões de serviços
  MANAGE_SERVICES: 'manage_services',
  VIEW_SERVICES: 'view_services',
  CREATE_SERVICES: 'create_services',
  EDIT_SERVICES: 'edit_services',
  DELETE_SERVICES: 'delete_services',

  // Permissões de agendamentos
  MANAGE_ALL_APPOINTMENTS: 'manage_all_appointments',
  VIEW_ALL_APPOINTMENTS: 'view_all_appointments',
  MANAGE_OWN_APPOINTMENTS: 'manage_own_appointments',
  VIEW_OWN_APPOINTMENTS: 'view_own_appointments',
  CREATE_APPOINTMENTS: 'create_appointments',
  CANCEL_APPOINTMENTS: 'cancel_appointments',

  // Permissões financeiras
  VIEW_FINANCIAL: 'view_financial',
  MANAGE_FINANCIAL: 'manage_financial',
  VIEW_ALL_FINANCIAL: 'view_all_financial',
  VIEW_OWN_FINANCIAL: 'view_own_financial',
  MANAGE_TRANSACTIONS: 'manage_transactions',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',

  // Permissões de configuração
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',

  // Permissões de sistema
  MANAGE_SYSTEM: 'manage_system',
  VIEW_MONITORING: 'view_monitoring',
  MANAGE_ROLES: 'manage_roles',
} as const

// Mapeamento de permissões por role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  saas_owner: ['*'], // SaaS Owner tem todas as permissões
  
  admin: [
    // Usuários
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,

    // Funcionários
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.CREATE_EMPLOYEES,
    PERMISSIONS.EDIT_EMPLOYEES,
    PERMISSIONS.DELETE_EMPLOYEES,

    // Serviços
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.CREATE_SERVICES,
    PERMISSIONS.EDIT_SERVICES,
    PERMISSIONS.DELETE_SERVICES,

    // Agendamentos
    PERMISSIONS.MANAGE_ALL_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.CANCEL_APPOINTMENTS,

    // Financeiro
    PERMISSIONS.VIEW_FINANCIAL,
    PERMISSIONS.MANAGE_FINANCIAL,
    PERMISSIONS.VIEW_ALL_FINANCIAL,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,

    // Configurações
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_SETTINGS,

    // Sistema
    PERMISSIONS.MANAGE_ROLES,
  ],

  barber: [
    // Usuários (limitado)
    PERMISSIONS.VIEW_USERS,

    // Serviços (visualização)
    PERMISSIONS.VIEW_SERVICES,

    // Agendamentos (próprios e visualização)
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.MANAGE_OWN_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,

    // Financeiro (próprio)
    PERMISSIONS.VIEW_FINANCIAL,
    PERMISSIONS.VIEW_OWN_FINANCIAL,
    PERMISSIONS.VIEW_REPORTS,

    // Configurações (limitado)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  client: [
    // Agendamentos (próprios)
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.CANCEL_APPOINTMENTS,

    // Serviços (visualização)
    PERMISSIONS.VIEW_SERVICES,

    // Configurações (próprias)
    PERMISSIONS.VIEW_SETTINGS,
  ],
}

export interface UsePermissionsReturn {
  // Verificação de roles
  isAdmin: boolean
  isBarber: boolean
  isClient: boolean
  isSaasOwner: boolean
  
  // Verificação de permissões específicas
  hasRole: (role: 'admin' | 'barber' | 'client' | 'saas_owner') => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  
  // Verificações de funcionalidades específicas
  canManageUsers: boolean
  canManageEmployees: boolean
  canManageServices: boolean
  canManageFinancial: boolean
  canViewReports: boolean
  canExportData: boolean
  canManageSettings: boolean
  
  // Informações do usuário
  userRole: string | null
  userId: string | null
  isAuthenticated: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { user, profile, hasRole, hasPermission } = useAuth()

  // Verificação de roles
  const isAdmin = hasRole('admin')
  const isBarber = hasRole('barber')
  const isClient = hasRole('client')
  const isSaasOwner = hasRole('saas_owner')

  // Função para verificar múltiplas permissões (qualquer uma)
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Função para verificar múltiplas permissões (todas)
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Verificações de funcionalidades específicas
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)
  const canManageEmployees = hasPermission(PERMISSIONS.MANAGE_EMPLOYEES)
  const canManageServices = hasPermission(PERMISSIONS.MANAGE_SERVICES)
  const canManageFinancial = hasPermission(PERMISSIONS.MANAGE_FINANCIAL)
  const canViewReports = hasPermission(PERMISSIONS.VIEW_REPORTS)
  const canExportData = hasPermission(PERMISSIONS.EXPORT_DATA)
  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_SETTINGS)

  return {
    // Verificação de roles
    isAdmin,
    isBarber,
    isClient,
    isSaasOwner,
    
    // Verificação de permissões
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificações específicas
    canManageUsers,
    canManageEmployees,
    canManageServices,
    canManageFinancial,
    canViewReports,
    canExportData,
    canManageSettings,
    
    // Informações do usuário
    userRole: profile?.role || null,
    userId: user?.id || null,
    isAuthenticated: !!user,
  }
}

// Hook para verificar se o usuário tem acesso a uma rota específica
export function useRoutePermissions(requiredPermissions: string[] = [], requiredRoles: string[] = []) {
  const { hasPermission, hasRole } = usePermissions()

  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    requiredPermissions.some(permission => hasPermission(permission))

  const hasRequiredRoles = requiredRoles.length === 0 || 
    requiredRoles.some(role => hasRole(role as any))

  const hasAccess = hasRequiredPermissions && hasRequiredRoles

  return {
    hasAccess,
    hasRequiredPermissions,
    hasRequiredRoles,
  }
}