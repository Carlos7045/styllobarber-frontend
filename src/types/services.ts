/**
 * Tipos para o sistema de serviços
 */

// Interface para um serviço
export interface Service {
  id: string
  nome: string
  descricao?: string
  preco: number
  duracao_minutos: number
  categoria?: string
  ativo: boolean
  ordem?: number
  created_at: string
  updated_at: string
  
  // Dados relacionados (joins)
  funcionarios?: FuncionarioBasico[]
}

// Interface para dados básicos de funcionário
export interface FuncionarioBasico {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar_url?: string
  role: string
}

// Interface para filtros de serviços
export interface ServiceFilters {
  categoria?: string
  precoMin?: number
  precoMax?: number
  duracaoMin?: number
  duracaoMax?: number
  ativo?: boolean
  busca?: string
}

// Interface para opções de busca
export interface ServiceSearchOptions {
  query?: string
  categoria?: string
  ordenarPor?: 'nome' | 'preco' | 'duracao' | 'ordem'
  ordem?: 'asc' | 'desc'
}

// Interface para dados de cache
export interface ServiceCacheData {
  services: Service[]
  timestamp: number
  filters?: ServiceFilters
}

// Configuração de cache (5 minutos)
export const SERVICE_CACHE_TTL = 5 * 60 * 1000

// Categorias padrão de serviços
export const SERVICE_CATEGORIES = [
  'Corte',
  'Barba',
  'Bigode',
  'Sobrancelha',
  'Tratamentos',
  'Combo'
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]