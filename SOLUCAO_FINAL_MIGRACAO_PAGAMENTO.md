# 🎯 Solução Final: Migração de Campos de Pagamento

## 🔍 Problema Identificado

O erro `Could not find the 'asaas_payment_id' column` indica que a tabela `appointments` não tem os campos de pagamento necessários.

## ✅ Soluções Disponíveis

### Opção 1: Página de Migração (Mais Fácil)

1. **Acesse a página de migração:**
   ```
   http://localhost:3000/admin/migrate-payments
   ```

2. **Clique em "Verificar se Colunas Existem"**
   - Se der erro → continue para o passo 3
   - Se funcionar → pule para o passo 4

3. **Clique em "Aplicar Migração"**
   - Aguarde a conclusão
   - Verifique se aparece "✅ Migração aplicada com sucesso!"

4. **Teste o sistema de pagamento**

5. **Delete a página** `src/app/admin/migrate-payments/page.tsx` após usar

### Opção 2: Supabase Dashboard (Manual)

1. **Acesse:** https://supabase.com/dashboard
2. **Vá para:** SQL Editor
3. **Execute este SQL:**

```sql
-- Adicionar campos de pagamento
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0;

-- Atualizar dados existentes
UPDATE appointments 
SET payment_status = 'pending', 
    payment_method = 'local'
WHERE status = 'concluido' 
  AND payment_status IS NULL;
```

## 🚀 Após Aplicar a Migração

### 1. Teste o Sistema
- Acesse a página de pagamento
- Teste PIX e Cartão
- Verifique se não há mais erro de coluna

### 2. Logs Esperados
```
✅ USANDO API REAL DO ASAAS
🔄 Fazendo requisição via API route: /api/asaas/customers
🔄 Fazendo requisição via API route: /api/asaas/payments
💳 Atualizando status do agendamento: appointment_123
✅ Agendamento atualizado com sucesso
```

### 3. Verificação no Banco
As colunas devem existir:
- `payment_status` - Status do pagamento
- `payment_method` - Método usado
- `payment_date` - Data do pagamento
- `asaas_payment_id` - ID do Asaas
- `discount_applied` - Desconto aplicado

## 🔧 Estrutura Final da Tabela

```sql
appointments (
  id UUID PRIMARY KEY,
  cliente_id UUID,
  barbeiro_id UUID,
  service_id UUID,
  data_agendamento TIMESTAMPTZ,
  status TEXT,
  observacoes TEXT,
  preco_final DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  -- Novos campos de pagamento
  payment_status TEXT,      -- 'pending', 'paid', 'failed', 'refunded'
  payment_method TEXT,      -- 'advance', 'cash', 'card', 'pix', 'local'
  payment_date TIMESTAMPTZ, -- Data do pagamento
  asaas_payment_id TEXT,    -- ID do pagamento no Asaas
  discount_applied DECIMAL  -- Percentual de desconto
)
```

## ✅ Checklist Final

- [ ] Migração aplicada (via página ou SQL manual)
- [ ] Colunas criadas na tabela appointments
- [ ] Sistema de pagamento testado
- [ ] PIX funcionando (QR Code real)
- [ ] Cartão funcionando (sem erro)
- [ ] Dados sendo salvos no banco
- [ ] Página de migração deletada (se usou)

## 🎯 Status Esperado

Após aplicar a migração:
- ✅ Erro de coluna resolvido
- ✅ Pagamentos funcionando
- ✅ API real do Asaas ativa
- ✅ Dados salvos no banco
- ✅ Sistema completo funcionando

**Aplique a migração e teste! 🚀**