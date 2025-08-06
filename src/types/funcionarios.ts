/**
 * Tipos para o sistema de funcionários e especialidades
 */

import type { Service } from './services'

// Interface para um funcionário com especialidades
export interface FuncionarioComEspecialidades {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar_url?: string
  role: 'admin' | 'barber'
  ativo: boolean
  created_at: string
  updated_at: string
  
  // Serviços que o funcionário pode realizar
  servicos: Service[]
}

// Interface para relacionamento funcionário-serviço
export interface FuncionarioServico {
  id: string
  funcionario_id: string
  service_id: string
  created_at: string
  updated_at: string
}

// Interface para dados de criação de relacionamento
export interface CreateFuncionarioServicoData {
  funcionario_id: string
  service_id: string
}

// Interface para atualização de especialidades de funcionário
export interface UpdateFuncionarioEspecialidadesData {
  funcionario_id: string
  service_ids: string[]
}

// Interface para filtros de funcionários
export interface FuncionarioFilters {
  role?: 'admin' | 'barber'
  ativo?: boolean
  service_id?: string // Filtrar funcionários que fazem um serviço específico
  busca?: string
}

// Interface para opções de busca de funcionários
export interface FuncionarioSearchOptions {
  query?: string
  role?: 'admin' | 'barber'
  service_id?: string
  ordenarPor?: 'nome' | 'role' | 'created_at'
  ordem?: 'asc' | 'desc'
}

// Interface para dados de cache de funcionários
export interface FuncionarioCacheData {
  funcionarios: FuncionarioComEspecialidades[]
  timestamp: number
  filters?: FuncionarioFilters
}

// Configuração de cache (5 minutos)
export const FUNCIONARIO_CACHE_TTL = 5 * 60 * 1000

// Interface para estatísticas de funcionários
export interface FuncionarioStats {
  total_funcionarios: number
  total_admins: number
  total_barbeiros: number
  funcionarios_ativos: number
  media_servicos_por_funcionario: number
}

// Interface para dados da view funcionarios_com_servicos
export interface FuncionarioComServicosView {
  funcionario_id: string
  funcionario_nome: string
  funcionario_email: string
  funcionario_telefone?: string
  funcionario_avatar?: string
  funcionario_role: 'admin' | 'barber'
  funcionario_ativo: boolean
  servicos: Array<{
    id: string
    nome: string
    descricao?: string
    preco: number
    duracao_minutos: number
    categoria?: string
  }>
}

// Interface para dados da view servicos_com_funcionarios
export interface ServicoComFuncionariosView {
  service_id: string
  service_nome: string
  service_descricao?: string
  service_preco: number
  service_duracao: number
  service_categoria?: string
  service_ativo: boolean
  funcionarios: Array<{
    id: string
    nome: string
    email: string
    telefone?: string
    avatar_url?: string
    role: 'admin' | 'barber'
  }>
}

// Tipos para componentes de seleção
export interface FuncionarioOption {
  value: string
  label: string
  role: 'admin' | 'barber'
  servicos: string[] // IDs dos serviços
}

export interface ServicoOption {
  value: string
  label: string
  preco: number
  duracao: number
  funcionarios: string[] // IDs dos funcionários
}

// Interface para dados de agendamento com especialidades
export interface AgendamentoComEspecialidades {
  cliente_id: string
  service_id?: string
  funcionario_id?: string
  data_agendamento: string
  observacoes?: string
  
  // Dados calculados
  funcionarios_disponiveis?: FuncionarioBasico[]
  servicos_disponiveis?: Service[]
}

// Interface básica de funcionário (para evitar imports circulares)
interface FuncionarioBasico {
  id: string
  nome: string
  email: string
  telefone?: string
  avatar_url?: string
  role: 'admin' | 'barber'
}

// Constantes úteis
export const FUNCIONARIO_ROLES = ['admin', 'barber'] as const
export type FuncionarioRole = typeof FUNCIONARIO_ROLES[number]

// Labels para roles
export const FUNCIONARIO_ROLE_LABELS: Record<FuncionarioRole, string> = {
  admin: 'Administrador',
  barber: 'Barbeiro'
}

// Cores para badges de roles
export const FUNCIONARIO_ROLE_COLORS: Record<FuncionarioRole, string> = {
  admin: 'bg-error text-white',
  barber: 'bg-primary-gold text-primary-black'
}
