import React, { memo, useMemo, useCallback } from 'react'

import { FileText, Download, TrendingUp, BarChart3 } from 'lucide-react'
import { 
  MemoizedCard, 
  MemoizedGrid, 
  MemoizedTable,
  useMemoizedDashboardMetrics,
  useMemoizedChartData,
  useStableCallback
} from '@/shared/components/optimized'
import { Button } from '@/shared/components/ui/button'

interface Report {
  id: string
  title: string
  description: string
  type: 'financial' | 'operational' | 'client'
  lastGenerated: string
  status: 'ready' | 'generating' | 'error'
}

interface OptimizedReportsCenterProps {
  reports: Report[]
  dashboardData: any
  onGenerateReport: (reportId: string) => void
  onDownloadReport: (reportId: string) => void
  loading?: boolean
  className?: string
}

/**
 * Centro de relatórios otimizado com memoização estratégica
 */
function OptimizedReportsCenterComponent({
  reports,
  dashboardData,
  onGenerateReport,
  onDownloadReport,
  loading = false,
  className = ''
}: OptimizedReportsCenterProps) {
  // Memoizar métricas do dashboard
  const dashboardMetrics = useMemoizedDashboardMetrics(dashboardData)
  
  // Memoizar dados do gráfico
  const chartData = useMemoizedChartData(dashboardData.transactions, 'day')

  // Memoizar colunas da tabela
  const tableColumns = useMemo(() => [
    {
      key: 'title',
      header: 'Relatório',
      render: (value: string, report: Report) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-gold/10">
            <FileText className="h-4 w-4 text-primary-gold" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-gray-500">{report.description}</p>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {value === 'financial' ? 'Financeiro' : value === 'operational' ? 'Operacional' : 'Cliente'}
        </span>
      )
    },
    {
      key: 'lastGenerated',
      header: 'Última Geração',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        const statusConfig = {
          ready: { label: 'Pronto', color: 'green' },
          generating: { label: 'Gerando', color: 'yellow' },
          error: { label: 'Erro', color: 'red' }
        }
        const config = statusConfig[value as keyof typeof statusConfig]
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
            {config.label}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, report: Report) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerateReport(report.id)}
            disabled={report.status === 'generating'}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Gerar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadReport(report.id)}
            disabled={report.status !== 'ready'}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      )
    }
  ], [])

  // Memoizar handlers
  const handleGenerateReport = useStableCallback((reportId: string) => {
    onGenerateReport(reportId)
  }, [onGenerateReport])

  const handleDownloadReport = useStableCallback((reportId: string) => {
    onDownloadReport(reportId)
  }, [onDownloadReport])

  // Memoizar renderizador de card de métrica
  const renderMetricCard = useCallback((metric: any, index: number) => (
    <MemoizedCard
      key={metric.id}
      title={metric.label}
      className="h-full"
    >
      <div className="space-y-2">
        <div className="text-2xl font-bold text-primary-gold">
          {typeof metric.value === 'number' && metric.format === 'currency'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metric.value)
            : metric.value
          }
        </div>
        {metric.change && (
          <div className={`flex items-center text-sm ${
            metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-4 w-4 mr-1" />
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </div>
        )}
      </div>
    </MemoizedCard>
  ), [])

  // Memoizar renderizador de card de relatório
  const renderReportCard = useCallback((report: Report, index: number) => (
    <MemoizedCard
      key={report.id}
      title={report.title}
      className="h-full"
      headerActions={
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerateReport(report.id)}
            disabled={report.status === 'generating'}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadReport(report.id)}
            disabled={report.status !== 'ready'}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {report.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Tipo: {report.type}</span>
          <span>Atualizado: {new Date(report.lastGenerated).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </MemoizedCard>
  ), [handleGenerateReport, handleDownloadReport])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas do Dashboard */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Métricas Principais</h2>
        <MemoizedGrid
          items={dashboardMetrics}
          renderItem={renderMetricCard}
          columns={{ sm: 1, md: 2, lg: 4 }}
          loading={loading}
          loadingCount={4}
        />
      </section>

      {/* Relatórios Disponíveis - Grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Relatórios Disponíveis</h2>
        <MemoizedGrid
          items={reports}
          renderItem={renderReportCard}
          columns={{ sm: 1, md: 2, lg: 3 }}
          loading={loading}
          emptyMessage="Nenhum relatório disponível"
        />
      </section>

      {/* Relatórios Disponíveis - Tabela */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Lista Detalhada</h2>
        <MemoizedCard>
          <MemoizedTable
            data={reports}
            columns={tableColumns}
            keyExtractor={(report) => report.id}
            loading={loading}
            emptyMessage="Nenhum relatório encontrado"
          />
        </MemoizedCard>
      </section>
    </div>
  )
}

export const OptimizedReportsCenter = memo(OptimizedReportsCenterComponent)

/**
 * Exemplo de uso com comparação customizada
 */
export const OptimizedReportsCenterWithCustomCompare = memo(
  OptimizedReportsCenterComponent,
  (prevProps, nextProps) => {
    // Comparação customizada para otimizar ainda mais
    return (
      prevProps.reports.length === nextProps.reports.length &&
      prevProps.loading === nextProps.loading &&
      prevProps.dashboardData === nextProps.dashboardData &&
      // Comparar apenas IDs dos relatórios para mudanças estruturais
      prevProps.reports.every((report, index) => 
        report.id === nextProps.reports[index]?.id &&
        report.status === nextProps.reports[index]?.status
      )
    )
  }
)