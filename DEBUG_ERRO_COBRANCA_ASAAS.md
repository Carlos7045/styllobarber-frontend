# 🔍 Debug: Erro 400 na Criação de Cobrança Asaas

## ✅ **Progresso Atual**

### **Cliente - Funcionando ✅**
- ✅ Cliente criado com sucesso: `cus_000006927002`
- ✅ Telefone formatado corretamente: `(11) 98765-4321`
- ✅ Sem mais erros 400 de telefone inválido

### **Cobrança - Erro 400 ❌**
```
📊 Resposta da API Asaas: { status: 400, statusText: '', ok: false }
❌ Erro ao criar cobrança: { status: 400, error: { errors: [ [Object] ] } }
```

## 🔧 **Melhorias Aplicadas para Debug**

### 1. **Logs Detalhados de Erro**
Adicionado em `src/app/api/asaas/payments/route.ts`:

```typescript
// Log detalhado dos erros específicos
if (error.errors && Array.isArray(error.errors)) {
  console.error('🔍 Erros específicos da API Asaas (Payments):')
  error.errors.forEach((err: any, index: number) => {
    console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
  })
}
```

### 2. **Frontend com Erros Específicos**
Adicionado em `src/app/debug/asaas-test/page.tsx`:

```typescript
// Mostrar erros específicos se disponíveis
if (paymentData.specificErrors && paymentData.specificErrors.length > 0) {
  console.error('🔍 Erros específicos da cobrança:')
  paymentData.specificErrors.forEach((err: any, index: number) => {
    console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
  })
}
```

### 3. **Dados Enviados para Debug**
```json
{
  "customer": "cus_000006927002",
  "billingType": "PIX",
  "value": 25,
  "dueDate": "2025-08-12",
  "description": "Teste de cobrança PIX via API",
  "externalReference": "test-1754962443933",
  "postalService": false
}
```

## 🧪 **Próximo Teste**

### **Reinicie o servidor:**
```bash
npm run dev
```

### **Execute o teste:**
1. Acesse: `http://localhost:3000/debug/asaas-test`
2. Clique em "🚀 Testar Criação de Cliente + Cobrança PIX"
3. **Verifique os logs do servidor** - deve mostrar erros específicos da cobrança

### **Logs Esperados (com detalhes):**
```
🔍 Erros específicos da API Asaas (Payments):
  1. invalid_value: Valor deve ser maior que zero
  2. invalid_dueDate: Data de vencimento inválida
  3. invalid_customer: Cliente não encontrado
```

## 🎯 **Possíveis Causas do Erro 400 na Cobrança**

### **Causa 1: Valor Inválido**
- Valor `25` pode precisar ser `25.00`
- Formato decimal pode estar incorreto

### **Causa 2: Data de Vencimento**
- Data `2025-08-12` pode estar no formato errado
- API pode esperar formato diferente

### **Causa 3: Cliente Inválido**
- Cliente `cus_000006927002` pode não existir
- Referência pode estar incorreta

### **Causa 4: Campos Obrigatórios**
- Algum campo pode ser obrigatório para PIX
- Configuração específica do PIX

## 📋 **Status Atual**

### ✅ **Funcionando:**
- Conexão com API Asaas
- Autenticação (API key)
- Criação de clientes
- Formatação de telefones

### 🔄 **Em Progresso:**
- Criação de cobranças (erro 400)
- Identificação dos campos inválidos

### 🎯 **Próximo:**
- Corrigir dados inválidos da cobrança
- Testar criação de PIX
- Validar no painel Asaas

## 🎉 **Conclusão**

**Progresso excelente!** Já temos:

1. ✅ **API key funcionando**
2. ✅ **Clientes sendo criados**
3. ✅ **Telefones formatados**
4. 🔄 **Só falta ajustar a cobrança**

**Teste novamente e me mostre os erros específicos da cobrança!** 🚀

---

**Status:** 🔄 Debug melhorado - Aguardando teste
**Data:** 2025-02-08
**Arquivos:** 
- `src/app/api/asaas/payments/route.ts`
- `src/app/debug/asaas-test/page.tsx`