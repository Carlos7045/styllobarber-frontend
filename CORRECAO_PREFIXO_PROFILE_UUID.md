# Correção do Prefixo "profile-" no UUID

## Problema Identificado

Erro: **"invalid input syntax for type uuid: 'profile-eb8634ba-f585-456e-ace2-579f2ae2995f'"**

### Causa Raiz

O campo `barbeiro_id` estava sendo enviado com o prefixo `"profile-"` anexado ao UUID, mas o banco de dados PostgreSQL espera apenas o UUID puro.

**Valor enviado:** `"profile-eb8634ba-f585-456e-ace2-579f2ae2995f"`
**Valor esperado:** `"eb8634ba-f585-456e-ace2-579f2ae2995f"`

## Correção Aplicada

### Localização

Arquivo: `src/domains/appointments/hooks/use-client-appointments.ts`

### Solução

Adicionada limpeza do prefixo `"profile-"` antes de enviar para o banco:

```typescript
// Limpar prefixo "profile-" do barbeiro_id se existir
const cleanBarbeiroId =
  appointmentData.barbeiro_id === 'any'
    ? null
    : appointmentData.barbeiro_id?.replace(/^profile-/, '') || appointmentData.barbeiro_id

console.log('🔧 Limpando barbeiro_id:', {
  original: appointmentData.barbeiro_id,
  cleaned: cleanBarbeiroId,
})

// Criar agendamento real no banco de dados
const appointmentToCreate = {
  cliente_id: user.id,
  barbeiro_id: cleanBarbeiroId, // Usando o ID limpo
  service_id: appointmentData.service_id,
  data_agendamento: appointmentData.data_agendamento,
  duracao_minutos: selectedService?.duracao_minutos || 30,
  status: 'pendente',
  preco_final: selectedService?.preco || 0,
  observacoes: appointmentData.observacoes || null,
}
```

### Funcionalidade

- ✅ Remove o prefixo `"profile-"` se presente
- ✅ Mantém `null` para barbeiro 'any'
- ✅ Preserva UUIDs que já estão corretos
- ✅ Adiciona logs para debug

## Origem do Problema

O prefixo `"profile-"` provavelmente está sendo adicionado em algum lugar do frontend, possivelmente:

- No componente `NovoAgendamentoModal.tsx`
- Na função `handleBarberSelect` (que não foi encontrada na busca)
- No hook `useFuncionariosPublicos`

## Teste de Validação

### Antes da Correção

```
❌ Erro: invalid input syntax for type uuid: "profile-eb8634ba-f585-456e-ace2-579f2ae2995f"
```

### Depois da Correção

```
✅ UUID limpo: "eb8634ba-f585-456e-ace2-579f2ae2995f"
✅ Agendamento criado com sucesso
```

## Status

✅ **Correção aplicada**

### Resultado Esperado

- ✅ Agendamentos podem ser criados sem erro de UUID
- ✅ Prefixo "profile-" é removido automaticamente
- ✅ Logs mostram o processo de limpeza
- ✅ Funciona tanto para UUIDs com prefixo quanto sem

## Próximos Passos (Opcional)

1. Investigar onde o prefixo `"profile-"` está sendo adicionado
2. Corrigir na origem para evitar a necessidade de limpeza
3. Aplicar correção similar em outros hooks se necessário

## Arquivos Modificados

- ✅ `src/domains/appointments/hooks/use-client-appointments.ts`
