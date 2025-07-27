-- =====================================================
-- SISTEMA DE ESPECIALIDADES - FUNCIONÁRIOS E SERVIÇOS
-- =====================================================

-- Criar tabela de relacionamento funcionário-serviços (many-to-many)
CREATE TABLE IF NOT EXISTS public.funcionario_servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicatas
  UNIQUE(funcionario_id, service_id)
);

-- Habilitar RLS
ALTER TABLE public.funcionario_servicos ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionario_servicos_funcionario_id ON public.funcionario_servicos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionario_servicos_service_id ON public.funcionario_servicos(service_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_funcionario_servicos_updated_at ON public.funcionario_servicos;
CREATE TRIGGER update_funcionario_servicos_updated_at
    BEFORE UPDATE ON public.funcionario_servicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Admins podem ver todos os relacionamentos
CREATE POLICY "Admins podem ver funcionario_servicos" ON public.funcionario_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem inserir relacionamentos
CREATE POLICY "Admins podem inserir funcionario_servicos" ON public.funcionario_servicos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem atualizar relacionamentos
CREATE POLICY "Admins podem atualizar funcionario_servicos" ON public.funcionario_servicos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem deletar relacionamentos
CREATE POLICY "Admins podem deletar funcionario_servicos" ON public.funcionario_servicos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Funcionários podem ver seus próprios serviços
CREATE POLICY "Funcionários podem ver seus serviços" ON public.funcionario_servicos
  FOR SELECT USING (funcionario_id = auth.uid());

-- Clientes podem ver relacionamentos para agendamento
CREATE POLICY "Clientes podem ver funcionario_servicos para agendamento" ON public.funcionario_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'client'
    )
  );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter serviços de um funcionário
CREATE OR REPLACE FUNCTION get_funcionario_servicos(funcionario_uuid UUID)
RETURNS TABLE (
  service_id UUID,
  nome TEXT,
  descricao TEXT,
  preco DECIMAL,
  duracao_minutos INTEGER,
  categoria TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nome,
    s.descricao,
    s.preco,
    s.duracao_minutos,
    s.categoria
  FROM public.services s
  INNER JOIN public.funcionario_servicos fs ON s.id = fs.service_id
  WHERE fs.funcionario_id = funcionario_uuid
    AND s.ativo = true
  ORDER BY s.ordem ASC, s.nome ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter funcionários que fazem um serviço
CREATE OR REPLACE FUNCTION get_service_funcionarios(service_uuid UUID)
RETURNS TABLE (
  funcionario_id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.email,
    p.telefone,
    p.avatar_url
  FROM public.profiles p
  INNER JOIN public.funcionario_servicos fs ON p.id = fs.funcionario_id
  WHERE fs.service_id = service_uuid
    AND p.ativo = true
    AND p.role IN ('admin', 'barber')
  ORDER BY p.nome ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se funcionário pode fazer um serviço
CREATE OR REPLACE FUNCTION funcionario_pode_fazer_servico(funcionario_uuid UUID, service_uuid UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.funcionario_servicos
    WHERE funcionario_id = funcionario_uuid 
      AND service_id = service_uuid
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para facilitar consultas de funcionários com seus serviços
CREATE OR REPLACE VIEW funcionarios_com_servicos AS
SELECT 
  p.id as funcionario_id,
  p.nome as funcionario_nome,
  p.email as funcionario_email,
  p.telefone as funcionario_telefone,
  p.avatar_url as funcionario_avatar,
  p.role as funcionario_role,
  p.ativo as funcionario_ativo,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'nome', s.nome,
        'descricao', s.descricao,
        'preco', s.preco,
        'duracao_minutos', s.duracao_minutos,
        'categoria', s.categoria
      ) ORDER BY s.ordem ASC, s.nome ASC
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) as servicos
FROM public.profiles p
LEFT JOIN public.funcionario_servicos fs ON p.id = fs.funcionario_id
LEFT JOIN public.services s ON fs.service_id = s.id AND s.ativo = true
WHERE p.role IN ('admin', 'barber') AND p.ativo = true
GROUP BY p.id, p.nome, p.email, p.telefone, p.avatar_url, p.role, p.ativo
ORDER BY p.nome ASC;

-- View para facilitar consultas de serviços com seus funcionários
CREATE OR REPLACE VIEW servicos_com_funcionarios AS
SELECT 
  s.id as service_id,
  s.nome as service_nome,
  s.descricao as service_descricao,
  s.preco as service_preco,
  s.duracao_minutos as service_duracao,
  s.categoria as service_categoria,
  s.ativo as service_ativo,
  COALESCE(
    json_agg(
      json_build_object(
        'id', p.id,
        'nome', p.nome,
        'email', p.email,
        'telefone', p.telefone,
        'avatar_url', p.avatar_url,
        'role', p.role
      ) ORDER BY p.nome ASC
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) as funcionarios
FROM public.services s
LEFT JOIN public.funcionario_servicos fs ON s.id = fs.service_id
LEFT JOIN public.profiles p ON fs.funcionario_id = p.id AND p.ativo = true AND p.role IN ('admin', 'barber')
WHERE s.ativo = true
GROUP BY s.id, s.nome, s.descricao, s.preco, s.duracao_minutos, s.categoria, s.ativo
ORDER BY s.ordem ASC, s.nome ASC;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.funcionario_servicos IS 'Relacionamento many-to-many entre funcionários e serviços que eles podem realizar';
COMMENT ON COLUMN public.funcionario_servicos.funcionario_id IS 'ID do funcionário (referência para profiles com role admin/barber)';
COMMENT ON COLUMN public.funcionario_servicos.service_id IS 'ID do serviço que o funcionário pode realizar';

COMMENT ON FUNCTION get_funcionario_servicos(UUID) IS 'Retorna todos os serviços que um funcionário pode realizar';
COMMENT ON FUNCTION get_service_funcionarios(UUID) IS 'Retorna todos os funcionários que podem realizar um serviço';
COMMENT ON FUNCTION funcionario_pode_fazer_servico(UUID, UUID) IS 'Verifica se um funcionário pode realizar um serviço específico';

COMMENT ON VIEW funcionarios_com_servicos IS 'View que mostra funcionários com seus serviços em formato JSON';
COMMENT ON VIEW servicos_com_funcionarios IS 'View que mostra serviços com seus funcionários em formato JSON';

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- =====================================================

-- Inserir alguns relacionamentos de exemplo se não existirem dados
-- (Isso deve ser feito via interface administrativa)

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

DO $
BEGIN
    RAISE NOTICE 'Migração de funcionario_servicos aplicada com sucesso!';
    RAISE NOTICE 'Tabela funcionario_servicos criada';
    RAISE NOTICE 'Políticas RLS configuradas';
    RAISE NOTICE 'Funções auxiliares criadas';
    RAISE NOTICE 'Views criadas';
END $;