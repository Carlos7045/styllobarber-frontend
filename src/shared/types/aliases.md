# Aliases de Tipos - Resolução de Conflitos

Este documento explica os aliases de tipos criados para resolver conflitos de nomes entre domínios.

## Conflitos Resolvidos

### PaymentMethod

Existem dois tipos `PaymentMethod` em domínios diferentes:

#### `AppointmentPaymentMethod` (de `@/domains/appointments/types`)
```typescript
type AppointmentPaymentMethod = 'cash' | 'card' | 'pix' | 'bank_transfer' | 'credit'
```
**Uso**: Métodos de pagamento específicos para agendamentos (mais simples).

#### `FinancialPaymentMethod` (de `@/domains/financial/types`)
```typescript
type FinancialPaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'bank_transfer'
  | 'check'
  | 'digital_wallet'
  | 'cryptocurrency'
  | 'store_credit'
  | 'loyalty_points'
```
**Uso**: Métodos de pagamento completos para transações financeiras (mais abrangente).

### Certification

Existem dois tipos `Certification` em domínios diferentes:

#### `AuthCertification` (de `@/domains/auth/types`)
```typescript
interface AuthCertification {
  id: UUID
  name: string
  issuer: string
  issue_date: string // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  certificate_url?: string
}
```
**Uso**: Certificações relacionadas à autenticação e licenças do sistema.

#### `UserCertification` (de `@/domains/users/types`)
```typescript
interface UserCertification {
  id: UUID
  name: string
  issuer: string
  issue_date: string // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  certificate_number?: string
  certificate_url?: string
  is_verified: boolean
  verification_date?: Timestamp
}
```
**Uso**: Certificações profissionais de barbeiros (cursos, especializações, etc.).

## Como Usar

### Importação Específica
```typescript
// Para métodos de pagamento de agendamentos
import { AppointmentPaymentMethod } from '@/shared/types'

// Para métodos de pagamento financeiros
import { FinancialPaymentMethod } from '@/shared/types'

// Para certificações de autenticação
import { AuthCertification } from '@/shared/types'

// Para certificações de usuários/barbeiros
import { UserCertification } from '@/shared/types'
```

### Importação Direta do Domínio
```typescript
// Alternativa: importar diretamente do domínio
import { PaymentMethod } from '@/domains/appointments/types' // AppointmentPaymentMethod
import { PaymentMethod as FinancialPayment } from '@/domains/financial/types'

import { Certification } from '@/domains/auth/types' // AuthCertification
import { Certification as BarberCertification } from '@/domains/users/types'
```

## Convenções de Nomenclatura

Para evitar futuros conflitos, seguimos estas convenções:

### Prefixos por Domínio
- **Auth**: `AuthXxx` - tipos relacionados à autenticação
- **User**: `UserXxx` - tipos relacionados a usuários/barbeiros
- **Appointment**: `AppointmentXxx` - tipos relacionados a agendamentos
- **Service**: `ServiceXxx` - tipos relacionados a serviços
- **Financial**: `FinancialXxx` - tipos relacionados a finanças

### Sufixos por Contexto
- **Data**: `XxxData` - dados para criação/atualização
- **State**: `XxxState` - estado de componentes/hooks
- **Config**: `XxxConfig` - configurações
- **Result**: `XxxResult` - resultados de operações
- **Options**: `XxxOptions` - opções de configuração

## Adicionando Novos Tipos

Ao adicionar novos tipos que podem conflitar:

1. **Verifique conflitos existentes**:
   ```bash
   grep -r "interface NomeDoTipo" src/domains/
   ```

2. **Use nomes específicos do domínio**:
   ```typescript
   // ✅ Bom
   interface UserPreferences { }
   interface AppointmentPreferences { }
   
   // ❌ Evitar
   interface Preferences { } // Muito genérico
   ```

3. **Documente aliases no barrel export**:
   ```typescript
   export {
     Preferences as UserPreferences, // Preferências do usuário
     Preferences as AppointmentPreferences // Preferências de agendamento
   } from '@/domains/xxx/types'
   ```

## Migração de Código Existente

Se você encontrar erros de tipo após esta mudança:

### Antes
```typescript
import { Certification } from '@/shared/types' // ❌ Ambíguo
```

### Depois
```typescript
// Especifique qual certificação você quer
import { AuthCertification } from '@/shared/types' // ✅ Claro
// ou
import { UserCertification } from '@/shared/types' // ✅ Claro
```

## Verificação de Conflitos

Para verificar se há novos conflitos de tipos:

```bash
# Procurar por tipos duplicados
npm run type-check 2>&1 | grep "has already exported"

# Ou usar o script de análise
npm run analyze-types
```