# 🎯 Solução: CPF Obrigatório para Cobranças PIX

## ✅ **Problema Identificado**

### **Erro Específico da API Asaas:**
```
invalid_customer.cpfCnpj: Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente.
```

### **Causa:**
- Cliente criado sem CPF/CNPJ
- API Asaas exige CPF/CNPJ para cobranças PIX
- Campo obrigatório para pagamentos instantâneos

## 🔧 **Correção Aplicada**

### **Antes:**
```typescript
body: JSON.stringify({
  name: 'Cliente Teste API',
  email: `teste-${Date.now()}@exemplo.com`,
  phone: '11987654321',
  mobilePhone: '11987654321',
}),
```

### **Depois:**
```typescript
body: JSON.stringify({
  name: 'Cliente Teste API',
  email: `teste-${Date.now()}@exemplo.com`,
  phone: '11987654321',
  mobilePhone: '11987654321',
  cpfCnpj: '11144477735', // CPF válido de teste para sandbox
}),
```

## 📋 **CPFs de Teste Válidos (Sandbox)**

### **Para Testes (CPFs Válidos):**
- `11144477735` - CPF válido de teste (usado no código)
- `12345678909` - CPF válido alternativo
- `98765432100` - CPF válido alternativo

### **Formato Aceito:**
- **Apenas números:** `12345678901`
- **Com formatação:** `123.456.789-01`
- **Ambos funcionam** na API Asaas

## 🧪 **Teste Agora**

### 1. **Reinicie o servidor:**
```bash
npm run dev
```

### 2. **Execute o teste:**
1. Acesse: `http://localhost:3000/debug/asaas-test`
2. Clique em "🚀 Testar Criação de Cliente + Cobrança PIX"

### 3. **Resultado Esperado:**
```json
{
  "success": true,
  "customer": {
    "id": "cus_123456789",
    "name": "Cliente Teste API",
    "email": "teste-1234567890@exemplo.com",
    "phone": "(11) 98765-4321",
    "mobilePhone": "(11) 98765-4321",
    "cpfCnpj": "11144477735"
  },
  "payment": {
    "id": "pay_123456789",
    "status": "PENDING",
    "billingType": "PIX",
    "value": 25.00,
    "pixTransaction": {
      "qrCode": "...",
      "copyAndPaste": "..."
    }
  },
  "message": "API do Asaas funcionando! Verifique o painel em https://sandbox.asaas.com/"
}
```

## 🎯 **Validação no Painel Asaas**

### **Após o teste bem-sucedido:**
1. **Acesse:** https://sandbox.asaas.com/
2. **Vá em:** "Cobranças"
3. **Verifique:**
   - ✅ Nova cobrança PIX criada
   - ✅ Status: "Aguardando pagamento"
   - ✅ Valor: R$ 25,00
   - ✅ Cliente com CPF preenchido

### **Se aparecer a cobrança = API real funcionando! ✅**

## 📚 **Documentação de Referência**

### **Campos Obrigatórios para PIX (Asaas):**
- ✅ `customer` - ID do cliente
- ✅ `billingType` - "PIX"
- ✅ `value` - Valor da cobrança
- ✅ `customer.cpfCnpj` - CPF ou CNPJ do cliente

### **Campos Opcionais:**
- `dueDate` - Data de vencimento
- `description` - Descrição da cobrança
- `externalReference` - Referência externa

## 🎉 **Próximos Passos**

### **Se o teste funcionar:**
1. ✅ API Asaas completamente funcional
2. ✅ Integração com sistema real
3. ✅ Implementar no PDV
4. ✅ Testar outros tipos de pagamento

### **Implementação no Sistema:**
- Sempre incluir CPF/CNPJ ao criar clientes
- Validar CPF antes de enviar para API
- Tratar erros específicos da API Asaas

---

**Status:** 🔄 Correção aplicada - Aguardando teste final
**Data:** 2025-02-08
**Arquivo:** `src/app/debug/asaas-test/page.tsx`
**Próximo:** Teste completo da integração PIX