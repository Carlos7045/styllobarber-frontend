/**
 * Tipos para o domínio de usuários (clientes e barbeiros)
 */

import { 
  BaseEntity, 
  AuditableEntity, 
  SoftDeletableEntity,
  UUID, 
  Email, 
  Phone, 
  Timestamp,
  Currency,
  Percentage,
  AsyncState
} from '@/shared/types/base'

import { UserRole, User, Address } from '@/domains/auth/types'

// Tipos específicos para clientes
export interface Client extends BaseEntity, AuditableEntity, SoftDeletableEntity {
  user_id: UUID
  birth_date?: string // YYYY-MM-DD
  gender?: Gender
  occupation?: string
  loyalty_points: number
  total_spent: Currency
  total_appointments: number
  average_rating: number
  preferred_services: UUID[]
  preferred_barbers: UUID[]
  allergies: string[]
  skin_type?: SkinType
  hair_type?: HairType
  notes: string
  tags: string[]
  referral_source?: ReferralSource
  referral_code?: string
  referred_by?: UUID
  emergency_contact?: EmergencyContact
  address?: Address
  communication_preferences: CommunicationPreferences
  loyalty_tier: LoyaltyTier
  last_visit_at?: Timestamp
  next_birthday?: string // MM-DD
  marketing_consent: boolean
  data_processing_consent: boolean
}

export type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say'
export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal'
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily' | 'bald'
export type ReferralSource = 'friend' | 'family' | 'social_media' | 'google' | 'advertisement' | 'walk_in' | 'other'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface EmergencyContact {
  name: string
  phone: Phone
  relationship: string
  is_primary: boolean
}

export interface CommunicationPreferences {
  preferred_channel: 'email' | 'sms' | 'whatsapp' | 'phone'
  appointment_reminders: boolean
  promotional_offers: boolean
  birthday_wishes: boolean
  loyalty_updates: boolean
  service_feedback_requests: boolean
  newsletter_subscription: boolean
  preferred_contact_time: 'morning' | 'afternoon' | 'evening' | 'any'
}

// Histórico do cliente
export interface ClientHistory extends BaseEntity {
  client_id: UUID
  appointment_id?: UUID
  type: HistoryType
  title: string
  description: string
  metadata?: Record<string, any>
  created_by: UUID
}

export type HistoryType = 
  | 'appointment'
  | 'payment'
  | 'complaint'
  | 'compliment'
  | 'note'
  | 'loyalty_reward'
  | 'referral'
  | 'birthday'
  | 'anniversary'

// Tipos específicos para barbeiros
export interface Barber extends BaseEntity, AuditableEntity, SoftDeletableEntity {
  user_id: UUID
  license_number?: string
  specialties: UUID[]
  experience_years: number
  bio: string
  portfolio_images: PortfolioImage[]
  working_schedule: WorkingSchedule
  commission_rate: Percentage
  hourly_rate?: Currency
  is_available: boolean
  is_accepting_new_clients: boolean
  max_daily_appointments: number
  rating_average: number
  rating_count: number
  total_appointments: number
  total_revenue: Currency
  services_offered: UUID[]
  certifications: Certification[]
  social_links: SocialLinks
  languages_spoken: string[]
  education: Education[]
  awards: Award[]
  professional_memberships: string[]
  insurance_info?: InsuranceInfo
  tax_info?: TaxInfo
  bank_info?: BankInfo
  performance_metrics: PerformanceMetrics
  availability_preferences: AvailabilityPreferences
}

export interface PortfolioImage {
  id: UUID
  url: string
  caption?: string
  tags: string[]
  is_featured: boolean
  uploaded_at: Timestamp
}

export interface WorkingSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
  exceptions: ScheduleException[]
}

export interface DaySchedule {
  is_working: boolean
  shifts: WorkShift[]
}

export interface WorkShift {
  start_time: string // HH:mm
  end_time: string // HH:mm
  break_start?: string // HH:mm
  break_end?: string // HH:mm
  max_appointments?: number
}

export interface ScheduleException {
  date: string // YYYY-MM-DD
  type: 'unavailable' | 'special_hours' | 'holiday'
  reason: string
  special_hours?: DaySchedule
}

export interface Certification {
  id: UUID
  name: string
  issuer: string
  issue_date: string // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  certificate_number?: string
  certificate_url?: string
  is_verified: boolean
  verification_date?: Timestamp
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
  website?: string
  whatsapp?: string
}

export interface Education {
  id: UUID
  institution: string
  degree: string
  field_of_study: string
  start_date: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
  is_current: boolean
  description?: string
}

export interface Award {
  id: UUID
  name: string
  issuer: string
  date_received: string // YYYY-MM-DD
  description?: string
  certificate_url?: string
}

export interface InsuranceInfo {
  provider: string
  policy_number: string
  coverage_amount: Currency
  expiry_date: string // YYYY-MM-DD
  certificate_url?: string
}

export interface TaxInfo {
  tax_id: string
  tax_classification: string
  tax_rate: Percentage
  is_tax_exempt: boolean
}

export interface BankInfo {
  bank_name: string
  account_type: 'checking' | 'savings'
  account_number: string
  routing_number: string
  account_holder_name: string
}

export interface PerformanceMetrics {
  punctuality_score: number // 0-100
  client_satisfaction: number // 0-100
  rebooking_rate: Percentage
  no_show_rate: Percentage
  cancellation_rate: Percentage
  revenue_per_hour: Currency
  appointments_per_day: number
  upselling_success_rate: Percentage
  complaint_count: number
  compliment_count: number
  last_calculated_at: Timestamp
}

export interface AvailabilityPreferences {
  min_break_between_appointments: number // minutes
  max_consecutive_appointments: number
  preferred_appointment_types: string[]
  blocked_services: UUID[]
  auto_accept_appointments: boolean
  advance_notice_hours: number
  weekend_availability: boolean
  holiday_availability: boolean
}

// Avaliações e feedback
export interface UserReview extends BaseEntity {
  reviewer_id: UUID
  reviewed_id: UUID
  appointment_id?: UUID
  rating: number // 1-5
  review_text?: string
  review_categories: ReviewCategory[]
  is_verified: boolean
  is_featured: boolean
  response?: ReviewResponse
  helpful_count: number
  reported_count: number
  status: ReviewStatus
}

export interface ReviewCategory {
  category: string
  rating: number // 1-5
}

export interface ReviewResponse {
  text: string
  responded_at: Timestamp
  responded_by: UUID
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

// Programa de fidelidade
export interface LoyaltyProgram extends BaseEntity {
  name: string
  description: string
  is_active: boolean
  tiers: LoyaltyTierConfig[]
  point_rules: PointRule[]
  redemption_rules: RedemptionRule[]
}

export interface LoyaltyTierConfig {
  tier: LoyaltyTier
  min_points: number
  min_spent: Currency
  benefits: string[]
  discount_percentage: Percentage
  priority_booking: boolean
  free_services_count: number
}

export interface PointRule {
  action: 'appointment' | 'referral' | 'review' | 'birthday' | 'anniversary'
  points_earned: number
  multiplier?: number
  conditions?: Record<string, any>
}

export interface RedemptionRule {
  reward_type: 'discount' | 'free_service' | 'product' | 'upgrade'
  points_required: number
  reward_value: Currency
  description: string
  terms_conditions: string[]
  expiry_days?: number
}

// Transações de pontos
export interface PointTransaction extends BaseEntity {
  client_id: UUID
  appointment_id?: UUID
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: number
  reason: string
  reference_id?: UUID
  expires_at?: Timestamp
  processed_by?: UUID
}

// Dados para criação/atualização
export interface CreateClientData {
  user_id: UUID
  birth_date?: string
  gender?: Gender
  occupation?: string
  allergies?: string[]
  skin_type?: SkinType
  hair_type?: HairType
  notes?: string
  tags?: string[]
  referral_source?: ReferralSource
  referral_code?: string
  emergency_contact?: EmergencyContact
  address?: Address
  communication_preferences?: Partial<CommunicationPreferences>
  marketing_consent: boolean
  data_processing_consent: boolean
}

export interface UpdateClientData extends Partial<CreateClientData> {
  preferred_services?: UUID[]
  preferred_barbers?: UUID[]
}

export interface CreateBarberData {
  user_id: UUID
  license_number?: string
  specialties: UUID[]
  experience_years: number
  bio: string
  commission_rate: Percentage
  hourly_rate?: Currency
  max_daily_appointments: number
  services_offered: UUID[]
  languages_spoken?: string[]
  working_schedule: WorkingSchedule
  availability_preferences?: Partial<AvailabilityPreferences>
}

export interface UpdateBarberData extends Partial<CreateBarberData> {
  is_available?: boolean
  is_accepting_new_clients?: boolean
  portfolio_images?: PortfolioImage[]
  certifications?: Certification[]
  social_links?: SocialLinks
  education?: Education[]
  awards?: Award[]
}

// Filtros para busca
export interface ClientFilters {
  loyalty_tier?: LoyaltyTier[]
  gender?: Gender[]
  age_range?: { min: number; max: number }
  total_spent_range?: { min: Currency; max: Currency }
  last_visit_range?: { start: string; end: string }
  tags?: string[]
  has_allergies?: boolean
  preferred_barber?: UUID
  referral_source?: ReferralSource[]
  marketing_consent?: boolean
}

export interface BarberFilters {
  specialties?: UUID[]
  experience_range?: { min: number; max: number }
  rating_range?: { min: number; max: number }
  is_available?: boolean
  is_accepting_new_clients?: boolean
  languages_spoken?: string[]
  services_offered?: UUID[]
  commission_rate_range?: { min: Percentage; max: Percentage }
}

// Estados para gerenciamento
export interface ClientState extends AsyncState<Client[]> {
  selectedClient: Client | null
  filters: ClientFilters
  searchTerm: string
}

export interface BarberState extends AsyncState<Barber[]> {
  selectedBarber: Barber | null
  filters: BarberFilters
  searchTerm: string
}

// Constantes
export const LOYALTY_TIER_BENEFITS: Record<LoyaltyTier, string[]> = {
  bronze: ['5% discount on services'],
  silver: ['10% discount on services', 'Priority booking'],
  gold: ['15% discount on services', 'Priority booking', '1 free service per month'],
  platinum: ['20% discount on services', 'Priority booking', '2 free services per month', 'Free products'],
  diamond: ['25% discount on services', 'VIP treatment', 'Unlimited free services', 'Personal barber assignment']
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',
  non_binary: 'Não-binário',
  other: 'Outro',
  prefer_not_to_say: 'Prefiro não informar'
}

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante'
}