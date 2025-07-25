// Configurações de localização
export const LOCALE_CONFIG = {
  locale: 'pt-BR',
  currency: 'BRL',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  timezone: 'America/Sao_Paulo'
} as const

// Status de agendamento
export const STATUS_AGENDAMENTO = {
  AGENDADO: 'scheduled',
  CONFIRMADO: 'confirmed',
  EM_ANDAMENTO: 'in_progress',
  CONCLUIDO: 'completed',
  CANCELADO: 'cancelled'
} as const

// Métodos de pagamento
export const METODOS_PAGAMENTO = {
  DINHEIRO: 'cash',
  CARTAO: 'card',
  PIX: 'pix'
} as const

// Status de pagamento
export const STATUS_PAGAMENTO = {
  PENDENTE: 'pending',
  PAGO: 'paid'
} as const

// Roles de usuário
export const ROLES_USUARIO = {
  ADMIN: 'admin',
  BARBEIRO: 'barber',
  CLIENTE: 'client'
} as const

// Horários de funcionamento padrão
export const HORARIOS_FUNCIONAMENTO = {
  ABERTURA: '08:00',
  FECHAMENTO: '18:00',
  INTERVALO_SLOTS: 30, // minutos
} as const

// Configurações de agendamento
export const CONFIG_AGENDAMENTO = {
  ANTECEDENCIA_MINIMA: 1, // horas
  ANTECEDENCIA_MAXIMA: 30, // dias
  DURACAO_PADRAO_SERVICO: 60, // minutos
  PAUSA_ENTRE_SERVICOS: 15, // minutos
} as const

// Mensagens do sistema
export const MENSAGENS = {
  ERRO_GENERICO: 'Ocorreu um erro inesperado. Tente novamente.',
  SUCESSO_AGENDAMENTO: 'Agendamento realizado com sucesso!',
  SUCESSO_CANCELAMENTO: 'Agendamento cancelado com sucesso.',
  ERRO_HORARIO_INDISPONIVEL: 'Horário não disponível.',
  ERRO_CAMPOS_OBRIGATORIOS: 'Preencha todos os campos obrigatórios.',
} as const

// Configurações de validação
export const VALIDACAO = {
  TELEFONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NOME_MIN_LENGTH: 2,
  NOME_MAX_LENGTH: 100,
  SENHA_MIN_LENGTH: 6,
} as const