# Correção dos Ícones Maximize2 e Minimize2 no QuickTransactionPDV

## Problema Identificado
- **Erro**: "Runtime ReferenceError: Maximize2 is not defined"
- **Localização**: `src/components/financial/components/QuickTransactionPDV.tsx` linha 313
- **Componente**: `<Maximize2 className="h-4 w-4" />` e `<Minimize2 className="h-4 w-4" />`

## Causa Raiz
Os ícones `Maximize2` e `Minimize2` estavam sendo usados no componente para o botão de expandir/minimizar o PDV, mas não estavam sendo importados.

## Solução Aplicada
Mudança do import de `optimized-imports` para import direto do `lucide-react` incluindo os ícones faltantes:

### Antes:
```typescript
import { Check, CreditCard, DollarSign, Loader2, Minus, Plus, Save, Search, User, X } from '@/shared/utils/optimized-imports'
```

### Depois:
```typescript
import { Check, CreditCard, DollarSign, Loader2, Minus, Plus, Save, Search, User, X, Maximize2, Minimize2 } from 'lucide-react'
```

## Ícones Corrigidos
- ✅ `Maximize2` - Ícone para expandir o PDV (linha 313)
- ✅ `Minimize2` - Ícone para minimizar o PDV (linha 308)
- ✅ Todos os outros ícones já funcionais mantidos

## Funcionalidade Afetada
- **Botão Expandir/Minimizar**: Permite alternar entre modo normal e tela cheia do PDV
- **Localização**: Header do componente PDV, lado direito
- **Comportamento**: Quando expandido, o PDV ocupa toda a tela para melhor usabilidade

## Contexto
Esta correção segue o padrão estabelecido nas correções anteriores onde mudamos de `optimized-imports` para imports diretos do `lucide-react` para resolver problemas de resolução de componentes.

## Resultado Esperado
- ✅ Página PDV deve carregar sem erros de runtime
- ✅ Botão de expandir/minimizar deve funcionar corretamente
- ✅ Ícones devem aparecer adequadamente no botão
- ✅ Funcionalidade de tela cheia deve operar normalmente

## Arquivos Modificados
- `src/components/financial/components/QuickTransactionPDV.tsx`

## Data da Correção
10 de fevereiro de 2025