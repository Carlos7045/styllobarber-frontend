'use client'

import { Suspense } from 'react'
import { Sidebar, useSidebar } from '@/components/layout/sidebar'
import { Header, HeaderContent } from '@/components/layout/header'
import { Container } from '@/components/layout'
import { UserMenu } from '@/components/layout/UserMenu'
import { RouteGuard } from '@/components/auth'
import { QuickUserInfo } from '@/components/debug/QuickUserInfo'
// import { SessionProvider } from '@/components/auth/SessionProvider' // Removido temporariamente
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

// Componente de loading para o dashboard
function DashboardSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-background-primary border-r border-border-default">
        <div className="p-4 border-b border-border-default">
          <div className="h-6 bg-neutral-light-gray animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <div className="h-5 w-5 bg-neutral-light-gray animate-pulse rounded" />
              <div className="h-4 bg-neutral-light-gray animate-pulse rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-background-primary border-b border-border-default">
          <div className="h-full flex items-center px-6">
            <div className="h-6 bg-neutral-light-gray animate-pulse rounded w-48" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 bg-neutral-light-gray animate-pulse rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-32 bg-neutral-light-gray animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Layout do Dashboard
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={['admin', 'barber', 'client']}>
      <DashboardContent>{children}</DashboardContent>
    </RouteGuard>
  )
}

// Componente interno do dashboard (após verificação de auth)
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const { isCollapsed, isDarkMode, toggleCollapse, toggleTheme } = useSidebar()

  // Determinar role do usuário
  const userRole = profile?.role || user?.user_metadata?.role || 'client' // Default para client, não admin

  return (
    <div className={cn('flex h-screen bg-background-secondary', isDarkMode && 'dark')}>
      {/* Quick User Info - só em development */}
      <QuickUserInfo />
      
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        userRole={userRole}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        variant={isDarkMode ? 'dark' : 'default'}
      />

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Header */}
        <Header variant={isDarkMode ? 'dark' : 'default'} container={false}>
          <Container>
            <HeaderContent>
              <div className="flex items-center gap-4">
                {/* Breadcrumbs ou título da página serão adicionados aqui */}
                <h1 className="text-lg font-semibold text-text-primary">
                  Dashboard
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* User Menu */}
                <UserMenu />
              </div>
            </HeaderContent>
          </Container>
        </Header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="p-6">
              <div className="space-y-4">
                <div className="h-8 bg-neutral-light-gray animate-pulse rounded w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-32 bg-neutral-light-gray animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}