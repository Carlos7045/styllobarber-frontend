# 🔧 Forçar Uso da API Real do Asaas

## 🎯 Problema Identificado

O sistema está usando MOCK mesmo com a API key configurada no `.env.local`. Isso pode acontecer por:

1. **Servidor não reiniciado** após configurar a API key
2. **Cache do Next.js** não limpo
3. **Variáveis de ambiente** não carregadas

## 🚀 Solução Imediata

### Passo 1: Parar o Servidor Completamente
```bash
# No terminal onde o servidor está rodando:
Ctrl+C (ou Cmd+C no Mac)
```

### Passo 2: Limpar Cache do Next.js
```bash
# Windows:
rmdir /s /q .next

# Mac/Linux:
rm -rf .next
```

### Passo 3: Verificar .env.local
Confirme que o arquivo `.env.local` contém:
```env
NEXT_PUBLIC_ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFkYzI4MjQzLTAwYzYtNGJmNi1iZTYzLWFmODg1ZjYyYzAzYTo6JGFhY2hfZWQ4NGUwYmQtYzgwNC00ZDNhLWIzMTUtODY2OTlhYWY0MjNi
```

### Passo 4: Reiniciar o Servidor
```bash
npm run dev
```

### Passo 5: Verificar Console
Após reiniciar, deve aparecer:
```
✅ USANDO API REAL DO ASAAS
🔧 Asaas Service configurado: {
  hasApiKey: true,
  apiKeyLength: 164,
  isDevelopment: false
}
```

## 🔍 Se Ainda Estiver Usando Mock

### Opção 1: Forçar API Real (Temporário)
Edite `src/lib/services/asaas-service.ts` linha ~45:

```typescript
// ANTES:
this.isDevelopment = !this.apiKey

// DEPOIS (temporário):
this.isDevelopment = false // Forçar API real
```

### Opção 2: Debug das Variáveis
Adicione este console.log no construtor:

```typescript
console.log('🔍 DEBUG ENV:', {
  NEXT_PUBLIC_ASAAS_API_KEY: process.env.NEXT_PUBLIC_ASAAS_API_KEY,
  length: process.env.NEXT_PUBLIC_ASAAS_API_KEY?.length,
  hasKey: !!process.env.NEXT_PUBLIC_ASAAS_API_KEY
})
```

## ✅ Resultado Esperado

Quando funcionar corretamente:

### Console do Navegador:
```
✅ USANDO API REAL DO ASAAS
💳 Processando pagamento via Asaas: { customerData, paymentData }
✅ Pagamento processado via Asaas: { success: true, paymentId: "cus_..." }
```

### Pagamento PIX:
- QR Code real do Asaas
- Código PIX válido
- Cobrança aparece no painel Asaas

### Pagamento Cartão:
- Link de pagamento real
- Redirecionamento para checkout Asaas
- Cobrança aparece no painel Asaas

## 🎯 Teste Final

1. **Reinicie o servidor** completamente
2. **Acesse a página de pagamento**
3. **Verifique o console** - deve mostrar "USANDO API REAL"
4. **Teste PIX** - deve gerar QR Code real
5. **Teste Cartão** - deve funcionar sem erro
6. **Verifique no painel Asaas** - cobranças devem aparecer

## 🚨 Importante

- **Sempre reinicie o servidor** após alterar `.env.local`
- **Limpe o cache** do Next.js com `rm -rf .next`
- **Verifique o console** para confirmar que está usando API real
- **Teste no painel Asaas** para confirmar que as cobranças estão sendo criadas

**Se seguir esses passos, deve usar a API real do Asaas! 🚀**