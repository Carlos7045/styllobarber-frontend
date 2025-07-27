-- =====================================================
-- APLICAR MIGRAÇÃO DE ESPECIALIDADES
-- Execute este script no Supabase SQL Editor
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

-- Trigger para updated_at (se a função existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_funcionario_servicos_updated_at ON public.funcionario_servicos;
        CREATE TRIGGER update_funcionario_servicos_updated_at
            BEFORE UPDATE ON public.funcionario_servicos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Admins podem ver todos os relacionamentos
DROP POLICY IF EXISTS "Admins podem ver funcionario_servicos" ON public.funcionario_servicos;
CREATE POLICY "Admins podem ver funcionario_servicos" ON public.funcionario_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem inserir relacionamentos
DROP POLICY IF EXISTS "Admins podem inserir funcionario_servicos" ON public.funcionario_servicos;
CREATE POLICY "Admins podem inserir funcionario_servicos" ON public.funcionario_servicos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem atualizar relacionamentos
DROP POLICY IF EXISTS "Admins podem atualizar funcionario_servicos" ON public.funcionario_servicos;
CREATE POLICY "Admins podem atualizar funcionario_servicos" ON public.funcionario_servicos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Admins podem deletar relacionamentos
DROP POLICY IF EXISTS "Admins podem deletar funcionario_servicos" ON public.funcionario_servicos;
CREATE POLICY "Admins podem deletar funcionario_servicos" ON public.funcionario_servicos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
    )
  );

-- Funcionários podem ver seus próprios serviços
DROP POLICY IF EXISTS "Funcionários podem ver seus serviços" ON public.funcionario_servicos;
CREATE POLICY "Funcionários podem ver seus serviços" ON public.funcionario_servicos
  FOR SELECT USING (funcionario_id = auth.uid());

-- Clientes podem ver relacionamentos para agendamento
DROP POLICY IF EXISTS "Clientes podem ver funcionario_servicos para agendamento" ON public.funcionario_servicos;
CREATE POLICY "Clientes podem ver funcionario_servicos para agendamento" ON public.funcionario_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'client'
    )
  );

-- Verificar se foi criado com sucesso
SELECT 'Migração aplicada com sucesso!' as status;
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'funcionario_servicos';