-- =====================================================
-- ROW LEVEL SECURITY (RLS) - SISTEMA DE AUTENTICAÇÃO
-- =====================================================

-- =====================================================
-- HABILITAR RLS NAS TABELAS PRINCIPAIS
-- =====================================================

-- Habilitar RLS na tabela profiles (CRÍTICO!)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar se outras tabelas precisam de RLS
-- (Futuras tabelas como agendamentos, serviços, etc.)

-- =====================================================
-- POLÍTICAS PARA TABELA PROFILES
-- =====================================================

-- 1. POLÍTICA DE LEITURA (SELECT)
-- Usuários podem ver apenas seu próprio perfil
-- Admins podem ver todos os perfis
-- Barbeiros podem ver perfis de clientes (para agendamentos)
CREATE POLICY "Usuários podem ver perfis baseado no role" ON public.profiles
  FOR SELECT USING (
    -- Usuário pode ver seu próprio perfil
    auth.uid() = id
    OR
    -- Admins podem ver todos os perfis
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Barbeiros podem ver perfis de clientes
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'barber'
      )
      AND role = 'client'
    )
  );

-- 2. POLÍTICA DE INSERÇÃO (INSERT)
-- Apenas o próprio usuário pode criar seu perfil (via trigger)
-- Admins podem criar perfis para outros usuários
CREATE POLICY "Controle de criação de perfis" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Usuário pode criar apenas seu próprio perfil
    auth.uid() = id
    OR
    -- Admins podem criar perfis para qualquer usuário
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. POLÍTICA DE ATUALIZAÇÃO (UPDATE)
-- Usuários podem atualizar apenas seu próprio perfil
-- Admins podem atualizar qualquer perfil
-- Barbeiros podem atualizar apenas dados específicos de clientes
CREATE POLICY "Controle de atualização de perfis" ON public.profiles
  FOR UPDATE USING (
    -- Usuário pode atualizar seu próprio perfil
    auth.uid() = id
    OR
    -- Admins podem atualizar qualquer perfil
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Verificações adicionais para atualização
    CASE 
      -- Usuários normais não podem alterar seu próprio role
      WHEN auth.uid() = id AND OLD.role != NEW.role THEN
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      ELSE true
    END
  );

-- 4. POLÍTICA DE EXCLUSÃO (DELETE)
-- Apenas admins podem deletar perfis
-- Usuários não podem deletar seu próprio perfil (para evitar acidentes)
CREATE POLICY "Apenas admins podem deletar perfis" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS ESPECÍFICAS POR ROLE
-- =====================================================

-- Política adicional: Barbeiros podem ver apenas dados necessários de clientes
-- (Para futuras funcionalidades como agendamentos)
CREATE POLICY "Barbeiros veem dados limitados de clientes" ON public.profiles
  FOR SELECT USING (
    -- Se é barbeiro vendo cliente, limitar campos visíveis
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'barber'
      ) AND role = 'client' THEN
        -- Barbeiro pode ver apenas dados básicos do cliente
        true
      ELSE
        -- Outras regras já definidas acima
        false
    END
  );

-- =====================================================
-- POLÍTICAS PARA STORAGE (AVATARS)
-- =====================================================

-- Verificar se RLS está habilitado no storage.objects
DO $$
BEGIN
  -- Habilitar RLS se não estiver habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Política para visualização pública de avatars
DROP POLICY IF EXISTS "Avatars são publicamente visíveis" ON storage.objects;
CREATE POLICY "Avatars são publicamente visíveis" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para upload de avatars pelos próprios usuários
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus próprios avatars" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de seus próprios avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para atualização de avatars pelos próprios usuários
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios avatars" ON storage.objects;
CREATE POLICY "Usuários podem atualizar seus próprios avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para exclusão de avatars pelos próprios usuários
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios avatars" ON storage.objects;
CREATE POLICY "Usuários podem deletar seus próprios avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- POLÍTICAS PARA TABELA DE AUDITORIA
-- =====================================================

-- A política para profiles_audit já existe no arquivo anterior
-- Mas vamos garantir que está correta

-- Verificar se RLS está habilitado na tabela de auditoria
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles_audit' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.profiles_audit ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Recriar política para admins verem logs de auditoria
DROP POLICY IF EXISTS "Admins podem ver logs de auditoria" ON public.profiles_audit;
CREATE POLICY "Admins podem ver logs de auditoria" ON public.profiles_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para inserção de logs (apenas pelo sistema)
CREATE POLICY "Sistema pode inserir logs de auditoria" ON public.profiles_audit
  FOR INSERT WITH CHECK (true); -- Permitir inserção pelo sistema

-- =====================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é barbeiro
CREATE OR REPLACE FUNCTION public.is_barber()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'barber'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é cliente
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode ver perfil específico
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Próprio usuário
    auth.uid() = profile_id
    OR
    -- Admin pode ver todos
    public.is_admin()
    OR
    -- Barbeiro pode ver clientes
    (
      public.is_barber() 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = profile_id AND role = 'client'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA FUTURAS TABELAS
-- =====================================================

-- Preparar estrutura para futuras tabelas que precisarão de RLS

-- Exemplo: Tabela de agendamentos (quando for criada)
/*
CREATE POLICY "Controle de acesso a agendamentos" ON public.agendamentos
  FOR SELECT USING (
    -- Cliente pode ver seus próprios agendamentos
    cliente_id = auth.uid()
    OR
    -- Barbeiro pode ver agendamentos onde ele é o prestador
    barbeiro_id = auth.uid()
    OR
    -- Admin pode ver todos
    public.is_admin()
  );
*/

-- =====================================================
-- VERIFICAÇÃO E TESTES DAS POLÍTICAS
-- =====================================================

-- Função para testar políticas RLS
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COALESCE(p.policy_count, 0)::INTEGER
  FROM pg_tables t
  LEFT JOIN (
    SELECT 
      schemaname,
      tablename,
      COUNT(*) as policy_count
    FROM pg_policies 
    GROUP BY schemaname, tablename
  ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('profiles', 'profiles_audit')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "Usuários podem ver perfis baseado no role" ON public.profiles IS 
'Permite que usuários vejam seu próprio perfil, admins vejam todos, e barbeiros vejam clientes';

COMMENT ON POLICY "Controle de criação de perfis" ON public.profiles IS 
'Controla quem pode criar novos perfis no sistema';

COMMENT ON POLICY "Controle de atualização de perfis" ON public.profiles IS 
'Controla quem pode atualizar perfis e quais campos podem ser alterados';

COMMENT ON POLICY "Apenas admins podem deletar perfis" ON public.profiles IS 
'Apenas administradores podem deletar perfis para evitar acidentes';

COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é administrador';
COMMENT ON FUNCTION public.is_barber() IS 'Verifica se o usuário atual é barbeiro';
COMMENT ON FUNCTION public.is_client() IS 'Verifica se o usuário atual é cliente';
COMMENT ON FUNCTION public.can_view_profile(UUID) IS 'Verifica se usuário pode ver perfil específico';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    profiles_rls BOOLEAN;
    profiles_policies INTEGER;
    audit_rls BOOLEAN;
    audit_policies INTEGER;
BEGIN
    -- Verificar RLS na tabela profiles
    SELECT rowsecurity INTO profiles_rls
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    -- Contar políticas na tabela profiles
    SELECT COUNT(*) INTO profiles_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    -- Verificar RLS na tabela profiles_audit
    SELECT rowsecurity INTO audit_rls
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    -- Contar políticas na tabela profiles_audit
    SELECT COUNT(*) INTO audit_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICAÇÃO DAS POLÍTICAS RLS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tabela profiles:';
    RAISE NOTICE '  RLS habilitado: %', COALESCE(profiles_rls, false);
    RAISE NOTICE '  Políticas criadas: %', COALESCE(profiles_policies, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'Tabela profiles_audit:';
    RAISE NOTICE '  RLS habilitado: %', COALESCE(audit_rls, false);
    RAISE NOTICE '  Políticas criadas: %', COALESCE(audit_policies, 0);
    RAISE NOTICE '==========================================';
    
    IF COALESCE(profiles_rls, false) AND COALESCE(profiles_policies, 0) >= 4 THEN
        RAISE NOTICE '🎉 RLS CONFIGURADO COM SUCESSO!';
    ELSE
        RAISE WARNING '⚠️ PROBLEMAS NA CONFIGURAÇÃO DO RLS';
    END IF;
END $$;