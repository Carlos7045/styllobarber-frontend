/**
 * Componentes lazy para gráficos e visualizações pesadas
 * Reduz significativamente o bundle inicial ao carregar charts sob demanda
 */

import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Loading específico para gráficos
const ChartSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} bg-muted animate-pulse rounded-lg flex items-center justify-center`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando gráfico...</span>
    </div>
  </div>
)

// ===== RECHARTS COMPONENTS =====

// Line Chart
export const LazyLineChart = React.lazy(() => 
  import('@/shared/utils/optimized-imports').then(module => ({
    default: ({ data, ...props }: any) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  }))
)

// Bar Chart
export const LazyBarChart = React.lazy(() => 
  import('@/shared/utils/optimized-imports').then(module => ({
    default: ({ data, ...props }: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }))
)

// Pie Chart
export const LazyPieChart = React.lazy(() => 
  import('@/shared/utils/optimized-imports').then(module => ({
    default: ({ data, ...props }: any) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = module
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart {...props}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }
  }))
)

// Area Chart
export const LazyAreaChart = React.lazy(() => 
  import('@/shared/utils/optimized-imports').then(module => ({
    default: ({ data, ...props }: any) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }))
)

// ===== COMPONENTES COM SUSPENSE =====

interface ChartProps {
  data: any[]
  height?: string
  [key: string]: any
}

export const LineChartWithSuspense: React.FC<ChartProps> = ({ height = 'h-64', ...props }) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <div className={height}>
      <LazyLineChart {...props} />
    </div>
  </Suspense>
)

export const BarChartWithSuspense: React.FC<ChartProps> = ({ height = 'h-64', ...props }) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <div className={height}>
      <LazyBarChart {...props} />
    </div>
  </Suspense>
)

export const PieChartWithSuspense: React.FC<ChartProps> = ({ height = 'h-64', ...props }) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <div className={height}>
      <LazyPieChart {...props} />
    </div>
  </Suspense>
)

export const AreaChartWithSuspense: React.FC<ChartProps> = ({ height = 'h-64', ...props }) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <div className={height}>
      <LazyAreaChart {...props} />
    </div>
  </Suspense>
)

// ===== COMPONENTES FINANCEIROS ESPECÍFICOS =====

// Dashboard Financeiro Completo
export const LazyFinancialDashboard = React.lazy(() => 
  import('@/components/financial/components/FinancialDashboard').then(module => ({
    default: module.default || module.FinancialDashboard
  }))
)

export const FinancialDashboardWithSuspense = () => (
  <Suspense fallback={
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <ChartSkeleton height="h-80" />
    </div>
  }>
    <LazyFinancialDashboard />
  </Suspense>
)

// PDV Component
export const LazyPDVComponent = React.lazy(() => 
  import('@/components/financial/components/QuickTransactionPDV').then(module => ({
    default: module.default || module.QuickTransactionPDV
  }))
)

export const PDVComponentWithSuspense = () => (
  <Suspense fallback={
    <div className="space-y-4">
      <div className="h-16 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  }>
    <LazyPDVComponent />
  </Suspense>
)

// Reports Center
export const LazyReportsCenter = React.lazy(() => 
  import('@/components/financial/components/ReportsCenter').then(module => ({
    default: module.default || module.ReportsCenter
  }))
)

export const ReportsCenterWithSuspense = () => (
  <Suspense fallback={
    <div className="space-y-6">
      <div className="h-12 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="h-64" />
        <ChartSkeleton height="h-64" />
      </div>
      <ChartSkeleton height="h-80" />
    </div>
  }>
    <LazyReportsCenter />
  </Suspense>
)

// ===== COMPONENTES DE CALENDÁRIO =====

// Calendar Component
export const LazyCalendar = React.lazy(() => 
  import('@/components/calendar/Calendar').then(module => ({
    default: module.default || module.Calendar
  }))
)

export const CalendarWithSuspense = () => (
  <Suspense fallback={
    <div className="space-y-4">
      <div className="h-12 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  }>
    <LazyCalendar />
  </Suspense>
)

// ===== HOOKS PARA PRELOAD DE CHARTS =====

export const useChartPreloader = () => {
  const preloadChart = React.useCallback((chartType: string) => {
    switch (chartType) {
      case 'line':
        import('@/shared/utils/optimized-imports')
        break
      case 'bar':
        import('@/shared/utils/optimized-imports')
        break
      case 'pie':
        import('@/shared/utils/optimized-imports')
        break
      case 'area':
        import('@/shared/utils/optimized-imports')
        break
      case 'financial':
        import('@/components/financial/components/FinancialDashboard')
        break
      case 'calendar':
        import('@/components/calendar/Calendar')
        break
    }
  }, [])

  const preloadFinancialCharts = React.useCallback(() => {
    // Preload todos os componentes financeiros
    import('@/components/financial/components/FinancialDashboard')
    import('@/components/financial/components/QuickTransactionPDV')
    import('@/components/financial/components/ReportsCenter')
    import('@/shared/utils/optimized-imports')
  }, [])

  return { preloadChart, preloadFinancialCharts }
}

// ===== EXPORTS ORGANIZADOS =====

export const LazyCharts = {
  Line: LineChartWithSuspense,
  Bar: BarChartWithSuspense,
  Pie: PieChartWithSuspense,
  Area: AreaChartWithSuspense,
}

export const LazyFinancialComponents = {
  Dashboard: FinancialDashboardWithSuspense,
  PDV: PDVComponentWithSuspense,
  Reports: ReportsCenterWithSuspense,
}

export const LazyCalendarComponents = {
  Calendar: CalendarWithSuspense,
}

// Componentes raw (sem Suspense)
export const LazyChartsRaw = {
  LineChart: LazyLineChart,
  BarChart: LazyBarChart,
  PieChart: LazyPieChart,
  AreaChart: LazyAreaChart,
}