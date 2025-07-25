import { z } from 'zod'
import { VALIDACAO } from './constants'

// Schema para validação de usuário
export const schemaUsuario = z.object({
  nome: z
    .string()
    .min(VALIDACAO.NOME_MIN_LENGTH, 'Nome deve ter pelo menos 2 caracteres')
    .max(VALIDACAO.NOME_MAX_LENGTH, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .regex(VALIDACAO.EMAIL_REGEX, 'Formato de email inválido'),
  telefone: z
    .string()
    .regex(VALIDACAO.TELEFONE_REGEX, 'Formato de telefone inválido: (XX) XXXXX-XXXX'),
})

// Schema para login
export const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(VALIDACAO.SENHA_MIN_LENGTH, 'Senha deve ter pelo menos 6 caracteres'),
})

// Schema para cadastro
export const schemaCadastro = schemaUsuario.extend({
  senha: z.string().min(VALIDACAO.SENHA_MIN_LENGTH, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha'],
})

// Schema para cliente
export const schemaCliente = schemaUsuario.extend({
  dataNascimento: z.date().optional(),
  observacoes: z.string().optional(),
})

// Schema para serviço
export const schemaServico = z.object({
  nome: z.string().min(1, 'Nome do serviço é obrigatório'),
  duracao: z.number().min(15, 'Duração mínima é 15 minutos').max(480, 'Duração máxima é 8 horas'),
  preco: z.number().min(0, 'Preço deve ser positivo'),
  pausaApos: z.number().min(0, 'Pausa deve ser positiva').max(60, 'Pausa máxima é 60 minutos'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  descricao: z.string().optional(),
})

// Schema para agendamento
export const schemaAgendamento = z.object({
  servicoId: z.string().min(1, 'Serviço é obrigatório'),
  data: z.date().min(new Date(), 'Data deve ser futura'),
  horaInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  barbeiroId: z.string().min(1, 'Barbeiro é obrigatório'),
  observacoes: z.string().optional(),
})

// Schema para agendamento público (com dados do cliente)
export const schemaAgendamentoPublico = schemaAgendamento.extend({
  clienteNome: z.string().min(2, 'Nome é obrigatório'),
  clienteTelefone: z.string().regex(VALIDACAO.TELEFONE_REGEX, 'Formato de telefone inválido'),
  clienteEmail: z.string().email('Email inválido').optional(),
})

// Schema para horário de trabalho
export const schemaHorarioTrabalho = z.object({
  ativo: z.boolean(),
  inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  fim: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  intervaloInicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
  intervaloFim: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido').optional(),
}).refine((data) => {
  if (!data.ativo) return true
  return data.inicio < data.fim
}, {
  message: 'Hora de início deve ser anterior à hora de fim',
  path: ['fim'],
})

// Tipos inferidos dos schemas
export type DadosUsuario = z.infer<typeof schemaUsuario>
export type DadosLogin = z.infer<typeof schemaLogin>
export type DadosCadastro = z.infer<typeof schemaCadastro>
export type DadosCliente = z.infer<typeof schemaCliente>
export type DadosServico = z.infer<typeof schemaServico>
export type DadosAgendamento = z.infer<typeof schemaAgendamento>
export type DadosAgendamentoPublico = z.infer<typeof schemaAgendamentoPublico>
export type DadosHorarioTrabalho = z.infer<typeof schemaHorarioTrabalho>