/**
 * Tipos para o domínio de serviços
 */

import { 
  BaseEntity, 
  AuditableEntity, 
  SoftDeletableEntity,
  UUID, 
  Timestamp,
  Currency,
  Percentage,
  AsyncState
} from '@/shared/types/base'

// Interface principal do serviço
export interface Service extends BaseEntity, AuditableEntity, SoftDeletableEntity {
  name: string
  description: string
  short_description?: string
  category_id: UUID
  duration_minutes: number
  base_price: Currency
  current_price: Currency
  is_active: boolean
  is_featured: boolean
  requires_consultation: boolean
  max_advance_booking_days: number
  min_advance_booking_hours: number
  preparation_time_minutes: number
  cleanup_time_minutes: number
  skill_level_required: SkillLevel
  age_restrictions?: AgeRestriction
  gender_restrictions?: GenderRestriction[]
  contraindications: string[]
  aftercare_instructions: string[]
  images: ServiceImage[]
  tags: string[]
  seo_keywords: string[]
  booking_notes?: string
  internal_notes?: string
  supplies_needed: Supply[]
  estimated_cost: Currency
  profit_margin: Percentage
  popularity_score: number
  rating_average: number
  rating_count: number
  booking_count: number
  revenue_total: Currency
  last_booked_at?: Timestamp
  seasonal_availability?: SeasonalAvailability
  add_ons: UUID[]
  alternatives: UUID[]
  prerequisites: UUID[]
  metadata: ServiceMetadata
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type GenderRestriction = 'male' | 'female' | 'non_binary'

export interface AgeRestriction {
  min_age?: number
  max_age?: number
  requires_guardian_consent: boolean
}

export interface ServiceImage {
  id: UUID
  url: string
  alt_text: string
  caption?: string
  is_primary: boolean
  sort_order: number
  tags: string[]
  uploaded_at: Timestamp
}

export interface Supply {
  id: UUID
  name: string
  quantity_needed: number
  unit: string
  cost_per_unit: Currency
  is_consumable: boolean
}

export interface SeasonalAvailability {
  available_months: number[] // 1-12
  peak_season_multiplier: number
  off_season_discount: Percentage
}

export interface ServiceMetadata {
  created_source: 'admin' | 'import' | 'api'
  last_price_change_at?: Timestamp
  last_price_change_by?: UUID
  price_change_reason?: string
  competitor_prices?: CompetitorPrice[]
  market_research_notes?: string
  profitability_analysis?: ProfitabilityAnalysis
}

export interface CompetitorPrice {
  competitor_name: string
  price: Currency
  date_checked: string // YYYY-MM-DD
  source_url?: string
  notes?: string
}

export interface ProfitabilityAnalysis {
  cost_breakdown: CostBreakdown
  profit_per_service: Currency
  break_even_bookings: number
  roi_percentage: Percentage
  last_calculated_at: Timestamp
}

export interface CostBreakdown {
  supplies_cost: Currency
  labor_cost: Currency
  overhead_cost: Currency
  equipment_depreciation: Currency
  total_cost: Currency
}

// Categoria de serviços
export interface ServiceCategory extends BaseEntity, AuditableEntity {
  name: string
  description?: string
  slug: string
  parent_id?: UUID
  icon?: string
  color?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  seo_title?: string
  seo_description?: string
  services_count: number
  subcategories?: ServiceCategory[]
}

// Preços e promoções
export interface ServicePricing extends BaseEntity {
  service_id: UUID
  price_type: PriceType
  price: Currency
  valid_from: Timestamp
  valid_until?: Timestamp
  conditions?: PricingCondition[]
  is_active: boolean
  created_by: UUID
}

export type PriceType = 'base' | 'promotional' | 'seasonal' | 'loyalty' | 'group' | 'first_time'

export interface PricingCondition {
  type: 'day_of_week' | 'time_of_day' | 'client_tier' | 'booking_advance' | 'group_size'
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: any
  description: string
}

// Pacotes de serviços
export interface ServicePackage extends BaseEntity, AuditableEntity, SoftDeletableEntity {
  name: string
  description: string
  services: PackageService[]
  total_duration_minutes: number
  individual_price: Currency
  package_price: Currency
  discount_amount: Currency
  discount_percentage: Percentage
  is_active: boolean
  is_featured: boolean
  max_validity_days: number
  terms_conditions: string[]
  images: ServiceImage[]
  booking_count: number
  revenue_total: Currency
}

export interface PackageService {
  service_id: UUID
  quantity: number
  is_optional: boolean
  discount_percentage?: Percentage
  notes?: string
}

// Add-ons e extras
export interface ServiceAddon extends BaseEntity, AuditableEntity {
  name: string
  description: string
  price: Currency
  duration_minutes: number
  is_active: boolean
  applicable_services: UUID[]
  is_required: boolean
  max_quantity: number
  category: 'product' | 'service' | 'upgrade'
  inventory_tracked: boolean
  stock_quantity?: number
  low_stock_threshold?: number
}

// Avaliações de serviços
export interface ServiceReview extends BaseEntity {
  service_id: UUID
  client_id: UUID
  appointment_id: UUID
  rating: number // 1-5
  review_text?: string
  review_categories: ServiceReviewCategory[]
  images?: string[]
  is_verified: boolean
  is_featured: boolean
  helpful_count: number
  reported_count: number
  barber_response?: string
  barber_response_at?: Timestamp
  status: ReviewStatus
}

export interface ServiceReviewCategory {
  category: 'quality' | 'value' | 'experience' | 'results' | 'cleanliness'
  rating: number // 1-5
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

// Disponibilidade de serviços
export interface ServiceAvailability extends BaseEntity {
  service_id: UUID
  barber_id?: UUID // Se null, aplica a todos
  day_of_week: number // 0-6 (0=domingo)
  start_time: string // HH:mm
  end_time: string // HH:mm
  is_available: boolean
  max_bookings_per_slot: number
  buffer_time_minutes: number
  override_reason?: string
}

// Histórico de preços
export interface ServicePriceHistory extends BaseEntity {
  service_id: UUID
  old_price: Currency
  new_price: Currency
  change_percentage: Percentage
  change_reason: string
  effective_date: Timestamp
  changed_by: UUID
  market_conditions?: string
  competitor_analysis?: string
}

// Estatísticas de serviços
export interface ServiceStats {
  service_id: UUID
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  booking_count: number
  revenue: Currency
  average_rating: number
  completion_rate: Percentage
  cancellation_rate: Percentage
  no_show_rate: Percentage
  repeat_booking_rate: Percentage
  profit_margin: Percentage
  client_satisfaction: number
  barber_satisfaction: number
  upsell_rate: Percentage
  addon_revenue: Currency
}

// Dados para criação/atualização
export interface CreateServiceData {
  name: string
  description: string
  short_description?: string
  category_id: UUID
  duration_minutes: number
  base_price: Currency
  requires_consultation?: boolean
  max_advance_booking_days?: number
  min_advance_booking_hours?: number
  preparation_time_minutes?: number
  cleanup_time_minutes?: number
  skill_level_required: SkillLevel
  age_restrictions?: AgeRestriction
  gender_restrictions?: GenderRestriction[]
  contraindications?: string[]
  aftercare_instructions?: string[]
  tags?: string[]
  booking_notes?: string
  supplies_needed?: Supply[]
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  current_price?: Currency
  is_active?: boolean
  is_featured?: boolean
  images?: ServiceImage[]
  add_ons?: UUID[]
  alternatives?: UUID[]
  prerequisites?: UUID[]
}

export interface CreateServiceCategoryData {
  name: string
  description?: string
  parent_id?: UUID
  icon?: string
  color?: string
  image_url?: string
  sort_order?: number
  seo_title?: string
  seo_description?: string
}

export interface UpdateServiceCategoryData extends Partial<CreateServiceCategoryData> {
  is_active?: boolean
}

// Filtros para busca
export interface ServiceFilters {
  category_id?: UUID[]
  price_range?: { min: Currency; max: Currency }
  duration_range?: { min: number; max: number }
  skill_level?: SkillLevel[]
  is_active?: boolean
  is_featured?: boolean
  requires_consultation?: boolean
  gender_restrictions?: GenderRestriction[]
  rating_min?: number
  tags?: string[]
  barber_id?: UUID
  available_date?: string // YYYY-MM-DD
  available_time?: string // HH:mm
}

export interface ServicePackageFilters {
  price_range?: { min: Currency; max: Currency }
  discount_range?: { min: Percentage; max: Percentage }
  duration_range?: { min: number; max: number }
  is_active?: boolean
  is_featured?: boolean
  services_included?: UUID[]
}

// Estados para gerenciamento
export interface ServiceState extends AsyncState<Service[]> {
  categories: ServiceCategory[]
  selectedService: Service | null
  selectedCategory: ServiceCategory | null
  filters: ServiceFilters
  searchTerm: string
  viewMode: 'grid' | 'list' | 'table'
}

export interface ServicePackageState extends AsyncState<ServicePackage[]> {
  selectedPackage: ServicePackage | null
  filters: ServicePackageFilters
  searchTerm: string
}

// Constantes
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  expert: 'Especialista'
}

export const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

export const GENDER_RESTRICTION_LABELS: Record<GenderRestriction, string> = {
  male: 'Masculino',
  female: 'Feminino',
  non_binary: 'Não-binário'
}

export const REVIEW_CATEGORY_LABELS: Record<ServiceReviewCategory['category'], string> = {
  quality: 'Qualidade',
  value: 'Custo-benefício',
  experience: 'Experiência',
  results: 'Resultados',
  cleanliness: 'Limpeza'
}

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  base: 'Preço Base',
  promotional: 'Promocional',
  seasonal: 'Sazonal',
  loyalty: 'Fidelidade',
  group: 'Grupo',
  first_time: 'Primeira Vez'
}

// Configurações padrão
export const DEFAULT_SERVICE_CONFIG = {
  MAX_ADVANCE_BOOKING_DAYS: 30,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  DEFAULT_PREPARATION_TIME: 5,
  DEFAULT_CLEANUP_TIME: 10,
  DEFAULT_BUFFER_TIME: 15,
  MAX_IMAGES_PER_SERVICE: 10,
  MAX_TAGS_PER_SERVICE: 20,
  MIN_RATING_FOR_FEATURED: 4.0,
  MIN_BOOKINGS_FOR_STATS: 10
} as const