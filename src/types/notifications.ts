// Tipos para o sistema de notificações

export type TipoNotificacao = 'email' | 'sms' | 'push' | 'whatsapp'
export type StatusNotificacao = 'pendente' | 'enviado' | 'falhou' | 'cancelado'
export type StatusAgendamento = 'agendado' | 'processado' | 'cancelado'
export type TipoAdminNotification = 'info' | 'warning' | 'error' | 'success'

// Template de notificação
export interface NotificationTemplate {
  id: string
  nome: string
  tipo: TipoNotificacao
  evento: string
  assunto?: string
  conteudo: string
  variaveis_disponiveis: string[]
  ativo: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Dados para criar/editar template
export interface CreateNotificationTemplateData {
  nome: string
  tipo: TipoNotificacao
  evento: string
  assunto?: string
  conteudo: string
  variaveis_disponiveis: string[]
  ativo?: boolean
}

export interface UpdateNotificationTemplateData extends Partial<CreateNotificationTemplateData> {
  id?: string
}

// Configurações de notificação
export interface NotificationSetting {
  id: string
  chave: string
  valor: any // JSONB pode ser qualquer tipo
  descricao?: string
  updated_by?: string
  updated_at: string
}

// Log de notificação
export interface NotificationLog {
  id: string
  template_id?: string
  destinatario: string
  tipo: TipoNotificacao
  assunto?: string
  conteudo: string
  status: StatusNotificacao
  tentativas: number
  erro_detalhes?: string
  agendamento_id?: string
  usuario_id?: string
  enviado_em?: string
  created_at: string
}

// Notificação agendada
export interface ScheduledNotification {
  id: string
  template_id: string
  destinatario: string
  dados_contexto?: Record<string, any>
  agendado_para: string
  status: StatusAgendamento
  created_by?: string
  created_at: string
}

// Notificação para administradores
export interface AdminNotification {
  id: string
  titulo: string
  mensagem: string
  tipo: TipoAdminNotification
  destinatario_id: string
  lida: boolean
  acao_url?: string
  dados_extras?: Record<string, any>
  created_at: string
  lida_em?: string
}

// Dados para criar notificação admin
export interface CreateAdminNotificationData {
  titulo: string
  mensagem: string
  tipo?: TipoAdminNotification
  destinatario_id: string
  acao_url?: string
  dados_extras?: Record<string, any>
}

// Dados para enviar notificação
export interface SendNotificationData {
  template_id: string
  destinatario: string
  dados_contexto: Record<string, any>
  agendamento_id?: string
  usuario_id?: string
}

// Dados para agendar notificação
export interface ScheduleNotificationData {
  template_id: string
  destinatario: string
  dados_contexto: Record<string, any>
  agendado_para: Date
}

// Estatísticas de notificações
export interface NotificationStats {
  total_enviadas: number
  total_falharam: number
  taxa_sucesso: number
  por_tipo: Record<TipoNotificacao, number>
  por_status: Record<StatusNotificacao, number>
  ultimos_7_dias: Array<{
    data: string
    enviadas: number
    falharam: number
  }>
}

// Filtros para listagem
export interface NotificationFilters {
  tipo?: TipoNotificacao
  status?: StatusNotificacao
  data_inicio?: string
  data_fim?: string
  destinatario?: string
  template_id?: string
}

// Variáveis disponíveis para templates
export interface TemplateVariables {
  // Dados do cliente
  nome_cliente?: string
  email_cliente?: string
  telefone_cliente?: string
  
  // Dados do agendamento
  data_agendamento?: string
  horario_agendamento?: string
  nome_servico?: string
  valor_servico?: string
  nome_barbeiro?: string
  
  // Dados da barbearia
  nome_barbearia?: string
  telefone_barbearia?: string
  endereco_barbearia?: string
  
  // Outras variáveis dinâmicas
  [key: string]: any
}

// Configurações do sistema de notificação
export interface NotificationSystemConfig {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  retry_attempts: number
  retry_delay_minutes: number
  lembrete_horas_antes: number
  email_from: string
  telefone_barbearia: string
}

// Resultado de processamento de template
export interface ProcessedTemplate {
  assunto?: string
  conteudo: string
  variaveis_utilizadas: string[]
  variaveis_faltantes: string[]
}

// Eventos disponíveis para templates
export const EVENTOS_NOTIFICACAO = {
  AGENDAMENTO_CONFIRMADO: 'agendamento_confirmado',
  AGENDAMENTO_CANCELADO: 'agendamento_cancelado',
  AGENDAMENTO_REAGENDADO: 'agendamento_reagendado',
  LEMBRETE_AGENDAMENTO: 'lembrete_agendamento',
  NOVO_AGENDAMENTO: 'novo_agendamento',
  PAGAMENTO_CONFIRMADO: 'pagamento_confirmado',
  CLIENTE_CADASTRADO: 'cliente_cadastrado',
  PROMOCAO_DISPONIVEL: 'promocao_disponivel'
} as const

export type EventoNotificacao = typeof EVENTOS_NOTIFICACAO[keyof typeof EVENTOS_NOTIFICACAO]

// Variáveis padrão por evento
export const VARIAVEIS_POR_EVENTO: Record<EventoNotificacao, string[]> = {
  [EVENTOS_NOTIFICACAO.AGENDAMENTO_CONFIRMADO]: [
    'nome_cliente', 'nome_servico', 'data_agendamento', 'horario_agendamento', 
    'nome_barbeiro', 'valor_servico', 'nome_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.AGENDAMENTO_CANCELADO]: [
    'nome_cliente', 'nome_servico', 'data_agendamento', 'horario_agendamento', 'nome_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.AGENDAMENTO_REAGENDADO]: [
    'nome_cliente', 'nome_servico', 'data_agendamento_antiga', 'data_agendamento_nova',
    'horario_agendamento_antigo', 'horario_agendamento_novo', 'nome_barbeiro', 'nome_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.LEMBRETE_AGENDAMENTO]: [
    'nome_cliente', 'nome_servico', 'data_agendamento', 'horario_agendamento', 
    'nome_barbeiro', 'nome_barbearia', 'telefone_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.NOVO_AGENDAMENTO]: [
    'nome_cliente', 'data_agendamento', 'horario_agendamento', 'nome_servico', 'nome_barbeiro'
  ],
  [EVENTOS_NOTIFICACAO.PAGAMENTO_CONFIRMADO]: [
    'nome_cliente', 'valor_pago', 'forma_pagamento', 'nome_servico', 'nome_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.CLIENTE_CADASTRADO]: [
    'nome_cliente', 'email_cliente', 'nome_barbearia'
  ],
  [EVENTOS_NOTIFICACAO.PROMOCAO_DISPONIVEL]: [
    'nome_cliente', 'descricao_promocao', 'validade_promocao', 'nome_barbearia'
  ]
}
