/**
 * Barrel exports para componentes de Layout do StylloBarber
 * Facilita a importação dos componentes de layout
 */

// Componentes Container e Layout
export {
  Container,
  Section,
  Grid,
  Flex,
  Stack,
  Spacer,
  Center,
  containerVariants,
  type ContainerProps,
} from './container'

// Componentes Header
export {
  Header,
  HeaderContent,
  HeaderLogo,
  HeaderNav,
  HeaderNavItem,
  HeaderActions,
  HeaderMobile,
  HeaderMobileContent,
  HeaderBreadcrumbs,
  headerVariants,
  type HeaderProps,
} from './header'

// Componentes Sidebar
export {
  Sidebar,
  useSidebar,
  type NavItem,
  type SidebarProps,
} from './sidebar'

// Componentes Breadcrumbs
export {
  Breadcrumbs,
  BreadcrumbSkeleton,
  useBreadcrumbs,
  type BreadcrumbsProps,
  type BreadcrumbItem,
} from './breadcrumbs'