# Supabase Database - StylloBarber

Este diretório contém todas as configurações, migrations e testes relacionados ao banco de dados Supabase.

## 📁 Estrutura

```
supabase/
├── migrations/           # Migrations do banco de dados
│   └── 20240101000001_auth_triggers.sql
├── tests/               # Testes automatizados
│   └── triggers_test.sql
└── README.md           # Este arquivo
```

## 🚀 Quick Start

### 1. Instalar Triggers

```bash
# Via script helper
node scripts/setup-triggers.js install

# Via Supabase CLI
supabase db push

# Via Dashboard
# Cole o conteúdo de migrations/20240101000001_auth_triggers.sql no SQL Editor
```

### 2. Testar Triggers

```bash
# Via script helper
node scripts/setup-triggers.js test

# Via Supabase CLI
supabase db push --file supabase/tests/triggers_test.sql
```

### 3. Verificar Status

```bash
# Via script helper
node scripts/setup-triggers.js status
```

## 📋 Migrations

### 20240101000001_auth_triggers.sql

**Triggers implementados:**

1. **`on_auth_user_created`** - Cria perfil automaticamente
2. **`update_profiles_updated_at`** - Atualiza timestamps
3. **`sync_profiles_email`** - Sincroniza email com auth.users
4. **`cleanup_user_data`** - Limpa dados relacionados
5. **`validate_profile_data`** - Valida dados antes de salvar
6. **`audit_profiles`** - Log de auditoria

**Funções criadas:**

- `handle_new_user()` - Criação automática de perfil
- `update_updated_at_column()` - Atualização de timestamps
- `sync_user_email()` - Sincronização de email
- `handle_user_delete()` - Limpeza de dados
- `validate_profile_data()` - Validação de dados
- `audit_profile_changes()` - Log de auditoria

## 🧪 Testes

### triggers_test.sql

Executa 7 testes abrangentes:

1. ✅ **Criação automática de perfil**
2. ✅ **Atualização de timestamps**
3. ✅ **Validação de dados**
4. ✅ **Sincronização de email**
5. ✅ **Log de auditoria**
6. ✅ **Limpeza de dados relacionados**
7. ✅ **Performance dos triggers**

### Como executar

```sql
-- No SQL Editor do Supabase
-- Cole e execute o conteúdo de tests/triggers_test.sql
```

### Resultado esperado

```
TESTE 1: ✅ PASSOU: Perfil criado automaticamente
TESTE 2: ✅ PASSOU: Timestamp updated_at foi atualizado
TESTE 3: ✅ PASSOU: Validação impediu dados inválidos
TESTE 4: ✅ PASSOU: Email sincronizado com auth.users
TESTE 5: ✅ PASSOU: Log de auditoria funcionando
TESTE 6: ✅ PASSOU: Usuário deletado com limpeza de dados
TESTE 7: ✅ PASSOU: Performance aceitável

🎉 TODOS OS TESTES PASSARAM!
```

## 🔧 Configuração

### Pré-requisitos

1. **Supabase CLI** instalado
2. **Projeto Supabase** configurado
3. **Tabela profiles** criada
4. **Bucket avatars** configurado (para limpeza de arquivos)

### Variáveis de ambiente

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Monitoramento

### Verificar triggers ativos

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

### Verificar performance

```sql
SELECT * FROM pg_stat_user_functions 
WHERE schemaname = 'public' 
AND funcname LIKE '%handle%' OR funcname LIKE '%sync%';
```

### Logs de auditoria

```sql
-- Ver últimas mudanças
SELECT * FROM profiles_audit 
ORDER BY changed_at DESC 
LIMIT 10;

-- Mudanças por usuário
SELECT profile_id, COUNT(*) as changes
FROM profiles_audit 
GROUP BY profile_id 
ORDER BY changes DESC;
```

## 🛠️ Manutenção

### Limpeza de logs antigos

```sql
-- Limpar logs mais antigos que 1 ano
DELETE FROM profiles_audit 
WHERE changed_at < NOW() - INTERVAL '1 year';
```

### Desabilitar trigger temporariamente

```sql
-- Desabilitar
ALTER TABLE profiles DISABLE TRIGGER validate_profile_data;

-- Reabilitar
ALTER TABLE profiles ENABLE TRIGGER validate_profile_data;
```

### Recriar trigger

```sql
-- Dropar trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;

-- Recriar (executar novamente a migration)
```

## 🚨 Troubleshooting

### Problema: Trigger não funciona

1. Verificar se existe:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'nome_do_trigger';
```

2. Verificar função:
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'nome_da_funcao';
```

3. Recriar se necessário

### Problema: Validação muito restritiva

1. Ajustar função `validate_profile_data`
2. Testar com dados reais
3. Aplicar nova versão

### Problema: Performance lenta

1. Analisar queries:
```sql
SELECT * FROM pg_stat_user_functions;
```

2. Otimizar funções
3. Considerar índices adicionais

## 📚 Documentação

- **Completa**: `docs/supabase-triggers.md`
- **Storage**: `docs/supabase-storage-setup.md`
- **Scripts**: `scripts/setup-triggers.js`

## 🔄 Versionamento

- **v1.0**: Triggers básicos de autenticação
- **Próximas versões**: Triggers para agendamentos, notificações, etc.

### Aplicar nova versão

1. Criar nova migration: `20240102000001_new_feature.sql`
2. Testar em ambiente de desenvolvimento
3. Aplicar em produção
4. Executar testes

## 🔐 Segurança

- Todas as funções usam `SECURITY DEFINER` quando necessário
- RLS habilitado em tabelas sensíveis
- Validações impedem dados inválidos
- Logs de auditoria para rastreabilidade

## 📈 Performance

- Triggers otimizados para operações rápidas
- Índices apropriados nas tabelas
- Limpeza automática de dados antigos
- Monitoramento de performance

## 🤝 Contribuição

1. Criar nova migration em `migrations/`
2. Adicionar testes em `tests/`
3. Atualizar documentação
4. Testar completamente
5. Fazer PR

## 📞 Suporte

- **Documentação**: `docs/`
- **Issues**: GitHub Issues
- **Logs**: Supabase Dashboard > Logs