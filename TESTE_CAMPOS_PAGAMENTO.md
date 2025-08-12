# Teste: Campos de Pagamento

## Problema Identificado
O agendamento está mostrando "✓ Pago" mesmo sem ter feito o pagamento, quando deveria mostrar "❌ Não Pago" e o botão "💳 Pagar Serviço".

## Correções Aplicadas

### 1. Lógica do `needsPayment` Corrigida
```typescript
const needsPayment = useCallback((appointment: ClientAppointment): boolean => {
  // Se já foi pago, não precisa de pagamento
  if (appointment.payment_status === 'paid') {
    return false
  }

  // Se foi pago antecipadamente, não precisa de pagamento
  if (appointment.payment_method === 'advance') {
    return false
  }

  // Se o agendamento foi concluído, precisa de pagamento (a menos que já tenha sido pago)
  if (appointment.status === 'concluido') {
    // Se não tem payment_status definido OU está como pending, precisa pagar
    return !appointment.payment_status || appointment.payment_status === 'pending'
  }

  return false
}, [])
```

### 2. PaymentStatusBadge Atualizado
Agora prioriza mostrar "❌ Não Pago" quando `needsPayment` é true, independente de outros campos.

### 3. Fluxos de Pagamento

#### Cenário 1: Pagamento Antecipado
- Cliente faz agendamento e paga antecipadamente
- `payment_method = 'advance'`
- `payment_status = 'paid'`
- Badge: "✓ Pago Antecipado"
- Botão: Não aparece

#### Cenário 2: Pagamento no Local (Futuro)
- Cliente faz agendamento para pagar no local
- `payment_method = 'local'` ou `null`
- `payment_status = 'pending'` ou `null`
- Badge: "💰 Pagar no Local"
- Botão: Não aparece (agendamento futuro)

#### Cenário 3: Serviço Realizado - Não Pago
- Agendamento foi concluído mas não foi pago
- `status = 'concluido'`
- `payment_status = null` ou `'pending'`
- Badge: "❌ Não Pago"
- Botão: "💳 Pagar Serviço" aparece

#### Cenário 4: Serviço Realizado - Pago
- Agendamento foi concluído e foi pago
- `status = 'concluido'`
- `payment_status = 'paid'`
- Badge: "✓ Pago"
- Botão: Não aparece

## Como Testar

### 1. Aplicar Migração (quando possível)
```sql
-- Adicionar campos de pagamento
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('advance', 'cash', 'card', 'pix', 'local')),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0;
```

### 2. Criar Agendamento de Teste
```sql
-- Inserir agendamento concluído sem pagamento
INSERT INTO appointments (
  cliente_id, barbeiro_id, service_id, 
  data_agendamento, status, 
  payment_status, payment_method
) VALUES (
  'seu-user-id', 'barbeiro-id', 'service-id',
  '2025-02-10T10:00:00-03:00', 'concluido',
  null, null  -- Sem status de pagamento
);
```

### 3. Verificar no Dashboard
- Ir para histórico recente
- Ver agendamento com badge "❌ Não Pago"
- Ver botão "💳 Pagar Serviço"
- Clicar no botão deve redirecionar para página de pagamento

## Funcionalidades do Sistema

### Para o Cliente (App)
- Ver histórico de agendamentos
- Identificar quais serviços precisam de pagamento
- Pagar diretamente pelo app (PIX, Cartão)
- Receber confirmação de pagamento

### Para o Barbeiro (PDV)
- Buscar cliente e seus agendamentos
- Ver quais serviços estão pendentes de pagamento
- Processar pagamento no local (Dinheiro, Cartão, PIX)
- Atualizar status automaticamente

## Status Atual
✅ Lógica de `needsPayment` corrigida
✅ PaymentStatusBadge atualizado
✅ Botão de pagamento aparece corretamente
⏳ Migração precisa ser aplicada para testar completamente