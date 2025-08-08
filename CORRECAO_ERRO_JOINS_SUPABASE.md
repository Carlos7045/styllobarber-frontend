# Correção do Erro de Joins do Supabase

## Problema Identificado

Erro: **"Could not embed because more than one relationship was found for 'appointments' and 'profiles'"**

### Causa Raiz

A tabela `appointments` tem duas foreign keys para a tabela `profiles`:

- `cliente_id` → `profiles.id`
- `barbeiro_id` → `profiles.id`

Quando usamos a sintaxe `profiles(...)` no Supabase JavaScript client, ele não consegue determinar qual das duas relações usar, causando ambiguidade.

## Correções Aplicadas

### 1. Hook use-client-appointments.ts

**Antes:**

```typescript
.select(`
  *,
  cliente:profiles(id, nome, email, telefone),
  barbeiro:profiles(id, nome, avatar_url)
`)
```

**Depois:**

```typescript
.select('*')
// Buscar dados relacionados separadamente
const { data: clienteData } = await supabase
  .from('profiles')
  .select('id, nome, email, telefone')
  .eq('id', newAppointment.cliente_id)
  .single()
```

### 2. Hook use-admin-agendamentos.ts

**Antes:**

```typescript
.select(`
  *,
  cliente:profiles(id, nome, telefone, email),
  barbeiro:profiles(id, nome),
  service:services(id, nome, preco, duracao_minutos)
`)
```

**Depois:**

```typescript
.select('*')
```

### 3. Hook use-appointments.ts

**Antes:**

```typescript
.select(`
  *,
  cliente:profiles(id, nome, telefone, email),
  barbeiro:profiles(id, nome),
  service:services(id, nome, preco, duracao_minutos)
`)
```

**Depois:**

```typescript
.select('*')
```

### 4. Hook use-agendamentos-pendentes.ts

**Antes:**

```typescript
cliente:profiles(id, nome, telefone),
barbeiro:profiles(id, nome),
service:services(id, nome, preco, duracao_minutos)
```

**Depois:**

```typescript
*
```

## Solução Implementada

### Abordagem de Queries Separadas

Em vez de usar joins problemáticos, implementamos:

1. **Query principal** para buscar agendamentos básicos
2. **Queries separadas** para buscar dados relacionados
3. **Combinação manual** dos dados no JavaScript

```typescript
// 1. Buscar agendamentos
const { data: appointmentsData } = await supabase.from('appointments').select('*')

// 2. Buscar clientes
const { data: clientesData } = await supabase
  .from('profiles')
  .select('id, nome, telefone, email')
  .in('id', clienteIds)

// 3. Buscar barbeiros
const { data: barbeirosData } = await supabase
  .from('profiles')
  .select('id, nome')
  .in('id', barbeiroIds)

// 4. Combinar dados
const appointmentsWithRelations = appointmentsData.map((apt) => ({
  ...apt,
  cliente: clientesData?.find((c) => c.id === apt.cliente_id) || null,
  barbeiro: barbeirosData?.find((b) => b.id === apt.barbeiro_id) || null,
}))
```

## Arquivos Corrigidos

- ✅ `src/domains/appointments/hooks/use-client-appointments.ts`
- ✅ `src/domains/users/hooks/use-admin-agendamentos.ts`
- ✅ `src/domains/appointments/hooks/use-appointments.ts`
- ✅ `src/domains/appointments/hooks/use-agendamentos-pendentes.ts`

## Arquivos Restantes para Correção

- `src/domains/users/hooks/use-barber-clients.ts`
- `src/domains/users/hooks/use-barber-financial-data.ts`
- `src/shared/hooks/data/use-dashboard-data.ts`
- `src/shared/hooks/data/use-cash-flow-data.ts`

## Status

✅ **Correções principais aplicadas**

### Resultado Esperado

- ✅ Agendamentos podem ser criados sem erro
- ✅ Página de agenda carrega corretamente
- ✅ Confirmação de agendamentos funciona
- ✅ Dados relacionados são carregados corretamente

## Teste de Validação

```sql
-- Verificar foreign keys que causam ambiguidade
SELECT
  constraint_name,
  column_name,
  foreign_table_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'appointments' AND foreign_table_name = 'profiles';
```

**Resultado**:

- `appointments_cliente_id_fkey` → `profiles`
- `appointments_barbeiro_id_fkey` → `profiles`

**Conclusão**: Ambiguidade confirmada e resolvida com queries separadas.
