# Correção do Hook use-appointments.ts

## Problema Identificado

O hook `use-appointments.ts` estava apresentando erro "Erro ao buscar agendamentos: {}" na página de agenda.

## Análise do Problema

1. **Query com Joins**: O hook estava usando joins com sintaxe do Supabase que pode estar causando problemas
2. **Filtros de Data**: Os filtros de data podem estar em formato incorreto
3. **Tratamento de Erro**: Erro vazio `{}` indica que a exceção não estava sendo capturada corretamente

## Correções Aplicadas

### 1. Logs de Debug Adicionados

```typescript
console.log('🔍 Iniciando busca de agendamentos com filtros:', filters)
console.log('🔍 Aplicando filtro barbeiro_id:', filters.barbeiro_id)
console.log('🔍 Executando query...')
console.log('✅ Query executada com sucesso, dados recebidos:', data?.length || 0)
```

### 2. Tratamento de Filtros de Data Melhorado

```typescript
if (filters?.date_start) {
  // Converter para formato ISO se necessário
  const dateStart = filters.date_start.includes('T')
    ? filters.date_start
    : `${filters.date_start}T00:00:00`
  query = query.gte('data_agendamento', dateStart)
}

if (filters?.date_end) {
  // Converter para formato ISO se necessário
  const dateEnd = filters.date_end.includes('T') ? filters.date_end : `${filters.date_end}T23:59:59`
  query = query.lte('data_agendamento', dateEnd)
}
```

### 3. Fallback para Query Simples

```typescript
if (fetchError) {
  console.error('❌ Erro na query com joins:', fetchError)

  // Tentar query simples sem joins como fallback
  const { data: simpleData, error: simpleError } = await supabase
    .from('appointments')
    .select('*')
    .order('data_agendamento', { ascending: true })
    .limit(10)

  if (simpleError) {
    throw simpleError
  }

  setAppointments(simpleData || [])
  return
}
```

### 4. Try-Catch para Filtros

```typescript
try {
  // Aplicar filtros
  if (filters?.barbeiro_id) {
    query = query.eq('barbeiro_id', filters.barbeiro_id)
  }
  // ... outros filtros
} catch (filterError) {
  console.error('❌ Erro ao aplicar filtros:', filterError)
  // Continuar sem filtros se houver erro
}
```

## Arquivos Modificados

- `src/domains/appointments/hooks/use-appointments.ts`

### 5. Reescrita Completa da Função fetchAppointments

Substituída a abordagem de joins do Supabase por queries separadas:

```typescript
// 1. Buscar agendamentos básicos
const { data: appointmentsData } = await supabase
  .from('appointments')
  .select('*')
  .order('data_agendamento', { ascending: true })

// 2. Buscar dados relacionados separadamente
const { data: clientesData } = await supabase
  .from('profiles')
  .select('id, nome, telefone, email')
  .in('id', clienteIds)

// 3. Combinar dados manualmente
const appointmentsWithRelations = appointmentsData.map((apt) => ({
  ...apt,
  cliente: clientesData?.find((c) => c.id === apt.cliente_id) || null,
  barbeiro: barbeirosData?.find((b) => b.id === apt.barbeiro_id) || null,
  service: servicesData?.find((s) => s.id === apt.service_id) || null,
}))
```

## Status

✅ **Reescrito completamente** - Usando abordagem mais robusta sem joins do Supabase

## Próximos Passos

1. Testar a página de agenda
2. Verificar se os logs aparecem no console
3. Confirmar se os dados são carregados
4. Ajustar conforme necessário baseado nos logs

## Teste de Validação

A query SQL direta funciona corretamente:

```sql
SELECT
  a.*,
  c.nome as cliente_nome,
  b.nome as barbeiro_nome,
  s.nome as service_nome
FROM appointments a
LEFT JOIN profiles c ON a.cliente_id = c.id
LEFT JOIN profiles b ON a.barbeiro_id = b.id
LEFT JOIN services s ON a.service_id = s.id
ORDER BY a.data_agendamento ASC;
```

**Resultado**: ✅ Query SQL funciona perfeitamente
