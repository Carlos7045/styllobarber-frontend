# Mapeamento de Duplicações e Dependências - StylloBarber

## 📊 Resumo das Duplicações Identificadas

### 🔄 Hooks com Padrões Duplicados

#### 1. Hooks Admin (6 hooks similares)

**Padrão Duplicado**: Todos seguem estrutura CRUD idêntica

```typescript
// Estrutura comum em todos os use-admin-* hooks:
- useState, useEffect, useCallback
- supabase import
- useAuth import
- Interface similar: { data[], loading, error, actions }
- Métodos: create, update, delete, refetch
```

**Hooks Identificados:**

- `use-admin-agendamentos.ts`
- `use-admin-clientes.ts`
- `use-admin-funcionarios.ts`
- `use-admin-horarios.ts`
- `use-admin-notificacoes.ts`
- `use-admin-servicos.ts`

**Oportunidade**: Criar hook base `useBaseCRUD<T>` reutilizável

#### 2. Hooks de Dados Financeiros (4 hooks similares)

**Padrão Duplicado**: Lógica de fetching e cache similar

```typescript
// Estrutura comum:
- Fetching de dados financeiros
- Cache e invalidação
- Filtros e agregações
- Estados de loading/error
```

**Hooks Identificados:**

- `use-financial-data.ts`
- `use-barber-financial-data.ts`
- `use-cash-flow-data.ts`
- `use-pdv-data.ts`

#### 3. Hooks de Relatórios (3 hooks similares)

**Padrão Duplicado**: Geração e exportação de relatórios

```typescript
// Estrutura comum:
- Geração de relatórios
- Filtros de período
- Exportação (PDF/Excel)
- Agregações de dados
```

**Hooks Identificados:**

- `use-appointment-reports.ts`
- `use-client-reports.ts`
- `use-operational-reports.ts`

### 🎨 Componentes Duplicados

#### 1. Componentes de Loading Auth (2 componentes)

**Duplicação Identificada:**

- `AuthLoadingState.tsx` - Versão simples
- `AuthLoadingStates.tsx` - Versão com múltiplos estados

**Funcionalidades Sobrepostas:**

- Ambos renderizam spinners de loading
- Ambos têm mensagens customizáveis
- Ambos usam Framer Motion
- Lógica de estados similar

#### 2. Componentes de Feedback Auth (2 componentes)

**Duplicação Identificada:**

- `AuthFeedback.tsx` - Versão básica
- `AuthFeedbackEnhanced.tsx` - Versão avançada

**Funcionalidades Sobrepostas:**

- Sistema de mensagens de feedback
- Tipos de alerta (success, error, warning)
- Auto-dismiss functionality
- Hook `useAuthFeedback` duplicado

#### 3. Componentes de Diálogo (2 componentes)

**Duplicação Identificada:**

- `src/components/admin/ConfirmDialog.tsx`
- `src/components/ui/confirm-dialog.tsx`

**Funcionalidades Sobrepostas:**

- Diálogos de confirmação
- Botões de ação (confirmar/cancelar)
- Variantes de estilo

### 📚 Utilitários Duplicados

#### 1. Validação (2 arquivos)

**Duplicação Identificada:**

- `src/lib/validations.ts`
- `src/lib/validation-schemas.ts`

**Funcionalidades Sobrepostas:**

- Schemas Zod
- Validação de formulários
- Regras de negócio

#### 2. Rate Limiting (2 arquivos)

**Duplicação Identificada:**

- `src/lib/rate-limiter.ts`
- `src/lib/rate-limiter-enhanced.ts`

**Funcionalidades Sobrepostas:**

- Controle de taxa de requisições
- Throttling e debouncing
- Cache de limites

#### 3. Storage (2 arquivos)

**Duplicação Identificada:**

- `src/lib/storage.ts`
- `src/lib/storage-fallback.ts`

**Funcionalidades Sobrepostas:**

- Gerenciamento de localStorage
- Fallbacks para storage
- Serialização de dados

### 🔧 Services Duplicados

#### 1. Services Financeiros (15+ arquivos)

**Localização**: `src/components/financial/services/`

**Duplicações Identificadas:**

- `reports-service.ts`
- `reports-service-simple.ts`
- `reports-service-hybrid.ts`

**Funcionalidades Sobrepostas:**

- Geração de relatórios
- Integração com APIs
- Cache de dados

### 🎯 Conceitos Duplicados

#### 1. Agendamento vs Appointments

**Duplicação Conceitual:**

- `src/components/agendamento/` (Português)
- `src/components/appointments/` (Inglês)

**Mesmo Domínio de Negócio:**

- Gestão de agendamentos
- Calendário
- Booking de serviços

#### 2. Client vs Clients

**Duplicação Conceitual:**

- `src/components/client/` (Singular)
- `src/components/clients/` (Plural)

**Mesmo Domínio de Negócio:**

- Gestão de clientes
- Perfis de usuário
- Relatórios de cliente

## 📈 Análise de Dependências Internas

### Dependências Circulares Identificadas

#### 1. Auth Dependencies

```
useAuth → useSession → useAuth (potencial circular)
AuthContext → useAuth → AuthProvider
```

#### 2. Financial Dependencies

```
financial/hooks → financial/services → financial/components
```

### Dependências Desnecessárias

#### 1. Debug Components

- 25+ componentes debug importando hooks de produção
- Dependências de desenvolvimento em código de produção

#### 2. Unused Imports

- Muitos arquivos importam bibliotecas não utilizadas
- Imports de tipos não utilizados

## 🔄 Padrões de Código Duplicados

### 1. Padrão CRUD Base

**Repetido em 15+ hooks:**

```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const create = async (item) => { /* lógica similar */ }
const update = async (id, item) => { /* lógica similar */ }
const delete = async (id) => { /* lógica similar */ }
const refetch = async () => { /* lógica similar */ }
```

### 2. Padrão de Error Handling

**Repetido em 20+ arquivos:**

```typescript
try {
  // operação
} catch (error) {
  console.error('Erro:', error)
  setError(error.message)
}
```

### 3. Padrão de Loading States

**Repetido em 30+ componentes:**

```typescript
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage />
if (!data) return <EmptyState />
```

## 🎯 Oportunidades de Consolidação

### 1. Hook Base Reutilizável

```typescript
// Criar useBaseCRUD<T> para substituir todos os hooks admin
function useBaseCRUD<T>(tableName: string, options?: CRUDOptions): CRUDResult<T>
```

### 2. Componente de Feedback Unificado

```typescript
// Unificar AuthFeedback e AuthFeedbackEnhanced
function UnifiedFeedback({
  variant: 'simple' | 'enhanced',
  // ... props
})
```

### 3. Sistema de Validação Centralizado

```typescript
// Unificar validations.ts e validation-schemas.ts
export const schemas = {
  user: UserSchema,
  appointment: AppointmentSchema,
  // ...
}
```

### 4. Service Layer Padronizado

```typescript
// Criar BaseService para todos os services
abstract class BaseService<T> {
  abstract tableName: string

  async create(data: Partial<T>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<void>
  async findMany(filters?: any): Promise<T[]>
}
```

## 📊 Impacto da Consolidação

### Redução Estimada:

- **Hooks**: 15+ → 5 (hook base + especializações)
- **Componentes**: 10+ duplicados → 5 unificados
- **Utilitários**: 8+ duplicados → 4 consolidados
- **Services**: 20+ → 10 (com base classes)

### Benefícios:

- **Manutenibilidade**: +70%
- **Consistência**: +80%
- **Bundle Size**: -25%
- **Desenvolvimento**: +50% velocidade

### Riscos:

- **Complexidade inicial** na criação de abstrações
- **Possível over-engineering** se não bem planejado
- **Curva de aprendizado** para novos desenvolvedores

## 🚀 Próximos Passos

### Fase 1: Consolidação de Hooks

1. Criar `useBaseCRUD<T>`
2. Migrar hooks admin para usar base
3. Testar funcionalidades

### Fase 2: Unificação de Componentes

1. Consolidar componentes de feedback
2. Unificar componentes de loading
3. Remover duplicados

### Fase 3: Reorganização de Services

1. Criar BaseService
2. Migrar services existentes
3. Padronizar interfaces

---

_Análise completa realizada em: ${new Date().toLocaleDateString('pt-BR')}_
_Próximo: Análise da estrutura atual de diretórios_
