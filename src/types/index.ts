// Barrel exports para facilitar importações
export * from './auth'
export * from './appointments'

// Tipos utilitários comuns
export interface ApiResponse<T> {
  data: T | null
  erro: string | null
  sucesso: boolean
}

export interface PaginacaoParams {
  pagina: number
  limite: number
}

export interface PaginacaoResponse<T> {
  dados: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

export interface FiltroData {
  dataInicio: Date
  dataFim: Date
}

export interface OpcoesOrdenacao {
  campo: string
  direcao: 'asc' | 'desc'
}

// Tipos para componentes UI
export interface OpcaoSelect {
  valor: string
  label: string
  desabilitado?: boolean
}

export interface ItemBreadcrumb {
  label: string
  href?: string
  ativo?: boolean
}

export interface NotificacaoToast {
  id: string
  tipo: 'success' | 'error' | 'warning' | 'info'
  titulo: string
  descricao?: string
  duracao?: number
  acao?: {
    label: string
    onClick: () => void
  }
}