# Correção: Lógica de Pagamento no Histórico Recente

## Problema Identificado
O agendamento no histórico recente estava mostrando "✓ Pago" mesmo sem ter feito o pagamento, quando deveria mostrar "❌ Não Pago" e exibir o botão "💳 Pagar Serviço".

## Análise do Problema
A lógica anterior assumia que se não havia `payment_status` definido, o agendamento estava pago. Isso estava incorreto para agendamentos concluídos que ainda não foram pagos.

## Correções Aplicadas

### 1. Função `needsPayment` Corrigida
**Arquivo:** `src/domains/appointments/hooks/use-client-appointments.ts`

```typescript
// ❌ Lógica anterior (incorreta)
if (appointment.status === 'concluido' && appointment.payment_status !== 'paid') {
  return true
}

// ✅ Lógica corrigida
if (appointment.status === 'concluido') {
  // Se não tem payment_status definido OU está como pending, precisa pagar
  return !appointment.payment_status || appointment.payment_status === 'pending'
}
```

### 2. PaymentStatusBadge Priorizado
**Arquivo:** `src/shared/components/ui/payment-status-badge.tsx`

Agora a lógica prioriza mostrar "❌ Não Pago" quando `needsPayment` é true:

```typescript
// 1. PRIORIDADE MÁXIMA: Se precisa de pagamento
if (needsPayment) {
  displayLabel = '❌ Não Pago'
  colorClass = 'bg-red-100 text-red-800 border-red-200'
}
// 2. Se tem status de pagamento definido como pago
else if (status === 'paid') {
  displayLabel = '✓ Pago'
  colorClass = 'bg-green-100 text-green-800 border-green-200'
}
// ... outras condições
```

### 3. Script SQL para Adicionar Campos
**Arquivo:** `scripts/add_payment_fields.sql`

Execute este script no SQL Editor do Supabase para adicionar os campos de pagamento.

## Fluxos de Pagamento Corrigidos

### 🔄 Fluxo 1: Pagamento Antecipado
1. Cliente faz agendamento
2. Escolhe "Pagar Agora" (10% desconto)
3. Processa pagamento via Asaas
4. Agendamento criado com:
   - `payment_method = 'advance'`
   - `payment_status = 'paid'`
5. Badge: "✓ Pago Antecipado"
6. Botão: Não aparece

### 🔄 Fluxo 2: Pagamento no Local (Futuro)
1. Cliente faz agendamento
2. Escolhe "Pagar no Local"
3. Agendamento criado com:
   - `payment_method = 'local'`
   - `payment_status = 'pending'`
4. Badge: "💰 Pagar no Local"
5. Botão: Não aparece (agendamento futuro)

### 🔄 Fluxo 3: Serviço Realizado - Precisa Pagar ⭐
1. Agendamento foi concluído
2. Status: `status = 'concluido'`
3. Pagamento: `payment_status = null` ou `'pending'`
4. Badge: "❌ Não Pago"
5. Botão: "💳 Pagar Serviço" **APARECE**
6. Cliente clica → Redireciona para página de pagamento
7. Após pagamento → `payment_status = 'paid'`

### 🔄 Fluxo 4: Pagamento via PDV (Barbeiro)
1. Barbeiro acessa PDV
2. Busca cliente e agendamentos pendentes
3. Processa pagamento (Dinheiro/Cartão/PIX)
4. Sistema atualiza automaticamente:
   - `payment_status = 'paid'`
   - `payment_method = 'cash'/'card'/'pix'`
   - `payment_date = now()`

## Como Testar

### 1. Aplicar Script SQL
Execute o arquivo `scripts/add_payment_fields.sql` no Supabase SQL Editor.

### 2. Criar Agendamento de Teste
```sql
-- Simular agendamento concluído sem pagamento
UPDATE appointments 
SET status = 'concluido',
    payment_status = NULL,
    payment_method = NULL
WHERE id = 'seu-agendamento-id';
```

### 3. Verificar no Dashboard
- Ir para histórico recente
- Ver badge "❌ Não Pago"
- Ver botão "💳 Pagar Serviço"
- Clicar deve redirecionar para `/dashboard/pagamento`

## Benefícios da Correção

### Para o Cliente
- ✅ Vê claramente quais serviços precisam de pagamento
- ✅ Pode pagar diretamente pelo app
- ✅ Histórico claro de pagamentos

### Para a Barbearia
- ✅ Controle financeiro melhorado
- ✅ Redução de inadimplência
- ✅ Pagamentos via app ou PDV
- ✅ Relatórios de pagamentos pendentes

### Para o Sistema
- ✅ Lógica consistente de pagamentos
- ✅ Integração com gateway Asaas
- ✅ Auditoria completa de transações
- ✅ Flexibilidade de métodos de pagamento

## Status
✅ **Lógica corrigida**
✅ **Componentes atualizados**
✅ **Script SQL criado**
⏳ **Aguardando aplicação da migração para teste completo**