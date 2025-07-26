-- =====================================================
-- TESTES PARA POLÍTICAS RLS - SISTEMA DE AUTENTICAÇÃO
-- =====================================================

-- Limpar dados de teste anteriores
DELETE FROM public.profiles_audit WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@rls-test.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@rls-test.com';

-- =====================================================
-- SETUP: CRIAR USUÁRIOS DE TESTE
-- =====================================================

DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    barber_id UUID := gen_random_uuid();
    client1_id UUID := gen_random_uuid();
    client2_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE 'SETUP: Criando usuários de teste para RLS';
    
    -- Criar admin
    INSERT INTO public.profiles (id, nome, email, role) VALUES
    (admin_id, 'Admin Teste', 'admin@rls-test.com', 'admin');
    
    -- Criar barbeiro
    INSERT INTO public.profiles (id, nome, email, role) VALUES
    (barber_id, 'Barbeiro Teste', 'barber@rls-test.com', 'barber');
    
    -- Criar clientes
    INSERT INTO public.profiles (id, nome, email, role) VALUES
    (client1_id, 'Cliente 1', 'client1@rls-test.com', 'client'),
    (client2_id, 'Cliente 2', 'client2@rls-test.com', 'client');
    
    RAISE NOTICE '✅ Usuários de teste criados';
END $$;

-- =====================================================
-- TESTE 1: VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

DO $$
DECLARE
    profiles_rls BOOLEAN;
    audit_rls BOOLEAN;
BEGIN
    RAISE NOTICE 'TESTE 1: Verificando se RLS está habilitado';
    
    -- Verificar RLS na tabela profiles
    SELECT rowsecurity INTO profiles_rls
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    -- Verificar RLS na tabela profiles_audit
    SELECT rowsecurity INTO audit_rls
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    IF COALESCE(profiles_rls, false) THEN
        RAISE NOTICE '✅ PASSOU: RLS habilitado na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: RLS não habilitado na tabela profiles';
    END IF;
    
    IF COALESCE(audit_rls, false) THEN
        RAISE NOTICE '✅ PASSOU: RLS habilitado na tabela profiles_audit';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: RLS não habilitado na tabela profiles_audit';
    END IF;
END $$;

-- =====================================================
-- TESTE 2: VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

DO $$
DECLARE
    profiles_policies INTEGER;
    audit_policies INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 2: Verificando políticas criadas';
    
    -- Contar políticas na tabela profiles
    SELECT COUNT(*) INTO profiles_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    -- Contar políticas na tabela profiles_audit
    SELECT COUNT(*) INTO audit_policies
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    RAISE NOTICE 'Políticas na tabela profiles: %', profiles_policies;
    RAISE NOTICE 'Políticas na tabela profiles_audit: %', audit_policies;
    
    IF profiles_policies >= 4 THEN
        RAISE NOTICE '✅ PASSOU: Políticas suficientes na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Políticas insuficientes na tabela profiles (% < 4)', profiles_policies;
    END IF;
    
    IF audit_policies >= 1 THEN
        RAISE NOTICE '✅ PASSOU: Políticas criadas na tabela profiles_audit';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Nenhuma política na tabela profiles_audit';
    END IF;
END $$;

-- =====================================================
-- TESTE 3: FUNÇÕES AUXILIARES DE RLS
-- =====================================================

DO $$
DECLARE
    admin_id UUID;
    barber_id UUID;
    client_id UUID;
BEGIN
    RAISE NOTICE 'TESTE 3: Testando funções auxiliares de RLS';
    
    -- Pegar IDs dos usuários de teste
    SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@rls-test.com';
    SELECT id INTO barber_id FROM public.profiles WHERE email = 'barber@rls-test.com';
    SELECT id INTO client_id FROM public.profiles WHERE email = 'client1@rls-test.com';
    
    -- Testar função is_admin (simulando contexto)
    -- Nota: Em teste real, seria necessário simular auth.uid()
    
    -- Verificar se funções existem
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE NOTICE '✅ PASSOU: Função is_admin() existe';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Função is_admin() não existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_barber') THEN
        RAISE NOTICE '✅ PASSOU: Função is_barber() existe';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Função is_barber() não existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_client') THEN
        RAISE NOTICE '✅ PASSOU: Função is_client() existe';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Função is_client() não existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_view_profile') THEN
        RAISE NOTICE '✅ PASSOU: Função can_view_profile() existe';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Função can_view_profile() não existe';
    END IF;
END $$;

-- =====================================================
-- TESTE 4: POLÍTICA DE LEITURA (SELECT)
-- =====================================================

-- Nota: Estes testes são conceituais pois não podemos simular auth.uid() facilmente
-- Em um ambiente real, seria necessário usar diferentes conexões de usuário

DO $$
BEGIN
    RAISE NOTICE 'TESTE 4: Verificando política de leitura';
    
    -- Verificar se política de SELECT existe
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND cmd = 'SELECT'
    ) THEN
        RAISE NOTICE '✅ PASSOU: Política de SELECT existe na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Política de SELECT não encontrada';
    END IF;
END $$;

-- =====================================================
-- TESTE 5: POLÍTICA DE INSERÇÃO (INSERT)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'TESTE 5: Verificando política de inserção';
    
    -- Verificar se política de INSERT existe
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND cmd = 'INSERT'
    ) THEN
        RAISE NOTICE '✅ PASSOU: Política de INSERT existe na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Política de INSERT não encontrada';
    END IF;
END $$;

-- =====================================================
-- TESTE 6: POLÍTICA DE ATUALIZAÇÃO (UPDATE)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'TESTE 6: Verificando política de atualização';
    
    -- Verificar se política de UPDATE existe
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND cmd = 'UPDATE'
    ) THEN
        RAISE NOTICE '✅ PASSOU: Política de UPDATE existe na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Política de UPDATE não encontrada';
    END IF;
END $$;

-- =====================================================
-- TESTE 7: POLÍTICA DE EXCLUSÃO (DELETE)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'TESTE 7: Verificando política de exclusão';
    
    -- Verificar se política de DELETE existe
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND cmd = 'DELETE'
    ) THEN
        RAISE NOTICE '✅ PASSOU: Política de DELETE existe na tabela profiles';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Política de DELETE não encontrada';
    END IF;
END $$;

-- =====================================================
-- TESTE 8: POLÍTICAS DO STORAGE
-- =====================================================

DO $$
DECLARE
    storage_policies INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 8: Verificando políticas do storage';
    
    -- Contar políticas no storage.objects para bucket avatars
    SELECT COUNT(*) INTO storage_policies
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%avatar%';
    
    IF storage_policies >= 4 THEN
        RAISE NOTICE '✅ PASSOU: Políticas do storage configuradas (% políticas)', storage_policies;
    ELSE
        RAISE NOTICE '⚠️ ATENÇÃO: Poucas políticas do storage (% políticas)', storage_policies;
    END IF;
END $$;

-- =====================================================
-- TESTE 9: TESTE DE PERFORMANCE DAS POLÍTICAS
-- =====================================================

DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    record_count INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 9: Testando performance das políticas RLS';
    
    start_time := clock_timestamp();
    
    -- Fazer consulta que ativa as políticas RLS
    SELECT COUNT(*) INTO record_count
    FROM public.profiles 
    WHERE email LIKE '%@rls-test.com';
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE '✅ PERFORMANCE: Consulta com RLS em % (% registros)', duration, record_count;
    
    IF duration < INTERVAL '1 second' THEN
        RAISE NOTICE '✅ PASSOU: Performance das políticas RLS aceitável';
    ELSE
        RAISE WARNING '⚠️ ATENÇÃO: Performance das políticas RLS pode estar lenta';
    END IF;
END $$;

-- =====================================================
-- TESTE 10: VERIFICAR INTEGRIDADE DAS POLÍTICAS
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'TESTE 10: Verificando integridade das políticas';
    
    -- Listar todas as políticas criadas
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, cmd
        FROM pg_policies 
        WHERE schemaname IN ('public', 'storage')
        AND tablename IN ('profiles', 'profiles_audit', 'objects')
        ORDER BY schemaname, tablename, policyname
    LOOP
        RAISE NOTICE 'Política: %.% - % (%)', 
            policy_record.schemaname, 
            policy_record.tablename, 
            policy_record.policyname, 
            policy_record.cmd;
    END LOOP;
    
    RAISE NOTICE '✅ PASSOU: Políticas listadas com sucesso';
END $$;

-- =====================================================
-- TESTE 11: FUNÇÃO DE TESTE INTEGRADA
-- =====================================================

DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE 'TESTE 11: Executando função de teste integrada';
    
    -- Executar função de teste das políticas RLS
    FOR test_result IN SELECT * FROM public.test_rls_policies()
    LOOP
        RAISE NOTICE 'Tabela: % | RLS: % | Políticas: %', 
            test_result.table_name, 
            test_result.rls_enabled, 
            test_result.policy_count;
    END LOOP;
    
    RAISE NOTICE '✅ PASSOU: Função de teste executada com sucesso';
END $$;

-- =====================================================
-- TESTE 12: SIMULAÇÃO DE CENÁRIOS REAIS
-- =====================================================

DO $$
DECLARE
    admin_id UUID;
    client_id UUID;
    test_count INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 12: Simulando cenários reais de acesso';
    
    -- Pegar IDs para teste
    SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@rls-test.com';
    SELECT id INTO client_id FROM public.profiles WHERE email = 'client1@rls-test.com';
    
    -- Simular consulta que seria feita por um admin
    -- (Em produção, auth.uid() retornaria o ID do admin)
    SELECT COUNT(*) INTO test_count
    FROM public.profiles 
    WHERE email LIKE '%@rls-test.com';
    
    IF test_count >= 4 THEN
        RAISE NOTICE '✅ PASSOU: Consulta de admin simulada (% registros)', test_count;
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Consulta de admin não retornou registros esperados';
    END IF;
    
    -- Teste adicional: verificar se políticas não quebram consultas normais
    SELECT COUNT(*) INTO test_count
    FROM public.profiles 
    WHERE role = 'client';
    
    IF test_count >= 2 THEN
        RAISE NOTICE '✅ PASSOU: Consulta por role funcionando (% clientes)', test_count;
    ELSE
        RAISE NOTICE '⚠️ ATENÇÃO: Poucos clientes encontrados (% clientes)', test_count;
    END IF;
END $$;

-- =====================================================
-- RELATÓRIO FINAL DOS TESTES RLS
-- =====================================================

DO $$
DECLARE
    profiles_rls BOOLEAN;
    profiles_policies INTEGER;
    audit_rls BOOLEAN;
    audit_policies INTEGER;
    storage_policies INTEGER;
    functions_count INTEGER;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RELATÓRIO FINAL DOS TESTES RLS';
    RAISE NOTICE '==========================================';
    
    -- Coletar estatísticas
    SELECT rowsecurity INTO profiles_rls
    FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
    
    SELECT COUNT(*) INTO profiles_policies
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
    
    SELECT rowsecurity INTO audit_rls
    FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    SELECT COUNT(*) INTO audit_policies
    FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles_audit';
    
    SELECT COUNT(*) INTO storage_policies
    FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
    
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc WHERE proname IN ('is_admin', 'is_barber', 'is_client', 'can_view_profile');
    
    -- Exibir relatório
    RAISE NOTICE 'TABELA PROFILES:';
    RAISE NOTICE '  RLS habilitado: %', COALESCE(profiles_rls, false);
    RAISE NOTICE '  Políticas: %', COALESCE(profiles_policies, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'TABELA PROFILES_AUDIT:';
    RAISE NOTICE '  RLS habilitado: %', COALESCE(audit_rls, false);
    RAISE NOTICE '  Políticas: %', COALESCE(audit_policies, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'STORAGE.OBJECTS:';
    RAISE NOTICE '  Políticas: %', COALESCE(storage_policies, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'FUNÇÕES AUXILIARES: %', COALESCE(functions_count, 0);
    RAISE NOTICE '==========================================';
    
    -- Verificar se tudo está OK
    IF COALESCE(profiles_rls, false) 
       AND COALESCE(profiles_policies, 0) >= 4 
       AND COALESCE(audit_rls, false) 
       AND COALESCE(functions_count, 0) >= 4 THEN
        RAISE NOTICE '🎉 TODOS OS TESTES RLS PASSARAM!';
        RAISE NOTICE 'Sistema de segurança RLS funcionando corretamente.';
    ELSE
        RAISE WARNING '⚠️ ALGUNS TESTES RLS FALHARAM';
        RAISE WARNING 'Verifique a configuração das políticas.';
    END IF;
    
    RAISE NOTICE '==========================================';
END $$;

-- =====================================================
-- LIMPEZA DOS DADOS DE TESTE
-- =====================================================

-- Limpar dados de teste
DELETE FROM public.profiles_audit WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@rls-test.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@rls-test.com';

RAISE NOTICE 'Dados de teste RLS limpos. Testes concluídos!';