/**
 * Hook específico para verificações de permissões de barbeiro
 * Usado principalmente no sistema financeiro
 */

import { usePermissions } from '@/hooks/use-permissions'

export function useBarberPermissions() {
  const { isAdmin, isBarber, isSaasOwner, hasRole, hasPermission } = usePermissions()

  // Um barbeiro que também é admin tem acesso completo
  const isBarberWithAdminAccess = isAdmin || isSaasOwner
  
  // Barbeiro puro (sem privilégios de admin)
  const isPureBarber = isBarber && !isAdmin && !isSaasOwner

  return {
    isBarber: isBarber || isAdmin || isSaasOwner, // Qualquer um que pode atuar como barbeiro
    isAdmin: isAdmin || isSaasOwner,
    isPureBarber, // Apenas barbeiro, sem privilégios administrativos
    isBarberWithAdminAccess,
    isSaasOwner,
    
    // Verificações específicas
    canViewFinancialDashboard: hasPermission('view_financial'),
    canManageFinancial: hasPermission('manage_financial'),
    canViewAllFinancial: hasPermission('view_all_financial'),
    canViewOwnFinancial: hasPermission('view_own_financial'),
    
    // Funções originais
    hasRole,
    hasPermission,
  }
}