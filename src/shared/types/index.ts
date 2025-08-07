/**
 * Barrel exports para todos os tipos do projeto
 * Centraliza a importação de tipos de todos os domínios
 * 
 * @note Para resolver conflitos de nomes, alguns tipos são re-exportados com aliases.
 * Veja src/shared/types/aliases.md para documentação completa.
 */

import { FinancialPaymentMethod } from '@/types'



// Tipos base e utilitários
export * from './base'

// Tipos por domínio - com re-exportação explícita para resolver conflitos
export * from '@/domains/services/types'

// Re-exportação explícita para resolver conflitos de PaymentMethod
export type {
  // Tipos de agendamentos
  AppointmentStatus,
  CalendarView,
  CancellationReason,
  Appointment,
  PaymentStatus,
  PaymentMethod as AppointmentPaymentMethod, // Métodos de pagamento para agendamentos
  AppointmentRating,
  AppointmentMetadata,
  RecurringPattern,
  AppointmentWithRelations,
  TimeSlot,
  CalendarConfig,
  BusinessHours,
  DayHours,
  Holiday,
  SpecialHours,
  CancellationPolicy,
  ReschedulingPolicy,
  CreateAppointmentData,
  UpdateAppointmentData,
  CancelAppointmentData,
  RescheduleAppointmentData,
  AppointmentFilters,
  CalendarStats,
  BarberAvailability,
  TimeBlock,
  AppointmentNotification,
  NotificationType,
  CalendarState,
  APPOINTMENT_VALIDATION,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  DEFAULT_CALENDAR_CONFIG
} from '@/domains/appointments/types'

export type {
  // Tipos financeiros
  TransactionType,
  TransactionCategory,
  PaymentMethod as FinancialPaymentMethod, // Métodos de pagamento para transações financeiras
  TransactionStatus,
  Transaction,
  TransactionMetadata,
  PaymentDetails,
  Account,
  AccountType,
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  InvoicePayment,
  Commission,
  CommissionStatus,
  FinancialReport,
  ReportType,
  ReportStatus,
  ReportParameters,
  ReportData,
  ReportSummary,
  ChartData,
  Budget,
  BudgetStatus,
  BudgetCategory,
  TaxConfiguration,
  TaxType,
  TaxApplicability,
  TaxTier,
  TaxReturn,
  TaxReturnStatus,
  FinancialMetrics,
  Revenue,
  Expenses,
  Profitability,
  CashFlow,
  Performance,
  Growth,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  FinancialState,
  TRANSACTION_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_COLORS
} from '@/domains/financial/types'

// Re-exportação explícita para resolver conflitos de nomes
export type {
  // Tipos de autenticação
  User,
  UserRole,
  UserStatus,
  ClientProfile,
  BarberProfile,
  WorkingHours,
  DaySchedule,
  Certification as AuthCertification, // Certificações para autenticação/licenças
  SocialLinks,
  AuthSession,
  AuthState,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChangeData,
  ProfileUpdateData,
  VerificationRequest,
  VerificationConfirm,
  SocialAuthProvider,
  SocialAuthData,
  AuthAuditLog,
  AuthAction,
  SecurityPolicy,
  TwoFactorAuth,
  TwoFactorSetup,
  TwoFactorVerification,
  ApiToken,
  TrustedDevice,
  USER_ROLES,
  AUTH_VALIDATION,
  AUTH_ERRORS
} from '@/domains/auth/types'

export type {
  // Tipos de usuários
  Client,
  Barber,
  Gender,
  SkinType,
  HairType,
  ReferralSource,
  LoyaltyTier,
  EmergencyContact,
  CommunicationPreferences,
  ClientHistory,
  HistoryType,
  PortfolioImage,
  WorkingSchedule,
  WorkShift,
  ScheduleException,
  Certification as UserCertification, // Certificações profissionais de barbeiros
  Education,
  Award,
  InsuranceInfo,
  TaxInfo,
  BankInfo,
  PerformanceMetrics,
  AvailabilityPreferences,
  UserReview,
  ReviewCategory,
  ReviewResponse,
  ReviewStatus,
  LoyaltyProgram,
  LoyaltyTierConfig,
  PointRule,
  RedemptionRule,
  PointTransaction,
  CreateClientData,
  UpdateClientData,
  CreateBarberData,
  UpdateBarberData,
  ClientFilters,
  BarberFilters,
  ClientState,
  BarberState,
  LOYALTY_TIER_BENEFITS,
  GENDER_LABELS,
  LOYALTY_TIER_LABELS
} from '@/domains/users/types'

// Re-export dos tipos legados para compatibilidade
export * from '@/types/auth'
export * from '@/types/appointments'

// Tipos específicos para componentes UI
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export interface LoadingProps {
  loading?: boolean
  loadingText?: string
  skeleton?: React.ReactNode
}

export interface ErrorProps {
  error?: string | null
  onRetry?: () => void
  fallback?: React.ReactNode
}

export interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
}

// Tipos para hooks customizados
export interface UseAsyncOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
}

export interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: any
  onSubmit: (values: T) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

// Tipos para contextos
export interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

export interface AuthContextValue {
  user: any | null
  login: (credentials: any) => Promise<void>
  logout: () => Promise<void>
  register: (data: any) => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

// Tipos para roteamento
export interface RouteConfig {
  path: string
  component: React.ComponentType
  exact?: boolean
  protected?: boolean
  roles?: string[]
  permissions?: string[]
  title?: string
  description?: string
}

export interface NavigationItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  children?: NavigationItem[]
  badge?: string | number
  disabled?: boolean
  external?: boolean
}

// Tipos para configurações da aplicação
export interface AppSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  integrations: IntegrationSettings
}

export interface GeneralSettings {
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  timezone: string
  currency: string
  language: string
  date_format: string
  time_format: '12h' | '24h'
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  primary_color: string
  secondary_color: string
  font_family: string
  font_size: 'sm' | 'md' | 'lg'
  compact_mode: boolean
  animations_enabled: boolean
}

export interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  desktop_notifications: boolean
  sound_enabled: boolean
  notification_frequency: 'immediate' | 'hourly' | 'daily'
}

export interface PrivacySettings {
  analytics_enabled: boolean
  crash_reporting: boolean
  usage_statistics: boolean
  marketing_communications: boolean
  data_retention_days: number
}

export interface IntegrationSettings {
  google_calendar: boolean
  whatsapp_business: boolean
  payment_gateways: string[]
  email_provider: string
  sms_provider: string
}

// Tipos para métricas e analytics
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
  user_id?: string
  session_id?: string
}

export interface PerformanceMetrics {
  page_load_time: number
  time_to_interactive: number
  first_contentful_paint: number
  largest_contentful_paint: number
  cumulative_layout_shift: number
  first_input_delay: number
}

// Tipos para testes
export interface TestUtils {
  render: (component: React.ReactElement, options?: any) => any
  screen: any
  fireEvent: any
  waitFor: (callback: () => void) => Promise<void>
  userEvent: any
}

export interface MockData {
  users: any[]
  appointments: any[]
  services: any[]
  transactions: any[]
}

// Tipos para APIs externas
export interface GoogleMapsConfig {
  apiKey: string
  libraries: string[]
  region: string
  language: string
}

export interface PaymentGatewayConfig {
  provider: string
  public_key: string
  webhook_url: string
  supported_methods: FinancialPaymentMethod[]
}

// Tipos para WebSocket
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  id: string
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

// Tipos para PWA
export interface PWAConfig {
  name: string
  short_name: string
  description: string
  theme_color: string
  background_color: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  orientation: 'portrait' | 'landscape' | 'any'
  start_url: string
  scope: string
  icons: PWAIcon[]
}

export interface PWAIcon {
  src: string
  sizes: string
  type: string
  purpose?: 'any' | 'maskable' | 'monochrome'
}

// Tipos para internacionalização
export interface I18nConfig {
  defaultLocale: string
  locales: string[]
  fallbackLocale: string
  interpolation: {
    escapeValue: boolean
  }
}

export interface TranslationResource {
  [key: string]: string | TranslationResource
}

// Tipos para SEO
export interface SEOConfig {
  title: string
  description: string
  keywords: string[]
  author: string
  canonical_url?: string
  og_image?: string
  twitter_card?: 'summary' | 'summary_large_image'
  robots?: string
  structured_data?: any
}

// Tipos para logs e debugging
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, any>
  stack?: string
  user_id?: string
  session_id?: string
}

export interface DebugInfo {
  version: string
  environment: string
  build_time: string
  commit_hash?: string
  user_agent: string
  screen_resolution: string
  memory_usage?: number
  performance_metrics?: PerformanceMetrics
}