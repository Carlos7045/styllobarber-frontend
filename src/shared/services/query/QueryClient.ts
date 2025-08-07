import { QueryClient } from '@tanstack/react-query'
import { errorHandler, ErrorType } from '../base/ErrorHandler'

/**
 * Configuração customizada do React Query
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Manter cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry automático para erros de rede
      retry: (failureCount, error: any) => {
        // Não retry para erros de autenticação/autorização
        if (error?.type === ErrorType.AUTHENTICATION || error?.type === ErrorType.AUTHORIZATION) {
          return false
        }
        // Não retry para erros de validação
        if (error?.type === ErrorType.VALIDATION || error?.type === ErrorType.NOT_FOUND) {
          return false
        }
        // Retry até 3 vezes para outros erros
        return failureCount < 3
      },
      // Delay entre retries (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta
      refetchOnReconnect: true,
      // Não refetch automaticamente
      refetchOnMount: true,
    },
    mutations: {
      // Retry para mutations apenas em casos específicos
      retry: (failureCount, error: any) => {
        // Retry apenas para erros de rede
        if (error?.type === ErrorType.NETWORK && failureCount < 2) {
          return true
        }
        return false
      },
      // Delay entre retries para mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
}

/**
 * Cliente React Query configurado para a aplicação
 */
export const queryClient = new QueryClient(queryClientConfig)

/**
 * Configuração de error handling global para React Query
 */
queryClient.setMutationDefaults(['mutation'], {
  onError: (error) => {
    errorHandler.handle(error, {
      service: 'ReactQuery',
      method: 'mutation',
    })
  },
})

queryClient.setQueryDefaults(['query'], {
  onError: (error) => {
    errorHandler.handle(error, {
      service: 'ReactQuery',
      method: 'query',
    })
  },
})

/**
 * Utilitários para chaves de query
 */
export const queryKeys = {
  // Usuários
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    byEmail: (email: string) => [...queryKeys.users.all, 'email', email] as const,
    byRole: (role: string) => [...queryKeys.users.all, 'role', role] as const,
    stats: () => [...queryKeys.users.all, 'stats'] as const,
  },
  
  // Agendamentos
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.appointments.all, 'user', userId] as const,
    byDate: (date: string) => [...queryKeys.appointments.all, 'date', date] as const,
    stats: () => [...queryKeys.appointments.all, 'stats'] as const,
  },

  // Serviços
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
    active: () => [...queryKeys.services.all, 'active'] as const,
  },

  // Financeiro
  financial: {
    all: ['financial'] as const,
    dashboard: () => [...queryKeys.financial.all, 'dashboard'] as const,
    reports: () => [...queryKeys.financial.all, 'reports'] as const,
    report: (type: string, period?: any) => [...queryKeys.financial.reports(), type, period] as const,
    transactions: () => [...queryKeys.financial.all, 'transactions'] as const,
    transaction: (id: string) => [...queryKeys.financial.transactions(), id] as const,
  },
} as const

/**
 * Utilitários para invalidação de cache
 */
export const cacheUtils = {
  /**
   * Invalida todas as queries de usuários
   */
  invalidateUsers: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  },

  /**
   * Invalida queries específicas de usuário
   */
  invalidateUser: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  },

  /**
   * Invalida todas as queries de agendamentos
   */
  invalidateAppointments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
  },

  /**
   * Invalida queries específicas de agendamento
   */
  invalidateAppointment: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() })
  },

  /**
   * Invalida queries de agendamentos por usuário
   */
  invalidateUserAppointments: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byUser(userId) })
  },

  /**
   * Invalida queries de agendamentos por data
   */
  invalidateDateAppointments: (date: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byDate(date) })
  },

  /**
   * Invalida todas as queries de serviços
   */
  invalidateServices: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
  },

  /**
   * Invalida queries específicas de serviço
   */
  invalidateService: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() })
  },

  /**
   * Invalida queries financeiras
   */
  invalidateFinancial: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.all })
  },

  /**
   * Invalida relatórios financeiros
   */
  invalidateFinancialReports: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.reports() })
  },

  /**
   * Remove dados específicos do cache
   */
  removeFromCache: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey })
  },

  /**
   * Atualiza dados no cache
   */
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data)
  },

  /**
   * Obtém dados do cache
   */
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  },

  /**
   * Prefetch de dados
   */
  prefetchQuery: async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    })
  },

  /**
   * Limpa todo o cache
   */
  clearCache: () => {
    queryClient.clear()
  },

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: JSON.stringify(queries.map(q => q.state.data)).length,
    }
  },
}

/**
 * Hook para monitoramento do cache
 */
export const useCacheMonitoring = () => {
  const stats = cacheUtils.getCacheStats()
  
  return {
    ...stats,
    clearCache: cacheUtils.clearCache,
    invalidateAll: () => {
      queryClient.invalidateQueries()
    },
  }
}
