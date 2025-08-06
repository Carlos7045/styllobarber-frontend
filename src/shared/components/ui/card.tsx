import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do card usando CVA
const cardVariants = cva(
  // Classes base
  'rounded-lg border bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white shadow-sm transition-all duration-200',
  {
    variants: {
      // Variantes de estilo
      variant: {
        default: 'border-gray-200 dark:border-secondary-graphite-card/30 hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200',
        elevated: 'border-gray-200 dark:border-secondary-graphite-card/30 shadow-lg hover:shadow-xl hover:border-primary-gold/50 transition-all duration-200',
        outlined: 'border-2 border-primary-gold shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
        dark: 'bg-secondary-graphite-light border-secondary-graphite-card/30 text-white hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200',
        gradient: 'bg-gradient-to-br from-primary-gold to-primary-gold-dark text-primary-black border-transparent',
      },
      
      // Variantes de tamanho/padding
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      
      // Efeitos de hover
      hover: {
        none: '',
        lift: 'hover:transform hover:-translate-y-1 hover:shadow-lg',
        glow: 'hover:shadow-gold hover:border-primary-gold/50',
        scale: 'hover:scale-[1.02]',
      },
      
      // Estados de interação
      interactive: {
        true: 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: 'none',
      interactive: false,
    },
  }
)

// Interface das props do card
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

// Componente Card principal
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, hover, interactive, className }))}
      {...props}
    />
  )
)

// Componente CardHeader
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
))

// Componente CardTitle
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-heading text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
))

// Componente CardDescription
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-300', className)}
    {...props}
  />
))

// Componente CardContent
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('pt-0', className)} 
    {...props} 
  />
))

// Componente CardFooter
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))

// Componente CardActions - para botões de ação
const CardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right'
  }
>(({ className, align = 'right', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex gap-2 pt-4',
      {
        'justify-start': align === 'left',
        'justify-center': align === 'center',
        'justify-end': align === 'right',
      },
      className
    )}
    {...props}
  />
))

// Componente CardImage - para imagens no card
const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src: string
    alt: string
    aspectRatio?: 'square' | 'video' | 'wide'
  }
>(({ className, src, alt, aspectRatio = 'video', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative overflow-hidden rounded-t-lg bg-neutral-light-gray',
      {
        'aspect-square': aspectRatio === 'square',
        'aspect-video': aspectRatio === 'video',
        'aspect-[21/9]': aspectRatio === 'wide',
      },
      className
    )}
    {...props}
  >
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
    />
  </div>
))

// Componente CardBadge - para badges/tags no card
const CardBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
      {
        'bg-neutral-light-gray text-text-secondary': variant === 'default',
        'bg-success/10 text-success': variant === 'success',
        'bg-warning/10 text-warning': variant === 'warning',
        'bg-error/10 text-error': variant === 'error',
        'bg-info/10 text-info': variant === 'info',
      },
      className
    )}
    {...props}
  />
))

// Definir display names
Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'
CardActions.displayName = 'CardActions'
CardImage.displayName = 'CardImage'
CardBadge.displayName = 'CardBadge'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardActions,
  CardImage,
  CardBadge,
  cardVariants,
}
