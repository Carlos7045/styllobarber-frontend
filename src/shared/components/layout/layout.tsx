import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { Header, type HeaderProps } from './header'
import { Sidebar, useSidebar, type SidebarProps } from './sidebar'
import { Container, type ContainerProps } from './container'

/**
 * Variantes do layout usando CVA
 * 
 * @description
 * Layout component que unifica Header, Sidebar e área de conteúdo.
 * Suporta diferentes configurações de layout e responsividade.
 */
const layoutVariants = cva(
  // Classes base
  'min-h-screen bg-background-primary',
  {
    variants: {
      // Tipo de layout
      type: {
        dashboard: 'flex',
        landing: 'block',
        auth: 'flex items-center justify-center',
        fullscreen: 'block',
      },
      
      // Tema
      theme: {
        light: 'bg-background-primary text-text-primary',
        dark: 'bg-background-dark text-text-inverse',
      },
    },
    defaultVariants: {
      type: 'dashboard',
      theme: 'light',
    },
  }
)

/**
 * Interface das props do Layout
 */
export interface LayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof layoutVariants> {
  /** Props do header */
  headerProps?: Partial<HeaderProps>
  /** Props do sidebar */
  sidebarProps?: Partial<SidebarProps>
  /** Props do container de conteúdo */
  containerProps?: Partial<ContainerProps>
  /** Se deve mostrar o header */
  showHeader?: boolean
  /** Se deve mostrar o sidebar */
  showSidebar?: boolean
  /** Se deve usar container no conteúdo */
  useContainer?: boolean
  /** Conteúdo do header customizado */
  headerContent?: React.ReactNode
  /** Conteúdo do sidebar customizado */
  sidebarContent?: React.ReactNode
  /** Role do usuário para navegação */
  userRole?: 'admin' | 'barber' | 'client'
}

/**
 * Componente Layout
 * 
 * @description
 * Layout principal da aplicação que combina Header, Sidebar e área de conteúdo.
 * Gerencia automaticamente o estado do sidebar e tema.
 * 
 * @example
 * ```tsx
 * <Layout 
 *   type="dashboard"
 *   userRole="admin"
 *   headerProps={{ variant: 'default' }}
 *   sidebarProps={{ variant: 'default' }}
 * >
 *   <h1>Conteúdo da página</h1>
 * </Layout>
 * ```
 */
const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({
    className,
    type,
    theme,
    headerProps = {},
    sidebarProps = {},
    containerProps = {},
    showHeader = true,
    showSidebar = type === 'dashboard',
    useContainer = true,
    headerContent,
    sidebarContent,
    userRole = 'admin',
    children,
    ...props
  }, ref) => {
    // Hook do sidebar para gerenciar estado
    const { isCollapsed, isDarkMode, toggleCollapse, toggleTheme } = useSidebar()

    // Aplicar tema dark se necessário
    React.useEffect(() => {
      if (theme === 'dark' || isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }, [theme, isDarkMode])

    // Renderizar conteúdo baseado no tipo de layout
    const renderContent = () => {
      const content = useContainer ? (
        <Container {...containerProps}>
          {children}
        </Container>
      ) : children

      switch (type) {
        case 'dashboard':
          return (
            <>
              {/* Sidebar */}
              {showSidebar && (
                sidebarContent || (
                  <Sidebar
                    isCollapsed={isCollapsed}
                    onToggleCollapse={toggleCollapse}
                    userRole={userRole}
                    isDarkMode={isDarkMode}
                    onToggleTheme={toggleTheme}
                    {...sidebarProps}
                  />
                )
              )}

              {/* Main Content Area */}
              <div className={cn(
                'flex-1 flex flex-col min-h-screen',
                showSidebar && (isCollapsed ? 'lg:ml-16' : 'lg:ml-64')
              )}>
                {/* Header */}
                {showHeader && (
                  headerContent || (
                    <Header {...headerProps} />
                  )
                )}

                {/* Page Content */}
                <main className="flex-1 p-6">
                  {content}
                </main>
              </div>
            </>
          )

        case 'landing':
          return (
            <>
              {showHeader && (
                headerContent || (
                  <Header 
                    variant="transparent" 
                    {...headerProps} 
                  />
                )
              )}
              <main>
                {content}
              </main>
            </>
          )

        case 'auth':
          return (
            <main className="flex-1 flex items-center justify-center p-6">
              {content}
            </main>
          )

        case 'fullscreen':
          return (
            <main className="h-screen overflow-hidden">
              {content}
            </main>
          )

        default:
          return content
      }
    }

    return (
      <div
        ref={ref}
        className={cn(layoutVariants({ type, theme }), className)}
        {...props}
      >
        {renderContent()}
      </div>
    )
  }
)

/**
 * Componente DashboardLayout
 * 
 * @description
 * Layout específico para páginas do dashboard com sidebar e header.
 */
const DashboardLayout = React.forwardRef<HTMLDivElement, Omit<LayoutProps, 'type'>>(
  (props, ref) => {
    return <Layout ref={ref} type="dashboard" {...props} />
  }
)

/**
 * Componente AuthLayout
 * 
 * @description
 * Layout específico para páginas de autenticação (login, registro, etc.).
 */
const AuthLayout = React.forwardRef<HTMLDivElement, Omit<LayoutProps, 'type' | 'showHeader' | 'showSidebar'>>(
  (props, ref) => {
    return (
      <Layout 
        ref={ref} 
        type="auth" 
        showHeader={false} 
        showSidebar={false} 
        {...props} 
      />
    )
  }
)

/**
 * Componente LandingLayout
 * 
 * @description
 * Layout específico para páginas de landing (home, sobre, etc.).
 */
const LandingLayout = React.forwardRef<HTMLDivElement, Omit<LayoutProps, 'type' | 'showSidebar'>>(
  (props, ref) => {
    return (
      <Layout 
        ref={ref} 
        type="landing" 
        showSidebar={false} 
        {...props} 
      />
    )
  }
)

/**
 * Hook para usar o contexto do layout
 */
export const useLayout = () => {
  const sidebar = useSidebar()
  
  return {
    ...sidebar,
    // Adicionar outras funcionalidades do layout aqui
  }
}

// Display names
Layout.displayName = 'Layout'
DashboardLayout.displayName = 'DashboardLayout'
AuthLayout.displayName = 'AuthLayout'
LandingLayout.displayName = 'LandingLayout'

export {
  Layout,
  DashboardLayout,
  AuthLayout,
  LandingLayout,
  layoutVariants,
}
