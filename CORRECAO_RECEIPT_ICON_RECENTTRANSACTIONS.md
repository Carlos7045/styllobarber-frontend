# Correção do Ícone Receipt no RecentTransactions

## Problema Identificado
- **Erro**: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined"
- **Localização**: `src/components/financial/components/RecentTransactions.tsx` linha 260
- **Componente**: `<Receipt className="h-6 w-6 text-primary-gold" />`

## Causa Raiz
O ícone `Receipt` estava sendo importado do arquivo `@/shared/utils/optimized-imports` mas não estava sendo resolvido corretamente, resultando em `undefined`.

## Solução Aplicada
Mudança do import de `optimized-imports` para import direto do `lucide-react`:

### Antes:
```typescript
import { Clock, DollarSign, TrendingUp, TrendingDown, User, CreditCard, MoreVertical, X, AlertTriangle, Receipt } from '@/shared/utils/optimized-imports'
```

### Depois:
```typescript
import { Clock, DollarSign, TrendingUp, TrendingDown, User, CreditCard, MoreVertical, X, AlertTriangle, Receipt, Smartphone } from 'lucide-react'
```

## Ícones Corrigidos
- ✅ `Receipt` - Ícone principal do cabeçalho
- ✅ `Smartphone` - Adicionado para método de pagamento PIX (estava faltando)
- ✅ Todos os outros ícones já funcionais mantidos

## Contexto
Esta correção segue o padrão estabelecido nas correções anteriores onde mudamos de `optimized-imports` para imports diretos do `lucide-react` para resolver problemas de resolução de componentes.

## Resultado Esperado
- ✅ Página PDV deve carregar sem erros
- ✅ Ícone Receipt deve aparecer no cabeçalho das transações recentes
- ✅ Ícone Smartphone deve aparecer para pagamentos PIX
- ✅ Todos os outros ícones devem continuar funcionando

## Arquivos Modificados
- `src/components/financial/components/RecentTransactions.tsx`

## Data da Correção
10 de fevereiro de 2025