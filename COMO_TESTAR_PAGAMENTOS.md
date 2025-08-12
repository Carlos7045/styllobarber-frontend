# Como Testar o Sistema de Pagamentos

## 🎯 Objetivo
Verificar se o sistema está detectando corretamente serviços que precisam de pagamento e mostrando o botão "💳 Pagar Serviço".

## 📋 Cenários de Teste

### ✅ **Cenário 1: Serviço Concluído Sem Pagamento**
- **Status**: `concluido`
- **Payment Status**: `pending` ou `NULL`
- **Payment Method**: `local` ou `NULL`
- **Data**: No passado
- **Resultado Esperado**: Badge "❌ Não Pago" + Botão "💳 Pagar Serviço"

### ✅ **Cenário 2: Serviço Confirmado no Passado**
- **Status**: `confirmado`
- **Payment Status**: `pending` ou `NULL`
- **Payment Method**: `local` ou `NULL`
- **Data**: No passado (já passou da hora)
- **Resultado Esperado**: Badge "❌ Não Pago" + Botão "💳 Pagar Serviço"

### ❌ **Cenário 3: Serviço Pago Antecipadamente**
- **Status**: `concluido`
- **Payment Status**: `paid`
- **Payment Method**: `advance`
- **Data**: Qualquer
- **Resultado Esperado**: Badge "✨ Pago Antecipado" + SEM botão pagar

### ❌ **Cenário 4: Agendamento Futuro**
- **Status**: `confirmado` ou `pendente`
- **Payment Status**: Qualquer
- **Payment Method**: `local`
- **Data**: No futuro
- **Resultado Esperado**: Badge "💰 Pagar no Local" + SEM botão pagar

## 🔧 Como Testar

### **Passo 1: Aplicar Migração**
Execute a migração SQL no Supabase:
```sql
-- Arquivo: supabase/migrations/20250211_add_payment_fields_to_appointments.sql
```

### **Passo 2: Criar Dados de Teste**
Execute o script de teste no SQL Editor do Supabase:
```sql
-- Arquivo: TESTE_PAGAMENTOS_PENDENTES.sql
```

### **Passo 3: Verificar no Dashboard**
1. Acesse o dashboard do cliente
2. Vá para "Histórico Recente"
3. Verifique se aparecem:
   - Badge "❌ Não Pago" para serviços que precisam de pagamento
   - Botão "💳 Pagar Serviço" vermelho e destacado
   - Debug info mostrando os valores corretos

### **Passo 4: Testar Fluxo de Pagamento**
1. Clique no botão "💳 Pagar Serviço"
2. Deve redirecionar para `/dashboard/pagamento?type=service&appointment=ID`
3. Escolha um método de pagamento
4. Confirme o pagamento
5. Verifique se o status foi atualizado

## 🐛 Debug e Troubleshooting

### **Debug Info Visível**
O AgendamentoCard agora mostra informações de debug:
```
🔍 DEBUG PAGAMENTO:
needsPayment: true/false
canPay: true/false
payment_status: paid/pending/null
payment_method: advance/local/null
status: concluido/confirmado
isPast: true/false
data: 10/02/2025 10:00:00
agora: 11/02/2025 15:30:00
```

### **Console Logs**
Verifique o console do navegador para logs detalhados:
- `🔍 Agendamento:` - Informações de cada agendamento processado
- `🧪 TESTE PAGAMENTO:` - Dados completos quando clicar no botão debug

### **Possíveis Problemas**

#### **1. Botão não aparece**
- Verifique se `needsPayment()` retorna `true`
- Verifique se `canPay()` retorna `true`
- Verifique se `isPast` é `true`
- Verifique se `showActions` é `true`

#### **2. Status incorreto**
- Verifique os campos `payment_status` e `payment_method` no banco
- Verifique se a data do agendamento está no passado
- Verifique se o status é `concluido` ou `confirmado`

#### **3. Lógica não funciona**
- Verifique se a migração foi aplicada
- Verifique se os dados de teste foram inseridos
- Verifique se o hook `useClientAppointments` está sendo usado

## 📊 Verificação Manual no Banco

```sql
-- Verificar agendamentos que DEVEM mostrar botão pagar
SELECT 
  id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  CASE 
    WHEN data_agendamento <= NOW() THEN '✅ PASSADO'
    ELSE '❌ FUTURO'
  END as tempo,
  CASE 
    WHEN status = 'concluido' AND (payment_status IS NULL OR payment_status = 'pending') AND (payment_method IS NULL OR payment_method != 'advance') THEN '💳 PRECISA PAGAR'
    WHEN status = 'confirmado' AND data_agendamento <= NOW() AND (payment_status IS NULL OR payment_status = 'pending') THEN '💳 PRECISA PAGAR'
    WHEN payment_status = 'paid' OR payment_method = 'advance' THEN '✅ JÁ PAGO'
    ELSE '⏸️ NÃO PRECISA PAGAR'
  END as situacao_pagamento
FROM appointments 
WHERE cliente_id = 'SEU_USER_ID'
ORDER BY data_agendamento DESC;
```

## ✅ Resultado Esperado

Após aplicar as correções, você deve ver:

1. **Histórico Recente** com agendamentos passados mostrando:
   - Badge "❌ Não Pago" (vermelho) para serviços não pagos
   - Botão "💳 Pagar Serviço" (vermelho, destacado)
   - Badge "✨ Pago Antecipado" (verde esmeralda) para pagamentos antecipados
   - Badge "✅ Pago" (verde) para pagamentos no local

2. **Fluxo de Pagamento** funcionando:
   - Redirecionamento correto para página de pagamento
   - Métodos de pagamento disponíveis (PIX, Cartão, Dinheiro)
   - Atualização automática do status após pagamento

3. **Debug Info** mostrando valores corretos:
   - `needsPayment: true` para serviços não pagos
   - `canPay: true` para serviços que podem ser pagos
   - `isPast: true` para agendamentos no passado

## 🚀 Próximos Passos

Após confirmar que está funcionando:
1. Remover as informações de debug
2. Testar com dados reais
3. Aplicar em produção
4. Monitorar logs de pagamento