-- Migração para tabelas de cadastro automático de clientes

-- Adicionar colunas ao profiles para controle de cadastro automático
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cadastro_automatico BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS senha_alterada BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS cadastrado_por UUID REFERENCES profiles(id);

-- Tabela para logs de cadastro automático
CREATE TABLE IF NOT EXISTS logs_cadastro_automatico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dados_originais JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de envio de credenciais
CREATE TABLE IF NOT EXISTS logs_envio_credenciais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo_envio VARCHAR(10) NOT NULL CHECK (tipo_envio IN ('SMS', 'EMAIL')),
  destinatario VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enviado', 'falha', 'pendente')),
  tentativa INTEGER DEFAULT 1,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de alteração de senha
CREATE TABLE IF NOT EXISTS logs_alteracao_senha (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('primeiro_acesso', 'reset', 'alteracao_normal')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_cadastro_automatico_cliente_id ON logs_cadastro_automatico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_cadastro_automatico_funcionario_id ON logs_cadastro_automatico(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_logs_cadastro_automatico_created_at ON logs_cadastro_automatico(created_at);

CREATE INDEX IF NOT EXISTS idx_logs_envio_credenciais_cliente_id ON logs_envio_credenciais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_envio_credenciais_status ON logs_envio_credenciais(status);
CREATE INDEX IF NOT EXISTS idx_logs_envio_credenciais_created_at ON logs_envio_credenciais(created_at);

CREATE INDEX IF NOT EXISTS idx_logs_alteracao_senha_user_id ON logs_alteracao_senha(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_alteracao_senha_tipo ON logs_alteracao_senha(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_alteracao_senha_created_at ON logs_alteracao_senha(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE logs_cadastro_automatico ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_envio_credenciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_alteracao_senha ENABLE ROW LEVEL SECURITY;

-- Políticas para logs_cadastro_automatico
CREATE POLICY "Admins podem ver todos os logs de cadastro" ON logs_cadastro_automatico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_owner')
    )
  );

CREATE POLICY "Funcionários podem ver logs que criaram" ON logs_cadastro_automatico
  FOR SELECT USING (
    funcionario_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_owner')
    )
  );

CREATE POLICY "Funcionários podem inserir logs" ON logs_cadastro_automatico
  FOR INSERT WITH CHECK (
    funcionario_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'barber')
    )
  );

-- Políticas para logs_envio_credenciais
CREATE POLICY "Admins podem ver todos os logs de envio" ON logs_envio_credenciais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_owner')
    )
  );

CREATE POLICY "Clientes podem ver seus próprios logs" ON logs_envio_credenciais
  FOR SELECT USING (cliente_id = auth.uid());

CREATE POLICY "Sistema pode inserir logs de envio" ON logs_envio_credenciais
  FOR INSERT WITH CHECK (true);

-- Políticas para logs_alteracao_senha
CREATE POLICY "Admins podem ver todos os logs de senha" ON logs_alteracao_senha
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'saas_owner')
    )
  );

CREATE POLICY "Usuários podem ver seus próprios logs" ON logs_alteracao_senha
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir logs de senha" ON logs_alteracao_senha
  FOR INSERT WITH CHECK (true);

-- Função para marcar clientes como cadastro automático
CREATE OR REPLACE FUNCTION mark_automatic_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário foi criado com metadata de cadastro automático
  IF NEW.raw_user_meta_data->>'cadastro_automatico' = 'true' THEN
    -- Atualizar o perfil correspondente
    UPDATE profiles 
    SET 
      cadastro_automatico = true,
      senha_alterada = false,
      cadastrado_por = (NEW.raw_user_meta_data->>'cadastrado_por')::UUID
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para marcar cadastros automáticos
DROP TRIGGER IF EXISTS trigger_mark_automatic_registration ON auth.users;
CREATE TRIGGER trigger_mark_automatic_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION mark_automatic_registration();

-- Função para obter estatísticas de cadastro automático
CREATE OR REPLACE FUNCTION get_automatic_registration_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_cadastros INTEGER,
  cadastros_por_dia JSONB,
  cadastros_por_funcionario JSONB,
  taxa_sucesso_envio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH cadastros AS (
    SELECT 
      l.created_at::DATE as dia,
      l.funcionario_id,
      p.nome as funcionario_nome
    FROM logs_cadastro_automatico l
    JOIN profiles p ON p.id = l.funcionario_id
    WHERE l.created_at::DATE BETWEEN start_date AND end_date
  ),
  envios AS (
    SELECT 
      status,
      COUNT(*) as total
    FROM logs_envio_credenciais
    WHERE created_at::DATE BETWEEN start_date AND end_date
    GROUP BY status
  )
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM cadastros) as total_cadastros,
    (
      SELECT jsonb_object_agg(dia, total)
      FROM (
        SELECT dia, COUNT(*) as total
        FROM cadastros
        GROUP BY dia
        ORDER BY dia
      ) daily_stats
    ) as cadastros_por_dia,
    (
      SELECT jsonb_object_agg(funcionario_nome, total)
      FROM (
        SELECT funcionario_nome, COUNT(*) as total
        FROM cadastros
        GROUP BY funcionario_nome
        ORDER BY total DESC
      ) employee_stats
    ) as cadastros_por_funcionario,
    (
      SELECT 
        CASE 
          WHEN SUM(total) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN status = 'enviado' THEN total ELSE 0 END) * 100.0 / SUM(total)), 2)
        END
      FROM envios
    ) as taxa_sucesso_envio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE logs_cadastro_automatico IS 'Log de clientes cadastrados automaticamente no PDV';
COMMENT ON TABLE logs_envio_credenciais IS 'Log de envio de credenciais por SMS/Email';
COMMENT ON TABLE logs_alteracao_senha IS 'Log de alterações de senha dos usuários';

COMMENT ON COLUMN profiles.cadastro_automatico IS 'Indica se o cliente foi cadastrado automaticamente no PDV';
COMMENT ON COLUMN profiles.senha_alterada IS 'Indica se o cliente já alterou a senha temporária';
COMMENT ON COLUMN profiles.cadastrado_por IS 'ID do funcionário que fez o cadastro automático';

COMMENT ON FUNCTION get_automatic_registration_stats IS 'Retorna estatísticas de cadastros automáticos em um período';