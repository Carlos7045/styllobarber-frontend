/**
 * Tipos para o domínio de autenticação
 */

import { 
  BaseEntity, 
  AuditableEntity, 
  SoftDeletableEntity,
  Email, 
  Phone, 
  UUID, 
  Timestamp,
  AsyncState,
  Permission,
  Role
} from '@/shared/types/base'

// Roles do sistema
export const USER_ROLES = {
  ADMIN: 'admin',
  BARBER: 'barber', 
  CLIENT: 'client'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Status do usuário
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'banned'

// Interface base do usuário
export interface User extends BaseEntity, AuditableEntity, SoftDeletableEntity {
  email: Email
  name: string
  phone?: Phone
  avatar_url?: string
  role: UserRole
  status: UserStatus
  email_verified_at?: Timestamp
  phone_verified_at?: Timestamp
  last_login_at?: Timestamp
  login_count: number
  preferences: UserPreferences
  metadata: UserMetadata
}

// Preferências do usuário
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US'
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  appointment_reminders: boolean
  promotional_offers: boolean
}

export interface PrivacyPreferences {
  profile_visibility: 'public' | 'private' | 'contacts_only'
  show_online_status: boolean
  allow_contact_by_phone: boolean
  allow_contact_by_email: boolean
}

// Metadados do usuário
export interface UserMetadata {
  registration_source: 'web' | 'mobile' | 'admin' | 'import'
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer?: string
  ip_address?: string
  user_agent?: string
}

// Perfil específico do cliente
export interface ClientProfile extends BaseEntity {
  user_id: UUID
  birth_date?: string // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  loyalty_points: number
  total_spent: number
  appointment_count: number
  favorite_services: UUID[]
  preferred_barbers: UUID[]
  notes: string
  tags: string[]
  emergency_contact?: EmergencyContact
  address?: Address
}

export interface EmergencyContact {
  name: string
  phone: Phone
  relationship: string
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  country: string
}

// Perfil específico do barbeiro
export interface BarberProfile extends BaseEntity {
  user_id: UUID
  license_number?: string
  specialties: UUID[]
  experience_years: number
  bio: string
  portfolio_images: string[]
  working_hours: WorkingHours
  commission_rate: number // Percentage 0-100
  is_available: boolean
  rating_average: number
  rating_count: number
  services_offered: UUID[]
  certifications: Certification[]
  social_links: SocialLinks
}

export interface WorkingHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  is_working: boolean
  start_time: string // HH:mm
  end_time: string // HH:mm
  break_start?: string // HH:mm
  break_end?: string // HH:mm
}

export interface Certification {
  id: UUID
  name: string
  issuer: string
  issue_date: string // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  certificate_url?: string
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  website?: string
}

// Sessão de autenticação
export interface AuthSession {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  expires_at: Timestamp | null
  permissions: Permission[]
  roles: Role[]
}

// Estado da autenticação
export interface AuthState extends AsyncState<User> {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: Permission[]
  roles: Role[]
}

// Dados para login
export interface LoginCredentials {
  email: Email
  password: string
  remember_me?: boolean
}

// Dados para registro
export interface RegisterData {
  name: string
  email: Email
  phone?: Phone
  password: string
  password_confirmation: string
  role?: UserRole
  terms_accepted: boolean
  marketing_consent?: boolean
}

// Dados para reset de senha
export interface PasswordResetRequest {
  email: Email
}

export interface PasswordResetConfirm {
  token: string
  password: string
  password_confirmation: string
}

// Dados para mudança de senha
export interface PasswordChangeData {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

// Dados para atualização de perfil
export interface ProfileUpdateData {
  name?: string
  phone?: Phone
  avatar_url?: string
  preferences?: Partial<UserPreferences>
}

// Verificação de email/telefone
export interface VerificationRequest {
  type: 'email' | 'phone'
  value: Email | Phone
}

export interface VerificationConfirm {
  type: 'email' | 'phone'
  token: string
  code: string
}

// Tipos para autenticação social
export interface SocialAuthProvider {
  id: string
  name: string
  icon: string
  enabled: boolean
}

export interface SocialAuthData {
  provider: string
  provider_id: string
  access_token: string
  refresh_token?: string
  expires_at?: Timestamp
}

// Tipos para auditoria de autenticação
export interface AuthAuditLog extends BaseEntity {
  user_id: UUID
  action: AuthAction
  ip_address: string
  user_agent: string
  location?: string
  success: boolean
  failure_reason?: string
  metadata?: Record<string, any>
}

export type AuthAction = 
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'password_change'
  | 'email_verification'
  | 'phone_verification'
  | 'profile_update'
  | 'role_change'
  | 'account_suspension'
  | 'account_deletion'

// Tipos para políticas de segurança
export interface SecurityPolicy {
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  password_expiry_days?: number
  max_login_attempts: number
  lockout_duration_minutes: number
  session_timeout_minutes: number
  require_email_verification: boolean
  require_phone_verification: boolean
  two_factor_enabled: boolean
}

// Tipos para autenticação de dois fatores
export interface TwoFactorAuth {
  enabled: boolean
  method: 'sms' | 'email' | 'authenticator'
  backup_codes: string[]
  last_used_at?: Timestamp
}

export interface TwoFactorSetup {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface TwoFactorVerification {
  code: string
  backup_code?: string
}

// Tipos para tokens de API
export interface ApiToken extends BaseEntity {
  user_id: UUID
  name: string
  token_hash: string
  permissions: Permission[]
  expires_at?: Timestamp
  last_used_at?: Timestamp
  is_active: boolean
}

// Tipos para dispositivos confiáveis
export interface TrustedDevice extends BaseEntity {
  user_id: UUID
  device_id: string
  device_name: string
  device_type: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
  ip_address: string
  location?: string
  last_used_at: Timestamp
  is_active: boolean
}

// Constantes para validação
export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_PATTERN: /^\+?[\d\s\-\(\)]+$/,
  TOKEN_EXPIRY_HOURS: 24,
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15
} as const

// Mensagens de erro
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
  ACCOUNT_SUSPENDED: 'Account has been suspended',
  EMAIL_NOT_VERIFIED: 'Email address not verified',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
  EMAIL_ALREADY_EXISTS: 'Email address already registered',
  PHONE_ALREADY_EXISTS: 'Phone number already registered'
} as const