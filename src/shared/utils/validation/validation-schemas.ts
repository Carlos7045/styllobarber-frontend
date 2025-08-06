/**
 * Esquemas de validação centralizados usando Zod
 * Fornece validações consistentes em todo o sistema
 */

import { z } from 'zod'

// Validações básicas reutilizáveis
export const baseValidations = {
  // Strings
  requiredString: (message = 'Campo obrigatório') => z.string().min(1, message).trim(),

  optionalString: z.string().optional(),

  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),

  phone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999')
    .optional(),

  // Números
  positiveNumber: (message = 'Deve ser um número positivo') => z.number().positive(message),

  currency: z
    .string()
    .regex(/^\d+([.,]\d{2})?$/, 'Formato inválido (ex: 10,50)')
    .transform((val) => parseFloat(val.replace(',', '.'))),

  percentage: z.number().min(0, 'Não pode ser negativo').max(100, 'Não pode ser maior que 100'),

  // Datas
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional(),

  futureDate: z.string().refine((date) => new Date(date) > new Date(), 'Data deve ser futura'),

  // Booleanos
  boolean: z.boolean(),

  // Arrays
  nonEmptyArray: <T>(schema: z.ZodSchema<T>, message = 'Selecione pelo menos um item') =>
    z.array(schema).min(1, message),

  // Enums
  role: z.enum(['admin', 'barbeiro', 'cliente'], {
    message: 'Função inválida',
  }),

  status: z.enum(['ativo', 'inativo', 'pendente'], {
    message: 'Status inválido',
  }),
}

// Schema para usuário
export const userSchema = z.object({
  nome: baseValidations.requiredString('Nome é obrigatório'),
  email: baseValidations.email,
  telefone: baseValidations.phone,
  role: baseValidations.role,
  ativo: baseValidations.boolean.default(true),
})

// Schema para funcionário
export const funcionarioSchema = z.object({
  nome: baseValidations.requiredString('Nome completo é obrigatório'),
  email: baseValidations.email,
  telefone: baseValidations.requiredString('Telefone é obrigatório'),
  endereco: baseValidations.optionalString,
  data_nascimento: baseValidations.dateString,
  cargo: baseValidations.requiredString('Cargo é obrigatório'),
  salario: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val.replace(',', '.')) : undefined))
    .refine((val) => !val || val > 0, 'Salário deve ser positivo'),
  comissao: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => !val || (val >= 0 && val <= 100), 'Comissão deve estar entre 0 e 100'),
  especialidades: z.array(z.string()).default([]),
  observacoes: baseValidations.optionalString,
})

// Schema para serviço
export const servicoSchema = z.object({
  nome: baseValidations.requiredString('Nome do serviço é obrigatório'),
  descricao: baseValidations.optionalString,
  preco: z.number().positive('Preço deve ser maior que zero'),
  duracao: z
    .number()
    .int('Duração deve ser um número inteiro')
    .positive('Duração deve ser maior que zero'),
  categoria: baseValidations.requiredString('Categoria é obrigatória'),
  ativo: baseValidations.boolean.default(true),
})

// Schema para agendamento
export const agendamentoSchema = z.object({
  cliente_id: baseValidations.requiredString('Cliente é obrigatório'),
  barbeiro_id: baseValidations.requiredString('Barbeiro é obrigatório'),
  servico_id: baseValidations.requiredString('Serviço é obrigatório'),
  data_agendamento: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data e hora inválidas'),
  observacoes: baseValidations.optionalString,
  valor_total: z.number().positive('Valor deve ser maior que zero').optional(),
})

// Schema para cliente
export const clienteSchema = z.object({
  nome: baseValidations.requiredString('Nome é obrigatório'),
  email: baseValidations.email.optional(),
  telefone: baseValidations.requiredString('Telefone é obrigatório'),
  data_nascimento: baseValidations.dateString,
  endereco: baseValidations.optionalString,
  observacoes: baseValidations.optionalString,
  preferencias: z.array(z.string()).default([]),
})

// Schema para configurações
export const configuracoesSchema = z.object({
  nome_barbearia: baseValidations.requiredString('Nome da barbearia é obrigatório'),
  endereco: baseValidations.requiredString('Endereço é obrigatório'),
  telefone: baseValidations.requiredString('Telefone é obrigatório'),
  email: baseValidations.email,
  horario_funcionamento: z.object({
    segunda: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    terca: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    quarta: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    quinta: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    sexta: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    sabado: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
    domingo: z.object({
      abertura: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      fechamento: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
      ativo: baseValidations.boolean,
    }),
  }),
  configuracoes_avancadas: z.object({
    intervalo_agendamentos: z.number().min(15, 'Mínimo 15 minutos').max(120, 'Máximo 120 minutos'),
    antecedencia_cancelamento: z.number().min(1, 'Mínimo 1 hora').max(48, 'Máximo 48 horas'),
    limite_agendamentos_dia: z
      .number()
      .min(1, 'Mínimo 1 agendamento')
      .max(50, 'Máximo 50 agendamentos'),
    notificacoes_email: baseValidations.boolean,
    notificacoes_sms: baseValidations.boolean,
  }),
})

// Schema para login
export const loginSchema = z.object({
  email: baseValidations.email,
  password: baseValidations.requiredString('Senha é obrigatória'),
})

// Schema para registro
export const registerSchema = z
  .object({
    nome: baseValidations.requiredString('Nome é obrigatório'),
    email: baseValidations.email,
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número'
      ),
    confirmPassword: baseValidations.requiredString('Confirmação de senha é obrigatória'),
    telefone: baseValidations.phone,
    termos: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos de uso'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  })

// Schema para alteração de senha
export const changePasswordSchema = z
  .object({
    currentPassword: baseValidations.requiredString('Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número'
      ),
    confirmNewPassword: baseValidations.requiredString('Confirmação da nova senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmNewPassword'],
  })

// Tipos TypeScript derivados dos schemas
export type UserFormData = z.infer<typeof userSchema>
export type FuncionarioFormData = z.infer<typeof funcionarioSchema>
export type ServicoFormData = z.infer<typeof servicoSchema>
export type AgendamentoFormData = z.infer<typeof agendamentoSchema>
export type ClienteFormData = z.infer<typeof clienteSchema>
export type ConfiguracoesFormData = z.infer<typeof configuracoesSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// Função utilitária para validar dados
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}

      error.issues.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })

      return {
        success: false,
        errors,
      }
    }

    return {
      success: false,
      errors: { general: 'Erro de validação desconhecido' },
    }
  }
}

// Função para validar campo individual
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): string | null {
  try {
    // Para validação de campo individual, vamos usar o schema completo
    // e extrair apenas o erro do campo específico
    const testData = { [fieldName]: value } as any
    schema.parse(testData)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find((issue) => issue.path.includes(fieldName))
      return fieldError?.message || 'Valor inválido'
    }
    return 'Erro de validação'
  }
}
