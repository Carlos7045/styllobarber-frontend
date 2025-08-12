import { z } from 'zod'
import { VALIDACAO } from './constants'

// Função para validar CPF brasileiro
function validarCPF(cpf: string): boolean {
  if (!cpf) return false
  
  const cpfNumeros = cpf.replace(/\D/g, '')
  if (cpfNumeros.length !== 11 || /^(\d)\1+$/.test(cpfNumeros)) return false
  
  // Primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNumeros.charAt(i)) * (10 - i)
  }
  let resto = soma % 11
  let digito1 = resto < 2 ? 0 : 11 - resto
  
  // Segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNumeros.charAt(i)) * (11 - i)
  }
  resto = soma % 11
  let digito2 = resto < 2 ? 0 : 11 - resto
  
  return digito1 === parseInt(cpfNumeros.charAt(9)) && digito2 === parseInt(cpfNumeros.charAt(10))
}

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
  cpf: z
    .string()
    .optional()
    .refine((cpf) => {
      if (!cpf || cpf.trim() === '') return true // CPF é opcional
      return validarCPF(cpf)
    }, 'CPF inválido'),
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
  cpf: z
    .string()
    .optional()
    .refine((cpf) => {
      if (!cpf || cpf.trim() === '') return true // CPF é opcional no cadastro
      return validarCPF(cpf)
    }, 'CPF inválido'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha'],
})

// Schema para atualização de perfil
export const schemaPerfilUsuario = z.object({
  nome: z
    .string()
    .min(VALIDACAO.NOME_MIN_LENGTH, 'Nome deve ter pelo menos 2 caracteres')
    .max(VALIDACAO.NOME_MAX_LENGTH, 'Nome deve ter no máximo 100 caracteres'),
  telefone: z
    .string()
    .regex(VALIDACAO.TELEFONE_REGEX, 'Formato de telefone inválido: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  cpf: z
    .string()
    .optional()
    .refine((cpf) => {
      if (!cpf || cpf.trim() === '') return true // CPF é opcional
      return validarCPF(cpf)
    }, 'CPF inválido')
    .or(z.literal('')),
  data_nascimento: z
    .string()
    .optional()
    .refine((date) => {
      if (!date || date.trim() === '') return true
      
      // Verificar formato básico da data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) return false
      
      // Verificar se é uma data válida
      const birthDate = new Date(date)
      if (isNaN(birthDate.getTime())) return false
      
      // Verificar idade
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      let finalAge = age
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        finalAge--
      }
      
      return finalAge >= 13 && finalAge <= 120
    }, 'Data inválida ou idade deve estar entre 13 e 120 anos'),
  avatar_url: z.string().url().optional().or(z.literal('')),
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
export type DadosPerfilUsuario = z.infer<typeof schemaPerfilUsuario>
export type DadosCliente = z.infer<typeof schemaCliente>
export type DadosServico = z.infer<typeof schemaServico>
export type DadosAgendamento = z.infer<typeof schemaAgendamento>
export type DadosAgendamentoPublico = z.infer<typeof schemaAgendamentoPublico>
export type DadosHorarioTrabalho = z.infer<typeof schemaHorarioTrabalho>
