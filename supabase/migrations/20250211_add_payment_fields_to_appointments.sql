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
-- Agendamentos com status 'concluido' que não têm payment_status definido ficam como 'pending'
UPDATE appointments 
SET payment_status = 'pending', 
    payment_method = 'local'
WHERE status = 'concluido' 
  AND payment_status IS NULL;

-- Agendamentos futuros ficam como 'pending' com pagamento 'local' por padrão
UPDATE appointments 
SET payment_status = 'pending', 
    payment_method = 'local'
WHERE status IN ('pendente', 'confirmado') 
  AND payment_status IS NULL;

-- Agendamentos cancelados não precisam de pagamento
UPDATE appointments 
SET payment_status = NULL, 
    payment_method = NULL
WHERE status = 'cancelado';