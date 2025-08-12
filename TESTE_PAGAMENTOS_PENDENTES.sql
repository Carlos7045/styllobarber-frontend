-- Script para testar pagamentos pendentes
-- Execute este script no SQL Editor do Supabase para criar agendamentos de teste

-- 1. Criar agendamento concluído sem pagamento (deve mostrar botão pagar)
INSERT INTO appointments (
  id,
  cliente_id,
  barbeiro_id,
  service_id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'client' LIMIT 1), -- Pegar um cliente
  (SELECT id FROM profiles WHERE role = 'barber' LIMIT 1), -- Pegar um barbeiro
  (SELECT id FROM services LIMIT 1), -- Pegar um serviço
  '2025-02-10 10:00:00-03:00', -- Data no passado
  'concluido', -- Status concluído
  'pending', -- Pagamento pendente
  'local', -- Método local
  45.00, -- Preço
  NOW(),
  NOW()
);

-- 2. Criar agendamento confirmado no passado sem pagamento (deve mostrar botão pagar)
INSERT INTO appointments (
  id,
  cliente_id,
  barbeiro_id,
  service_id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'client' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'barber' LIMIT 1),
  (SELECT id FROM services LIMIT 1),
  '2025-02-09 14:30:00-03:00', -- Data no passado
  'confirmado', -- Status confirmado mas no passado
  NULL, -- Sem status de pagamento
  NULL, -- Sem método de pagamento
  35.00,
  NOW(),
  NOW()
);

-- 3. Criar agendamento pago antecipadamente (NÃO deve mostrar botão pagar)
INSERT INTO appointments (
  id,
  cliente_id,
  barbeiro_id,
  service_id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  discount_applied,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'client' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'barber' LIMIT 1),
  (SELECT id FROM services LIMIT 1),
  '2025-02-08 16:00:00-03:00',
  'concluido',
  'paid', -- Pago
  'advance', -- Antecipado
  22.50, -- Preço com desconto (25 * 0.9)
  10.00, -- 10% de desconto
  NOW(),
  NOW()
);

-- 4. Criar agendamento futuro (NÃO deve mostrar botão pagar)
INSERT INTO appointments (
  id,
  cliente_id,
  barbeiro_id,
  service_id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'client' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'barber' LIMIT 1),
  (SELECT id FROM services LIMIT 1),
  '2025-02-15 11:00:00-03:00', -- Data futura
  'confirmado',
  'pending',
  'local',
  30.00,
  NOW(),
  NOW()
);

-- Verificar os agendamentos criados
SELECT 
  id,
  data_agendamento,
  status,
  payment_status,
  payment_method,
  preco_final,
  CASE 
    WHEN data_agendamento <= NOW() THEN 'PASSADO'
    ELSE 'FUTURO'
  END as tempo,
  CASE 
    WHEN status = 'concluido' AND (payment_status IS NULL OR payment_status = 'pending') AND payment_method != 'advance' THEN 'PRECISA PAGAR'
    WHEN status = 'confirmado' AND data_agendamento <= NOW() AND (payment_status IS NULL OR payment_status = 'pending') THEN 'PRECISA PAGAR'
    WHEN payment_status = 'paid' OR payment_method = 'advance' THEN 'JÁ PAGO'
    ELSE 'NÃO PRECISA PAGAR'
  END as situacao_pagamento
FROM appointments 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY data_agendamento DESC;