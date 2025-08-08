import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyPageWrapperProps {
  title?: string
  children: React.ReactNode
  loading?: boolean
}

const PageSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-muted animate-pulse rounded-lg w-64" />
    <div className="space-y-4">
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>
  </div>
)

export function LazyPageWrapper({ title, children, loading }: LazyPageWrapperProps) {
  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
      )}
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </div>
  )
}

export default LazyPageWrapper