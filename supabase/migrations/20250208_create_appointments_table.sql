-- =====================================================
-- CRIAÇÃO DA TABELA APPOINTMENTS - STYLLOBARBER
-- =====================================================

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID, -- Referência para tabela de serviços (quando criada)
  
  -- Dados do agendamento
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu')),
  
  -- Dados financeiros
  preco_final DECIMAL(10,2),
  desconto DECIMAL(10,2) DEFAULT 0,
  
  -- Observações
  observacoes TEXT,
  observacoes_internas TEXT, -- Apenas para barbeiros/admins
  
  -- Dados de cancelamento/reagendamento
  cancelado_por UUID REFERENCES public.profiles(id),
  motivo_cancelamento TEXT,
  reagendado_de UUID REFERENCES public.appointments(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (data_agendamento > NOW() - INTERVAL '1 day'),
  CONSTRAINT valid_duration CHECK (duracao_minutos > 0 AND duracao_minutos <= 480),
  CONSTRAINT valid_price CHECK (preco_final >= 0),
  CONSTRAINT valid_discount CHECK (desconto >= 0 AND desconto <= preco_final)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para consultas por cliente
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_id ON public.appointments(cliente_id);

-- Índice para consultas por barbeiro
CREATE INDEX IF NOT EXISTS idx_appointments_barbeiro_id ON public.appointments(barbeiro_id);

-- Índice para consultas por data
CREATE INDEX IF NOT EXISTS idx_appointments_data ON public.appointments(data_agendamento);

-- Índice para consultas por status
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Índice composto para consultas por barbeiro e data
CREATE INDEX IF NOT EXISTS idx_appointments_barbeiro_data ON public.appointments(barbeiro_id, data_agendamento);

-- Índice composto para consultas por cliente e data
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_data ON public.appointments(cliente_id, data_agendamento);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Controle de visualização de agendamentos" ON public.appointments
  FOR SELECT USING (
    -- Cliente pode ver seus próprios agendamentos
    cliente_id = auth.uid()
    OR
    -- Barbeiro pode ver agendamentos onde ele é o prestador
    barbeiro_id = auth.uid()
    OR
    -- Admin pode ver todos
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Política para INSERT
CREATE POLICY "Controle de criação de agendamentos" ON public.appointments
  FOR INSERT WITH CHECK (
    -- Cliente pode criar agendamentos para si mesmo
    cliente_id = auth.uid()
    OR
    -- Barbeiro pode criar agendamentos para clientes
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('barber', 'admin', 'saas_owner')
    )
  );

-- Política para UPDATE
CREATE POLICY "Controle de atualização de agendamentos" ON public.appointments
  FOR UPDATE USING (
    -- Cliente pode atualizar seus próprios agendamentos (limitado)
    (cliente_id = auth.uid() AND status IN ('pendente', 'confirmado'))
    OR
    -- Barbeiro pode atualizar agendamentos onde ele é o prestador
    barbeiro_id = auth.uid()
    OR
    -- Admin pode atualizar qualquer agendamento
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Política para DELETE
CREATE POLICY "Controle de exclusão de agendamentos" ON public.appointments
  FOR DELETE USING (
    -- Apenas admins podem deletar agendamentos
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar conflitos de horário
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_barbeiro_id UUID,
  p_data_agendamento TIMESTAMP WITH TIME ZONE,
  p_duracao_minutos INTEGER,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Verificar se há conflitos de horário
  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments
  WHERE barbeiro_id = p_barbeiro_id
    AND status NOT IN ('cancelado', 'nao_compareceu')
    AND (p_appointment_id IS NULL OR id != p_appointment_id)
    AND (
      -- Novo agendamento começa durante um existente
      (p_data_agendamento >= data_agendamento 
       AND p_data_agendamento < data_agendamento + INTERVAL '1 minute' * duracao_minutos)
      OR
      -- Novo agendamento termina durante um existente
      (p_data_agendamento + INTERVAL '1 minute' * p_duracao_minutos > data_agendamento 
       AND p_data_agendamento + INTERVAL '1 minute' * p_duracao_minutos <= data_agendamento + INTERVAL '1 minute' * duracao_minutos)
      OR
      -- Novo agendamento engloba um existente
      (p_data_agendamento <= data_agendamento 
       AND p_data_agendamento + INTERVAL '1 minute' * p_duracao_minutos >= data_agendamento + INTERVAL '1 minute' * duracao_minutos)
    );
  
  RETURN conflict_count > 0;
END;
$ LANGUAGE plpgsql;

-- Função para validar agendamento antes de inserir/atualizar
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $
BEGIN
  -- Verificar se barbeiro existe e tem role correto
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.barbeiro_id AND role IN ('barber', 'admin')
  ) THEN
    RAISE EXCEPTION 'Barbeiro inválido ou não encontrado';
  END IF;

  -- Verificar se cliente existe e tem role correto
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.cliente_id AND role = 'client'
  ) THEN
    RAISE EXCEPTION 'Cliente inválido ou não encontrado';
  END IF;

  -- Verificar conflitos de horário
  IF check_appointment_conflict(
    NEW.barbeiro_id, 
    NEW.data_agendamento, 
    NEW.duracao_minutos,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
  ) THEN
    RAISE EXCEPTION 'Conflito de horário detectado para este barbeiro';
  END IF;

  -- Verificar se data não é no passado (exceto para admins)
  IF NEW.data_agendamento < NOW() - INTERVAL '1 hour' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    ) THEN
      RAISE EXCEPTION 'Não é possível agendar para horários passados';
    END IF;
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para validação
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment();

-- =====================================================
-- VIEWS AUXILIARES
-- =====================================================

-- View para agendamentos com horário brasileiro
CREATE OR REPLACE VIEW public.appointments_brazil AS
SELECT 
  id,
  cliente_id,
  barbeiro_id,
  service_id,
  data_agendamento,
  data_agendamento AT TIME ZONE 'America/Sao_Paulo' as data_brasil,
  DATE(data_agendamento AT TIME ZONE 'America/Sao_Paulo') as data_apenas,
  (data_agendamento AT TIME ZONE 'America/Sao_Paulo')::TIME as hora_brasil,
  duracao_minutos,
  status,
  preco_final,
  desconto,
  observacoes,
  observacoes_internas,
  cancelado_por,
  motivo_cancelamento,
  reagendado_de,
  created_at,
  updated_at
FROM public.appointments;

-- View para estatísticas de agendamentos
CREATE OR REPLACE VIEW public.appointment_stats AS
SELECT 
  DATE(data_agendamento AT TIME ZONE 'America/Sao_Paulo') as data,
  barbeiro_id,
  COUNT(*) as total_agendamentos,
  COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
  COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
  COUNT(*) FILTER (WHERE status = 'nao_compareceu') as nao_compareceu,
  SUM(preco_final) FILTER (WHERE status = 'concluido') as receita_total,
  AVG(duracao_minutos) as duracao_media
FROM public.appointments
GROUP BY DATE(data_agendamento AT TIME ZONE 'America/Sao_Paulo'), barbeiro_id;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.appointments IS 'Tabela de agendamentos da barbearia';
COMMENT ON COLUMN public.appointments.cliente_id IS 'ID do cliente que fez o agendamento';
COMMENT ON COLUMN public.appointments.barbeiro_id IS 'ID do barbeiro que fará o atendimento';
COMMENT ON COLUMN public.appointments.service_id IS 'ID do serviço agendado';
COMMENT ON COLUMN public.appointments.data_agendamento IS 'Data e hora do agendamento (UTC)';
COMMENT ON COLUMN public.appointments.duracao_minutos IS 'Duração estimada do serviço em minutos';
COMMENT ON COLUMN public.appointments.status IS 'Status atual do agendamento';
COMMENT ON COLUMN public.appointments.preco_final IS 'Preço final cobrado pelo serviço';
COMMENT ON COLUMN public.appointments.observacoes IS 'Observações visíveis ao cliente';
COMMENT ON COLUMN public.appointments.observacoes_internas IS 'Observações internas (apenas staff)';

COMMENT ON FUNCTION check_appointment_conflict(UUID, TIMESTAMP WITH TIME ZONE, INTEGER, UUID) IS 
'Verifica se há conflitos de horário para um agendamento';

COMMENT ON FUNCTION validate_appointment() IS 
'Valida dados do agendamento antes de inserir/atualizar';

COMMENT ON VIEW public.appointments_brazil IS 
'View com agendamentos convertidos para horário brasileiro';

COMMENT ON VIEW public.appointment_stats IS 
'View com estatísticas agregadas de agendamentos por data e barbeiro';

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS DESENVOLVIMENTO)
-- =====================================================

-- Inserir alguns agendamentos de exemplo se não existirem
-- (Apenas para desenvolvimento - remover em produção)

DO $
DECLARE
  admin_id UUID;
  client_id UUID;
  barber_id UUID;
BEGIN
  -- Buscar IDs de usuários existentes
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO client_id FROM public.profiles WHERE role = 'client' LIMIT 1;
  SELECT id INTO barber_id FROM public.profiles WHERE role = 'barber' LIMIT 1;
  
  -- Se existirem usuários, criar agendamentos de exemplo
  IF admin_id IS NOT NULL AND client_id IS NOT NULL AND barber_id IS NOT NULL THEN
    INSERT INTO public.appointments (
      cliente_id,
      barbeiro_id,
      data_agendamento,
      duracao_minutos,
      status,
      preco_final,
      observacoes
    ) VALUES 
    (
      client_id,
      barber_id,
      NOW() + INTERVAL '1 day',
      30,
      'confirmado',
      45.00,
      'Corte simples'
    ),
    (
      client_id,
      barber_id,
      NOW() + INTERVAL '2 days',
      60,
      'pendente',
      65.00,
      'Corte + barba'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Agendamentos de exemplo criados';
  ELSE
    RAISE NOTICE 'Usuários não encontrados - agendamentos de exemplo não criados';
  END IF;
END $;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $
DECLARE
  table_exists BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verificar se tabela foi criada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments'
  ) INTO table_exists;
  
  -- Verificar RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'appointments';
  
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'appointments';
  
  -- Contar índices
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public' AND tablename = 'appointments';
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'VERIFICAÇÃO DA TABELA APPOINTMENTS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Tabela criada: %', table_exists;
  RAISE NOTICE 'RLS habilitado: %', COALESCE(rls_enabled, false);
  RAISE NOTICE 'Políticas criadas: %', COALESCE(policy_count, 0);
  RAISE NOTICE 'Índices criados: %', COALESCE(index_count, 0);
  RAISE NOTICE '==========================================';
  
  IF table_exists AND COALESCE(rls_enabled, false) AND COALESCE(policy_count, 0) >= 4 THEN
    RAISE NOTICE '🎉 TABELA APPOINTMENTS CRIADA COM SUCESSO!';
  ELSE
    RAISE WARNING '⚠️ PROBLEMAS NA CRIAÇÃO DA TABELA APPOINTMENTS';
  END IF;
END $;