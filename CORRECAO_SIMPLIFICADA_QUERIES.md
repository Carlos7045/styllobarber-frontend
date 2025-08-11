# Correção Simplificada - Queries Supabase

## Análise dos Erros

Pelas imagens do console, vejo que ainda há erros nas queries:
- `Erro ao buscar agendamentos: {}`
- `Erro ao buscar serviços populares: {}`
- `Erro ao buscar transações: {}`

## Estratégia de Correção

Vou simplificar as queries para identificar o problema raiz:

### 1. Simplificar fetchAppointments
- Remover joins complexos temporariamente
- Usar `SELECT *` para buscar todos os campos
- Adicionar try/catch para melhor tratamento de erro
- Adicionar logs para debug

### 2. Desabilitar Temporariamente
- `fetchPopularServices` - retorna array vazio
- `fetchTransactions` - retorna array vazio  
- `fetchDailyRevenue` - retorna dados vazios

### 3. Focar no Essencial
- Apenas agendamentos concluídos
- Cálculo simples de receita usando `preco_final`
- Sem joins até identificar o problema

## Correções Aplicadas

### fetchAppointments (Simplificado)
```typescript
async function fetchAppointments(inicio: Date, fim: Date, barbeiroId?: string) {
  try {
    let query = supabase
      .from('appointments')
      .select('*')  // Buscar todos os campos
      .eq('status', 'concluido')

    // Aplicar filtros apenas se válidos
    if (inicio && fim) {
      query = query
        .gte('data_agendamento', inicio.toISOString())
        .lte('data_agendamento', fim.toISOString())
    }

    if (barbeiroId && barbeiroId !== 'todos') {
      query = query.eq('barbeiro_id', barbeiroId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return []
    }

    console.log('Agendamentos encontrados:', data?.length || 0)
    return data || []
  } catch (err) {
    console.error('Erro na função fetchAppointments:', err)
    return []
  }
}
```

### Outras Funções (Temporariamente Desabilitadas)
```typescript
// Retornam arrays vazios para evitar erros
async function fetchPopularServices() { return [] }
async function fetchTransactions() { return [] }
async function fetchDailyRevenue() { return [] }
```

### Cálculo de Receita (Simplificado)
```typescript
function calculateAppointmentsRevenue(agendamentos: any[]) {
  return agendamentos.reduce((sum, apt) => {
    const preco = parseFloat(apt.preco_final) || 0
    return sum + preco
  }, 0)
}
```

## Resultado Esperado

Com essas simplificações:

### Dashboard deve mostrar:
- **Receita Bruta:** R$ 80,00 (se encontrar os 2 agendamentos)
- **Número de Atendimentos:** 2
- **Ticket Médio:** R$ 40,00
- **Outros campos:** 0 (temporariamente)

### Console deve mostrar:
- `Agendamentos encontrados: 2` (se funcionar)
- Sem erros de query
- Logs de debug das outras funções

### Se ainda houver erro:
- Vamos investigar se o problema é:
  - Permissões RLS no Supabase
  - Estrutura da tabela appointments
  - Formato das datas
  - Configuração do cliente Supabase

## Próximos Passos

1. **Testar a versão simplificada**
2. **Se funcionar:** Reativar joins gradualmente
3. **Se não funcionar:** Investigar configuração do Supabase
4. **Verificar RLS:** Pode estar bloqueando as queries
5. **Testar query direta:** Usar SQL direto para comparar

## Debug Adicional

Se ainda houver erros, vamos:
1. Verificar se RLS está habilitado na tabela appointments
2. Testar query SQL direta no Supabase
3. Verificar se o usuário tem permissão para ler appointments
4. Analisar logs do Supabase para mais detalhes