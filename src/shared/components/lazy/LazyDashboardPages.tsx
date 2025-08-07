/**
 * Componentes lazy para páginas do dashboard
 * Implementa lazy loading agressivo para reduzir bundle inicial
 */

import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Loading fallback otimizado
const DashboardPageSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando página...</p>
    </div>
  </div>
)

// Loading específico para páginas com gráficos
const ChartPageSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-center gap-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-lg font-semibold">Carregando relatórios...</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
    <div className="h-64 bg-muted animate-pulse rounded-lg" />
  </div>
)

// Loading específico para páginas de dados
const DataPageSkeleton = () => (
  <div className="space-y-4 p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  </div>
)

// ===== PÁGINAS ADMINISTRATIVAS =====

// Página de Serviços (muito pesada - 10.7MB)
export const LazyServicosPage = React.lazy(() => 
  import('@/app/dashboard/servicos/page').then(module => ({
    default: module.default
  }))
)

export const ServicosPageWithSuspense = () => (
  <Suspense fallback={<DataPageSkeleton />}>
    <LazyServicosPage />
  </Suspense>
)

// Página de Clientes (renomeado para evitar confusão)
export const LazyUsuariosPage = React.lazy(() => 
  import('@/app/dashboard/clientes/page').then(module => ({
    default: module.default
  }))
)

export const UsuariosPageWithSuspense = () => (
  <Suspense fallback={<DataPageSkeleton />}>
    <LazyUsuariosPage />
  </Suspense>
)

// Página de Horários
export const LazyHorariosPage = React.lazy(() => 
  import('@/app/dashboard/admin/horarios/page').then(module => ({
    default: module.default
  }))
)

export const HorariosPageWithSuspense = () => (
  <Suspense fallback={<DashboardPageSkeleton />}>
    <LazyHorariosPage />
  </Suspense>
)

// ===== PÁGINAS FINANCEIRAS =====

// PDV (Point of Sale) - componente pesado
export const LazyPDVPage = React.lazy(() => 
  import('@/app/dashboard/financeiro/pdv/page').then(module => ({
    default: module.default
  }))
)

export const PDVPageWithSuspense = () => (
  <Suspense fallback={<ChartPageSkeleton />}>
    <LazyPDVPage />
  </Suspense>
)

// Relatórios Financeiros
export const LazyRelatoriosPage = React.lazy(() => 
  import('@/app/dashboard/relatorios/page').then(module => ({
    default: module.default
  }))
)

export const RelatoriosPageWithSuspense = () => (
  <Suspense fallback={<ChartPageSkeleton />}>
    <LazyRelatoriosPage />
  </Suspense>
)

// Fluxo de Caixa
export const LazyFluxoCaixaPage = React.lazy(() => 
  import('@/app/dashboard/financeiro/fluxo-caixa/page').then(module => ({
    default: module.default
  }))
)

export const FluxoCaixaPageWithSuspense = () => (
  <Suspense fallback={<ChartPageSkeleton />}>
    <LazyFluxoCaixaPage />
  </Suspense>
)

// Comissões
export const LazyComissoesPage = React.lazy(() => 
  import('@/app/dashboard/financeiro/comissoes/page').then(module => ({
    default: module.default
  }))
)

export const ComissoesPageWithSuspense = () => (
  <Suspense fallback={<ChartPageSkeleton />}>
    <LazyComissoesPage />
  </Suspense>
)

// ===== PÁGINAS DE AGENDAMENTO =====

// Agenda/Calendar - componente pesado com calendário
export const LazyAgendaPage = React.lazy(() => 
  import('@/app/dashboard/agenda/page').then(module => ({
    default: module.default
  }))
)

export const AgendaPageWithSuspense = () => (
  <Suspense fallback={<DashboardPageSkeleton />}>
    <LazyAgendaPage />
  </Suspense>
)

// Agendamentos
export const LazyAgendamentosPage = React.lazy(() => 
  import('@/app/dashboard/agendamentos/page').then(module => ({
    default: module.default
  }))
)

export const AgendamentosPageWithSuspense = () => (
  <Suspense fallback={<DataPageSkeleton />}>
    <LazyAgendamentosPage />
  </Suspense>
)

// ===== PÁGINAS SAAS =====

// SaaS Admin Dashboard
export const LazySaasAdminPage = React.lazy(() => 
  import('@/app/saas-admin/page').then(module => ({
    default: module.default
  }))
)

export const SaasAdminPageWithSuspense = () => (
  <Suspense fallback={<ChartPageSkeleton />}>
    <LazySaasAdminPage />
  </Suspense>
)

// Barbearias Management
export const LazyBarbeariasPage = React.lazy(() => 
  import('@/app/saas-admin/barbearias/page').then(module => ({
    default: module.default
  }))
)

export const BarbeariasPageWithSuspense = () => (
  <Suspense fallback={<DataPageSkeleton />}>
    <LazyBarbeariasPage />
  </Suspense>
)

// ===== PÁGINAS DE CONFIGURAÇÃO =====

// Configurações
export const LazyConfiguracoes = React.lazy(() => 
  import('@/app/dashboard/configuracoes/page').then(module => ({
    default: module.default
  }))
)

export const ConfiguracoesWithSuspense = () => (
  <Suspense fallback={<DashboardPageSkeleton />}>
    <LazyConfiguracoes />
  </Suspense>
)

// Monitoring
export const LazyMonitoringPage = React.lazy(() => 
  import('@/app/dashboard/monitoring/page').then(module => ({
    default: module.default
  }))
)

export const MonitoringPageWithSuspense = () => (
  <Suspense fallback={<DashboardPageSkeleton />}>
    <LazyMonitoringPage />
  </Suspense>
)

// ===== HOOKS PARA PRELOAD =====

/**
 * Hook para preload de páginas baseado na navegação do usuário
 */
export const usePagePreloader = () => {
  const preloadPage = React.useCallback((pageName: string) => {
    switch (pageName) {
      case 'servicos':
        import('@/app/dashboard/servicos/page')
        break
      case 'usuarios':
        import('@/app/dashboard/clientes/page')
        break
      case 'pdv':
        import('@/app/dashboard/financeiro/pdv/page')
        break
      case 'relatorios':
        import('@/app/dashboard/relatorios/page')
        break
      case 'agenda':
        import('@/app/dashboard/agenda/page')
        break
      case 'agendamentos':
        import('@/app/dashboard/agendamentos/page')
        break
      default:
        console.log(`Preload não configurado para: ${pageName}`)
    }
  }, [])

  const preloadOnHover = React.useCallback((pageName: string) => {
    // Preload com delay para evitar preloads desnecessários
    const timeoutId = setTimeout(() => {
      preloadPage(pageName)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [preloadPage])

  return { preloadPage, preloadOnHover }
}

/**
 * Hook para preload inteligente baseado na role do usuário
 */
export const useRoleBasedPreload = (userRole?: string) => {
  const { preloadPage } = usePagePreloader()

  React.useEffect(() => {
    if (!userRole) return

    // Preload páginas baseado na role
    const preloadTimeout = setTimeout(() => {
      switch (userRole) {
        case 'admin':
          preloadPage('servicos')
          preloadPage('usuarios')
          preloadPage('relatorios')
          break
        case 'barber':
          preloadPage('agenda')
          preloadPage('agendamentos')
          break
        case 'client':
          preloadPage('agendamentos')
          break
        case 'saas_owner':
          preloadPage('relatorios')
          break
      }
    }, 1000) // Preload após 1 segundo

    return () => clearTimeout(preloadTimeout)
  }, [userRole, preloadPage])
}

// ===== COMPONENTE DE ROTEAMENTO OTIMIZADO =====

interface LazyRouteProps {
  component: React.ComponentType
  fallback?: React.ComponentType
  preload?: boolean
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ 
  component: Component, 
  fallback: Fallback = DashboardPageSkeleton,
  preload = false 
}) => {
  return (
    <Suspense fallback={<Fallback />}>
      <Component />
    </Suspense>
  )
}

// ===== EXPORTS ORGANIZADOS =====

// Páginas com Suspense (prontas para uso)
export const LazyPages = {
  // Admin
  Servicos: ServicosPageWithSuspense,
  Usuarios: UsuariosPageWithSuspense,
  Horarios: HorariosPageWithSuspense,
  
  // Financeiro
  PDV: PDVPageWithSuspense,
  Relatorios: RelatoriosPageWithSuspense,
  FluxoCaixa: FluxoCaixaPageWithSuspense,
  Comissoes: ComissoesPageWithSuspense,
  
  // Agendamento
  Agenda: AgendaPageWithSuspense,
  Agendamentos: AgendamentosPageWithSuspense,
  
  // SaaS
  SaasAdmin: SaasAdminPageWithSuspense,
  Barbearias: BarbeariasPageWithSuspense,
  
  // Configuração
  Configuracoes: ConfiguracoesWithSuspense,
  Monitoring: MonitoringPageWithSuspense,
}

// Componentes lazy (sem Suspense - para uso customizado)
export const LazyComponents = {
  ServicosPage: LazyServicosPage,
  UsuariosPage: LazyUsuariosPage,
  HorariosPage: LazyHorariosPage,
  PDVPage: LazyPDVPage,
  RelatoriosPage: LazyRelatoriosPage,
  FluxoCaixaPage: LazyFluxoCaixaPage,
  ComissoesPage: LazyComissoesPage,
  AgendaPage: LazyAgendaPage,
  AgendamentosPage: LazyAgendamentosPage,
  SaasAdminPage: LazySaasAdminPage,
  BarbeariasPage: LazyBarbeariasPage,
  ConfiguracoesPage: LazyConfiguracoes,
  MonitoringPage: LazyMonitoringPage,
}