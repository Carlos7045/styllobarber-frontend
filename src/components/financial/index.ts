// Barrel exports for financial module components
export * from './types'
export * from './constants'
export * from './config'
export * from './utils'
export * from './services'
export * from './hooks/use-commission'
export * from './hooks/use-expenses'
export * from './hooks/use-metrics'
export * from './hooks/use-reports'
export * from './hooks/use-cash-flow'
export * from './hooks/use-quick-transactions'

// Hooks de permissões
export { useBarberPermissions, useBarberFinancialFilter, usePermissionCheck } from '@/hooks/use-barber-permissions'
export * from './components/CommissionConfig'
export * from './components/CommissionReport'
export * from './components/ExpenseForm'
export * from './components/ExpenseList'
export * from './components/MetricCard'
export * from './components/DashboardFilters'
export * from './components/FinancialCharts'
export * from './components/FinancialDashboard'
export * from './components/FinancialDashboardSimple'
export * from './components/CashFlowManager'
export * from './components/CashFlowProjections'
export * from './components/CashFlowAlerts'
export * from './components/QuickTransactionPDV'
export * from './components/RecentTransactions'
export * from './components/PDVTest'
export * from './components/ClientSearch'
export * from './components/AgendamentoSelector'
export * from './components/BarberDashboard'
export * from './components/ReportsCenter'
export * from './components/ReceitasReport'

// Main dashboard component
export { FinancialDashboard } from './components/FinancialDashboard'
export { FinancialDashboardSimple } from './components/FinancialDashboardSimple'

// Cash flow components
export { CashFlowManager } from './components/CashFlowManager'
export { CashFlowProjections } from './components/CashFlowProjections'
export { CashFlowAlerts } from './components/CashFlowAlerts'
export { QuickTransactionPDV } from './components/QuickTransactionPDV'
export { RecentTransactions } from './components/RecentTransactions'
export { PDVTest } from './components/PDVTest'
export { ClientSearch } from './components/ClientSearch'
export { AgendamentoSelector } from './components/AgendamentoSelector'
export { BarberDashboard } from './components/BarberDashboard'

// Reports components
export { ReportsCenter } from './components/ReportsCenter'
export { ReceitasReport } from './components/ReceitasReport'

// Componentes de proteção
export { 
  PermissionGuard, 
  FinancialDataGuard, 
  PDVGuard, 
  ClientDataGuard, 
  AdminGuard,
  ConditionalRender,
  useConditionalRender
} from '@/components/auth/PermissionGuard'