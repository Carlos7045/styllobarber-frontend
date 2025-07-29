import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Container } from './container'

// Variantes do header usando CVA
const headerVariants = cva(
  // Classes base
  'sticky top-0 z-50 w-full border-b bg-white dark:bg-secondary-graphite-light backdrop-blur',
  {
    variants: {
      // Variantes de estilo
      variant: {
        default: 'border-gray-200 dark:border-gray-700',
        transparent: 'border-transparent bg-transparent backdrop-blur-none',
        dark: 'border-gray-200 dark:border-gray-700',
        gold: 'bg-primary-gold border-primary-gold-dark text-primary-black',
      },
      
      // Variantes de altura
      size: {
        sm: 'h-12',
        md: 'h-16',
        lg: 'h-20',
        xl: 'h-24',
      },
      
      // Sombra
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shadow: 'sm',
    },
  }
)

// Interface das props do header
export interface HeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  container?: boolean
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
}

// Componente Header principal
const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ 
    className, 
    variant, 
    size, 
    shadow,
    container = true,
    containerSize = '7xl',
    children,
    ...props 
  }, ref) => {
    const content = container ? (
      <Container size={containerSize} className="h-full">
        {children}
      </Container>
    ) : children

    return (
      <header
        ref={ref}
        className={cn(headerVariants({ variant, size, shadow, className }))}
        {...props}
      >
        {content}
      </header>
    )
  }
)

// Componente HeaderContent - para o conteúdo interno do header
const HeaderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end'
    justify?: 'start' | 'center' | 'end' | 'between'
  }
>(({ 
  className, 
  align = 'center',
  justify = 'between',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full items-center',
      {
        'items-start': align === 'start',
        'items-center': align === 'center',
        'items-end': align === 'end',
      },
      {
        'justify-start': justify === 'start',
        'justify-center': justify === 'center',
        'justify-end': justify === 'end',
        'justify-between': justify === 'between',
      },
      className
    )}
    {...props}
  />
))

// Componente HeaderLogo - para o logo/marca
const HeaderLogo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    href?: string
    as?: React.ElementType
  }
>(({ className, href, as: Component = 'div', ...props }, ref) => {
  const Comp = href ? 'a' : Component
  
  return (
    <Comp
      ref={ref}
      href={href}
      className={cn(
        'flex items-center space-x-2 font-display text-xl font-bold text-primary-gold hover:text-primary-gold-dark transition-colors',
        href && 'cursor-pointer',
        className
      )}
      {...props}
    />
  )
})

// Componente HeaderNav - para navegação
const HeaderNav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn('flex items-center space-x-6', className)}
    {...props}
  />
))

// Componente HeaderNavItem - para itens de navegação
const HeaderNavItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    active?: boolean
    as?: React.ElementType
  }
>(({ className, active = false, as: Component = 'a', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      'text-sm font-medium transition-colors hover:text-primary-gold',
      active 
        ? 'text-primary-gold' 
        : 'text-text-secondary hover:text-text-primary',
      className
    )}
    {...props}
  />
))

// Componente HeaderActions - para ações do header (botões, etc.)
const HeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'tight' | 'normal' | 'loose'
  }
>(({ className, spacing = 'normal', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      {
        'space-x-2': spacing === 'tight',
        'space-x-4': spacing === 'normal',
        'space-x-6': spacing === 'loose',
      },
      className
    )}
    {...props}
  />
))

// Componente HeaderMobile - para menu mobile
const HeaderMobile = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
  }
>(({ className, isOpen = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute left-0 right-0 top-full border-b border-border-default bg-background-primary shadow-lg transition-all duration-200 md:hidden',
      isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
      className
    )}
    {...props}
  />
))

// Componente HeaderMobileContent - para conteúdo do menu mobile
const HeaderMobileContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-4 py-6 space-y-4', className)}
    {...props}
  />
))

// Componente HeaderBreadcrumbs - para breadcrumbs no header
const HeaderBreadcrumbs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    items: Array<{
      label: string
      href?: string
      active?: boolean
    }>
    separator?: React.ReactNode
  }
>(({ className, items, separator = '/', ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center space-x-2 text-sm text-text-muted', className)}
    {...props}
  >
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <span className="text-text-muted">{separator}</span>
        )}
        {item.href && !item.active ? (
          <a
            href={item.href}
            className="hover:text-primary-gold transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <span className={item.active ? 'text-text-primary font-medium' : ''}>
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </div>
))

// Definir display names
Header.displayName = 'Header'
HeaderContent.displayName = 'HeaderContent'
HeaderLogo.displayName = 'HeaderLogo'
HeaderNav.displayName = 'HeaderNav'
HeaderNavItem.displayName = 'HeaderNavItem'
HeaderActions.displayName = 'HeaderActions'
HeaderMobile.displayName = 'HeaderMobile'
HeaderMobileContent.displayName = 'HeaderMobileContent'
HeaderBreadcrumbs.displayName = 'HeaderBreadcrumbs'

export {
  Header,
  HeaderContent,
  HeaderLogo,
  HeaderNav,
  HeaderNavItem,
  HeaderActions,
  HeaderMobile,
  HeaderMobileContent,
  HeaderBreadcrumbs,
  headerVariants,
}