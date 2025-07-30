'use client'

import { Suspense } from 'react'
import { Sidebar, useSidebar } from '@/components/layout/sidebar'
import { Header, HeaderContent } from '@/components/layout/header'
import { Container } from '@/components/layout'
import { UserMenu } from '@/components/layout/UserMenu'
import { RouteGuard } from '@/components/auth'
import { ToastProvider } from '@/components/ui'
// Debug components removidos - problema resolvido!
// import { SessionProvider } from '@/components/auth/SessionProvider' // Removido temporariamente
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

// Componente de loading para o dashboard
function DashboardSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="border-border-default w-64 border-r bg-background-primary">
        <div className="border-border-default border-b p-4">
          <div className="h-6 animate-pulse rounded bg-neutral-light-gray" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <div className="h-5 w-5 animate-pulse rounded bg-neutral-light-gray" />
              <div className="h-4 flex-1 animate-pulse rounded bg-neutral-light-gray" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        <div className="border-border-default h-16 border-b bg-background-primary">
          <div className="flex h-full items-center px-6">
            <div className="h-6 w-48 animate-pulse rounded bg-neutral-light-gray" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded bg-neutral-light-gray" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-lg bg-neutral-light-gray" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Layout do Dashboard
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={['admin', 'barber', 'client']}>
      <ToastProvider>
        <DashboardContent>{children}</DashboardContent>
      </ToastProvider>
    </RouteGuard>
  )
}

// Componente interno do dashboard (após verificação de auth)
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const { isCollapsed, isDarkMode, toggleCollapse, toggleTheme } = useSidebar()

  // Determinar role do usuário
  const userRole = profile?.role || user?.user_metadata?.role || 'client' // Default para client, não admin

  console.log('🏠 Dashboard Layout - Role do usuário:', {
    userRole,
    hasProfile: !!profile,
    profileRole: profile?.role,
    metadataRole: user?.user_metadata?.role,
  })

  return (
    <div className="flex h-screen bg-background-secondary dark:bg-background-dark">
      {/* Debug components removidos - sistema funcionando perfeitamente! */}

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
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Header */}
        <Header
          variant={isDarkMode ? 'dark' : 'default'}
          container={false}
          className="border-b border-gray-200 bg-white dark:border-secondary-graphite-card/30 dark:bg-background-dark"
        >
          <Container>
            <HeaderContent>
              <div className="flex items-center gap-4">
                {/* Breadcrumbs ou título da página serão adicionados aqui */}
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* User Menu */}
                <UserMenu />
              </div>
            </HeaderContent>
          </Container>
        </Header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background-secondary dark:bg-background-dark">
          <Suspense
            fallback={
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-8 w-64 animate-pulse rounded bg-neutral-light-gray" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-32 animate-pulse rounded-lg bg-neutral-light-gray"
                      />
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
