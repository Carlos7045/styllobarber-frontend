# Mapeamento de Duplicações - StylloBarber Frontend

## Padrões Duplicados Identificados

### 1. Estrutura Base de Hooks de Dados

**Padrão Comum em TODOS os hooks de dados:**
```typescript
interface UseHookReturn {
  data: Type[]
  loading: boolean
  error: string | null
  // Funções CRUD específicas
}

// Estado interno comum:
const [data, setData] = useState<Type[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Hooks que seguem este padrão:**
- `use-admin-agendamentos.ts`
- `use-admin-clientes.ts`
- `use-admin-funcionarios.ts`
- `use-admin-horarios.ts`
- `use-admin-servicos.ts`
- `use-appointments.ts`
- `use-barber-clients.ts`
- `use-services.ts`
- `use-client-appointments.ts`

### 2. Padrões de Error Handling

**Estrutura Repetida:**
```typescript
try {
  setLoading(true)
  setError(null)
  // Operação
  const result = await operation()
  setData(result)
} catch (err) {
  setError('Mensagem de erro')
  console.error('Erro:', err)
} finally {
  setLoading(false)
}
```

### 3. Hooks de Reports com Estrutura Similar

**Hooks de Relatórios:**
- `use-appointment-reports.ts`
- `use-client-reports.ts`
- `use-operational-reports.ts`

**Padrão Comum:**
```typescript
interface UseReportsReturn {
  isLoading: boolean
  isError: boolean
  error: Error | null
  // Funções de geração de relatórios
}
```

### 4. Hooks de Dados Financeiros

**Hooks Similares:**
- `use-financial-data.ts`
- `use-barber-financial-data.ts`
- `use-cash-flow-data.ts`

**Funcionalidades Duplicadas:**
- Cálculo de métricas financeiras
- Formatação de dados para gráficos
- Agregação de dados por período

### 5. Session Management (Múltiplas Implementações)

**Hooks Duplicados:**
- `use-minimal-session-manager.ts` (EM USO)
- `use-session-manager-simple.ts`
- `use-stable-session-manager.ts` (NÃO UTILIZADO)
- `use-session-manager.ts.backup` (BACKUP)

### 6. Componentes de Notificações Duplicados

**Componentes Similares:**
- `NotificacoesManager.tsx`
- `NotificacoesManagerNew.tsx`
- `NotificacoesManagerSimple.tsx`
- `NotificacoesManagerTest.tsx`

### 7. Utilities e Funções Duplicadas

**Validações:**
- `lib/validations.ts`
- `lib/validation-schemas.ts`

**Formatação de Data:**
- Funções de formatação espalhadas em vários arquivos
- `lib/date-utils.ts` centraliza algumas, mas não todas

**Formatação de Moeda:**
- Lógica de formatação repetida em componentes financeiros

## Oportunidades de Consolidação

### 1. Hook Base para CRUD Operations

**Criar hook genérico:**
```typescript
function useBaseCRUD<T>(
  endpoint: string,
  options?: {
    permissions?: string[]
    cache?: boolean
    realtime?: boolean
  }
): {
  data: T[]
  loading: boolean
  error: string | null
  create: (data: Partial<T>) => Promise<Result<T>>
  update: (id: string, data: Partial<T>) => Promise<Result<T>>
  delete: (id: string) => Promise<Result<void>>
  refresh: () => Promise<void>
}
```

### 2. Hook de Reports Unificado

**Consolidar em:**
```typescript
function useReports<T>(
  reportType: 'appointments' | 'clients' | 'operational' | 'financial',
  config: ReportConfig
): UseReportsReturn<T>
```

### 3. Utilities Centralizadas

**Criar módulos específicos:**
- `lib/formatters/` - Para formatação de data, moeda, etc.
- `lib/validators/` - Para todas as validações
- `lib/calculators/` - Para cálculos financeiros e estatísticas

### 4. Componentes Base Reutilizáveis

**Criar componentes genéricos:**
- `DataTable<T>` - Para todas as tabelas de dados
- `FormModal<T>` - Para modais de formulário
- `StatsCard` - Para cards de estatísticas
- `ReportGenerator<T>` - Para geração de relatórios

## Estimativa de Redução de Código

### Hooks de Dados Admin
- **Atual:** ~2000 linhas distribuídas em 5 hooks
- **Após consolidação:** ~800 linhas (hook base + especializações)
- **Redução:** 60%

### Componentes de Notificações
- **Atual:** 4 componentes similares (~1500 linhas)
- **Após consolidação:** 1 componente robusto (~600 linhas)
- **Redução:** 60%

### Session Management
- **Atual:** 4 implementações diferentes
- **Após consolidação:** 1 implementação robusta
- **Redução:** 75%

## Plano de Consolidação

### Fase 1: Hooks Base
1. Criar `useBaseCRUD` genérico
2. Migrar hooks admin para usar base
3. Testar e validar funcionalidades

### Fase 2: Components
1. Criar componentes base reutilizáveis
2. Migrar componentes específicos
3. Remover duplicações

### Fase 3: Utilities
1. Centralizar formatters e validators
2. Criar calculators para lógica financeira
3. Atualizar imports em todo projeto

### Fase 4: Limpeza Final
1. Remover arquivos não utilizados
2. Atualizar documentação
3. Validar testes