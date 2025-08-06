/**
 * Barrel exports para componentes de layout compartilhados
 */

// Breadcrumbs
export { 
  Breadcrumbs, 
  BreadcrumbSkeleton, 
  useBreadcrumbs 
} from './breadcrumbs'

// Container e layout utilities
export { 
  Container, 
  Section, 
  Grid, 
  Flex, 
  Stack, 
  Spacer, 
  Center 
} from './container'

// Header e componentes relacionados
export { 
  Header,
  HeaderContent,
  HeaderLogo,
  HeaderNav,
  HeaderNavItem,
  HeaderActions,
  HeaderMobile,
  HeaderMobileContent,
  HeaderBreadcrumbs
} from './header'

// Sidebar e navegação
export { 
  Sidebar, 
  useSidebar 
} from './sidebar'

// User menu
export { UserMenu } from './UserMenu'

// Layout principal e variações
export { 
  Layout,
  DashboardLayout,
  AuthLayout,
  LandingLayout,
  useLayout
} from './layout'

// Page header
export {
  PageHeader,
  PageHeaderSkeleton,
  PageHeaderActions,
  PageHeaderStats
} from './page-header'

// Re-export types
export type { BreadcrumbItem, BreadcrumbsProps } from './breadcrumbs'
export type { ContainerProps } from './container'
export type { HeaderProps } from './header'
export type { SidebarProps, NavItem } from './sidebar'
export type { LayoutProps } from './layout'
export type { PageHeaderProps } from './page-header'
