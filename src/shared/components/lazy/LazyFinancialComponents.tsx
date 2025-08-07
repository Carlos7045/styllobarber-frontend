import React, { Suspense } from 'react'
import { Loader2 } from '@/shared/utils/optimized-imports'

const FinancialSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} bg-muted animate-pulse rounded-lg flex items-center justify-center`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando dados financeiros...</span>
    </div>
  </div>
)

// Cash Flow Manager
export const LazyCashFlowManager = React.lazy(() => 
  import('@/components/financial/components/CashFlowManager').then(module => ({
    default: module.default || module.CashFlowManager
  })).catch(() => ({
    default: () => <div className="p-4 text-center text-muted-foreground">Componente não encontrado</div>
  }))
)

export const CashFlowManagerWithSuspense = () => (
  <Suspense fallback={<FinancialSkeleton height="h-96" />}>
    <LazyCashFlowManager />
  </Suspense>
)

// Receitas Report
export const LazyReceitasReport = React.lazy(() => 
  import('@/components/financial/components/ReceitasReport').then(module => ({
    default: module.default || module.ReceitasReport
  })).catch(() => ({
    default: () => <div className="p-4 text-center text-muted-foreground">Componente não encontrado</div>
  }))
)

export const ReceitasReportWithSuspense = () => (
  <Suspense fallback={<FinancialSkeleton height="h-96" />}>
    <LazyReceitasReport />
  </Suspense>
)

// Quick Transaction PDV
export const LazyQuickTransactionPDV = React.lazy(() => 
  import('@/components/financial/components/QuickTransactionPDV').then(module => ({
    default: module.default || module.QuickTransactionPDV
  })).catch(() => ({
    default: () => <div className="p-4 text-center text-muted-foreground">Componente não encontrado</div>
  }))
)

export const QuickTransactionPDVWithSuspense = () => (
  <Suspense fallback={<FinancialSkeleton height="h-80" />}>
    <LazyQuickTransactionPDV />
  </Suspense>
)

// Calendar Stats
export const LazyCalendarStats = React.lazy(() => 
  import('@/components/calendar/CalendarStats').then(module => ({
    default: module.default || module.CalendarStats
  })).catch(() => ({
    default: () => <div className="p-4 text-center text-muted-foreground">Componente não encontrado</div>
  }))
)

export const CalendarStatsWithSuspense = () => (
  <Suspense fallback={<FinancialSkeleton height="h-32" />}>
    <LazyCalendarStats />
  </Suspense>
)

export default {
  LazyCashFlowManager,
  CashFlowManagerWithSuspense,
  LazyReceitasReport,
  ReceitasReportWithSuspense,
  LazyQuickTransactionPDV,
  QuickTransactionPDVWithSuspense,
  LazyCalendarStats,
  CalendarStatsWithSuspense
}