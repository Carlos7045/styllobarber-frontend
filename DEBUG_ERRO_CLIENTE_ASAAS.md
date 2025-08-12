# 🔍 Debug: Erro na Criação de Cliente Asaas

## 🚨 Problema Identificado

A página de debug está mostrando erro na criação de cliente:
```json
{
  "success": false,
  "error": "Erro ao criar cliente: Erro ao criar cliente"
}
```

## 🎯 Passos para Debugging

### 1. **Primeiro: Teste a API Key**
- Acesse: `http://localhost:3000/debug/asaas-test`
- Clique em "🔍 Testar API Key (Busca de Cliente)"
- **Resultado esperado:** Status 200 e lista vazia (sem erro)
- **Se der erro 401/403:** API key inválida
- **Se der erro 500:** Problema na configuração

### 2. **Verifique os Logs do Servidor**
No terminal onde roda `npm run dev`, procure por:

#### **Logs de Configuração (ao iniciar):**
```
🔧 API Route Customers - Config: {
  baseUrl: 'https://sandbox.asaas.com/api/v3',
  hasApiKey: true,
  apiKeyLength: 164,
  apiKeyPreview: '$aact_hmlg...'
}
```

#### **Logs de Erro (ao testar):**
```
❌ Erro ao criar cliente: {
  status: 400,
  statusText: 'Bad Request',
  error: { ... detalhes do erro ... }
}
```

### 3. **Possíveis Causas e Soluções**

#### **Causa 1: API Key Inválida**
**Sintomas:** Status 401 ou 403
**Solução:** 
1. Verifique se a API key no `.env.local` está correta
2. Confirme se é a key do sandbox (deve começar com `$aact_hmlg_`)
3. Reinicie o servidor após alterar `.env.local`

#### **Causa 2: Dados Inválidos**
**Sintomas:** Status 400 com detalhes do erro
**Solução:** Verificar se os campos obrigatórios estão corretos:
- `name`: string não vazia
- `email`: formato de email válido
- `phone`: formato brasileiro (opcional)

#### **Causa 3: Problema de Rede/CORS**
**Sintomas:** Erro de conexão ou CORS
**Solução:** 
1. Verificar se o servidor está rodando
2. Verificar se não há firewall bloqueando
3. Testar diretamente no Postman/Insomnia

#### **Causa 4: Limite de Rate Limiting**
**Sintomas:** Status 429
**Solução:** Aguardar alguns minutos antes de testar novamente

### 4. **Teste Manual com Dados Mínimos**

Se o problema persistir, teste com dados mínimos:

```javascript
// Dados mínimos para teste
{
  "name": "Teste",
  "email": "teste@teste.com"
}
```

### 5. **Verificação no Painel Asaas**

1. Acesse: https://sandbox.asaas.com/
2. Faça login com suas credenciais
3. Vá em "Clientes"
4. Verifique se há clientes sendo criados (mesmo com erro na resposta)

## 🔧 Melhorias Aplicadas no Debug

1. **Logs mais detalhados** na página de debug
2. **Teste específico da API key** com busca de cliente
3. **Tratamento de erro melhorado** com status HTTP
4. **Informações de configuração** nos logs do servidor

## 🎯 Próximos Passos

1. **Execute o teste da API key primeiro**
2. **Analise os logs do servidor**
3. **Identifique a causa específica**
4. **Aplique a solução correspondente**

## 📋 Checklist de Verificação

- [ ] Servidor rodando (`npm run dev`)
- [ ] API key configurada no `.env.local`
- [ ] Logs de configuração aparecem no terminal
- [ ] Teste de busca de cliente funciona (status 200)
- [ ] Dados de teste são válidos
- [ ] Sem bloqueios de firewall/proxy

**Execute os testes na ordem e me informe os resultados específicos!** 🚀