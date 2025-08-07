import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface MemoizedCardProps {
  title?: string
  children: React.ReactNode
  className?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  headerActions?: React.ReactNode
}

/**
 * Card memoizado para evitar re-renders desnecessários
 */
function MemoizedCardComponent({
  title,
  children,
  className,
  loading = false,
  error = null,
  onRetry,
  headerActions
}: MemoizedCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary-gold text-white rounded hover:bg-primary-gold/90 transition-colors"
            >
              Tentar novamente
            </button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {(title || headerActions) && (
        <CardHeader className="flex flex-row items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          {headerActions}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

export const MemoizedCard = memo(MemoizedCardComponent)