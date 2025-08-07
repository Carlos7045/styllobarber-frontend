/**
 * Tipos base e utilitários para todo o projeto
 */

// Tipos primitivos customizados
export type UUID = string
export type Email = string
export type Phone = string
export type Timestamp = string // ISO 8601
export type Currency = number // Valor em centavos
export type Percentage = number // 0-100

// Entidade base para todos os modelos
export interface BaseEntity {
  readonly id: UUID
  readonly created_at: Timestamp
  readonly updated_at?: Timestamp
  readonly version?: number
}

// Entidade auditável
export interface AuditableEntity extends BaseEntity {
  readonly created_by?: UUID
  readonly updated_by?: UUID
}

// Entidade com soft delete
export interface SoftDeletableEntity extends BaseEntity {
  readonly deleted_at?: Timestamp
  readonly is_deleted: boolean
}

// Tipos para operações CRUD
export type CreateInput<T> = Omit<T, keyof BaseEntity>
export type UpdateInput<T> = Partial<CreateInput<T>>
export type EntityWithId<T> = T & { id: UUID }

// Tipos para API responses
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
  timestamp: Timestamp
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Timestamp
}

export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Tipos para filtros e ordenação
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: any
}

export interface QueryOptions {
  filters?: FilterOptions
  sort?: SortOptions
  pagination?: PaginationParams
  include?: string[]
}

// Tipos para datas
export interface DateRange {
  start: Date
  end: Date
}

export interface TimeRange {
  start: string // HH:mm
  end: string // HH:mm
}

// Tipos para status genéricos
export type Status = 'active' | 'inactive' | 'pending' | 'archived'

// Tipos para operações assíncronas
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface AsyncOperation {
  loading: boolean
  error: string | null
  success: boolean
}

// Tipos para formulários
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// Tipos para validação
export interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
}

export interface ValidationResult {
  success: boolean
  errors: ValidationError[]
}

// Tipos para componentes UI
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

export interface ToastNotification {
  id: UUID
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Tipos para configurações
export interface AppConfig {
  name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  features: Record<string, boolean>
}

// Tipos para permissões
export type Permission = string
export type Role = string

export interface UserPermissions {
  roles: Role[]
  permissions: Permission[]
}

// Tipos para eventos
export interface DomainEvent<T = any> {
  id: UUID
  type: string
  payload: T
  timestamp: Timestamp
  source: string
}

// Tipos utilitários avançados
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Tipos para discriminated unions
export interface SuccessResult<T> {
  success: true
  data: T
}

export interface ErrorResult {
  success: false
  error: ApiError
}

export type Result<T> = SuccessResult<T> | ErrorResult

// Tipos para configurações de componentes
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type ComponentColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'

// Tipos para temas
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

// Tipos para localização
export type Locale = 'pt-BR' | 'en-US'

export interface LocalizedText {
  [key: string]: string
}

// Tipos para métricas e analytics
export interface Metric {
  name: string
  value: number
  unit?: string
  timestamp: Timestamp
}

export interface PerformanceMetric extends Metric {
  category: 'performance' | 'user' | 'business'
  tags?: Record<string, string>
}