// Constantes para o módulo financeiro do StylloBarber

// Status de transações
export const TRANSACTION_STATUS = {
  PENDENTE: 'PENDENTE',
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA'
} as const

// Tipos de transação
export const TRANSACTION_TYPES = {
  RECEITA: 'RECEITA',
  DESPESA: 'DESPESA',
  COMISSAO: 'COMISSAO'
} as const

// Status de pagamentos Asaas
export const ASAAS_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const

// Tipos de cobrança Asaas
export const ASAAS_BILLING_TYPES = {
  BOLETO: 'BOLETO',
  CREDIT_CARD: 'CREDIT_CARD',
  PIX: 'PIX'
} as const

// Status de comissões
export const COMMISSION_STATUS = {
  CALCULADA: 'CALCULADA',
  PAGA: 'PAGA',
  CANCELADA: 'CANCELADA'
} as const

// Frequências de despesas recorrentes
export const EXPENSE_FREQUENCIES = {
  MENSAL: 'MENSAL',
  TRIMESTRAL: 'TRIMESTRAL',
  ANUAL: 'ANUAL'
} as const

// Tipos de categoria financeira
export const CATEGORY_TYPES = {
  RECEITA: 'RECEITA',
  DESPESA: 'DESPESA'
} as const

// Tipos de relatório
export const REPORT_TYPES = {
  RECEITAS: 'RECEITAS',
  DESPESAS: 'DESPESAS',
  DRE: 'DRE',
  FLUXO_CAIXA: 'FLUXO_CAIXA',
  COMISSOES: 'COMISSOES'
} as const

// Formatos de exportação
export const EXPORT_FORMATS = {
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  CSV: 'CSV'
} as const

// Categorias de movimentação do fluxo de caixa
export const CASH_FLOW_CATEGORIES = {
  OPERACIONAL: 'OPERACIONAL',
  INVESTIMENTO: 'INVESTIMENTO',
  FINANCIAMENTO: 'FINANCIAMENTO'
} as const

// Status de movimentação do fluxo de caixa
export const CASH_FLOW_STATUS = {
  REALIZADA: 'REALIZADA',
  PROJETADA: 'PROJETADA'
} as const

// Categorias de configuração
export const CONFIG_CATEGORIES = {
  ASAAS: 'ASAAS',
  COMISSOES: 'COMISSOES',
  ALERTAS: 'ALERTAS',
  GERAL: 'GERAL'
} as const

// Métodos de pagamento
export const PAYMENT_METHODS = {
  DINHEIRO: 'DINHEIRO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  PIX: 'PIX',
  BOLETO: 'BOLETO',
  TRANSFERENCIA: 'TRANSFERENCIA'
} as const

// Cores padrão para categorias
export const DEFAULT_CATEGORY_COLORS = [
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#F59E0B', // Amarelo
  '#EF4444', // Vermelho
  '#06B6D4', // Ciano
  '#84CC16', // Lima
  '#F97316', // Laranja
  '#EC4899', // Rosa
  '#6B7280'  // Cinza
] as const

// Limites e configurações padrão
export const DEFAULT_LIMITS = {
  MIN_COMMISSION_PERCENTAGE: 0,
  MAX_COMMISSION_PERCENTAGE: 100,
  MIN_TRANSACTION_VALUE: 0.01,
  MAX_TRANSACTION_VALUE: 999999.99,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CASH_FLOW_ALERT_THRESHOLD: 1000, // R$ 1.000,00
  REPORT_MAX_MONTHS: 24 // 2 anos
} as const

// Configurações de formatação
export const FORMAT_CONFIG = {
  CURRENCY: {
    locale: 'pt-BR',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  },
  DATE: {
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo'
  },
  PERCENTAGE: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }
} as const

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  INVALID_AMOUNT: 'Valor inválido',
  INVALID_DATE: 'Data inválida',
  INVALID_PERCENTAGE: 'Percentual deve estar entre 0% e 100%',
  REQUIRED_FIELD: 'Campo obrigatório',
  ASAAS_CONNECTION_ERROR: 'Erro de conexão com Asaas',
  CALCULATION_ERROR: 'Erro no cálculo',
  PERMISSION_DENIED: 'Permissão negada',
  RESOURCE_NOT_FOUND: 'Recurso não encontrado'
} as const

// Eventos de webhook Asaas
export const ASAAS_WEBHOOK_EVENTS = {
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_UPDATED: 'PAYMENT_UPDATED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
  PAYMENT_RESTORED: 'PAYMENT_RESTORED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_RECEIVED_IN_CASH: 'PAYMENT_RECEIVED_IN_CASH',
  PAYMENT_CHARGEBACK_REQUESTED: 'PAYMENT_CHARGEBACK_REQUESTED',
  PAYMENT_CHARGEBACK_DISPUTE: 'PAYMENT_CHARGEBACK_DISPUTE',
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  PAYMENT_DUNNING_RECEIVED: 'PAYMENT_DUNNING_RECEIVED',
  PAYMENT_DUNNING_REQUESTED: 'PAYMENT_DUNNING_REQUESTED',
  PAYMENT_BANK_SLIP_VIEWED: 'PAYMENT_BANK_SLIP_VIEWED',
  PAYMENT_CHECKOUT_VIEWED: 'PAYMENT_CHECKOUT_VIEWED'
} as const

// Configurações de retry para integrações
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 segundo
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY: 10000 // 10 segundos
} as const

// Configurações de cache
export const CACHE_CONFIG = {
  METRICS_TTL: 300, // 5 minutos
  REPORTS_TTL: 600, // 10 minutos
  COMMISSION_CONFIG_TTL: 3600, // 1 hora
  CATEGORIES_TTL: 3600 // 1 hora
} as const