import * as React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/shared/utils'

// Interface para item de breadcrumb
export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  active?: boolean
}

// Interface das props do breadcrumb
export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeHref?: string
  maxItems?: number
  variant?: 'default' | 'simple' | 'pills'
}

// Componente Breadcrumbs
const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ 
    className,
    items,
    separator = <ChevronRight className="h-4 w-4" />,
    showHome = true,
    homeHref = '/',
    maxItems,
    variant = 'default',
    ...props 
  }, ref) => {
    // Processar itens com limite máximo
    const processedItems = React.useMemo(() => {
      let finalItems = [...items]
      
      // Adicionar item home se solicitado
      if (showHome && finalItems[0]?.href !== homeHref) {
        finalItems.unshift({
          label: 'Início',
          href: homeHref,
          icon: <Home className="h-4 w-4" />,
        })
      }
      
      // Aplicar limite máximo de itens
      if (maxItems && finalItems.length > maxItems) {
        const firstItem = finalItems[0]
        const lastItems = finalItems.slice(-(maxItems - 2))
        finalItems = [
          firstItem,
          { label: '...', active: false },
          ...lastItems,
        ]
      }
      
      return finalItems
    }, [items, showHome, homeHref, maxItems])

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn('flex items-center space-x-1', className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {processedItems.map((item, index) => {
            const isLast = index === processedItems.length - 1
            const isEllipsis = item.label === '...'
            
            return (
              <li key={index} className="flex items-center">
                {/* Separador (exceto para o primeiro item) */}
                {index > 0 && (
                  <span className="mx-2 text-text-muted" aria-hidden="true">
                    {separator}
                  </span>
                )}
                
                {/* Item do breadcrumb */}
                {isEllipsis ? (
                  <span className="text-text-muted">...</span>
                ) : isLast || !item.href ? (
                  // Item ativo (último) ou sem link
                  <span
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      variant === 'default' && 'text-text-primary',
                      variant === 'simple' && 'text-text-primary',
                      variant === 'pills' && 'bg-primary-gold/10 text-primary-gold px-2 py-1 rounded-full',
                      isLast && 'text-text-primary'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  // Item com link
                  <a
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary-gold',
                      variant === 'default' && 'text-text-muted hover:text-text-primary',
                      variant === 'simple' && 'text-text-muted hover:text-text-primary',
                      variant === 'pills' && 'text-text-muted hover:bg-primary-gold/10 hover:text-primary-gold px-2 py-1 rounded-full'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)

// Componente BreadcrumbSkeleton para loading
const BreadcrumbSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    items?: number
  }
>(({ className, items = 3, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center space-x-2', className)}
    {...props}
  >
    {Array.from({ length: items }).map((_, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <div className="h-4 w-4 bg-neutral-light-gray animate-pulse rounded" />
        )}
        <div className="h-4 bg-neutral-light-gray animate-pulse rounded w-16" />
      </React.Fragment>
    ))}
  </div>
))

// Hook para gerar breadcrumbs automaticamente baseado na URL
export const useBreadcrumbs = (pathname: string, customLabels?: Record<string, string>) => {
  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = customLabels?.[segment] || 
                   segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      
      return {
        label,
        href,
        active: index === segments.length - 1,
      }
    })
  }, [pathname, customLabels])
}

// Definir display names
Breadcrumbs.displayName = 'Breadcrumbs'
BreadcrumbSkeleton.displayName = 'BreadcrumbSkeleton'

export { Breadcrumbs, BreadcrumbSkeleton }
