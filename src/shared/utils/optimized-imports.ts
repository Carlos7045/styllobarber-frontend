/**
 * Imports otimizados para reduzir bundle size
 * Centraliza imports de bibliotecas pesadas para melhor tree shaking
 */

import React from 'react'

// ===== LUCIDE REACT ICONS =====
// Import específico para reduzir bundle de 33MB para apenas os ícones usados
export {
  // Navigation & Layout
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Home,
  
  // User & Profile
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  
  // Calendar & Time
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  
  // Business & Services
  Scissors,
  ShoppingBag,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  MoreVertical,
  
  // Status & Feedback
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  
  // Communication
  Bell,
  BellRing,
  Mail,
  Phone,
  MessageSquare,
  
  // Files & Data
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  
  // System
  Loader2,
  RefreshCw,
  Power,
  LogOut,
  LogIn,
  
  // Security & Auth
  Key,
  Shield,
  Lock,
  Unlock,
  
  // Theme & UI
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Zap,
  Globe,
  
  // Development & Debug
  Bug,
  Activity,
  
  // Specific to Barbershop
  MapPin,
  Star,
  Heart,
  Bookmark,
  Share2,
  Building2,
  Crown,
} from 'lucide-react'

// ===== DATE-FNS UTILITIES =====
// Import específico para reduzir bundle de 22MB
export {
  // Formatting
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  
  // Parsing
  parseISO,
  parse,
  
  // Manipulation
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  subHours,
  subMinutes,
  setHours,
  setMinutes,
  setSeconds,
  
  // Comparison
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  isWeekend,
  
  // Utilities
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  
  // Validation
  isValid,
  isDate,
  
  // Locale
  setDefaultOptions,
} from 'date-fns'

// Locale brasileiro para date-fns
export { ptBR } from 'date-fns/locale'

// ===== RECHARTS COMPONENTS =====
// Import específico para componentes de gráficos
export {
  // Charts
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  
  // Components
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  
  // Elements
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts'

// ===== FRAMER MOTION =====
// Import específico para animações (temporariamente desabilitado para build)
// export {
//   motion,
//   AnimatePresence,
//   useAnimation,
//   useMotionValue,
//   useTransform,
//   useSpring,
// } from 'framer-motion'

// Mock temporário para motion
export const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children

// ===== TANSTACK QUERY =====
// Import específico para React Query
export {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQueries,
} from '@tanstack/react-query'

// ===== ZUSTAND =====
// Import específico para state management
export {
  create,
} from 'zustand'

export {
  subscribeWithSelector,
  devtools,
  persist,
} from 'zustand/middleware'

export {
  immer,
} from 'zustand/middleware/immer'

// ===== UTILITY FUNCTIONS =====

/**
 * Função para lazy import de componentes pesados
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn)
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const FallbackComponent = fallback || (() => React.createElement('div', {}, 'Carregando...'))
    
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(LazyComponent, { ...props, ref })
    )
  })
}

/**
 * Hook para preload de componentes
 */
export function usePreloadComponent(importFn: () => Promise<any>) {
  const preload = React.useCallback(() => {
    importFn()
  }, [importFn])
  
  return preload
}

/**
 * Configurações otimizadas para React Query
 */
export const optimizedQueryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (era cacheTime)
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
}

/**
 * Configurações otimizadas para Zustand
 */
export function createOptimizedStore<T>(
  storeCreator: (set: any, get: any) => T,
  options?: {
    name?: string
    persist?: boolean
    devtools?: boolean
  }
) {
  let store = storeCreator
  
  if (options?.persist) {
    store = persist(store, { name: options.name || 'store' })
  }
  
  if (options?.devtools && process.env.NODE_ENV === 'development') {
    store = devtools(store, { name: options.name })
  }
  
  return create(store)
}

// ===== PERFORMANCE UTILITIES =====

/**
 * Debounce otimizado
 */
export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

/**
 * Throttle otimizado
 */
export function useOptimizedThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = React.useRef(Date.now())
  
  return React.useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}