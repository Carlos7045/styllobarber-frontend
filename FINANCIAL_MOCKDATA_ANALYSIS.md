# Análise de Dados Mockados no Sistema Financeiro

## Problemas Identificados

### 1. Card de Tendência (+12%)
**Localização**: `src/components/financial/components/FinancialDashboardSimple.tsx`
**Problema**: O card de tendência está usando dados hardcoded no componente `MetricCard`
**Código problemático**:
```typescript
// Linha ~70-80 - valores hardcoded para comparação
previousValue={13000} // <- MOCKADO
previousValue={10400} // <- MOCKADO
previousValue={2600}  // <- MOCKADO
previousValue={7800}  // <- MOCKADO
```

### 2. Transações Recentes - Dados Mistos
**Localização**: `src/hooks/use-cash-flow-data.ts` função `getRecentMovements()`
**Problema**: Quando não há dados reais, usa fallback com dados mockados que aparecem na lista
**Código problemático**:
```typescript
// Linha ~200+ - fallback com dados mockados
return [
  {
    id: '1',
    tipo: 'ENTRADA',
    valor: 85,
    descricao: 'Corte + Barba - Cliente', // <- MOCKADO
    categoria: 'Serviços',
    data: hoje,
    metodo_pagamento: 'Dinheiro'
  },
  // ... mais dados mockados
]
```

### 3. Dados de Evolução Temporal
**Localização**: `src/hooks/use-financial-data.ts` função `getEvolutionData()`
**Problema**: Fallback com dados mockados quando falha a busca real
**Código problemático**:
```typescript
// Linha ~180+ - dados mockados de evolução
return [
  { mes: 'Jan', receitas: 12000, despesas: 2800, lucro: 9200 }, // <- MOCKADO
  { mes: 'Fev', receitas: 13500, despesas: 2900, lucro: 10600 }, // <- MOCKADO
  // ...
]
```

### 4. Performance dos Barbeiros
**Localização**: `src/hooks/use-financial-data.ts` função `getFallbackFinancialData()`
**Problema**: Dados de barbeiros mockados no fallback
**Código problemático**:
```typescript
performanceBarbeiros: [
  { id: '1', nome: 'João Silva', receitaGerada: 8000 }, // <- MOCKADO
  { id: '2', nome: 'Pedro Santos', receitaGerada: 7000 }, // <- MOCKADO
  // ...
]
```

## Soluções Propostas

### 1. Corrigir Card de Tendência
- Calcular valores anteriores reais baseados no período selecionado
- Remover valores hardcoded
- Implementar cálculo de tendência baseado em dados reais

### 2. Melhorar Sistema de Fallback
- Reduzir dependência de dados mockados
- Usar dados históricos reais quando disponíveis
- Indicar claramente quando dados são estimados

### 3. Implementar Sistema de Cache
- Cache de dados para melhor performance
- Atualização incremental de dados
- Indicadores visuais de dados em tempo real vs. cache

### 4. Separar Dados Reais de Estimativas
- Badges/indicadores para dados estimados
- Diferentes estilos visuais para dados reais vs. estimados
- Logs claros sobre origem dos dados

## Prioridade de Correção

1. **Alta**: Card de tendência (visível na tela principal)
2. **Alta**: Transações recentes (dados mistos confusos)
3. **Média**: Evolução temporal (fallback menos visível)
4. **Baixa**: Performance barbeiros (dados de fallback aceitáveis)

## Próximos Passos

1. Implementar cálculo real de tendências
2. Melhorar sistema de movimentações recentes
3. Adicionar indicadores visuais para dados estimados
4. Implementar sistema de cache para performance