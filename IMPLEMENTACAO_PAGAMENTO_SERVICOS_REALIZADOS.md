# Implementação: Pagamento de Serviços Realizados

## Resumo
Implementação do sistema de pagamento para serviços já realizados no histórico recente do cliente, complementando o sistema de pagamento antecipado já existente.

## Funcionalidades Implementadas

### 1. Campos de Pagamento na Base de Dados
- **payment_status**: 'pending' | 'paid' | 'failed' | 'refunded'
- **payment_method**: 'advance' | 'cash' | 'card' | 'pix' | 'local'
- **payment_date**: Data e hora do pagamento
- **asaas_payment_id**: ID do pagamento no Asaas
- **discount_applied**: Percentual de desconto aplicado

### 2. Tipos TypeScript Atualizados
- Adicionados tipos `PaymentStatus` e `PaymentMethod`
- Interface `Appointment` estendida com campos de pagamento
- Interface `ClientAppointment` com campos `canPay` e `needsPayment`
- Constantes para cores e labels dos status

### 3. Lógica de Negócio

#### Quando um serviço precisa de pagamento:
- Status do agendamento = 'concluido'
- payment_status ≠ 'paid'
- payment_method ≠ 'advance'

#### Quando um cliente pode pagar:
- Agendamento concluído
- Não foi cancelado
- Ainda não foi pago

### 4. Componentes Atualizados

#### AgendamentoCard
- Exibe status de pagamento com badge colorido
- Botão "💳 Pagar Serviço" para agendamentos que precisam de pagamento
- Integração com página de pagamento existente

#### PaymentStatusBadge (Novo)
- Componente reutilizável para exibir status de pagamento
- Cores consistentes baseadas no status
- Suporte a diferentes estados

### 5. Fluxo de Pagamento

#### Para Serviços Já Realizados:
1. Cliente vê agendamento concluído no histórico
2. Se não foi pago, aparece botão "Pagar Serviço"
3. Clica no botão → redireciona para página de pagamento
4. Escolhe método (PIX, Cartão, Dinheiro)
5. Processa pagamento via Asaas
6. Atualiza status no banco de dados
7. Retorna para lista de agendamentos

#### Para Pagamento Antecipado (Já Existia):
1. Cliente faz novo agendamento
2. Escolhe "Pagar Agora" com 10% desconto
3. Redireciona para página de pagamento
4. Agendamento criado com payment_method='advance'

### 6. Integração com Asaas
- Reutiliza serviço existente `asaasService`
- Suporte a PIX, Cartão e Dinheiro
- Geração de QR Code para PIX
- Tracking de pagamentos

### 7. Migração SQL
```sql
-- Adiciona campos de pagamento
ALTER TABLE appointments 
ADD COLUMN payment_status TEXT,
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_date TIMESTAMPTZ,
ADD COLUMN asaas_payment_id TEXT,
ADD COLUMN discount_applied DECIMAL(5,2);

-- Atualiza agendamentos existentes
UPDATE appointments 
SET payment_status = 'pending', payment_method = 'local'
WHERE status = 'concluido' AND payment_status IS NULL;
```

## Diferenças dos Sistemas

### Pagamento Antecipado (Já Existia)
- **Quando**: Durante criação do agendamento
- **Desconto**: 10% de desconto
- **Status**: payment_method = 'advance', payment_status = 'paid'
- **Fluxo**: Agendamento → Pagamento → Confirmação

### Pagamento Pós-Serviço (Novo)
- **Quando**: Após serviço realizado
- **Desconto**: Valor integral
- **Status**: payment_method = 'local', payment_status = 'pending' → 'paid'
- **Fluxo**: Serviço Realizado → Histórico → Pagamento

## Arquivos Modificados

### Tipos e Interfaces
- `src/types/appointments.ts` - Novos tipos e campos

### Hooks
- `src/domains/appointments/hooks/use-client-appointments.ts` - Lógica de pagamento

### Componentes
- `src/domains/users/components/client/AgendamentoCard.tsx` - UI do botão pagar
- `src/shared/components/ui/payment-status-badge.tsx` - Badge de status (novo)

### Páginas
- `src/app/dashboard/pagamento/page.tsx` - Suporte a pagamento de serviços

### Banco de Dados
- `supabase/migrations/20250211_add_payment_fields_to_appointments.sql` - Nova migração

## Como Testar

### 1. Criar Agendamento Concluído
```sql
INSERT INTO appointments (
  cliente_id, barbeiro_id, service_id, 
  data_agendamento, status, payment_status, payment_method
) VALUES (
  'user-id', 'barber-id', 'service-id',
  '2025-02-10T10:00:00-03:00', 'concluido', 'pending', 'local'
);
```

### 2. Verificar no Dashboard do Cliente
- Ir para histórico recente
- Ver agendamento com status "Pendente"
- Clicar em "💳 Pagar Serviço"
- Testar fluxo de pagamento

### 3. Verificar Diferentes Status
- `payment_status = 'paid'` → Badge verde "✓ Pago"
- `payment_status = 'pending'` → Badge amarelo "⏳ Pendente" + botão pagar
- `payment_method = 'advance'` → Não mostra botão pagar

## Benefícios

### Para o Cliente
- Pode pagar serviços realizados de forma conveniente
- Múltiplas opções de pagamento (PIX, Cartão, Dinheiro)
- Histórico claro de pagamentos

### Para a Barbearia
- Controle financeiro melhorado
- Redução de inadimplência
- Integração com gateway de pagamento
- Relatórios de pagamentos pendentes

### Para o Sistema
- Não duplica funcionalidades existentes
- Reutiliza infraestrutura de pagamento
- Mantém consistência de UX
- Fácil manutenção e extensão

## Próximos Passos (Opcionais)

1. **Notificações**: Lembrar clientes sobre pagamentos pendentes
2. **Relatórios**: Dashboard para barbeiros verem pagamentos pendentes
3. **Webhooks**: Atualização automática via webhooks do Asaas
4. **Parcelamento**: Opção de parcelar serviços mais caros
5. **Cashback**: Sistema de pontos/cashback para fidelização