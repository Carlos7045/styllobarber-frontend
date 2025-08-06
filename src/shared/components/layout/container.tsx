import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do container usando CVA
const containerVariants = cva(
  // Classes base
  'w-full mx-auto',
  {
    variants: {
      // Variantes de tamanho máximo
      size: {
        sm: 'max-w-screen-sm',      // 640px
        md: 'max-w-screen-md',      // 768px
        lg: 'max-w-screen-lg',      // 1024px
        xl: 'max-w-screen-xl',      // 1280px
        '2xl': 'max-w-screen-2xl',  // 1536px
        '7xl': 'max-w-7xl',         // 1280px (Tailwind default)
        full: 'max-w-full',         // 100%
        none: '',                   // Sem max-width
      },
      
      // Variantes de padding
      padding: {
        none: '',
        sm: 'px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8',
        xl: 'px-4 sm:px-6 lg:px-8 xl:px-12',
      },
      
      // Variantes de centralização
      center: {
        true: 'mx-auto',
        false: '',
      },
    },
    defaultVariants: {
      size: '7xl',
      padding: 'lg',
      center: true,
    },
  }
)

// Interface das props do container
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: React.ElementType
}

// Componente Container
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding, center, className }))}
        {...props}
      />
    )
  }
)

// Componente Section - para seções da página
const Section = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    as?: React.ElementType
    spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    background?: 'transparent' | 'primary' | 'secondary' | 'dark'
  }
>(({ 
  className, 
  as: Component = 'section', 
  spacing = 'lg',
  background = 'transparent',
  ...props 
}, ref) => (
  <Component
    ref={ref}
    className={cn(
      // Espaçamento vertical
      {
        'py-4': spacing === 'sm',
        'py-8': spacing === 'md',
        'py-12 md:py-16 lg:py-20': spacing === 'lg',
        'py-16 md:py-20 lg:py-24': spacing === 'xl',
      },
      // Background
      {
        'bg-transparent': background === 'transparent',
        'bg-background-primary': background === 'primary',
        'bg-background-secondary': background === 'secondary',
        'bg-background-dark text-text-inverse': background === 'dark',
      },
      className
    )}
    {...props}
  />
))

// Componente Grid responsivo
const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    responsive?: boolean
  }
>(({ 
  className, 
  cols = 1, 
  gap = 'md',
  responsive = true,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid',
      // Colunas base
      {
        'grid-cols-1': cols === 1,
        'grid-cols-2': cols === 2,
        'grid-cols-3': cols === 3,
        'grid-cols-4': cols === 4,
        'grid-cols-5': cols === 5,
        'grid-cols-6': cols === 6,
        'grid-cols-12': cols === 12,
      },
      // Responsividade automática
      responsive && {
        'sm:grid-cols-2': cols >= 2,
        'md:grid-cols-3': cols >= 3,
        'lg:grid-cols-4': cols >= 4,
        'xl:grid-cols-5': cols >= 5,
        '2xl:grid-cols-6': cols >= 6,
      },
      // Gap
      {
        'gap-1': gap === 'sm',
        'gap-4': gap === 'md',
        'gap-6': gap === 'lg',
        'gap-8': gap === 'xl',
      },
      className
    )}
    {...props}
  />
))

// Componente Flex responsivo
const Flex = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
    wrap?: boolean
    gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    responsive?: boolean
  }
>(({ 
  className, 
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  responsive = false,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex',
      // Direção
      {
        'flex-row': direction === 'row',
        'flex-col': direction === 'col',
        'flex-row-reverse': direction === 'row-reverse',
        'flex-col-reverse': direction === 'col-reverse',
      },
      // Responsividade
      responsive && 'flex-col sm:flex-row',
      // Alinhamento
      {
        'items-start': align === 'start',
        'items-center': align === 'center',
        'items-end': align === 'end',
        'items-stretch': align === 'stretch',
        'items-baseline': align === 'baseline',
      },
      // Justificação
      {
        'justify-start': justify === 'start',
        'justify-center': justify === 'center',
        'justify-end': justify === 'end',
        'justify-between': justify === 'between',
        'justify-around': justify === 'around',
        'justify-evenly': justify === 'evenly',
      },
      // Wrap
      wrap && 'flex-wrap',
      // Gap
      {
        'gap-1': gap === 'sm',
        'gap-4': gap === 'md',
        'gap-6': gap === 'lg',
        'gap-8': gap === 'xl',
      },
      className
    )}
    {...props}
  />
))

// Componente Stack - para empilhar elementos verticalmente
const Stack = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    align?: 'start' | 'center' | 'end' | 'stretch'
  }
>(({ 
  className, 
  spacing = 'md',
  align = 'stretch',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col',
      // Alinhamento
      {
        'items-start': align === 'start',
        'items-center': align === 'center',
        'items-end': align === 'end',
        'items-stretch': align === 'stretch',
      },
      // Espaçamento
      {
        'space-y-1': spacing === 'sm',
        'space-y-4': spacing === 'md',
        'space-y-6': spacing === 'lg',
        'space-y-8': spacing === 'xl',
      },
      className
    )}
    {...props}
  />
))

// Componente Spacer - para criar espaços flexíveis
const Spacer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1', className)}
    {...props}
  />
))

// Componente Center - para centralizar conteúdo
const Center = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inline?: boolean
  }
>(({ className, inline = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      inline ? 'inline-flex' : 'flex',
      'items-center justify-center',
      className
    )}
    {...props}
  />
))

// Definir display names
Container.displayName = 'Container'
Section.displayName = 'Section'
Grid.displayName = 'Grid'
Flex.displayName = 'Flex'
Stack.displayName = 'Stack'
Spacer.displayName = 'Spacer'
Center.displayName = 'Center'

export {
  Container,
  Section,
  Grid,
  Flex,
  Stack,
  Spacer,
  Center,
  containerVariants,
}
