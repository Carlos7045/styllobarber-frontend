# Triggers do Supabase - Sistema de Autenticação

## Visão Geral

Este documento descreve todos os triggers implementados no sistema de autenticação do StylloBarber. Os triggers automatizam operações importantes e garantem a integridade dos dados.

## Triggers Implementados

### 1. 🆕 **Criação Automática de Perfil** (`handle_new_user`)

**Trigger:** `on_auth_user_created`  
**Tabela:** `auth.users`  
**Evento:** `AFTER INSERT`

**Funcionalidade:**
- Cria automaticamente um perfil na tabela `profiles` quando um usuário é registrado
- Extrai dados do `raw_user_meta_data` (nome, telefone, role)
- Define role padrão como 'client' se não especificado
- Usa parte do email como nome se não fornecido

**Exemplo de uso:**
```sql
-- Quando um usuário se registra, o perfil é criado automaticamente
INSERT INTO auth.users (email, raw_user_meta_data) 
VALUES ('joao@example.com', '{"nome": "João Silva", "telefone": "(11) 99999-9999"}');
-- Perfil criado automaticamente na tabela profiles
```

### 2. ⏰ **Atualização de Timestamps** (`update_updated_at_column`)

**Trigger:** `update_profiles_updated_at`  
**Tabela:** `public.profiles`  
**Evento:** `BEFORE UPDATE`

**Funcionalidade:**
- Atualiza automaticamente o campo `updated_at` sempre que um registro é modificado
- Garante rastreamento preciso de quando os dados foram alterados
- Funciona para qualquer campo da tabela

**Exemplo de uso:**
```sql
-- Ao atualizar qualquer campo, updated_at é automaticamente atualizado
UPDATE profiles SET nome = 'João Santos' WHERE id = 'user-id';
-- updated_at será automaticamente definido para CURRENT_TIMESTAMP
```

### 3. 🔄 **Sincronização com Auth.Users** (`sync_user_email`)

**Trigger:** `sync_profiles_email`  
**Tabela:** `public.profiles`  
**Evento:** `AFTER UPDATE OF email`

**Funcionalidade:**
- Sincroniza mudanças de email entre `profiles` e `auth.users`
- Mantém consistência entre as duas tabelas
- Atualiza automaticamente o timestamp no `auth.users`

**Exemplo de uso:**
```sql
-- Ao alterar email no profiles, auth.users é automaticamente atualizado
UPDATE profiles SET email = 'novo@example.com' WHERE id = 'user-id';
-- Email também será atualizado em auth.users
```

### 4. 🧹 **Limpeza de Dados Relacionados** (`handle_user_delete`)

**Trigger:** `cleanup_user_data`  
**Tabela:** `public.profiles`  
**Evento:** `BEFORE DELETE`

**Funcionalidade:**
- Remove avatar do Supabase Storage quando usuário é deletado
- Extrai path do avatar da URL e remove o arquivo
- Preparado para limpar outros dados relacionados (agendamentos, etc.)
- Falha graciosamente se não conseguir deletar arquivos

**Exemplo de uso:**
```sql
-- Ao deletar usuário, avatar é automaticamente removido do storage
DELETE FROM profiles WHERE id = 'user-id';
-- Avatar será removido do bucket 'avatars'
```

### 5. ✅ **Validação de Dados** (`validate_profile_data`)

**Trigger:** `validate_profile_data`  
**Tabela:** `public.profiles`  
**Evento:** `BEFORE INSERT OR UPDATE`

**Funcionalidade:**
- Valida formato de email
- Verifica se nome tem pelo menos 2 caracteres
- Valida role (deve ser 'admin', 'barber' ou 'client')
- Valida formato de telefone brasileiro
- Limpa campos vazios (converte string vazia para NULL)

**Validações implementadas:**
```sql
-- Email obrigatório e formato válido
-- Nome mínimo 2 caracteres
-- Role deve ser: admin, barber, client
-- Telefone formato: (XX) XXXXX-XXXX
-- Campos vazios convertidos para NULL
```

### 6. 📋 **Log de Auditoria** (`audit_profile_changes`)

**Trigger:** `audit_profiles`  
**Tabela:** `public.profiles`  
**Evento:** `AFTER INSERT OR UPDATE OR DELETE`

**Funcionalidade:**
- Registra todas as mudanças nos perfis de usuário
- Armazena dados antes e depois da mudança
- Registra quem fez a alteração e quando
- Permite rastreamento completo de mudanças

**Tabela de auditoria:**
```sql
CREATE TABLE profiles_audit (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,       -- Dados antes da mudança
  new_data JSONB,       -- Dados após a mudança
  changed_by UUID,      -- Quem fez a mudança
  changed_at TIMESTAMP  -- Quando foi feita
);
```

## Como Aplicar os Triggers

### 1. Via Supabase CLI

```bash
# Aplicar migration
supabase db push

# Ou aplicar arquivo específico
supabase db push --file supabase/migrations/20240101000001_auth_triggers.sql
```

### 2. Via Dashboard do Supabase

1. Acesse o SQL Editor no dashboard
2. Cole o conteúdo do arquivo `20240101000001_auth_triggers.sql`
3. Execute o script

### 3. Verificação

Após aplicar, execute para verificar:

```sql
-- Verificar triggers criados
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%handle%' OR routine_name LIKE '%sync%' OR routine_name LIKE '%audit%';
```

## Testando os Triggers

### Teste 1: Criação Automática de Perfil

```sql
-- Simular registro de usuário (normalmente feito via Supabase Auth)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'teste@example.com',
  '{"nome": "Usuário Teste", "telefone": "(11) 99999-9999", "role": "client"}'
);

-- Verificar se perfil foi criado
SELECT * FROM profiles WHERE email = 'teste@example.com';
```

### Teste 2: Atualização de Timestamp

```sql
-- Atualizar perfil
UPDATE profiles SET nome = 'Nome Atualizado' WHERE email = 'teste@example.com';

-- Verificar se updated_at foi atualizado
SELECT nome, created_at, updated_at FROM profiles WHERE email = 'teste@example.com';
```

### Teste 3: Validação de Dados

```sql
-- Tentar inserir dados inválidos (deve falhar)
INSERT INTO profiles (id, nome, email, role)
VALUES (gen_random_uuid(), 'A', 'email-inválido', 'role-inválido');
-- Deve retornar erro de validação
```

### Teste 4: Log de Auditoria

```sql
-- Fazer uma alteração
UPDATE profiles SET role = 'barber' WHERE email = 'teste@example.com';

-- Verificar log de auditoria
SELECT * FROM profiles_audit ORDER BY changed_at DESC LIMIT 5;
```

## Monitoramento e Manutenção

### Verificar Performance

```sql
-- Verificar triggers ativos
SELECT * FROM pg_stat_user_functions 
WHERE schemaname = 'public' 
AND funcname LIKE '%handle%' OR funcname LIKE '%sync%';
```

### Limpeza de Logs Antigos

```sql
-- Limpar logs de auditoria mais antigos que 1 ano
DELETE FROM profiles_audit 
WHERE changed_at < NOW() - INTERVAL '1 year';
```

### Desabilitar Triggers (se necessário)

```sql
-- Desabilitar trigger específico
ALTER TABLE profiles DISABLE TRIGGER validate_profile_data;

-- Reabilitar trigger
ALTER TABLE profiles ENABLE TRIGGER validate_profile_data;
```

## Troubleshooting

### Problema: Trigger não está funcionando

1. Verificar se o trigger existe:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'nome_do_trigger';
```

2. Verificar se a função existe:
```sql
SELECT * FROM information_schema.routines WHERE routine_name = 'nome_da_funcao';
```

3. Verificar logs de erro:
```sql
-- No Supabase, verificar logs na aba Logs do dashboard
```

### Problema: Validação muito restritiva

1. Ajustar função de validação:
```sql
-- Modificar a função validate_profile_data conforme necessário
CREATE OR REPLACE FUNCTION public.validate_profile_data()
-- ... ajustar validações
```

### Problema: Performance lenta

1. Verificar se triggers estão causando lentidão:
```sql
-- Analisar performance das funções
SELECT * FROM pg_stat_user_functions WHERE schemaname = 'public';
```

2. Otimizar funções se necessário
3. Considerar desabilitar auditoria em tabelas com muitas escritas

## Segurança

- Todas as funções usam `SECURITY DEFINER` quando necessário
- Logs de auditoria têm RLS habilitado
- Apenas admins podem ver logs de auditoria
- Validações impedem inserção de dados inválidos

## Backup e Restore

Os triggers são incluídos automaticamente nos backups do Supabase. Para restore manual:

1. Aplicar primeiro as tabelas
2. Aplicar os triggers
3. Testar funcionamento

## Versionamento

- Versão atual: 1.0
- Arquivo: `20240101000001_auth_triggers.sql`
- Próximas versões devem usar timestamps incrementais