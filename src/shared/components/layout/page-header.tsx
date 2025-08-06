import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs'
import { Button } from '@/shared/components/ui'

/**
 * Variantes do page header usando CVA
 * 
 * @description
 * PageHeader component para cabeçalhos de páginas com título, descrição,
 * breadcrumbs e ações. Usado dentro do conteúdo das páginas.
 */
const pageHeaderVariants = cva(
  // Classes base
  'flex flex-col gap-4 pb-6 border-b border-border-default',
  {
    variants: {
      // Variantes de espaçamento
      spacing: {
        none: 'pb-0 border-b-0',
        sm: 'pb-4 gap-2',
        md: 'pb-6 gap-4',
        lg: 'pb-8 gap-6',
      },
      
      // Variantes de alinhamento
      align: {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
      },
    },
    defaultVariants: {
      spacing: 'md',
      align: 'left',
    },
  }
)

/**
 * Interface das props do PageHeader
 */
export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  /** Título da página */
  title: string
  /** Descrição opcional da página */
  description?: string
  /** Itens de breadcrumb */
  breadcrumbs?: BreadcrumbItem[]
  /** Ações do header (botões, etc.) */
  actions?: React.ReactNode
  /** Ícone do título */
  icon?: React.ReactNode
  /** Se deve mostrar breadcrumbs */
  showBreadcrumbs?: boolean
  /** Badge ou indicador no título */
  badge?: React.ReactNode
  /** Conteúdo adicional abaixo do título */
  children?: React.ReactNode
}

/**
 * Componente PageHeader
 * 
 * @description
 * Cabeçalho de página que inclui título, descrição, breadcrumbs e ações.
 * Usado para criar uma estrutura consistente no topo das páginas.
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Usuários"
 *   description="Gerencie os usuários do sistema"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Usuários', active: true }
 *   ]}
 *   actions={
 *     <Button>
 *       Novo Usuário
 *     </Button>
 *   }
 * />
 * ```
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({
    className,
    spacing,
    align,
    title,
    description,
    breadcrumbs,
    actions,
    icon,
    showBreadcrumbs = true,
    badge,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(pageHeaderVariants({ spacing, align }), className)}
        {...props}
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* Header Content */}
        <div className={cn(
          'flex items-start justify-between gap-4',
          align === 'center' && 'flex-col items-center',
          align === 'right' && 'flex-row-reverse'
        )}>
          {/* Title Section */}
          <div className={cn(
            'flex-1 min-w-0',
            align === 'center' && 'text-center',
            align === 'right' && 'text-right'
          )}>
            {/* Title with Icon and Badge */}
            <div className={cn(
              'flex items-center gap-3 mb-2',
              align === 'center' && 'justify-center',
              align === 'right' && 'justify-end'
            )}>
              {icon && (
                <div className="flex-shrink-0 text-primary-gold">
                  {icon}
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-text-primary dark:text-white font-heading truncate">
                {title}
              </h1>
              
              {badge && (
                <div className="flex-shrink-0">
                  {badge}
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-text-secondary dark:text-gray-300 max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                {actions}
              </div>
            </div>
          )}
        </div>

        {/* Additional Content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    )
  }
)

/**
 * Componente PageHeaderSkeleton
 * 
 * @description
 * Skeleton loader para o PageHeader durante carregamento.
 */
const PageHeaderSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showBreadcrumbs?: boolean
    showActions?: boolean
  }
>(({ className, showBreadcrumbs = true, showActions = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-4 pb-6 border-b border-border-default animate-pulse', className)}
    {...props}
  >
    {/* Breadcrumbs Skeleton */}
    {showBreadcrumbs && (
      <div className="flex items-center gap-2">
        <div className="h-4 bg-neutral-light-gray rounded w-16" />
        <div className="h-4 w-4 bg-neutral-light-gray rounded" />
        <div className="h-4 bg-neutral-light-gray rounded w-20" />
      </div>
    )}

    {/* Header Content Skeleton */}
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {/* Title */}
        <div className="h-8 bg-neutral-light-gray rounded w-48 mb-2" />
        {/* Description */}
        <div className="h-4 bg-neutral-light-gray rounded w-96" />
      </div>

      {/* Actions Skeleton */}
      {showActions && (
        <div className="flex gap-2">
          <div className="h-10 bg-neutral-light-gray rounded w-24" />
          <div className="h-10 bg-neutral-light-gray rounded w-32" />
        </div>
      )}
    </div>
  </div>
))

/**
 * Componente PageHeaderActions
 * 
 * @description
 * Container para ações do PageHeader com espaçamento consistente.
 */
const PageHeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right'
    spacing?: 'tight' | 'normal' | 'loose'
  }
>(({ className, align = 'right', spacing = 'normal', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      {
        'justify-start': align === 'left',
        'justify-center': align === 'center',
        'justify-end': align === 'right',
      },
      {
        'gap-1': spacing === 'tight',
        'gap-2': spacing === 'normal',
        'gap-4': spacing === 'loose',
      },
      className
    )}
    {...props}
  />
))

/**
 * Componente PageHeaderStats
 * 
 * @description
 * Container para estatísticas no PageHeader.
 */
const PageHeaderStats = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: 2 | 3 | 4
  }
>(({ className, cols = 3, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid gap-4',
      {
        'grid-cols-1 sm:grid-cols-2': cols === 2,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': cols === 3,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': cols === 4,
      },
      className
    )}
    {...props}
  />
))

// Display names
PageHeader.displayName = 'PageHeader'
PageHeaderSkeleton.displayName = 'PageHeaderSkeleton'
PageHeaderActions.displayName = 'PageHeaderActions'
PageHeaderStats.displayName = 'PageHeaderStats'

export {
  PageHeader,
  PageHeaderSkeleton,
  PageHeaderActions,
  PageHeaderStats,
  pageHeaderVariants,
}
