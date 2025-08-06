/**
 * Layout para o painel administrativo do SaaS Owner
 * Acesso restrito apenas para role 'saas_owner'
 */

'use client'

import { RouteGuard } from '@/domains/auth/components'
import { SaasAdminSidebar } from '@/components/saas/SaasAdminSidebar'
import { SaasAdminHeader } from '@/components/saas/SaasAdminHeader'

interface SaasAdminLayoutProps {
  children: React.ReactNode
}

export default function SaasAdminLayout({ children }: SaasAdminLayoutProps) {
  return (
    <RouteGuard requiredRole="saas_owner">
      <div className="min-h-screen bg-background-secondary">
        {/* Header */}
        <SaasAdminHeader />
        
        <div className="flex">
          {/* Sidebar */}
          <SaasAdminSidebar />
          
          {/* Main Content */}
          <main className="flex-1 ml-64">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}
