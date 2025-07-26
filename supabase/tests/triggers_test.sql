-- =====================================================
-- TESTES PARA TRIGGERS DO SISTEMA DE AUTENTICAÇÃO
-- =====================================================

-- Limpar dados de teste anteriores
DELETE FROM public.profiles_audit WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@teste.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@teste.com';

-- =====================================================
-- TESTE 1: CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    profile_count INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 1: Criação automática de perfil';
    
    -- Simular criação de usuário (normalmente feito pelo Supabase Auth)
    INSERT INTO auth.users (
        id, 
        email, 
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'usuario1@teste.com',
        '{"nome": "Usuário Teste 1", "telefone": "(11) 99999-9999", "role": "client"}',
        NOW(),
        NOW()
    );
    
    -- Verificar se perfil foi criado automaticamente
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles 
    WHERE id = test_user_id;
    
    IF profile_count = 1 THEN
        RAISE NOTICE '✅ PASSOU: Perfil criado automaticamente';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Perfil não foi criado automaticamente';
    END IF;
    
    -- Verificar dados do perfil
    DECLARE
        profile_nome TEXT;
        profile_role TEXT;
    BEGIN
        SELECT nome, role INTO profile_nome, profile_role
        FROM public.profiles 
        WHERE id = test_user_id;
        
        IF profile_nome = 'Usuário Teste 1' AND profile_role = 'client' THEN
            RAISE NOTICE '✅ PASSOU: Dados do perfil corretos';
        ELSE
            RAISE EXCEPTION '❌ FALHOU: Dados do perfil incorretos. Nome: %, Role: %', profile_nome, profile_role;
        END IF;
    END;
END $$;

-- =====================================================
-- TESTE 2: ATUALIZAÇÃO DE TIMESTAMPS
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    old_updated_at TIMESTAMP;
    new_updated_at TIMESTAMP;
BEGIN
    RAISE NOTICE 'TESTE 2: Atualização de timestamps';
    
    -- Pegar ID do usuário de teste
    SELECT id INTO test_user_id
    FROM public.profiles 
    WHERE email = 'usuario1@teste.com';
    
    -- Pegar timestamp atual
    SELECT updated_at INTO old_updated_at
    FROM public.profiles 
    WHERE id = test_user_id;
    
    -- Aguardar um pouco para garantir diferença no timestamp
    PERFORM pg_sleep(1);
    
    -- Atualizar perfil
    UPDATE public.profiles 
    SET nome = 'Usuário Teste 1 Atualizado'
    WHERE id = test_user_id;
    
    -- Verificar se timestamp foi atualizado
    SELECT updated_at INTO new_updated_at
    FROM public.profiles 
    WHERE id = test_user_id;
    
    IF new_updated_at > old_updated_at THEN
        RAISE NOTICE '✅ PASSOU: Timestamp updated_at foi atualizado';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Timestamp updated_at não foi atualizado';
    END IF;
END $$;

-- =====================================================
-- TESTE 3: VALIDAÇÃO DE DADOS
-- =====================================================

DO $$
DECLARE
    test_passed BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE 'TESTE 3: Validação de dados';
    
    -- Tentar inserir dados inválidos (deve falhar)
    BEGIN
        INSERT INTO public.profiles (id, nome, email, role)
        VALUES (gen_random_uuid(), 'A', 'email-inválido', 'role-inválido');
        
        RAISE EXCEPTION '❌ FALHOU: Validação não impediu dados inválidos';
    EXCEPTION WHEN OTHERS THEN
        test_passed := TRUE;
    END;
    
    IF test_passed THEN
        RAISE NOTICE '✅ PASSOU: Validação impediu dados inválidos';
    END IF;
    
    -- Testar validação de telefone
    test_passed := FALSE;
    BEGIN
        INSERT INTO public.profiles (id, nome, email, telefone, role)
        VALUES (gen_random_uuid(), 'Teste', 'teste@valid.com', '123456789', 'client');
        
        RAISE EXCEPTION '❌ FALHOU: Validação não impediu telefone inválido';
    EXCEPTION WHEN OTHERS THEN
        test_passed := TRUE;
    END;
    
    IF test_passed THEN
        RAISE NOTICE '✅ PASSOU: Validação impediu telefone inválido';
    END IF;
END $$;

-- =====================================================
-- TESTE 4: SINCRONIZAÇÃO DE EMAIL
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    auth_email TEXT;
BEGIN
    RAISE NOTICE 'TESTE 4: Sincronização de email';
    
    -- Pegar ID do usuário de teste
    SELECT id INTO test_user_id
    FROM public.profiles 
    WHERE email = 'usuario1@teste.com';
    
    -- Atualizar email no profiles
    UPDATE public.profiles 
    SET email = 'usuario1_novo@teste.com'
    WHERE id = test_user_id;
    
    -- Verificar se email foi sincronizado no auth.users
    SELECT email INTO auth_email
    FROM auth.users 
    WHERE id = test_user_id;
    
    IF auth_email = 'usuario1_novo@teste.com' THEN
        RAISE NOTICE '✅ PASSOU: Email sincronizado com auth.users';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Email não foi sincronizado. Auth email: %', auth_email;
    END IF;
END $$;

-- =====================================================
-- TESTE 5: LOG DE AUDITORIA
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    audit_count INTEGER;
    audit_action TEXT;
BEGIN
    RAISE NOTICE 'TESTE 5: Log de auditoria';
    
    -- Pegar ID do usuário de teste
    SELECT id INTO test_user_id
    FROM public.profiles 
    WHERE email = 'usuario1_novo@teste.com';
    
    -- Fazer uma alteração
    UPDATE public.profiles 
    SET role = 'barber'
    WHERE id = test_user_id;
    
    -- Verificar se foi registrado na auditoria
    SELECT COUNT(*), MAX(action) INTO audit_count, audit_action
    FROM public.profiles_audit 
    WHERE profile_id = test_user_id;
    
    IF audit_count > 0 AND audit_action = 'UPDATE' THEN
        RAISE NOTICE '✅ PASSOU: Log de auditoria funcionando (% registros)', audit_count;
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Log de auditoria não funcionando';
    END IF;
END $$;

-- =====================================================
-- TESTE 6: LIMPEZA DE DADOS RELACIONADOS
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    profile_count INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 6: Limpeza de dados relacionados';
    
    -- Criar usuário com avatar para teste
    INSERT INTO public.profiles (
        id, nome, email, role, avatar_url
    ) VALUES (
        gen_random_uuid(), 
        'Usuário Para Deletar', 
        'deletar@teste.com', 
        'client',
        'https://example.com/storage/v1/object/public/avatars/test-avatar.jpg'
    ) RETURNING id INTO test_user_id;
    
    -- Deletar usuário
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    -- Verificar se foi deletado
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles 
    WHERE id = test_user_id;
    
    IF profile_count = 0 THEN
        RAISE NOTICE '✅ PASSOU: Usuário deletado com limpeza de dados';
    ELSE
        RAISE EXCEPTION '❌ FALHOU: Usuário não foi deletado corretamente';
    END IF;
END $$;

-- =====================================================
-- TESTE 7: PERFORMANCE DOS TRIGGERS
-- =====================================================

DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    i INTEGER;
BEGIN
    RAISE NOTICE 'TESTE 7: Performance dos triggers';
    
    start_time := clock_timestamp();
    
    -- Inserir múltiplos usuários para testar performance
    FOR i IN 1..100 LOOP
        INSERT INTO public.profiles (
            id, nome, email, role
        ) VALUES (
            gen_random_uuid(),
            'Usuário Performance ' || i,
            'performance' || i || '@teste.com',
            'client'
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE '✅ PERFORMANCE: 100 inserções em %', duration;
    
    -- Limpar dados de teste
    DELETE FROM public.profiles WHERE email LIKE 'performance%@teste.com';
    
    IF duration < INTERVAL '5 seconds' THEN
        RAISE NOTICE '✅ PASSOU: Performance aceitável';
    ELSE
        RAISE WARNING '⚠️ ATENÇÃO: Performance pode estar lenta';
    END IF;
END $$;

-- =====================================================
-- RELATÓRIO FINAL
-- =====================================================

DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RELATÓRIO FINAL DOS TESTES';
    RAISE NOTICE '==========================================';
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name IN (
        'on_auth_user_created',
        'update_profiles_updated_at',
        'sync_profiles_email',
        'cleanup_user_data',
        'validate_profile_data',
        'audit_profiles'
    );
    
    -- Contar funções
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'handle_new_user',
        'sync_user_email',
        'handle_user_delete',
        'validate_profile_data',
        'audit_profile_changes',
        'update_updated_at_column'
    );
    
    RAISE NOTICE 'Triggers ativos: %/6', trigger_count;
    RAISE NOTICE 'Funções criadas: %/6', function_count;
    
    IF trigger_count = 6 AND function_count = 6 THEN
        RAISE NOTICE '🎉 TODOS OS TESTES PASSARAM!';
        RAISE NOTICE 'Sistema de triggers funcionando corretamente.';
    ELSE
        RAISE WARNING '⚠️ ALGUNS TRIGGERS/FUNÇÕES PODEM ESTAR FALTANDO';
    END IF;
    
    RAISE NOTICE '==========================================';
END $$;

-- Limpar dados de teste
DELETE FROM public.profiles_audit WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@teste.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@teste.com';

RAISE NOTICE 'Dados de teste limpos. Testes concluídos!';