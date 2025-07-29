# Problema de Integração PDV com Dashboard Financeiro

## 🔍 Problema Identificado

Os registros do PDV não aparecem no Dashboard Financeiro e no Fluxo de Caixa porque há uma **desconexão entre onde os dados são salvos e onde são buscados**.

### Onde os dados são salvos (PDV):
- **Tabela**: `transacoes_financeiras`
- **Serviço**: `QuickTransactionService.registrarTransacao()`
- **Dados encontrados**: ✅ 3 registros recentes confirmados
  - Gilete (R$ 100,00 - DESPESA)
  - 3x Barba + Corte Simples + Corte + Barba (R$ 130,00 - RECEITA)
  - Hidratação (R$ 30,00 - RECEITA)

### Onde os dados são buscados (Dashboard):
- **Tabelas**: `appointments` (para receitas) e `expenses` (para despesas)
- **Hooks**: `use-financial-data.ts` e `use-cash-flow-data.ts`
- **Resultado**: ❌ Não encontra os dados do PDV

## 🔧 Solução Necessária

Atualizar os hooks financeiros para incluir dados da tabela `transacoes_financeiras`:

### 1. Hook `use-financial-data.ts`
- Adicionar busca em `transacoes_financeiras` para receitas e despesas
- Combinar com dados de `appointments` e `expenses`
- Calcular métricas considerando todas as fontes

### 2. Hook `use-cash-flow-data.ts`
- Incluir `transacoes_financeiras` nas movimentações recentes
- Somar entradas/saídas de todas as tabelas
- Atualizar evolução semanal com dados completos

### 3. Priorização de Dados
- **Dados do PDV** (`transacoes_financeiras`): Prioridade alta (dados mais recentes e precisos)
- **Agendamentos** (`appointments`): Para receitas de serviços agendados
- **Despesas** (`expenses`): Para despesas não registradas via PDV

## 📊 Estrutura da Tabela `transacoes_financeiras`

```sql
- id: uuid
- tipo: 'RECEITA' | 'DESPESA' | 'COMISSAO'
- valor: numeric
- descricao: text
- categoria_id: uuid (FK para categorias_financeiras)
- agendamento_id: uuid (FK para appointments)
- barbeiro_id: uuid (FK para profiles)
- data_transacao: date
- status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA'
- metodo_pagamento: varchar
- observacoes: text
- created_at: timestamptz
- updated_at: timestamptz
```

## 🎯 Resultado Esperado

Após a correção:
- ✅ Registros do PDV aparecerão no Dashboard Financeiro
- ✅ Cards de métricas incluirão dados do PDV
- ✅ Fluxo de caixa mostrará movimentações do PDV
- ✅ Gráficos de evolução incluirão dados completos
- ✅ Sistema unificado de dados financeiros