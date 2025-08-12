# 🔧 Solução: Erro 401 Unauthorized - API Asaas

## 🚨 Problema Identificado

As imagens mostram claramente o erro **401 Unauthorized** com a mensagem:
> "O cabeçalho de autenticação 'access_token' é obrigatório e não foi encontrado na requisição"

## ✅ Correções Aplicadas

### 1. **Adicionado User-Agent Header**
A API do Asaas pode exigir um User-Agent válido. Adicionei:
```javascript
headers: {
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY,
  'User-Agent': 'StylloBarber/1.0'  // ← NOVO
}
```

### 2. **Logs Melhorados para Debug**
Adicionei logs mais detalhados para verificar:
- Se a API key está sendo carregada corretamente
- Se tem o formato correto (`$aact_` no início)
- Quais variáveis de ambiente estão disponíveis

### 3. **Verificação da API Key**
A API key deve:
- ✅ Começar com `$aact_hmlg_` (sandbox)
- ✅ Ter 164 caracteres de comprimento
- ✅ Estar nas variáveis `ASAAS_API_KEY` e `NEXT_PUBLIC_ASAAS_API_KEY`

## 🎯 Possíveis Causas do Erro 401

### **Causa 1: API Key Inválida ou Expirada**
- A key pode ter expirado
- Pode estar mal copiada
- Pode ser de produção ao invés de sandbox

### **Causa 2: Header Incorreto**
- Algumas APIs exigem `Authorization: Bearer TOKEN`
- Outras exigem `access_token` no header
- Falta de User-Agent pode causar rejeição

### **Causa 3: Configuração de Ambiente**
- Variável não carregada corretamente
- Problema no `.env.local`
- Cache do Next.js

## 🚀 Teste Agora

### 1. **Reinicie o Servidor**
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### 2. **Verifique os Logs de Configuração**
Deve aparecer algo como:
```
🔧 API Route Customers - Config: {
  baseUrl: 'https://sandbox.asaas.com/api/v3',
  hasApiKey: true,
  apiKeyLength: 164,
  apiKeyPreview: '$aact_hmlg_000...',
  apiKeyValid: true,
  envVars: { ASAAS_API_KEY: true, NEXT_PUBLIC_ASAAS_API_KEY: true }
}
```

### 3. **Teste a API Key**
- Acesse: `http://localhost:3000/debug/asaas-test`
- Clique em "🔍 Testar API Key (Busca de Cliente)"
- **Resultado esperado:** Status 200 (mesmo que retorne lista vazia)

### 4. **Se Ainda Der 401**
Vamos tentar uma abordagem alternativa com `Authorization` header:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ASAAS_API_KEY}`,  // Alternativa
  'User-Agent': 'StylloBarber/1.0'
}
```

## 🔍 Verificações Adicionais

### **Verificar API Key no Painel Asaas:**
1. Acesse: https://sandbox.asaas.com/
2. Vá em "Configurações" → "API"
3. Verifique se a key está ativa
4. Se necessário, gere uma nova key

### **Testar com cURL (Opcional):**
```bash
curl -X GET "https://sandbox.asaas.com/api/v3/customers?email=teste@exemplo.com" \
  -H "access_token: SUA_API_KEY_AQUI" \
  -H "User-Agent: StylloBarber/1.0"
```

## 📋 Checklist de Verificação

- [ ] Servidor reiniciado
- [ ] Logs de configuração mostram API key válida
- [ ] API key começa com `$aact_hmlg_`
- [ ] Comprimento da API key = 164 caracteres
- [ ] User-Agent adicionado aos headers
- [ ] Teste de busca retorna status 200

## 🎯 Resultado Esperado

Após as correções:
- ✅ Status 200 na busca de cliente
- ✅ Status 200 na criação de cliente
- ✅ IDs reais retornados (cus_, pay_)
- ✅ Cobranças aparecendo no painel Asaas

**Teste agora e me informe se o erro 401 foi resolvido!** 🚀