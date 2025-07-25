'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cva, type VariantProps } from 'class-variance-authority'
import { 
  Calendar, 
  Users, 
  Scissors, 
  UserCheck, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Home
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'

// Variantes do sidebar
const sidebarVariants = cva(
  'flex flex-col bg-background-primary border-r border-border-default transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-background-primary text-text-primary',
        dark: 'bg-background-dark text-text-inverse border-border-dark',
        gold: 'bg-primary-gold text-primary-black',
      },
      size: {
        collapsed: 'w-16',
        expanded: 'w-64',
      },
      position: {
        fixed: 'fixed left-0 top-0 h-screen z-40',
        relative: 'relative h-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'expanded',
      position: 'fixed',
    },
  }
)

// Interface para itens de navegação
export interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  roles?: string[] // Roles que podem ver este item
  children?: NavItem[]
}

// Itens de navegação por role
const navigationItems: Record<string, NavItem[]> = {
  admin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/dashboard/agenda',
      icon: Calendar,
      badge: '3',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      href: '/dashboard/clientes',
      icon: Users,
    },
    {
      id: 'servicos',
      label: 'Serviços',
      href: '/dashboard/servicos',
      icon: Scissors,
    },
    {
      id: 'funcionarios',
      label: 'Funcionários',
      href: '/dashboard/funcionarios',
      icon: UserCheck,
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: DollarSign,
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      href: '/dashboard/relatorios',
      icon: BarChart3,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings,
    },
  ],
  barber: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/dashboard/agenda',
      icon: Calendar,
      badge: '2',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      href: '/dashboard/clientes',
      icon: Users,
    },
    {
      id: 'servicos',
      label: 'Serviços',
      href: '/dashboard/servicos',
      icon: Scissors,
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: DollarSign,
    },
  ],
  client: [
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      href: '/dashboard/agendamentos',
      icon: Calendar,
    },
    {
      id: 'historico',
      label: 'Histórico',
      href: '/dashboard/historico',
      icon: BarChart3,
    },
    {
      id: 'perfil',
      label: 'Perfil',
      href: '/dashboard/perfil',
      icon: Settings,
    },
  ],
}

// Interface das props do sidebar
export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  userRole?: 'admin' | 'barber' | 'client'
  isDarkMode?: boolean
  onToggleTheme?: () => void
}

// Componente Sidebar principal
export function Sidebar({
  className,
  variant,
  size,
  position,
  isCollapsed = false,
  onToggleCollapse,
  userRole = 'admin',
  isDarkMode = false,
  onToggleTheme,
  ...props
}: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  // Obter itens de navegação baseado no role
  const navItems = navigationItems[userRole] || navigationItems.admin

  // Função para verificar se item está ativo
  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Função para lidar com logout
  const handleLogout = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          sidebarVariants({ 
            variant, 
            size: isCollapsed ? 'collapsed' : 'expanded', 
            position 
          }),
          // Responsividade mobile
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
        {...props}
      >
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="font-display text-xl font-bold text-primary-gold hover:text-primary-gold-dark transition-colors"
            >
              STYLLOBARBER
            </Link>
          )}
          
          {/* Botão de toggle (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Botão de fechar (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={isItemActive(item.href)}
              isCollapsed={isCollapsed}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Footer do Sidebar */}
        <div className="p-4 border-t border-border-default space-y-2">
          {/* Toggle tema */}
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={onToggleTheme}
            className="w-full justify-start"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!isCollapsed && (
              <span className="ml-2">
                {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            )}
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={handleLogout}
            className="w-full justify-start text-error hover:text-error-dark hover:bg-error/10"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Botão de menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  )
}

// Componente para item de navegação
interface SidebarNavItemProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function SidebarNavItem({ item, isActive, isCollapsed, onClick }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-gold/10 hover:text-primary-gold',
        isActive
          ? 'bg-primary-gold text-primary-black shadow-sm'
          : 'text-text-secondary hover:text-text-primary',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="bg-primary-gold text-primary-black text-xs px-2 py-0.5 rounded-full font-semibold">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )
}

// Hook para controlar o estado do sidebar
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  // Persistir estado no localStorage
  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    const savedDarkMode = localStorage.getItem('dark-mode')
    
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed))
    }
    
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  const toggleTheme = React.useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev
      localStorage.setItem('dark-mode', JSON.stringify(newValue))
      
      // Aplicar classe dark no documento
      if (newValue) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      return newValue
    })
  }, [])

  return {
    isCollapsed,
    isDarkMode,
    toggleCollapse,
    toggleTheme,
  }
}

// NavItem já foi exportado acima