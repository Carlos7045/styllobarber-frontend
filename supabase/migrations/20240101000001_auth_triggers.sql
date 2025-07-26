-- =====================================================
-- TRIGGERS PARA SISTEMA DE AUTENTICAÇÃO - STYLLOBARBER
-- =====================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGER 1: CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nome,
    email,
    telefone,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para criação automática de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER 2: ATUALIZAÇÃO DE TIMESTAMPS
-- =====================================================

-- Trigger para atualizar updated_at na tabela profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER 3: SINCRONIZAÇÃO COM AUTH.USERS
-- =====================================================

-- Função para sincronizar mudanças de email com auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar email no auth.users se mudou
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE auth.users 
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar email
DROP TRIGGER IF EXISTS sync_profiles_email ON public.profiles;
CREATE TRIGGER sync_profiles_email
  AFTER UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- =====================================================
-- TRIGGER 4: LIMPEZA DE DADOS RELACIONADOS
-- =====================================================

-- Função para limpar dados relacionados quando usuário é deletado
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar avatar do storage se existir
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != '' THEN
    -- Extrair path do avatar da URL
    DECLARE
      avatar_path TEXT;
    BEGIN
      avatar_path := regexp_replace(OLD.avatar_url, '^.*/storage/v1/object/public/avatars/', '');
      
      -- Deletar arquivo do storage
      DELETE FROM storage.objects 
      WHERE bucket_id = 'avatars' 
      AND name = avatar_path;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erros de deleção do storage
      NULL;
    END;
  END IF;

  -- Aqui podemos adicionar limpeza de outras tabelas relacionadas
  -- Por exemplo: agendamentos, histórico, etc.
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpeza de dados relacionados
DROP TRIGGER IF EXISTS cleanup_user_data ON public.profiles;
CREATE TRIGGER cleanup_user_data
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- =====================================================
-- TRIGGER 5: VALIDAÇÃO DE DADOS
-- =====================================================

-- Função para validar dados antes de inserir/atualizar
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email é obrigatório';
  END IF;
  
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;

  -- Validar nome
  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;

  -- Validar role
  IF NEW.role NOT IN ('admin', 'barber', 'client') THEN
    RAISE EXCEPTION 'Role deve ser admin, barber ou client';
  END IF;

  -- Validar telefone se fornecido
  IF NEW.telefone IS NOT NULL AND NEW.telefone != '' THEN
    IF NEW.telefone !~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$' THEN
      RAISE EXCEPTION 'Formato de telefone inválido. Use: (XX) XXXXX-XXXX';
    END IF;
  END IF;

  -- Limpar campos vazios
  IF NEW.telefone = '' THEN NEW.telefone := NULL; END IF;
  IF NEW.avatar_url = '' THEN NEW.avatar_url := NULL; END IF;
  IF NEW.data_nascimento = '' THEN NEW.data_nascimento := NULL; END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação de dados
DROP TRIGGER IF EXISTS validate_profile_data ON public.profiles;
CREATE TRIGGER validate_profile_data
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- =====================================================
-- TRIGGER 6: LOG DE AUDITORIA (OPCIONAL)
-- =====================================================

-- Criar tabela de auditoria para profiles
CREATE TABLE IF NOT EXISTS public.profiles_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.profiles_audit ENABLE ROW LEVEL SECURITY;

-- Política para admins verem logs de auditoria
CREATE POLICY "Admins podem ver logs de auditoria" ON public.profiles_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Função para log de auditoria
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.profiles_audit (
      profile_id, action, old_data, changed_by
    ) VALUES (
      OLD.id, 'DELETE', to_jsonb(OLD), auth.uid()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.profiles_audit (
      profile_id, action, old_data, new_data, changed_by
    ) VALUES (
      NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles_audit (
      profile_id, action, new_data, changed_by
    ) VALUES (
      NEW.id, 'INSERT', to_jsonb(NEW), auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profile_changes();

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil quando um novo usuário é registrado no auth.users';
COMMENT ON FUNCTION public.sync_user_email() IS 'Sincroniza mudanças de email entre profiles e auth.users';
COMMENT ON FUNCTION public.handle_user_delete() IS 'Limpa dados relacionados quando um usuário é deletado';
COMMENT ON FUNCTION public.validate_profile_data() IS 'Valida dados do perfil antes de inserir/atualizar';
COMMENT ON FUNCTION public.audit_profile_changes() IS 'Registra mudanças nos perfis para auditoria';
COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at';

COMMENT ON TABLE public.profiles_audit IS 'Log de auditoria para mudanças nos perfis de usuário';
COMMENT ON COLUMN public.profiles_audit.action IS 'Tipo de ação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN public.profiles_audit.old_data IS 'Dados antes da mudança (para UPDATE e DELETE)';
COMMENT ON COLUMN public.profiles_audit.new_data IS 'Dados após a mudança (para INSERT e UPDATE)';
COMMENT ON COLUMN public.profiles_audit.changed_by IS 'ID do usuário que fez a mudança';

-- =====================================================
-- VERIFICAÇÃO DOS TRIGGERS
-- =====================================================

-- Verificar se todos os triggers foram criados
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
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
    
    RAISE NOTICE 'Triggers criados: % de 6', trigger_count;
    
    IF trigger_count < 6 THEN
        RAISE WARNING 'Nem todos os triggers foram criados corretamente';
    ELSE
        RAISE NOTICE 'Todos os triggers foram criados com sucesso!';
    END IF;
END $$;