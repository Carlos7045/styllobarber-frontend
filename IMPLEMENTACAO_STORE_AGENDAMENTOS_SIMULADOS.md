# Implementação do Store de Agendamentos Simulados

## Problema Identificado

Os agendamentos criados durante o desenvolvimento não apareciam nas páginas de listagem (cliente e admin) porque eram apenas simulados localmente e não persistidos em nenhum lugar.

## Solução Implementada

Criamos um **store global temporário** que mantém os agendamentos simulados em memória e os disponibiliza para todas as páginas da aplicação.

## Arquitetura da Solução

### 1. Store Centralizado (`src/shared/stores/mock-appointments-store.ts`)

```typescript
// Store global em memória
let mockAppointmentsStore: any[] = []

// Sistema de listeners para reatividade
let listeners: (() => void)[] = []
```

### 2. Funções Principais

#### Gerenciamento de Dados

```typescript
// Adicionar agendamento
export const addMockAppointment = (appointment: any) => {
  mockAppointmentsStore.push(appointment)
  // Notificar todos os listeners
  listeners.forEach((listener) => listener())
}

// Obter agendamentos
export const getMockAppointments = () => [...mockAppointmentsStore]

// Filtrar por cliente
export const getMockAppointmentsByClient = (clientId: string) =>
  mockAppointmentsStore.filter((apt) => apt.cliente_id === clientId)

// Atualizar status
export const updateMockAppointmentStatus = (id: string, status: string) => {
  // Atualizar e notificar listeners
}
```

#### Sistema de Reatividade

```typescript
// Adicionar listener
export const addMockAppointmentsListener = (listener: () => void) => {
  listeners.push(listener)
  return () => (listeners = listeners.filter((l) => l !== listener))
}
```

### 3. Hooks React

#### Hook para Cliente

```typescript
export const useMockAppointmentsClient = (clientId: string) => {
  const [appointments, setAppointments] = useState(getMockAppointmentsByClient(clientId))

  useEffect(() => {
    const unsubscribe = addMockAppointmentsListener(() => {
      setAppointments(getMockAppointmentsByClient(clientId))
    })
    return unsubscribe
  }, [clientId])

  return { appointments, addAppointment, updateStatus, removeAppointment }
}
```

#### Hook para Admin

```typescript
export const useMockAppointmentsAdmin = () => {
  const [appointments, setAppointments] = useState(getAllMockAppointments())

  useEffect(() => {
    const unsubscribe = addMockAppointmentsListener(() => {
      setAppointments(getAllMockAppointments())
    })
    return unsubscribe
  }, [])

  return { appointments, addAppointment, updateStatus, removeAppointment }
}
```

## Integração com Hooks Existentes

### 1. Hook do Cliente (`use-client-appointments.ts`)

```typescript
// Import do store
import { useMockAppointmentsClient } from '@/shared/stores/mock-appointments-store'

// Usar o hook
const { appointments: mockAppointments } = useMockAppointmentsClient(user?.id || '')

// Combinar com agendamentos reais
const appointments = useMemo(() => {
  const realAppointments = allAppointments.filter((apt) => apt.cliente_id === user.id)
  const allClientAppointments = [...realAppointments, ...mockAppointments]

  return allClientAppointments.map((appointment) => ({
    ...appointment,
    canCancel: canCancelAppointment(appointment.id),
    canReschedule: canRescheduleAppointment(appointment.id),
    // ... outras propriedades
  }))
}, [allAppointments, mockAppointments, user?.id])
```

### 2. Hook do Admin (`use-admin-agendamentos.ts`)

```typescript
// Import do store
import { useMockAppointmentsAdmin } from '@/shared/stores/mock-appointments-store'

// Usar o hook
const { appointments: mockAppointments } = useMockAppointmentsAdmin()

// Combinar na função fetchAgendamentos
const allAppointments = [...(data || []), ...mockAppointments]

const agendamentosProcessados = allAppointments.map((agendamento) => ({
  ...agendamento,
  pode_cancelar: hoursUntilAppointment >= 2,
  pode_reagendar: hoursUntilAppointment >= 12,
  // ... outras propriedades
}))
```

### 3. Criação de Agendamentos

```typescript
// Na função createAppointment
const mockAppointment = {
  id: `mock-${Date.now()}`,
  ...appointmentData,
  cliente_id: user.id,
  status: 'pendente',
  created_at: new Date().toISOString(),
}

// Adicionar ao store global
addMockAppointment(mockAppointment)
```

## Funcionalidades Implementadas

### 1. Reatividade Automática

- ✅ **Listeners**: Componentes se atualizam automaticamente quando agendamentos são adicionados
- ✅ **Cleanup**: Listeners são removidos quando componentes são desmontados
- ✅ **Performance**: Apenas componentes interessados são notificados

### 2. Filtragem por Contexto

- ✅ **Cliente**: Vê apenas seus próprios agendamentos
- ✅ **Admin**: Vê todos os agendamentos (reais + simulados)
- ✅ **Filtros**: Suporta filtros por data, status, barbeiro, etc.

### 3. Operações CRUD

- ✅ **Create**: Adicionar novos agendamentos
- ✅ **Read**: Listar agendamentos com filtros
- ✅ **Update**: Atualizar status dos agendamentos
- ✅ **Delete**: Remover/cancelar agendamentos

### 4. Logs Informativos

```typescript
console.log('📝 Agendamento adicionado ao store temporário:', appointment)
console.log('📋 Total de agendamentos no store:', mockAppointmentsStore.length)
console.log('📋 Combinando agendamentos:', {
  reais: realAppointments.length,
  simulados: mockAppointments.length,
  total: realAppointments.length + mockAppointments.length,
})
```

## Exemplo de Fluxo Completo

### 1. Usuário Cria Agendamento

```typescript
// Modal de agendamento
const appointment = await createAppointment({
  service_id: 'service-123',
  barbeiro_id: 'barber-456',
  data_agendamento: '2024-01-15T10:00:00-03:00',
})

// Função createAppointment
const mockAppointment = {
  id: 'mock-1705123456789',
  service_id: 'service-123',
  barbeiro_id: 'barber-456',
  data_agendamento: '2024-01-15T10:00:00-03:00',
  cliente_id: 'user-123',
  status: 'pendente',
}

addMockAppointment(mockAppointment) // Adiciona ao store global
```

### 2. Store Notifica Componentes

```typescript
// Todos os listeners são chamados
listeners.forEach((listener) => listener())

// Componentes se atualizam automaticamente
// - Página de agendamentos do cliente
// - Agenda do admin
// - Dashboard com estatísticas
```

### 3. Dados Aparecem nas Páginas

```typescript
// Página do Cliente
const { appointments } = useMockAppointmentsClient('user-123')
// appointments = [mockAppointment] ✅

// Página do Admin
const { appointments } = useMockAppointmentsAdmin()
// appointments = [mockAppointment] ✅
```

## Benefícios da Implementação

### 1. UX Completa

- ✅ **Agendamentos visíveis**: Aparecem imediatamente nas páginas
- ✅ **Reatividade**: Atualizações automáticas sem refresh
- ✅ **Consistência**: Mesmo comportamento que dados reais

### 2. Desenvolvimento Ágil

- ✅ **Não bloqueia**: Desenvolvimento pode continuar normalmente
- ✅ **Testes completos**: QA pode testar fluxos end-to-end
- ✅ **Demos funcionais**: Apresentações mostram funcionalidade completa

### 3. Arquitetura Preparada

- ✅ **Fácil migração**: Quando banco estiver pronto, é só trocar a fonte
- ✅ **Interface consistente**: Mesma API para dados reais e simulados
- ✅ **Logs detalhados**: Facilita debug e implementação futura

## Limitações Temporárias

### 1. Persistência

- ⚠️ **Memória apenas**: Dados são perdidos ao recarregar a página
- ⚠️ **Não compartilhado**: Cada sessão tem seu próprio store
- ⚠️ **Sem backup**: Dados não são salvos em lugar nenhum

### 2. Escalabilidade

- ⚠️ **Limite de memória**: Muitos agendamentos podem consumir RAM
- ⚠️ **Performance**: Filtros são feitos em JavaScript, não no banco
- ⚠️ **Sincronização**: Não há sincronização entre abas/dispositivos

## Próximos Passos

### 1. Implementação Real (Futuro)

```typescript
// Substituir store por queries reais
const { data: realAppointments } = await supabase
  .from('agendamentos')
  .select('*')
  .eq('cliente_id', userId)

// Manter mesma interface
return realAppointments.map((appointment) => ({
  ...appointment,
  canCancel: canCancelAppointment(appointment.id),
  // ... outras propriedades
}))
```

### 2. Migração Gradual

1. **Manter store**: Para compatibilidade durante transição
2. **Implementar queries**: Adicionar busca real do banco
3. **Combinar fontes**: Mostrar dados reais + simulados
4. **Remover store**: Quando não precisar mais de simulação

### 3. Melhorias Opcionais

- **LocalStorage**: Persistir dados entre sessões
- **IndexedDB**: Para grandes volumes de dados
- **Service Worker**: Para funcionalidade offline

## Status Atual

### ✅ Funcionando

- Criação de agendamentos simulados
- Listagem na página do cliente
- Listagem na agenda do admin
- Reatividade automática
- Logs informativos

### ⏳ Pendente (Implementação Real)

- Persistência no banco de dados
- Queries reais do Supabase
- Relacionamentos com outras tabelas
- Validações de integridade

## Impacto

### Positivo

- **UX completa**: Usuários veem agendamentos criados
- **Desenvolvimento contínuo**: Não bloqueia outras funcionalidades
- **Testes possíveis**: QA pode validar fluxos completos
- **Demos realistas**: Apresentações funcionam perfeitamente

### Temporário

- **Dados não persistem**: Perdidos ao recarregar página
- **Sem validações reais**: Não verifica conflitos no banco
- **Performance limitada**: Filtros em JavaScript

A implementação permite que o sistema funcione completamente durante o desenvolvimento, e quando a estrutura do banco estiver definida, podemos migrar gradualmente para dados reais sem impactar a experiência do usuário.
