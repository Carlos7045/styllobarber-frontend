import { ROLES_USUARIO } from '@/lib/config/constants'

export type RoleUsuario = typeof ROLES_USUARIO[keyof typeof ROLES_USUARIO]

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string
  role: RoleUsuario
  avatar?: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface Cliente extends Usuario {
  dataNascimento?: Date
  pontosFidelidade: number
  preferencias: string[]
  observacoes: string
  historicoAgendamentos: string[] // IDs dos agendamentos
}

export interface Barbeiro extends Usuario {
  servicos: string[] // IDs dos serviços
  horarioTrabalho: HorarioTrabalho
  taxaComissao: number
  ativo: boolean
}

export interface HorarioTrabalho {
  segunda: HorarioDia
  terca: HorarioDia
  quarta: HorarioDia
  quinta: HorarioDia
  sexta: HorarioDia
  sabado: HorarioDia
  domingo: HorarioDia
}

export interface HorarioDia {
  ativo: boolean
  inicio: string // formato HH:mm
  fim: string // formato HH:mm
  intervaloInicio?: string
  intervaloFim?: string
}

export interface SessaoAuth {
  usuario: Usuario | null
  carregando: boolean
  erro: string | null
}
