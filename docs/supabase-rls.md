# Row Level Security (RLS) - StylloBarber

## 🔐 Visão Geral

Row Level Security (RLS) é um sistema de segurança que controla o acesso a linhas específicas de uma tabela baseado no usuário autenticado. No StylloBarber, implementamos RLS para garantir que usuários só possam acessar dados apropriados ao seu role.

## 📋 Status das Políticas RLS

### ✅ **Implementado**

- **Tabela `profiles`** - Políticas completas por role
- **Tabela `profiles_audit`** - Acesso restrito a admins
- **Storage `avatars`** - Controle de upload/download por usuário

### 🔄 **Futuro**

- Tabelas de agendamentos
- Tabelas de serviços
- Tabelas de pagamentos

## 🎯 Políticas por Tabela

### **Tabela `profiles`**

#### **1. Política de Leitura (SELECT)**
```sql
"Usuários podem ver perfis baseado no role"
```

**Regras:**
- ✅ Usuário pode ver seu próprio perfil
- ✅ Admins podem ver todos os perfis
- ✅ Barbeiros podem ver perfis de clientes
- ❌ Clientes não podem ver outros perfis

#### **2. Política de Inserção (INSERT)**
```sql
"Controle de criação de perfis"
```

**Regras:**
- ✅ Usuário pode criar apenas seu próprio perfil (via trigger)
- ✅ Admins podem criar perfis para outros usuários
- ❌ Usuários não podem criar perfis para outros

#### **3. Política de Atualização (UPDATE)**
```sql
"Controle de atualização de perfis"
```

**Regras:**
- ✅ Usuário pode atualizar seu próprio perfil
- ✅ Admins podem atualizar qualquer perfil
- ❌ Usuários não podem alterar seu próprio role
- ❌ Barbeiros não podem alterar perfis de clientes

#### **4. Política de Exclusão (DELETE)**
```sql
"Apenas admins podem deletar perfis"
```

**Regras:**
- ✅ Apenas admins podem deletar perfis
- ❌ Usuários não podem deletar seu próprio perfil
- ❌ Barbeiros não podem deletar perfis

### **Tabela `profiles_audit`**

#### **1. Política de Leitura (SELECT)**
```sql
"Admins podem ver logs de auditoria"
```

**Regras:**
- ✅ Apenas admins podem ver logs de auditoria
- ❌ Outros usuários não têm acesso aos logs

#### **2. Política de Inserção (INSERT)**
```sql
"Sistema pode inserir logs de auditoria"
```

**Regras:**
- ✅ Sistema pode inserir logs automaticamente
- ❌ Usuários não podem inserir logs manualmente

### **Storage `avatars`**

#### **1. Visualização Pública**
```sql
"Avatars são publicamente visíveis"
```

**Regras:**
- ✅ Qualquer pessoa pode ver avatars
- ✅ Não requer autenticação para visualizar

#### **2. Upload de Avatars**
```sql
"Usuários podem fazer upload de seus próprios avatars"
```

**Regras:**
- ✅ Usuário pode fazer upload apenas do seu avatar
- ❌ Não pode fazer upload de avatars de outros

#### **3. Atualização de Avatars**
```sql
"Usuários podem atualizar seus próprios avatars"
```

**Regras:**
- ✅ Usuário pode atualizar apenas seu avatar
- ❌ Não pode atualizar avatars de outros

#### **4. Exclusão de Avatars**
```sql
"Usuários podem deletar seus próprios avatars"
```

**Regras:**
- ✅ Usuário pode deletar apenas seu avatar
- ❌ Não pode deletar avatars de outros

## 🔧 Funções Auxiliares

### **`is_admin()`**
Verifica se o usuário atual é administrador.

```sql
SELECT public.is_admin(); -- true/false
```

### **`is_barber()`**
Verifica se o usuário atual é barbeiro.

```sql
SELECT public.is_barber(); -- true/false
```

### **`is_client()`**
Verifica se o usuário atual é cliente.

```sql
SELECT public.is_client(); -- true/false
```

### **`can_view_profile(profile_id)`**
Verifica se o usuário pode ver um perfil específico.

```sql
SELECT public.can_view_profile('user-uuid'); -- true/false
```

## 📊 Cenários de Uso

### **Cenário 1: Cliente logado**
```sql
-- auth.uid() = 'client-uuid'
-- role = 'client'

-- ✅ Pode ver seu próprio perfil
SELECT * FROM profiles WHERE id = auth.uid();

-- ❌ Não pode ver outros perfis
SELECT * FROM profiles WHERE id != auth.uid(); -- Retorna vazio

-- ✅ Pode atualizar seu perfil
UPDATE profiles SET nome = 'Novo Nome' WHERE id = auth.uid();

-- ❌ Não pode alterar seu role
UPDATE profiles SET role = 'admin' WHERE id = auth.uid(); -- Falha
```

### **Cenário 2: Barbeiro logado**
```sql
-- auth.uid() = 'barber-uuid'
-- role = 'barber'

-- ✅ Pode ver seu próprio perfil
SELECT * FROM profiles WHERE id = auth.uid();

-- ✅ Pode ver perfis de clientes
SELECT * FROM profiles WHERE role = 'client';

-- ❌ Não pode ver outros barbeiros ou admins
SELECT * FROM profiles WHERE role IN ('barber', 'admin') AND id != auth.uid(); -- Retorna vazio

-- ✅ Pode atualizar seu perfil
UPDATE profiles SET nome = 'Novo Nome' WHERE id = auth.uid();

-- ❌ Não pode atualizar perfis de clientes
UPDATE profiles SET nome = 'Hack' WHERE role = 'client'; -- Falha
```

### **Cenário 3: Admin logado**
```sql
-- auth.uid() = 'admin-uuid'
-- role = 'admin'

-- ✅ Pode ver todos os perfis
SELECT * FROM profiles; -- Retorna todos

-- ✅ Pode atualizar qualquer perfil
UPDATE profiles SET nome = 'Novo Nome' WHERE id = 'any-uuid';

-- ✅ Pode alterar roles
UPDATE profiles SET role = 'barber' WHERE id = 'client-uuid';

-- ✅ Pode deletar perfis
DELETE FROM profiles WHERE id = 'user-uuid';

-- ✅ Pode ver logs de auditoria
SELECT * FROM profiles_audit;
```

## 🧪 Como Testar

### **1. Aplicar Políticas**
```bash
# Via Supabase CLI
supabase db push --file supabase/migrations/20240102000001_rls_policies.sql
```

### **2. Executar Testes**
```bash
# Via Supabase CLI
supabase db push --file supabase/tests/rls_policies_test.sql
```

### **3. Verificar Status**
```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'profiles_audit');

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **4. Teste Manual**
```sql
-- Executar função de teste
SELECT * FROM public.test_rls_policies();
```

## 🚨 Troubleshooting

### **Problema: "permission denied for table profiles"**

**Causa:** RLS está habilitado mas não há políticas apropriadas.

**Solução:**
1. Verificar se políticas foram aplicadas:
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';
```

2. Recriar políticas se necessário:
```sql
-- Executar novamente o arquivo de migration
```

### **Problema: "row-level security policy violated"**

**Causa:** Usuário tentando acessar dados não permitidos.

**Solução:**
1. Verificar role do usuário:
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

2. Verificar se política permite o acesso:
```sql
SELECT public.can_view_profile('target-user-id');
```

### **Problema: Performance lenta**

**Causa:** Políticas RLS podem impactar performance.

**Solução:**
1. Criar índices apropriados:
```sql
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);
```

2. Otimizar consultas:
```sql
-- Usar filtros específicos
SELECT * FROM profiles WHERE role = 'client' AND id = auth.uid();
```

### **Problema: Políticas não funcionam**

**Causa:** RLS pode não estar habilitado.

**Solução:**
```sql
-- Verificar se RLS está habilitado
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Habilitar se necessário
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 🔄 Manutenção

### **Adicionar Nova Política**
```sql
-- Exemplo: Permitir que barbeiros vejam agendamentos
CREATE POLICY "Barbeiros podem ver agendamentos" ON agendamentos
  FOR SELECT USING (
    barbeiro_id = auth.uid() OR public.is_admin()
  );
```

### **Modificar Política Existente**
```sql
-- Dropar política antiga
DROP POLICY "nome_da_politica" ON tabela;

-- Criar nova política
CREATE POLICY "nome_da_politica" ON tabela
  FOR SELECT USING (nova_condicao);
```

### **Desabilitar RLS Temporariamente**
```sql
-- Desabilitar (cuidado!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Reabilitar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 📈 Monitoramento

### **Verificar Uso das Políticas**
```sql
-- Ver estatísticas de uso
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public';
```

### **Logs de Acesso**
```sql
-- Ver tentativas de acesso (via auditoria)
SELECT 
  action,
  COUNT(*) as count,
  DATE(changed_at) as date
FROM profiles_audit 
GROUP BY action, DATE(changed_at)
ORDER BY date DESC;
```

## 🔐 Segurança

### **Boas Práticas**

1. **Sempre habilitar RLS** em tabelas sensíveis
2. **Testar políticas** antes de aplicar em produção
3. **Usar funções auxiliares** para lógica complexa
4. **Monitorar performance** após aplicar políticas
5. **Documentar políticas** para manutenção futura

### **Políticas Defensivas**

```sql
-- Exemplo: Política que nega por padrão
CREATE POLICY "deny_all_by_default" ON sensitive_table
  FOR ALL USING (false);

-- Depois adicionar políticas específicas
CREATE POLICY "allow_specific_access" ON sensitive_table
  FOR SELECT USING (specific_condition);
```

## 📚 Referências

- [Documentação oficial do Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## 🤝 Contribuição

Para adicionar novas políticas RLS:

1. Criar migration em `supabase/migrations/`
2. Adicionar testes em `supabase/tests/`
3. Documentar políticas neste arquivo
4. Testar em ambiente de desenvolvimento
5. Aplicar em produção com cuidado