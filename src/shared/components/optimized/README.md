# Componentes e Hooks Otimizados com Memoização

Este diretório contém componentes e hooks otimizados com memoização estratégica para melhorar a performance da aplicação StylloBarber.

## 📋 Índice

- [Componentes Memoizados](#componentes-memoizados)
- [Hooks de Memoização](#hooks-de-memoização)
- [Utilitários de Performance](#utilitários-de-performance)
- [Guia de Uso](#guia-de-uso)
- [Boas Práticas](#boas-práticas)
- [Exemplos](#exemplos)

## 🧩 Componentes Memoizados

### MemoizedList
Lista otimizada com filtros e ordenação memoizados.

```tsx
import { MemoizedList } from '@/shared/components/optimized'

<MemoizedList
  items={clients}
  renderItem={(client, index) => (
    <ClientCard key={client.id} client={client} />
  )}
  filter={(client) => client.status === 'active'}
  sort={(a, b) => a.name.localeCompare(b.name)}
  loading={loading}
  emptyMessage="Nenhum cliente encontrado"
/>
```

### MemoizedTable
Tabela otimizada com ordenação e filtros.

```tsx
import { MemoizedTable } from '@/shared/components/optimized'

const columns = [
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status', render: (value) => <StatusBadge status={value} /> }
]

<MemoizedTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  sortBy="name"
  sortDirection="asc"
  onSort={handleSort}
/>
```

### MemoizedGrid
Grid responsivo otimizado para exibição de cards.

```tsx
import { MemoizedGrid } from '@/shared/components/optimized'

<MemoizedGrid
  items={services}
  renderItem={(service) => <ServiceCard service={service} />}
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap={4}
  loading={loading}
/>
```

### MemoizedCard
Card otimizado com estados de loading e erro.

```tsx
import { MemoizedCard } from '@/shared/components/optimized'

<MemoizedCard
  title="Estatísticas"
  loading={loading}
  error={error}
  onRetry={refetch}
  headerActions={<Button>Atualizar</Button>}
>
  <StatisticsContent />
</MemoizedCard>
```

### MemoizedListItem
Item de lista otimizado com ações e status.

```tsx
import { MemoizedListItem } from '@/shared/components/optimized'

<MemoizedListItem
  id={client.id}
  title={client.name}
  subtitle={client.email}
  status={client.status}
  actions={[
    { label: 'Editar', icon: Edit, onClick: () => editClient(client.id) },
    { label: 'Excluir', icon: Trash, onClick: () => deleteClient(client.id), variant: 'destructive' }
  ]}
  onClick={() => viewClient(client.id)}
/>
```

## 🎣 Hooks de Memoização

### useMemoizedForm
Hook otimizado para gerenciamento de formulários.

```tsx
import { useMemoizedForm } from '@/shared/hooks/use-memoized-form'

const {
  values,
  errors,
  handleChange,
  handleSubmit,
  getFieldProps
} = useMemoizedForm({
  initialValues: { name: '', email: '' },
  onSubmit: async (values) => {
    await createUser(values)
  },
  validate: (values) => {
    const errors: any = {}
    if (!values.name) errors.name = 'Nome é obrigatório'
    if (!values.email) errors.email = 'Email é obrigatório'
    return errors
  }
})

// Uso em componente
<input {...getFieldProps('name')} />
<input {...getFieldProps('email')} />
```

### useMemoizedDashboardMetrics
Hook para memoização de métricas de dashboard.

```tsx
import { useMemoizedDashboardMetrics } from '@/shared/hooks/use-memoized-dashboard'

const metrics = useMemoizedDashboardMetrics({
  appointments,
  clients,
  services,
  transactions,
  dateRange: { start: startDate, end: endDate }
})
```

### useMemoizedChartData
Hook para memoização de dados de gráficos.

```tsx
import { useMemoizedChartData } from '@/shared/hooks/use-memoized-dashboard'

const chartData = useMemoizedChartData(transactions, 'day')
```

## 🛠 Utilitários de Performance

### useExpensiveMemo
Memoização com debug para cálculos pesados.

```tsx
import { useExpensiveMemo } from '@/shared/utils/memoization'

const expensiveCalculation = useExpensiveMemo(
  () => {
    return data.reduce((acc, item) => {
      // Cálculo complexo
      return acc + complexCalculation(item)
    }, 0)
  },
  [data],
  'expensive-calculation' // Nome para debug
)
```

### useStableCallback
Callback memoizado com debug.

```tsx
import { useStableCallback } from '@/shared/utils/memoization'

const handleClick = useStableCallback(
  (id: string) => {
    onItemClick(id)
  },
  [onItemClick],
  'item-click-handler'
)
```

### useDebounce
Debounce de valores.

```tsx
import { useDebounce } from '@/shared/utils/memoization'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearch) {
    searchItems(debouncedSearch)
  }
}, [debouncedSearch])
```

### useFilteredList
Filtro e ordenação memoizados.

```tsx
import { useFilteredList } from '@/shared/utils/memoization'

const filteredItems = useFilteredList(
  items,
  (item) => item.status === 'active',
  (a, b) => a.name.localeCompare(b.name)
)
```

## 📖 Guia de Uso

### Quando Usar Memoização

✅ **Use quando:**
- Componentes re-renderizam frequentemente
- Cálculos pesados são executados a cada render
- Listas grandes são filtradas/ordenadas
- Dados de dashboard são processados
- Formulários complexos com validação

❌ **Não use quando:**
- Componentes simples que raramente re-renderizam
- Dados mudam constantemente
- Overhead da memoização é maior que o benefício

### Identificando Oportunidades

1. **React DevTools Profiler**: Identifique componentes que re-renderizam frequentemente
2. **Console.time**: Meça tempo de cálculos pesados
3. **Performance.mark**: Marque pontos críticos de performance

### Medindo Impacto

```tsx
// Antes da otimização
console.time('component-render')
const result = expensiveCalculation(data)
console.timeEnd('component-render')

// Depois da otimização
const result = useExpensiveMemo(
  () => expensiveCalculation(data),
  [data],
  'expensive-calculation'
)
```

## 🎯 Boas Práticas

### 1. Memoização Estratégica
```tsx
// ✅ Bom - Memoizar cálculos pesados
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0)
}, [data])

// ❌ Ruim - Memoizar valores simples
const simpleValue = useMemo(() => props.value * 2, [props.value])
```

### 2. Dependências Corretas
```tsx
// ✅ Bom - Dependências específicas
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory)
}, [items, selectedCategory])

// ❌ Ruim - Dependências desnecessárias
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory)
}, [items, selectedCategory, unrelatedProp])
```

### 3. Comparação Customizada
```tsx
// Para casos específicos, use comparação customizada
const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.status === nextProps.status
  )
})
```

### 4. Keys Estáveis
```tsx
// ✅ Bom - Keys estáveis
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ Ruim - Keys instáveis
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

## 📊 Monitoramento de Performance

### Debug em Desenvolvimento
```tsx
// Ativar logs de performance
if (process.env.NODE_ENV === 'development') {
  // Logs automáticos dos hooks memoizados
}
```

### Métricas de Produção
```tsx
// Coletar métricas de performance
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.startsWith('memo-')) {
      // Enviar métricas para serviço de monitoramento
    }
  })
})
```

## 🔧 Troubleshooting

### Problema: Componente não está memoizando
**Solução**: Verifique se as dependências estão corretas e se os props não estão mudando desnecessariamente.

### Problema: Performance piorou após memoização
**Solução**: Remova a memoização desnecessária e foque apenas em cálculos pesados.

### Problema: Dados não atualizam
**Solução**: Verifique se todas as dependências necessárias estão incluídas no array de dependências.

## 📈 Resultados Esperados

Com a implementação correta da memoização estratégica, você deve observar:

- ⚡ **Redução de 30-50%** no tempo de re-render de listas grandes
- 🚀 **Melhoria de 20-40%** na responsividade de formulários complexos
- 📊 **Otimização de 40-60%** no processamento de dados de dashboard
- 💾 **Redução do uso de CPU** em componentes que re-renderizam frequentemente

## 🔗 Links Úteis

- [React.memo Documentation](https://react.dev/reference/react/memo)
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)