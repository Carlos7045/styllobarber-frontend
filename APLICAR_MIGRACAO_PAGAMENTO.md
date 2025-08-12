# 🔧 Aplicar Migração de Campos de Pagamento

## 🎯 Problema Identificado

O erro `Could not find the 'asaas_payment_id' column` indica que a migração dos campos de pagamento não foi aplicada no banco de dados.

## ✅ Solução: Aplicar Migração Manual

### Opção 1: Via Supabase Dashboard

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Vá para seu projeto

2. **Abra o SQL Editor:**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Execute este SQL:**

```sql
-- Adicionar campos de pagamento à tabela appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('advance', 'cash', 'card', 'pix', 'local')),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN appointments.payment_status IS 'Status do pagamento: pending, paid, failed, refunded';
COMMENT ON COLUMN appointments.payment_method IS 'Método de pagamento: advance (antecipado), cash, card, pix, local';
COMMENT ON COLUMN appointments.payment_date IS 'Data e hora do pagamento';
COMMENT ON COLUMN appointments.asaas_payment_id IS 'ID do pagamento no Asaas';
COMMENT ON COLUMN appointments.discount_applied IS 'Percentual de desconto aplicado (ex: 10.00 para 10%)';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_method ON appointments(payment_method);
CREATE INDEX IF NOT EXISTS idx_appointments_asaas_payment_id ON appointments(asaas_payment_id);

-- Atualizar agendamentos existentes
UPDATE appointments 
SET payment_status = 'pending', 
    payment_method = 'local'
WHERE status = 'concluido' 
  AND payment_status IS NULL;

UPDATE appointments 
SET payment_status = 'pending', 
    payment_method = 'local'
WHERE status IN ('pendente', 'confirmado') 
  AND payment_status IS NULL;

UPDATE appointments 
SET payment_status = NULL, 
    payment_method = NULL
WHERE status = 'cancelado';
```

4. **Clique em "Run"** para executar

### Opção 2: Via Supabase CLI (se instalado)

```bash
# Aplicar migração específica
supabase db push

# Ou aplicar todas as migrações
supabase migration up
```

### Opção 3: Verificar se Já Foi Aplicada

Execute este SQL para verificar se as colunas existem:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name IN ('payment_status', 'payment_method', 'payment_date', 'asaas_payment_id', 'discount_applied')
ORDER BY column_name;
```

## 🔍 Verificação

Após aplicar a migração, você deve ver estas colunas:

- `payment_status` (TEXT)
- `payment_method` (TEXT) 
- `payment_date` (TIMESTAMPTZ)
- `asaas_payment_id` (TEXT)
- `discount_applied` (DECIMAL)

## 🚀 Teste Após Migração

1. **Aplique a migração** usando uma das opções acima
2. **Reinicie o servidor** Next.js
3. **Teste o pagamento** novamente
4. **Verifique se não há mais erro** de coluna não encontrada

## ⚠️ Importante

- **Faça backup** antes de aplicar migrações em produção
- **Teste primeiro** em ambiente de desenvolvimento
- **Verifique se todas as colunas** foram criadas corretamente

## ✅ Resultado Esperado

Após aplicar a migração:
- ✅ Colunas de pagamento criadas
- ✅ Erro de coluna não encontrada resolvido
- ✅ Sistema de pagamento funcionando
- ✅ Dados de pagamento sendo salvos

**Execute a migração e teste novamente! 🚀**