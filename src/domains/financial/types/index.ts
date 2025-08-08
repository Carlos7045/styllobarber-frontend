/**
 * Tipos para o domínio financeiro
 */

import { 
  BaseEntity, 
  AuditableEntity, 
  UUID, 
  Timestamp,
  Currency,
  Percentage,
  AsyncState,
  DateRange
} from '@/shared/types/base'

// Tipos de transação
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type TransactionCategory = 
  | 'service_payment'
  | 'product_sale'
  | 'tip'
  | 'commission'
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'equipment'
  | 'marketing'
  | 'insurance'
  | 'tax'
  | 'loan_payment'
  | 'refund'
  | 'chargeback'
  | 'other'

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'bank_transfer'
  | 'check'
  | 'digital_wallet'
  | 'cryptocurrency'
  | 'store_credit'
  | 'loyalty_points'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'

// Interface principal da transação
export interface Transaction extends BaseEntity, AuditableEntity {
  type: TransactionType
  category: TransactionCategory
  amount: Currency
  description: string
  reference_id?: UUID // ID do agendamento, venda, etc.
  reference_type?: 'appointment' | 'product_sale' | 'salary' | 'expense'
  payment_method: PaymentMethod
  status: TransactionStatus
  processed_at?: Timestamp
  client_id?: UUID
  barber_id?: UUID
  account_id?: UUID
  invoice_id?: UUID
  receipt_url?: string
  notes?: string
  tags: string[]
  tax_amount?: Currency
  tax_rate?: Percentage
  discount_amount?: Currency
  tip_amount?: Currency
  commission_amount?: Currency
  net_amount: Currency
  exchange_rate?: number
  original_currency?: string
  original_amount?: Currency
  payment_processor?: string
  processor_transaction_id?: string
  processor_fee?: Currency
  reconciled: boolean
  reconciled_at?: Timestamp
  reconciled_by?: UUID
  metadata: TransactionMetadata
}

export interface TransactionMetadata {
  source: 'pos' | 'online' | 'mobile' | 'admin' | 'import'
  device_id?: string
  location?: string
  ip_address?: string
  user_agent?: string
  payment_details?: PaymentDetails
  refund_reason?: string
  chargeback_reason?: string
  dispute_id?: string
  batch_id?: string
  recurring_payment_id?: UUID
}

export interface PaymentDetails {
  card_last_four?: string
  card_brand?: string
  card_type?: 'credit' | 'debit'
  authorization_code?: string
  gateway_response?: string
  risk_score?: number
  cvv_result?: string
  avs_result?: string
}

// Contas financeiras
export interface Account extends BaseEntity, AuditableEntity {
  name: string
  type: AccountType
  subtype?: string
  account_number?: string
  bank_name?: string
  currency: string
  balance: Currency
  available_balance?: Currency
  is_active: boolean
  is_default: boolean
  description?: string
  interest_rate?: Percentage
  minimum_balance?: Currency
  overdraft_limit?: Currency
  last_reconciled_at?: Timestamp
  external_id?: string
  api_credentials?: Record<string, any>
}

export type AccountType = 
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'digital_wallet'
  | 'investment'
  | 'loan'
  | 'other'

// Faturas e recibos
export interface Invoice extends BaseEntity, AuditableEntity {
  invoice_number: string
  client_id?: UUID
  barber_id?: UUID
  appointment_id?: UUID
  issue_date: string // YYYY-MM-DD
  due_date: string // YYYY-MM-DD
  status: InvoiceStatus
  subtotal: Currency
  tax_amount: Currency
  discount_amount: Currency
  total_amount: Currency
  paid_amount: Currency
  balance_due: Currency
  currency: string
  payment_terms: string
  notes?: string
  items: InvoiceItem[]
  payments: InvoicePayment[]
  sent_at?: Timestamp
  viewed_at?: Timestamp
  paid_at?: Timestamp
  overdue_at?: Timestamp
  cancelled_at?: Timestamp
  pdf_url?: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: UUID
  service_id?: UUID
  product_id?: UUID
  description: string
  quantity: number
  unit_price: Currency
  discount_percentage?: Percentage
  discount_amount?: Currency
  tax_rate?: Percentage
  tax_amount?: Currency
  total_amount: Currency
}

export interface InvoicePayment {
  id: UUID
  transaction_id: UUID
  amount: Currency
  payment_method: PaymentMethod
  paid_at: Timestamp
  notes?: string
}

// Comissões
export interface Commission extends BaseEntity, AuditableEntity {
  barber_id: UUID
  appointment_id?: UUID
  transaction_id?: UUID
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  base_amount: Currency
  commission_rate: Percentage
  commission_amount: Currency
  bonus_amount?: Currency
  deduction_amount?: Currency
  net_amount: Currency
  status: CommissionStatus
  calculated_at: Timestamp
  paid_at?: Timestamp
  payment_method?: PaymentMethod
  payment_reference?: string
  notes?: string
}

export type CommissionStatus = 'calculated' | 'approved' | 'paid' | 'disputed' | 'cancelled'

// Relatórios financeiros
export interface FinancialReport extends BaseEntity {
  name: string
  type: ReportType
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  parameters: ReportParameters
  data: ReportData
  generated_by: UUID
  file_url?: string
  status: ReportStatus
}

export type ReportType = 
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'commission_report'
  | 'tax_report'
  | 'client_statement'
  | 'barber_performance'
  | 'service_analysis'
  | 'custom'

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'expired'

export interface ReportParameters {
  date_range: DateRange
  accounts?: UUID[]
  barbers?: UUID[]
  clients?: UUID[]
  services?: UUID[]
  categories?: TransactionCategory[]
  payment_methods?: PaymentMethod[]
  include_tax?: boolean
  include_tips?: boolean
  group_by?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  currency?: string
}

export interface ReportData {
  summary: ReportSummary
  details: any[]
  charts?: ChartData[]
  totals: Record<string, Currency>
  comparisons?: Record<string, any>
}

export interface ReportSummary {
  total_income: Currency
  total_expenses: Currency
  net_profit: Currency
  profit_margin: Percentage
  transaction_count: number
  average_transaction: Currency
  growth_rate?: Percentage
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area'
  title: string
  data: any[]
  labels: string[]
  colors?: string[]
}

// Orçamentos e previsões
export interface Budget extends BaseEntity, AuditableEntity {
  name: string
  description?: string
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  status: BudgetStatus
  categories: BudgetCategory[]
  total_budgeted: Currency
  total_actual: Currency
  variance: Currency
  variance_percentage: Percentage
  approval_required: boolean
  approved_by?: UUID
  approved_at?: Timestamp
}

export type BudgetStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export interface BudgetCategory {
  category: TransactionCategory
  budgeted_amount: Currency
  actual_amount: Currency
  variance: Currency
  variance_percentage: Percentage
  notes?: string
}

// Impostos
export interface TaxConfiguration extends BaseEntity {
  name: string
  type: TaxType
  rate: Percentage
  is_active: boolean
  applies_to: TaxApplicability[]
  calculation_method: 'percentage' | 'fixed' | 'tiered'
  tiers?: TaxTier[]
  effective_date: string // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  jurisdiction: string
  tax_authority: string
  filing_frequency: 'monthly' | 'quarterly' | 'annually'
  next_filing_date?: string // YYYY-MM-DD
}

export type TaxType = 'sales_tax' | 'service_tax' | 'income_tax' | 'payroll_tax' | 'vat' | 'other'
export type TaxApplicability = 'services' | 'products' | 'tips' | 'commissions' | 'all'

export interface TaxTier {
  min_amount: Currency
  max_amount?: Currency
  rate: Percentage
}

export interface TaxReturn extends BaseEntity {
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  tax_type: TaxType
  gross_income: Currency
  taxable_income: Currency
  tax_owed: Currency
  tax_paid: Currency
  balance_due: Currency
  status: TaxReturnStatus
  filed_at?: Timestamp
  due_date: string // YYYY-MM-DD
  file_url?: string
  prepared_by?: UUID
}

export type TaxReturnStatus = 'draft' | 'filed' | 'accepted' | 'rejected' | 'amended'

// Métricas financeiras
export interface FinancialMetrics {
  period_start: string // YYYY-MM-DD
  period_end: string // YYYY-MM-DD
  revenue: Revenue
  expenses: Expenses
  profitability: Profitability
  cash_flow: CashFlow
  performance: Performance
  growth: Growth
}

export interface Revenue {
  total: Currency
  services: Currency
  products: Currency
  tips: Currency
  other: Currency
  average_per_day: Currency
  average_per_transaction: Currency
  recurring_percentage: Percentage
}

export interface Expenses {
  total: Currency
  fixed: Currency
  variable: Currency
  by_category: Record<TransactionCategory, Currency>
  percentage_of_revenue: Percentage
}

export interface Profitability {
  gross_profit: Currency
  net_profit: Currency
  gross_margin: Percentage
  net_margin: Percentage
  ebitda: Currency
  break_even_point: Currency
}

export interface CashFlow {
  operating: Currency
  investing: Currency
  financing: Currency
  net_change: Currency
  ending_balance: Currency
  burn_rate: Currency
  runway_months: number
}

export interface Performance {
  revenue_per_barber: Currency
  revenue_per_client: Currency
  client_lifetime_value: Currency
  client_acquisition_cost: Currency
  retention_rate: Percentage
  churn_rate: Percentage
}

export interface Growth {
  revenue_growth: Percentage
  client_growth: Percentage
  transaction_growth: Percentage
  profit_growth: Percentage
  month_over_month: Percentage
  year_over_year: Percentage
}

// Dados para criação/atualização
export interface CreateTransactionData {
  type: TransactionType
  category: TransactionCategory
  amount: Currency
  description: string
  payment_method: PaymentMethod
  client_id?: UUID
  barber_id?: UUID
  account_id?: UUID
  reference_id?: UUID
  reference_type?: string
  notes?: string
  tags?: string[]
  tax_rate?: Percentage
  discount_amount?: Currency
  tip_amount?: Currency
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  status?: TransactionStatus
  processed_at?: Timestamp
  reconciled?: boolean
}

// Filtros para busca
export interface TransactionFilters {
  type?: TransactionType[]
  category?: TransactionCategory[]
  status?: TransactionStatus[]
  payment_method?: PaymentMethod[]
  amount_range?: { min: Currency; max: Currency }
  date_range?: DateRange
  client_id?: UUID
  barber_id?: UUID
  account_id?: UUID
  reconciled?: boolean
  tags?: string[]
}

// Estados para gerenciamento
export interface FinancialState extends AsyncState<Transaction[]> {
  accounts: Account[]
  selectedTransaction: Transaction | null
  selectedAccount: Account | null
  filters: TransactionFilters
  metrics: FinancialMetrics | null
  dateRange: DateRange
}

// Constantes
export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  service_payment: 'Pagamento de Serviço',
  product_sale: 'Venda de Produto',
  tip: 'Gorjeta',
  commission: 'Comissão',
  salary: 'Salário',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  supplies: 'Suprimentos',
  equipment: 'Equipamentos',
  marketing: 'Marketing',
  insurance: 'Seguro',
  tax: 'Impostos',
  loan_payment: 'Pagamento de Empréstimo',
  refund: 'Reembolso',
  chargeback: 'Estorno',
  other: 'Outros'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  bank_transfer: 'Transferência Bancária',
  check: 'Cheque',
  digital_wallet: 'Carteira Digital',
  cryptocurrency: 'Criptomoeda',
  store_credit: 'Crédito da Loja',
  loyalty_points: 'Pontos de Fidelidade'
}

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
}