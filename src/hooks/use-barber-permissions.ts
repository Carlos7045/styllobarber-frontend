// Hook para controle de permissões específicas de barbeiros
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase'

export interface BarberPermissions {
  // Dados financeiros
  canViewOwnFinancialData: boolean
  canViewAllFinancialData: boolean
  canUsePDV: boolean
  canViewCashFlow: boolean
  canViewReports: boolean
  
  // Clientes
  canViewOwnClients: boolean
  canViewAllClients: boolean
  canEditClients: boolean
  
  // Agendamentos
  canViewOwnAppointments: boolean
  canViewAllAppointments: boolean
  canEditAppointments: boolean
  
  // Comissões
  canViewOwnCommissions: boolean
  canViewAllCommissions: boolean
  
  // Sistema
  canAccessAdminPanel: boolean
  canManageEmployees: boolean
  canManageSettings: boolean
}

export interface BarberContext {
  barbeiroId: string | null
  barbeiroNome: string | null
  role: 'admin' | 'barber' | 'client' | 'saas_owner' | null
  permissions: BarberPermissions
  isBarber: boolean
  isAdmin: boolean
  isClient: boolean
  loading: boolean
}

// Permissões padrão por role
const getDefaultPermissions = (role: string | null): BarberPermissions => {
  switch (role) {
    case 'admin':
    case 'saas_owner':
      return {
        // Admins têm acesso total
        canViewOwnFinancialData: true,
        canViewAllFinancialData: true,
        canUsePDV: true,
        canViewCashFlow: true,
        canViewReports: true,
        canViewOwnClients: true,
        canViewAllClients: true,
        canEditClients: true,
        canViewOwnAppointments: true,
        canViewAllAppointments: true,
        canEditAppointments: true,
        canViewOwnCommissions: true,
        canViewAllCommissions: true,
        canAccessAdminPanel: true,
        canManageEmployees: true,
        canManageSettings: true
      }
    
    case 'barber':
      return {
        // Barbeiros têm acesso limitado aos próprios dados
        canViewOwnFinancialData: true,
        canViewAllFinancialData: false,
        canUsePDV: true,
        canViewCashFlow: false, // Apenas saldo próprio
        canViewReports: false, // Apenas relatórios próprios
        canViewOwnClients: true,
        canViewAllClients: false,
        canEditClients: false, // Apenas visualização
        canViewOwnAppointments: true,
        canViewAllAppointments: false,
        canEditAppointments: true, // Apenas próprios agendamentos
        canViewOwnCommissions: true,
        canViewAllCommissions: false,
        canAccessAdminPanel: false,
        canManageEmployees: false,
        canManageSettings: false
      }
    
    case 'client':
      return {
        // Clientes têm acesso muito limitado
        canViewOwnFinancialData: false,
        canViewAllFinancialData: false,
        canUsePDV: false,
        canViewCashFlow: false,
        canViewReports: false,
        canViewOwnClients: false,
        canViewAllClients: false,
        canEditClients: false,
        canViewOwnAppointments: true, // Apenas próprios agendamentos
        canViewAllAppointments: false,
        canEditAppointments: false,
        canViewOwnCommissions: false,
        canViewAllCommissions: false,
        canAccessAdminPanel: false,
        canManageEmployees: false,
        canManageSettings: false
      }
    
    default:
      return {
        // Sem permissões por padrão
        canViewOwnFinancialData: false,
        canViewAllFinancialData: false,
        canUsePDV: false,
        canViewCashFlow: false,
        canViewReports: false,
        canViewOwnClients: false,
        canViewAllClients: false,
        canEditClients: false,
        canViewOwnAppointments: false,
        canViewAllAppointments: false,
        canEditAppointments: false,
        canViewOwnCommissions: false,
        canViewAllCommissions: false,
        canAccessAdminPanel: false,
        canManageEmployees: false,
        canManageSettings: false
      }
  }
}

export const useBarberPermissions = (): BarberContext => {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customPermissions, setCustomPermissions] = useState<Partial<BarberPermissions> | null>(null)

  // Carregar permissões customizadas do banco (se existirem)
  useEffect(() => {
    const loadCustomPermissions = async () => {
      if (!user || !profile) {
        setLoading(false)
        return
      }

      try {
        // Verificar se existem permissões customizadas para este usuário
        const { data: permissions, error } = await supabase
          .from('user_permissions')
          .select('permissions')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.warn('Erro ao carregar permissões customizadas:', error)
        }

        if (permissions?.permissions) {
          setCustomPermissions(permissions.permissions)
        }
      } catch (error) {
        console.warn('Erro ao carregar permissões:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadCustomPermissions()
    }
  }, [user, profile, authLoading])

  // Calcular permissões finais
  const permissions = useMemo(() => {
    const defaultPermissions = getDefaultPermissions(profile?.role || null)
    
    // Mesclar com permissões customizadas se existirem
    if (customPermissions) {
      return { ...defaultPermissions, ...customPermissions }
    }
    
    return defaultPermissions
  }, [profile?.role, customPermissions])

  // Contexto do barbeiro
  const context = useMemo((): BarberContext => {
    return {
      barbeiroId: profile?.role === 'barber' ? profile.id : null,
      barbeiroNome: profile?.nome || null,
      role: profile?.role || null,
      permissions,
      isBarber: profile?.role === 'barber',
      isAdmin: profile?.role === 'admin' || profile?.role === 'saas_owner',
      isClient: profile?.role === 'client',
      loading: authLoading || loading
    }
  }, [profile, permissions, authLoading, loading])

  return context
}

// Hook específico para filtrar dados financeiros por barbeiro
export const useBarberFinancialFilter = () => {
  const { barbeiroId, permissions, isBarber } = useBarberPermissions()

  const getFinancialFilter = useMemo(() => {
    return {
      // Filtro para transações
      getTransactionFilter: () => {
        if (!isBarber || permissions.canViewAllFinancialData) {
          return {} // Sem filtro (ver tudo)
        }
        
        return {
          barbeiro_id: barbeiroId // Apenas transações do barbeiro
        }
      },

      // Filtro para agendamentos
      getAppointmentFilter: () => {
        if (!isBarber || permissions.canViewAllAppointments) {
          return {} // Sem filtro (ver tudo)
        }
        
        return {
          barbeiro_id: barbeiroId // Apenas agendamentos do barbeiro
        }
      },

      // Filtro para clientes
      getClientFilter: () => {
        if (!isBarber || permissions.canViewAllClients) {
          return {} // Sem filtro (ver tudo)
        }
        
        // Para barbeiros, mostrar apenas clientes que tiveram agendamentos com ele
        return {
          barbeiro_id: barbeiroId
        }
      },

      // Filtro para comissões
      getCommissionFilter: () => {
        if (!isBarber || permissions.canViewAllCommissions) {
          return {} // Sem filtro (ver tudo)
        }
        
        return {
          barbeiro_id: barbeiroId // Apenas comissões do barbeiro
        }
      }
    }
  }, [barbeiroId, permissions, isBarber])

  return {
    barbeiroId,
    permissions,
    isBarber,
    ...getFinancialFilter
  }
}

// Hook para verificar permissões específicas
export const usePermissionCheck = () => {
  const { permissions } = useBarberPermissions()

  return {
    // Verificar se pode acessar dados financeiros
    canAccessFinancialData: (scope: 'own' | 'all' = 'own') => {
      return scope === 'own' 
        ? permissions.canViewOwnFinancialData 
        : permissions.canViewAllFinancialData
    },

    // Verificar se pode usar PDV
    canUsePDV: () => permissions.canUsePDV,

    // Verificar se pode ver fluxo de caixa
    canViewCashFlow: () => permissions.canViewCashFlow,

    // Verificar se pode ver relatórios
    canViewReports: () => permissions.canViewReports,

    // Verificar se pode acessar clientes
    canAccessClients: (scope: 'own' | 'all' = 'own') => {
      return scope === 'own' 
        ? permissions.canViewOwnClients 
        : permissions.canViewAllClients
    },

    // Verificar se pode editar clientes
    canEditClients: () => permissions.canEditClients,

    // Verificar se pode acessar agendamentos
    canAccessAppointments: (scope: 'own' | 'all' = 'own') => {
      return scope === 'own' 
        ? permissions.canViewOwnAppointments 
        : permissions.canViewAllAppointments
    },

    // Verificar se pode editar agendamentos
    canEditAppointments: () => permissions.canEditAppointments,

    // Verificar se pode ver comissões
    canViewCommissions: (scope: 'own' | 'all' = 'own') => {
      return scope === 'own' 
        ? permissions.canViewOwnCommissions 
        : permissions.canViewAllCommissions
    },

    // Verificar se é admin
    isAdmin: () => permissions.canAccessAdminPanel,

    // Verificar permissão genérica
    hasPermission: (permission: keyof BarberPermissions) => {
      return permissions[permission]
    }
  }
}