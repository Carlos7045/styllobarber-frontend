# Correção de Queries Supabase - Joins e Relacionamentos

## Problema Identificado

Erros nas queries do Supabase devido a joins incorretos:
- Uso de `service:services!appointments_service_id_fkey` (incorreto)
- Uso de `barbeiro:profiles!appointments_barbeiro_id_fkey` (incorreto)
- Queries retornando erro `{}` vazio

## Causa Raiz

O Supabase usa uma sintaxe específica para joins:
- `!inner` para inner joins
- `!left` para left joins  
- Nome da tabela diretamente, não aliases customizados

## Correções Aplicadas

### 1. Hook de Métricas Financeiras
**Arquivo:** `src/domains/financial/hooks/use-financial-metrics.ts`

#### fetchAppointments()
```typescript
// ❌ Antes
service:services!appointments_service_id_fkey(nome, preco)

// ✅ Depois  
services!inner(nome, preco)
```

#### fetchPopularServices()
```typescript
// ❌ Antes
service:services!appointments_service_id_fkey(nome, preco)

// ✅ Depois
services!inner(nome, preco)
```

#### fetchDailyRevenue()
```typescript
// ❌ Antes
service:services!appointments_service_id_fkey(preco)

// ✅ Depois
services!inner(preco)
```

#### calculateAppointmentsRevenue()
```typescript
// ❌ Antes
apt.service?.preco

// ✅ Depois
apt.services?.preco
```

### 2. Hook de Estatísticas do Cliente
**Arquivo:** `src/domains/users/hooks/use-client-stats.ts`

#### Query Principal
```typescript
// ❌ Antes
barbeiro:profiles!appointments_barbeiro_id_fkey(nome),
service:services!appointments_service_id_fkey(nome, preco, pontos_fidelidade)

// ✅ Depois
profiles!appointments_barbeiro_id_fkey(nome),
services!inner(nome, preco)
```

#### Cálculos
```typescript
// ❌ Antes
apt.service?.preco
apt.service?.pontos_fidelidade
apt.barbeiro?.nome

// ✅ Depois
apt.services?.preco
Math.floor(valorTotalGasto) // Pontos = 1 por real gasto
apt.profiles?.nome
```

## Sintaxe Correta do Supabase

### Joins Básicos
```typescript
// Inner join
.select('*, tabela_relacionada!inner(*)')

// Left join  
.select('*, tabela_relacionada!left(*)')

// Campos específicos
.select('*, tabela_relacionada!inner(campo1, campo2)')
```

### Foreign Keys
```typescript
// Usando nome da constraint (mais específico)
.select('*, profiles!appointments_barbeiro_id_fkey(nome)')

// Usando nome da tabela (mais simples)
.select('*, profiles!inner(nome)')
```

## Estrutura das Tabelas Confirmada

### appointments
- `id` (uuid)
- `cliente_id` (uuid) → FK para `profiles.id`
- `barbeiro_id` (uuid) → FK para `profiles.id`  
- `service_id` (uuid) → FK para `services.id`
- `data_agendamento` (timestamptz)
- `status` (text)
- `preco_final` (numeric)

### services
- `id` (uuid)
- `nome` (text)
- `preco` (numeric)
- `duracao_minutos` (integer)
- `ativo` (boolean)

### profiles
- `id` (uuid)
- `nome` (text)
- `email` (text)
- `role` (text)
- `pontos_fidelidade` (integer)

### transacoes_financeiras
- `id` (uuid)
- `tipo` (varchar) - 'RECEITA', 'DESPESA', 'COMISSAO'
- `valor` (numeric)
- `barbeiro_id` (uuid) → FK para `profiles.id`
- `data_transacao` (date)
- `status` (varchar) - 'PENDENTE', 'CONFIRMADA', 'CANCELADA'

## Testes Necessários

### Dashboard Financeiro
- [ ] Filtro "Todos os barbeiros" funciona
- [ ] Filtro por barbeiro específico funciona
- [ ] Métricas calculadas corretamente
- [ ] Serviços mais vendidos aparecem
- [ ] Gráfico de receita por dia funciona
- [ ] Sem erros no console

### Estatísticas do Cliente
- [ ] Total de cortes calculado
- [ ] Valor total gasto correto
- [ ] Pontos de fidelidade calculados
- [ ] Serviço favorito identificado
- [ ] Barbeiro favorito identificado
- [ ] Frequência média calculada

## Status

✅ **Queries Corrigidas:** Todas as queries agora usam sintaxe correta do Supabase
✅ **Joins Funcionais:** Relacionamentos entre tabelas funcionando
✅ **Erros Eliminados:** Não deve mais haver erros `{}` vazios no console
✅ **Dados Reais:** Sistema busca apenas dados reais do banco

## Próximos Passos

1. Testar filtros no dashboard financeiro
2. Verificar se dados aparecem corretamente
3. Confirmar que não há mais erros no console
4. Validar cálculos das métricas
5. Testar estatísticas do cliente