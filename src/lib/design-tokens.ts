/**
 * Tokens de Design do StylloBarber
 * Centraliza todas as configurações de design para consistência
 */

// Paleta de cores
export const colors = {
  // Cores primárias
  primary: {
    black: '#000000',
    gold: '#D4AF37',
    goldLight: '#E6C757',
    goldDark: '#B8941F',
  },
  
  // Cores secundárias
  secondary: {
    graphite: '#2F2F2F',
    graphiteLight: '#404040',
    graphiteDark: '#1A1A1A',
    petrol: '#1B4D4D',
    petrolLight: '#2A6B6B',
    petrolDark: '#0F3333',
    darkRed: '#8B0000',
    darkRedLight: '#A50000',
    darkRedDark: '#660000',
  },
  
  // Cores neutras
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    mediumGray: '#9CA3AF',
    darkGray: '#374151',
    darkerGray: '#1F2937',
  },
  
  // Cores de estado
  state: {
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
  },
} as const

// Sistema tipográfico
export const typography = {
  fontFamilies: {
    heading: ['Montserrat', 'sans-serif'],
    display: ['Bebas Neue', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    interface: ['Poppins', 'sans-serif'],
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

// Sistema de espaçamento
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px
} as const

// Sistema de breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Sistema de sombras
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  gold: '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
  goldLg: '0 10px 25px -3px rgba(212, 175, 55, 0.3)',
  dark: '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
  darkLg: '0 10px 25px -3px rgba(0, 0, 0, 0.25)',
} as const

// Sistema de border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const

// Durações de animação
export const durations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '750ms',
} as const

// Curvas de animação
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// Configurações de componentes
export const components = {
  button: {
    heights: {
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px
      lg: '3rem',    // 48px
      xl: '3.5rem',  // 56px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
      xl: '1.25rem 2.5rem',
    },
  },
  
  input: {
    heights: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.25rem',
    },
  },
  
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },
} as const

// Configurações de layout
export const layout = {
  container: {
    maxWidth: '1280px',
    padding: '1rem',
  },
  
  sidebar: {
    width: '16rem',      // 256px
    collapsedWidth: '4rem', // 64px
  },
  
  header: {
    height: '4rem',      // 64px
  },
} as const