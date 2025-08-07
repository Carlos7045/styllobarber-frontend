/**
 * Barrel exports para componentes lazy otimizados
 */

// Dashboard pages - Exports que realmente existem
export {
  LazyServicosPage,
  LazyUsuariosPage,
  LazyHorariosPage,
  LazyPDVPage,
  LazyRelatoriosPage,
  LazyFluxoCaixaPage,
  LazyComissoesPage,
  LazyAgendaPage,
  LazyAgendamentosPage,
  LazySaasAdminPage,
  LazyBarbeariasPage,
  LazyConfiguracoes,
  LazyMonitoringPage,
  // Componentes com Suspense
  ServicosPageWithSuspense,
  UsuariosPageWithSuspense,
  HorariosPageWithSuspense,
  PDVPageWithSuspense,
  RelatoriosPageWithSuspense,
  FluxoCaixaPageWithSuspense,
  ComissoesPageWithSuspense,
  AgendaPageWithSuspense,
  AgendamentosPageWithSuspense,
  SaasAdminPageWithSuspense,
  BarbeariasPageWithSuspense,
  ConfiguracoesWithSuspense,
  MonitoringPageWithSuspense,
  // Hooks e utilitários
  usePagePreloader,
  useRoleBasedPreload,
  LazyRoute,
  LazyPages,
  LazyComponents
} from './LazyDashboardPages'

// Chart components - Exports que realmente existem
export {
  LazyLineChart,
  LazyBarChart,
  LazyPieChart,
  LazyAreaChart,
  LineChartWithSuspense,
  BarChartWithSuspense,
  PieChartWithSuspense,
  AreaChartWithSuspense,
  LazyFinancialDashboard,
  LazyPDVComponent,
  LazyReportsCenter,
  LazyCalendar,
  FinancialDashboardWithSuspense,
  PDVComponentWithSuspense,
  ReportsCenterWithSuspense,
  CalendarWithSuspense,
  useChartPreloader,
  LazyCharts,
  LazyFinancialComponents,
  LazyCalendarComponents,
  LazyChartsRaw
} from './LazyChartComponents'

// Modal components - Exports que realmente existem
export {
  LazyNovoAgendamentoModal,
  LazyServicoFormModal,
  LazyNovoFuncionarioModal,
  LazyUserEditModal,
  LazyEspecialidadesModal,
  LazyCriarFuncionarioModal,
  LazyHistoricoPrecoModal,
  LazyPrimeiroAcessoModal,
  LazyModalWrapper
} from './LazyModals'

// Page wrapper component
export { LazyPageWrapper } from './LazyPageWrapper'

// Additional financial components
export {
  LazyCashFlowManager,
  CashFlowManagerWithSuspense,
  LazyReceitasReport,
  ReceitasReportWithSuspense,
  LazyQuickTransactionPDV,
  QuickTransactionPDVWithSuspense,
  LazyCalendarStats,
  CalendarStatsWithSuspense
} from './LazyFinancialComponents'

// Utils - Imports condicionais para evitar erros
export * from '@/shared/utils/lazy-loading'