-- Migração para sistema de notificações
-- Criação das tabelas necessárias para o sistema de notificações

-- Tabela de templates de notificação
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('email', 'sms', 'push', 'whatsapp')),
  evento VARCHAR(100) NOT NULL, -- agendamento_criado, agendamento_cancelado, etc.
  assunto VARCHAR(200),
  conteudo TEXT NOT NULL,
  variaveis_disponiveis TEXT[], -- Array de variáveis que podem ser usadas
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de log de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id),
  destinatario VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  assunto VARCHAR(200),
  conteudo TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'falhou', 'cancelado')),
  tentativas INTEGER DEFAULT 0,
  erro_detalhes TEXT,
  agendamento_id UUID REFERENCES appointments(id),
  usuario_id UUID REFERENCES profiles(id),
  enviado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de notificações agendadas
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id),
  destinatario VARCHAR(200) NOT NULL,
  dados_contexto JSONB, -- Dados para substituir variáveis
  agendado_para TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'processado', 'cancelado')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de push notifications para administradores
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info' CHECK (tipo IN ('info', 'warning', 'error', 'success')),
  destinatario_id UUID REFERENCES profiles(id),
  lida BOOLEAN DEFAULT false,
  acao_url VARCHAR(500),
  dados_extras JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  lida_em TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_evento ON notification_templates(evento);
CREATE INDEX IF NOT EXISTS idx_notification_templates_ativo ON notification_templates(ativo);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_agendado_para ON scheduled_notifications(agendado_para);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_destinatario ON admin_notifications(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_lida ON admin_notifications(lida);

-- RLS Policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_templates
CREATE POLICY "Admins podem gerenciar templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_admin')
    )
  );

-- Políticas para notification_settings
CREATE POLICY "Admins podem gerenciar configurações" ON notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_admin')
    )
  );

-- Políticas para notification_logs
CREATE POLICY "Admins podem ver logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_admin')
    )
  );

-- Políticas para scheduled_notifications
CREATE POLICY "Admins podem gerenciar notificações agendadas" ON scheduled_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_admin')
    )
  );

-- Políticas para admin_notifications
CREATE POLICY "Usuários veem suas próprias notificações" ON admin_notifications
  FOR SELECT USING (destinatario_id = auth.uid());

CREATE POLICY "Admins podem criar notificações" ON admin_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_admin')
    )
  );

CREATE POLICY "Usuários podem marcar como lida" ON admin_notifications
  FOR UPDATE USING (destinatario_id = auth.uid())
  WITH CHECK (destinatario_id = auth.uid());

-- Inserir templates padrão
INSERT INTO notification_templates (nome, tipo, evento, assunto, conteudo, variaveis_disponiveis) VALUES
('agendamento_confirmado_email', 'email', 'agendamento_confirmado', 
 'Agendamento Confirmado - {{nome_barbearia}}', 
 'Olá {{nome_cliente}},\n\nSeu agendamento foi confirmado!\n\nDetalhes:\n- Serviço: {{nome_servico}}\n- Data: {{data_agendamento}}\n- Horário: {{horario_agendamento}}\n- Barbeiro: {{nome_barbeiro}}\n- Valor: {{valor_servico}}\n\nObrigado por escolher a {{nome_barbearia}}!',
 ARRAY['nome_cliente', 'nome_servico', 'data_agendamento', 'horario_agendamento', 'nome_barbeiro', 'valor_servico', 'nome_barbearia']),

('agendamento_cancelado_email', 'email', 'agendamento_cancelado',
 'Agendamento Cancelado - {{nome_barbearia}}',
 'Olá {{nome_cliente}},\n\nSeu agendamento foi cancelado.\n\nDetalhes do agendamento cancelado:\n- Serviço: {{nome_servico}}\n- Data: {{data_agendamento}}\n- Horário: {{horario_agendamento}}\n\nPara reagendar, entre em contato conosco.\n\nObrigado pela compreensão!',
 ARRAY['nome_cliente', 'nome_servico', 'data_agendamento', 'horario_agendamento', 'nome_barbearia']),

('lembrete_agendamento_sms', 'sms', 'lembrete_agendamento',
 NULL,
 'Lembrete: Você tem um agendamento amanhã às {{horario_agendamento}} na {{nome_barbearia}}. Serviço: {{nome_servico}}. Para cancelar, ligue {{telefone_barbearia}}.',
 ARRAY['horario_agendamento', 'nome_barbearia', 'nome_servico', 'telefone_barbearia']),

('novo_agendamento_admin', 'push', 'novo_agendamento',
 'Novo Agendamento',
 'Novo agendamento criado por {{nome_cliente}} para {{data_agendamento}} às {{horario_agendamento}}.',
 ARRAY['nome_cliente', 'data_agendamento', 'horario_agendamento']);

-- Inserir configurações padrão
INSERT INTO notification_settings (chave, valor, descricao) VALUES
('email_enabled', '"true"', 'Habilitar envio de emails'),
('sms_enabled', '"false"', 'Habilitar envio de SMS'),
('push_enabled', '"true"', 'Habilitar notificações push'),
('retry_attempts', '"3"', 'Número máximo de tentativas de reenvio'),
('retry_delay_minutes', '"5"', 'Delay em minutos entre tentativas'),
('lembrete_horas_antes', '"24"', 'Horas antes do agendamento para enviar lembrete'),
('email_from', '"StylloBarber <noreply@styllobarber.com>"', 'Email remetente padrão'),
('telefone_barbearia', '"+55 11 99999-9999"', 'Telefone da barbearia para SMS');

-- Função para processar variáveis em templates
CREATE OR REPLACE FUNCTION process_template_variables(
  template_content TEXT,
  variables JSONB
) RETURNS TEXT AS $$
DECLARE
  result TEXT := template_content;
  var_key TEXT;
  var_value TEXT;
BEGIN
  -- Iterar sobre todas as variáveis e substituir no template
  FOR var_key, var_value IN SELECT * FROM jsonb_each_text(variables)
  LOOP
    result := REPLACE(result, '{{' || var_key || '}}', COALESCE(var_value, ''));
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();