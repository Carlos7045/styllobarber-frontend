/**
 * @deprecated Use tipos de @/shared/types em vez deste arquivo
 * Este arquivo é mantido apenas para compatibilidade com código legado
 */

// Tipos legados mantidos para compatibilidade
export * from './auth'
export * from './appointments'
export * from './services'
export * from './funcionarios'
export * from './notifications'

// Para usar os novos tipos, importe diretamente de @/shared/types
// Exemplo: import { Service, BreadcrumbItem } from '@/shared/types' // Novos tipos
// Exemplo: import { Service, ItemBreadcrumb } from '@/types' // Tipos legados

// Mapeamento de tipos legados para novos tipos
import {
  ApiResponse as NewApiResponse,
  PaginationParams as NewPaginationParams,
  PaginatedResponse as NewPaginatedResponse,
  DateRange as NewDateRange,
  SortOptions as NewSortOptions,
  SelectOption as NewSelectOption,
  BreadcrumbItem as NewBreadcrumbItem,
  ToastNotification as NewToastNotification
} from '@/shared/types'

/**
 * @deprecated Use ApiResponse de @/shared/types
 */
export interface ApiResponse<T> extends NewApiResponse<T> {
  /** @deprecated Use 'error' */
  erro?: string | null
  /** @deprecated Use 'success' */
  sucesso?: boolean
}

/**
 * @deprecated Use PaginationParams de @/shared/types
 */
export interface PaginacaoParams extends NewPaginationParams {
  /** @deprecated Use 'page' */
  pagina: number
  /** @deprecated Use 'limit' */
  limite: number
}

/**
 * @deprecated Use PaginatedResponse de @/shared/types
 */
export interface PaginacaoResponse<T> {
  /** @deprecated Use 'data' */
  dados: T[]
  total: number
  /** @deprecated Use 'page' */
  pagina: number
  /** @deprecated Use 'limit' */
  limite: number
  /** @deprecated Use 'totalPages' */
  totalPaginas: number
}

/**
 * @deprecated Use DateRange de @/shared/types
 */
export interface FiltroData extends NewDateRange {
  /** @deprecated Use 'start' */
  dataInicio: Date
  /** @deprecated Use 'end' */
  dataFim: Date
}

/**
 * @deprecated Use SortOptions de @/shared/types
 */
export interface OpcoesOrdenacao extends NewSortOptions {
  /** @deprecated Use 'field' */
  campo: string
  /** @deprecated Use 'direction' */
  direcao: 'asc' | 'desc'
}

/**
 * @deprecated Use SelectOption de @/shared/types
 */
export interface OpcaoSelect extends NewSelectOption {
  /** @deprecated Use 'value' */
  valor: string
  /** @deprecated Use 'disabled' */
  desabilitado?: boolean
}

/**
 * @deprecated Use BreadcrumbItem de @/shared/types
 */
export interface ItemBreadcrumb extends NewBreadcrumbItem {
  /** @deprecated Use 'active' */
  ativo?: boolean
}

/**
 * @deprecated Use ToastNotification de @/shared/types
 */
export interface NotificacaoToast extends NewToastNotification {
  /** @deprecated Use 'type' */
  tipo: 'success' | 'error' | 'warning' | 'info'
  /** @deprecated Use 'title' */
  titulo: string
  /** @deprecated Use 'description' */
  descricao?: string
  /** @deprecated Use 'duration' */
  duracao?: number
  /** @deprecated Use 'action' */
  acao?: {
    label: string
    onClick: () => void
  }
}
