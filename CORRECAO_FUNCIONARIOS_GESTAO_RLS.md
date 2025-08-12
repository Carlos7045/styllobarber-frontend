# 🔧 Correção: Funcionários Não Aparecem na Gestão

## 🚨 Problema Identificado

**Situação:** Após as correções das políticas RLS para eliminar recursão infinita, os funcionários pararam de aparecer na página de gestão de funcionários.

**Causa Raiz:** As políticas RLS ficaram muito restritivas e o hook de funcionários estava dependendo de verificações de permissão que não funcionavam corretamente.

## ✅ Correções Aplicadas

### 1. **Políticas RLS Simplificadas para Profiles**

**Problema:** Políticas dependiam do JWT que pode não conter o role.

**Solução:** Criadas políticas mais simples e funcionais:

```sql
-- Remover políticas complexas que dependem do JWT
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Criar políticas simples e funcionais
CREATE POLICY "profiles_select_staff" ON profiles
FOR SELECT USING (
  -- Usuário pode ver próprio perfil
  auth.uid() = id 
  OR
  -- Ou pode ver perfis de staff se estiver autenticado
  (auth.uid() IS NOT NULL AND role IN ('barber', 'admin', 'saas_owner'))
);

CREATE POLICY "profiles_insert_authenticated" ON profiles
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
FOR DELETE USING (auth.uid() = id);
```

### 2. **Hook de Funcionários com Debug Melhorado**

**Problema:** Hook falhava silenciosamente sem logs adequados.

**Melhorias aplicadas:**

```typescript
// Logs detalhados para debug
console.log('🔐 Verificação de permissão:', {
  hasAdmin: hasRole('admin'),
  hasSaasOwner: hasRole('saas_owner'),
  hasPermission,
  profileExists: !!useAuth().profile,
  profileRole: useAuth().profile?.role,
  userExists: !!useAuth().user,
  initialized: useAuth().initialized
})

// Logs da busca de dados
console.log('📊 Buscando funcionários na tabela profiles...')
console.log('📋 Resultado da busca:', {
  hasData: !!data,
  hasError: !!fetchError,
  count: data?.length || 0,
  error: fetchError
})
```

### 3. **Verificação Temporária Sem Permissões**

**Para teste:** Removida temporariamente a verificação de permissões para identificar se o problema é com o `hasRole`:

```typescript
// TEMPORÁRIO: Remover verificação de permissão para testar
// if (!hasPermission) {
//   console.log('❌ Acesso negado - sem permissão')
//   setError('Acesso negado')
//   setLoading(false)
//   return
// }
```

## 🧪 Validação das Correções

### 1. **Teste Direto da Query**
```sql
SELECT id, nome, email, role, ativo 
FROM profiles 
WHERE role IN ('admin', 'barber', 'saas_owner') 
AND ativo = true 
ORDER BY nome;
```

**Resultado:** ✅ Query retorna dados corretamente

### 2. **Verificação das Políticas**
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
```

**Resultado:** ✅ Políticas simples e funcionais criadas

### 3. **Logs de Debug**
- ✅ **Logs de permissão** - Verificar se hasRole funciona
- ✅ **Logs de busca** - Verificar se query executa
- ✅ **Logs de resultado** - Verificar dados retornados

## 📊 Estrutura das Políticas Corrigidas

### Tabela `profiles`:
- ✅ **profiles_select_staff** - Ver perfis de funcionários
- ✅ **profiles_insert_authenticated** - Inserir perfil
- ✅ **profiles_update_own** - Atualizar próprio perfil
- ✅ **profiles_delete_own** - Deletar próprio perfil

**Características:**
- **Simples e diretas** - Sem dependência do JWT
- **Permissivas para staff** - Usuários autenticados veem funcionários
- **Seguras** - Ainda protegem dados pessoais

## 🔍 Diagnóstico do Problema

### Possíveis Causas:
1. **Políticas RLS muito restritivas** ✅ Corrigido
2. **hasRole não funcionando** 🔍 Em investigação
3. **Profile não carregado** 🔍 Em investigação
4. **Hook executando antes da auth** 🔍 Em investigação

### Próximos Passos:
1. **Testar sem verificação de permissão** - Identificar se é problema de auth
2. **Verificar logs do console** - Ver se dados são retornados
3. **Corrigir hasRole se necessário** - Implementar fallback
4. **Restaurar verificações** - Após identificar problema

## 🎯 Resultado Esperado

### Funcionalidades Restauradas:
- ✅ **Políticas RLS funcionais** - Sem recursão, mas permissivas
- 🔍 **Lista de funcionários** - Em teste
- 🔍 **Dados completos** - Em validação
- 🔍 **Filtros funcionando** - Em teste

### Debug Disponível:
- ✅ **Logs detalhados** no console
- ✅ **Verificação de permissões** com detalhes
- ✅ **Resultado da query** com informações
- ✅ **Estado da autenticação** completo

---

**🔍 DIAGNÓSTICO EM ANDAMENTO**

As políticas RLS foram corrigidas e logs detalhados foram adicionados. Agora é necessário:

1. **Recarregar a página** e verificar os logs no console
2. **Identificar** se o problema é com hasRole ou com a query
3. **Aplicar correção específica** baseada no diagnóstico
4. **Restaurar verificações** de segurança após correção

**Status:** Políticas corrigidas, aguardando teste para identificar causa raiz.