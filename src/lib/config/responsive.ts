/**
 * Sistema de Breakpoints Responsivos StylloBarber
 * Configurações para diferentes tamanhos de tela
 */

// Breakpoints em pixels
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Breakpoints como strings para media queries
export const mediaQueries = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

// Configurações específicas por breakpoint
export const responsiveConfig = {
  // Container padding por breakpoint
  containerPadding: {
    xs: '1rem',    // 16px
    sm: '1.5rem',  // 24px
    md: '2rem',    // 32px
    lg: '2.5rem',  // 40px
    xl: '3rem',    // 48px
    '2xl': '3rem', // 48px
  },
  
  // Grid columns por breakpoint
  gridColumns: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  },
  
  // Sidebar width por breakpoint
  sidebarWidth: {
    xs: '100%',     // Full width em mobile
    sm: '100%',     // Full width em tablet pequeno
    md: '16rem',    // 256px em tablet
    lg: '18rem',    // 288px em desktop
    xl: '20rem',    // 320px em desktop grande
    '2xl': '20rem', // 320px em desktop muito grande
  },
  
  // Header height por breakpoint
  headerHeight: {
    xs: '3.5rem',  // 56px
    sm: '4rem',    // 64px
    md: '4rem',    // 64px
    lg: '4.5rem',  // 72px
    xl: '5rem',    // 80px
    '2xl': '5rem', // 80px
  },
  
  // Font sizes por breakpoint para títulos
  headingFontSizes: {
    h1: {
      xs: '1.875rem', // 30px
      sm: '2.25rem',  // 36px
      md: '3rem',     // 48px
      lg: '3.75rem',  // 60px
      xl: '4.5rem',   // 72px
      '2xl': '6rem',  // 96px
    },
    h2: {
      xs: '1.5rem',   // 24px
      sm: '1.875rem', // 30px
      md: '2.25rem',  // 36px
      lg: '3rem',     // 48px
      xl: '3.75rem',  // 60px
      '2xl': '4.5rem', // 72px
    },
    h3: {
      xs: '1.25rem',  // 20px
      sm: '1.5rem',   // 24px
      md: '1.875rem', // 30px
      lg: '2.25rem',  // 36px
      xl: '3rem',     // 48px
      '2xl': '3.75rem', // 60px
    },
  },
} as const

// Hook para detectar breakpoint atual (para uso futuro com React)
export type Breakpoint = keyof typeof breakpoints

// Função utilitária para verificar se está em um breakpoint específico
export const isBreakpoint = (breakpoint: Breakpoint, width: number): boolean => {
  return width >= breakpoints[breakpoint]
}

// Função para obter o breakpoint atual baseado na largura
export const getCurrentBreakpoint = (width: number): Breakpoint => {
  if (width >= breakpoints['2xl']) return '2xl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

// Classes CSS responsivas pré-definidas
export const responsiveClasses = {
  // Container responsivo
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Grid responsivo
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
  
  // Flex responsivo
  flex: 'flex flex-col sm:flex-row items-start sm:items-center gap-4',
  
  // Texto responsivo
  textResponsive: 'text-sm sm:text-base md:text-lg',
  
  // Padding responsivo
  paddingResponsive: 'p-4 sm:p-6 md:p-8 lg:p-10',
  
  // Margin responsivo
  marginResponsive: 'm-4 sm:m-6 md:m-8 lg:m-10',
  
  // Altura responsiva para hero sections
  heroHeight: 'h-screen sm:h-96 md:h-[32rem] lg:h-[40rem]',
  
  // Largura responsiva para modais
  modalWidth: 'w-full sm:w-96 md:w-[32rem] lg:w-[40rem]',
} as const

// Configurações específicas para componentes
export const componentResponsive = {
  // Botões
  button: {
    padding: {
      xs: 'px-3 py-2',
      sm: 'px-4 py-2',
      md: 'px-6 py-3',
      lg: 'px-8 py-4',
    },
    fontSize: {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    },
  },
  
  // Cards
  card: {
    padding: {
      xs: 'p-4',
      sm: 'p-6',
      md: 'p-8',
      lg: 'p-10',
    },
    borderRadius: {
      xs: 'rounded-lg',
      sm: 'rounded-xl',
      md: 'rounded-2xl',
      lg: 'rounded-3xl',
    },
  },
  
  // Inputs
  input: {
    padding: {
      xs: 'px-3 py-2',
      sm: 'px-4 py-3',
      md: 'px-5 py-4',
      lg: 'px-6 py-5',
    },
    fontSize: {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    },
  },
} as const
