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
export * from './components/CommissionConfig'
export * from './components/CommissionReport'
export * from './components/ExpenseForm'
export * from './components/ExpenseList'
export * from './components/MetricCard'
export * from './components/DashboardFilters'
export * from './components/FinancialCharts'
export * from './components/FinancialDashboard'
export * from './components/FinancialDashboardSimple'
export * from './components/ReportsCenter'
export * from './components/ReceitasReport'

// Main dashboard component
export { FinancialDashboard } from './components/FinancialDashboard'
export { FinancialDashboardSimple } from './components/FinancialDashboardSimple'

// Reports components
export { ReportsCenter } from './components/ReportsCenter'
export { ReceitasReport } from './components/ReceitasReport'