// Tipos para entidades financeiras do StylloBarber

// Tipos base para transações financeiras
export interface TransacaoFinanceira {
  id: string
  tipo: 'RECEITA' | 'DESPESA' | 'COMISSAO'
  valor: number
  descricao: string
  categoriaId?: string
  agendamentoId?: string
  barbeiroId?: string
  dataTransacao: string
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA'
  metodoPagamento?: string
  asaasPaymentId?: string
  observacoes?: string
  createdAt: string
  updatedAt: string
}

// Tipos para sistema de comissões
export interface ComissaoConfig {
  id: string
  barbeiroId: string
  servicoId?: string
  percentual: number
  valorMinimo?: number
  valorMaximo?: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface ComissaoCalculada {
  agendamentoId: string
  barbeiroId: string
  valorServico: number
  percentualComissao: number
  valorComissao: number
  descontos: number
  valorLiquido: number
  status: 'CALCULADA' | 'PAGA' | 'CANCELADA'
}

// Tipos para integração com Asaas
export interface AsaasPayment {
  id: string
  asaasId: string
  agendamentoId?: string
  customerId: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  dueDate: string
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED'
  invoiceUrl?: string
  pixQrCode?: string
  webhookData?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AsaasCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

// Tipos para categorias financeiras
export interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: 'RECEITA' | 'DESPESA'
  cor: string
  orcamentoMensal?: number
  ativo: boolean
  createdAt: string
}

// Tipos para despesas
export interface Despesa {
  id: string
  descricao: string
  valor: number
  categoriaId: string
  categoria?: CategoriaFinanceira
  dataDespesa: string
  recorrente: boolean
  frequencia?: 'MENSAL' | 'TRIMESTRAL' | 'ANUAL'
  comprovantes: string[]
  observacoes?: string
  createdAt: string
  updatedAt: string
}

// Tipos para métricas e dashboard
export interface MetricasFinanceiras {
  receitaBruta: number
  receitaLiquida: number
  despesasTotal: number
  lucroLiquido: number
  ticketMedio: number
  numeroAtendimentos: number
  taxaCrescimento: number
  comissoesPendentes: number
}

export interface PerformanceBarbeiro {
  barbeiroId: string
  nome: string
  mes: string
  receitaGerada: number
  comissoesGanhas: number
  atendimentosRealizados: number
  ticketMedio: number
}

// Tipos para relatórios
export interface ConfigRelatorio {
  tipo: 'RECEITAS' | 'DESPESAS' | 'DRE' | 'FLUXO_CAIXA' | 'COMISSOES'
  periodo: {
    inicio: string
    fim: string
  }
  filtros: {
    barbeiroId?: string
    categoriaId?: string
    statusPagamento?: string
  }
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

export interface RelatorioReceitas {
  id: string
  data: string
  cliente: string
  barbeiro: string
  servico: string
  valor: number
  metodoPagamento: string
  status: string
  comissao?: number
}

export interface RelatorioDespesas {
  id: string
  data: string
  categoria: string
  descricao: string
  valor: number
  comprovante?: string
  recorrente: boolean
}

export interface RelatorioComissoes {
  id: string
  barbeiro: string
  periodo: string
  servicosRealizados: number
  receitaGerada: number
  percentualComissao: number
  valorComissao: number
  valorPago: number
  saldoPendente: number
}

export interface DREData {
  receitaOperacional: number
  custosVariaveis: number
  margemContribuicao: number
  despesasFixas: number
  ebitda: number
  depreciacoes: number
  lucroOperacional: number
  lucroLiquido: number
}

// Tipos para fluxo de caixa
export interface MovimentacaoFluxoCaixa {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
  categoria: 'OPERACIONAL' | 'INVESTIMENTO' | 'FINANCIAMENTO'
  dataMovimentacao: string
  status: 'REALIZADA' | 'PROJETADA'
  origem?: string
  transacaoId?: string
}

export interface FluxoCaixaResumo {
  saldoAtual: number
  entradasDia: number
  saidasDia: number
  saldoProjetado: number
  alertaSaldoBaixo: boolean
}

// Tipos para configurações do sistema
export interface ConfiguracaoFinanceira {
  id: string
  chave: string
  valor: string | number | boolean
  descricao: string
  categoria: 'ASAAS' | 'COMISSOES' | 'ALERTAS' | 'GERAL'
  updatedAt: string
}

// Tipos para webhooks
export interface WebhookAsaas {
  id: string
  event: string
  payment: AsaasPayment
  dateCreated: string
}

// Tipos utilitários
export interface DateRange {
  inicio: string
  fim: string
}

export interface PaginationParams {
  page: number
  limit: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
