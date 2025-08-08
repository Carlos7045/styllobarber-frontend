/**
 * Barrel exports para hooks de dados compartilhados
 */

export { useServices } from './use-services'
export { useSettings } from './use-settings'
export { useDashboardData, useBarberDashboardData } from './use-dashboard-data'
export { useFinancialData } from './use-financial-data'
export { useCashFlowData } from './use-cash-flow-data'
export { usePDVData as usePdvData } from './use-pdv-data'

// Reports
export { useClientReports } from './use-client-reports'
export { useOperationalReports } from './use-operational-reports'

// React Query integration
export { 
  useQueryService,
  useSimpleQueryService
} from './use-query-service'

// Re-export types
export type {
  UseServiceQueryConfig,
  UseServiceListQueryConfig,
  UseServiceMutationConfig
} from './use-query-service'
