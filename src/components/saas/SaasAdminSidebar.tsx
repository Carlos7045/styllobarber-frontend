/**
 * Sidebar do painel administrativo do SaaS Owner
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Building2, 
  Crown, 
  DollarSign, 
  BarChart3, 
  Settings, 
  FileText,
  Shield,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/saas-admin',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  {
    title: 'Barbearias',
    href: '/saas-admin/barbearias',
    icon: Building2,
    description: 'Gestão de clientes SaaS'
  },
  {
    title: 'Administradores',
    href: '/saas-admin/administradores',
    icon: Crown,
    description: 'Gestão de admins'
  },
  {
    title: 'Financeiro',
    href: '/saas-admin/financeiro',
    icon: DollarSign,
    description: 'Receitas e pagamentos'
  },
  {
    title: 'Relatórios',
    href: '/saas-admin/relatorios',
    icon: BarChart3,
    description: 'Analytics e métricas'
  },
  {
    title: 'Usuários',
    href: '/saas-admin/usuarios',
    icon: Users,
    description: 'Todos os usuários'
  },
  {
    title: 'Auditoria',
    href: '/saas-admin/auditoria',
    icon: Shield,
    description: 'Logs e segurança'
  },
  {
    title: 'Configurações',
    href: '/saas-admin/configuracoes',
    icon: Settings,
    description: 'Configurações do sistema'
  }
]

export function SaasAdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {item.title}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Informações do Sistema */}
        <div className="mt-8 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-text-muted mb-2">
            Sistema
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Versão:</span>
              <span className="font-mono">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span className="font-mono">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}