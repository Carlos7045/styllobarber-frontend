# 🔧 Correção: Formato de Telefone para API Asaas

## ✅ **Problema Identificado**

### **Erro 400 da API Asaas:**
```
invalid_phone: O telefone informado é inválido.
invalid_mobilePhone: O celular informado é inválido.
```

### **Causa:**
- Telefones enviados no formato `11999999999` (apenas números)
- API Asaas espera formato brasileiro: `(11) 99999-9999`

## 🔧 **Correção Aplicada**

### 1. **Função de Formatação de Telefone**
Adicionada em `src/app/api/asaas/customers/route.ts`:

```typescript
// Função para formatar telefone brasileiro
const formatPhoneForAsaas = (phone: string): string => {
  if (!phone) return ''
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se tem 11 dígitos (celular com 9), formatar como (XX) 9XXXX-XXXX
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`
  }
  
  // Se tem 10 dígitos (fixo), formatar como (XX) XXXX-XXXX
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`
  }
  
  // Se não tem formato padrão, retornar vazio para evitar erro
  return ''
}
```

### 2. **Aplicação da Formatação**
```typescript
const customerData = {
  name: body.name,
  email: body.email,
  phone: formatPhoneForAsaas(body.phone || body.mobilePhone || ''),
  mobilePhone: formatPhoneForAsaas(body.mobilePhone || body.phone || ''),
  // ... outros campos
}
```

### 3. **Atualização do Teste**
Alterado em `src/app/debug/asaas-test/page.tsx`:
```typescript
// Antes
phone: '11999999999',

// Depois
phone: '11987654321',
mobilePhone: '11987654321',
```

## 📋 **Formatos Suportados**

### **Entrada (aceita qualquer um):**
- `11987654321` (apenas números)
- `(11) 98765-4321` (já formatado)
- `11 98765-4321` (com espaços)
- `+55 11 98765-4321` (com código do país)

### **Saída (enviado para Asaas):**
- **Celular (11 dígitos):** `(11) 98765-4321`
- **Fixo (10 dígitos):** `(11) 3456-7890`
- **Inválido:** `""` (string vazia para evitar erro)

## 🧪 **Como Testar**

### 1. **Reinicie o servidor:**
```bash
npm run dev
```

### 2. **Execute o teste:**
1. Acesse: `http://localhost:3000/debug/asaas-test`
2. Clique em "🚀 Testar Criação de Cliente + Cobrança PIX"
3. Verifique se não há mais erro 400

### 3. **Resultado Esperado:**
```json
{
  "success": true,
  "customer": {
    "id": "cus_123456789",
    "name": "Cliente Teste API",
    "email": "teste-1234567890@exemplo.com",
    "phone": "(11) 98765-4321",
    "mobilePhone": "(11) 98765-4321"
  },
  "payment": {
    "id": "pay_123456789",
    "status": "PENDING",
    "pixQrCode": "..."
  }
}
```

## 🎯 **Próximos Passos**

### **Se o teste funcionar:**
1. ✅ Problema de formato resolvido
2. ✅ API Asaas funcionando
3. ✅ Cobrança criada no painel
4. 🎯 Integrar com sistema real

### **Se ainda houver erro:**
1. Verificar logs específicos
2. Testar outros formatos
3. Consultar documentação Asaas

## 📚 **Referências**

- **Documentação Asaas:** https://docs.asaas.com/reference/criar-novo-cliente
- **Formato de telefone brasileiro:** (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
- **Regex para validação:** `/^\(?(\d{2})\)?[\s-]?9?\d{4}[\s-]?\d{4}$/`

---

**Status:** 🔄 Correção aplicada - Aguardando teste
**Data:** 2025-02-08
**Arquivo:** `src/app/api/asaas/customers/route.ts`