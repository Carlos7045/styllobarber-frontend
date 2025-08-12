# Configuração Completa da API Asaas

## 🎯 Objetivo
Configurar a integração real com a API do Asaas para processar pagamentos PIX, cartão e dinheiro.

## 📋 Pré-requisitos

### 1. Conta no Asaas
- Acesse: https://www.asaas.com/
- Crie uma conta gratuita
- Confirme seu email

### 2. Configuração da Conta
- Complete o cadastro da empresa
- Adicione dados bancários (para receber os pagamentos)
- Configure webhook (opcional, mas recomendado)

## 🔧 Configuração da API

### Passo 1: Obter Chave da API

#### Ambiente Sandbox (Desenvolvimento)
1. Acesse: https://sandbox.asaas.com/
2. Faça login com sua conta
3. Vá em **Configurações** → **Integrações** → **API**
4. Copie a **Chave de API** (começa com `$aact_`)

#### Ambiente Produção
1. Acesse: https://www.asaas.com/
2. Faça login com sua conta
3. Vá em **Configurações** → **Integrações** → **API**
4. Copie a **Chave de API** (começa com `$aact_`)

### Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
# Asaas API Configuration

# Para DESENVOLVIMENTO (Sandbox)
NEXT_PUBLIC_ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_sandbox_aqui

# Para PRODUÇÃO (descomente quando for para produção)
# NEXT_PUBLIC_ASAAS_BASE_URL=https://api.asaas.com/v3
# NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_producao_aqui
```

### Passo 3: Reiniciar o Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## 🧪 Testando a Configuração

### 1. Verificar no Console
Ao acessar a página de pagamento, verifique o console do navegador:

```
✅ USANDO API REAL DO ASAAS
🔧 Asaas Service configurado: {
  hasApiKey: true,
  apiKeyLength: 32,
  isDevelopment: false,
  willUseMock: false
}
```

### 2. Usar Componente de Debug
Na página de pagamento, há um componente de debug que mostra:
- Status das variáveis de ambiente
- Se está usando mock ou API real
- Teste de conexão com a API

### 3. Teste de Pagamento PIX
1. Faça um pagamento PIX de teste
2. Deve gerar um QR Code real
3. Verifique no painel do Asaas se a cobrança foi criada

## 🔍 Troubleshooting

### Problema: Ainda está usando Mock

**Sintomas:**
- Console mostra "⚠️ USANDO MOCK"
- QR Code PIX é sempre o mesmo
- Pagamentos não aparecem no painel Asaas

**Soluções:**
1. Verifique se a chave está no `.env.local`
2. Verifique se a chave começa com `$aact_`
3. Reinicie o servidor completamente
4. Verifique se não há espaços extras na chave

### Problema: Erro de Autenticação

**Sintomas:**
- Erro 401 ou 403 na API
- "Invalid API key" no console

**Soluções:**
1. Verifique se a chave está correta
2. Verifique se está usando a URL correta (sandbox vs produção)
3. Verifique se a conta Asaas está ativa

### Problema: Pagamentos não são criados

**Sintomas:**
- API retorna sucesso mas não aparece no painel
- Erro ao criar cobrança

**Soluções:**
1. Verifique se os dados do cliente estão corretos
2. Verifique se o valor é maior que R$ 0,01
3. Verifique logs no painel Asaas

## 📊 Monitoramento

### Logs Importantes
```javascript
// Console do navegador
console.log('🔧 Asaas Service configurado:', config)
console.log('💳 Processando pagamento via Asaas:', data)
console.log('✅ Pagamento processado via Asaas:', result)
```

### Painel Asaas
- Acesse **Vendas** → **Cobranças** para ver pagamentos criados
- Acesse **Relatórios** → **Financeiro** para ver recebimentos
- Acesse **Configurações** → **Webhooks** para configurar notificações

## 🚀 Configuração de Produção

### Antes de ir para produção:

1. **Validar conta Asaas**
   - Complete todos os dados da empresa
   - Valide documentos se necessário
   - Configure conta bancária para recebimento

2. **Trocar para API de produção**
   ```env
   NEXT_PUBLIC_ASAAS_BASE_URL=https://api.asaas.com/v3
   NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_producao_aqui
   ```

3. **Configurar Webhooks** (Recomendado)
   - URL: `https://seudominio.com/api/webhooks/asaas`
   - Eventos: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`

4. **Testar com valores pequenos**
   - Faça alguns pagamentos de teste
   - Verifique se o dinheiro está sendo recebido
   - Teste cancelamentos e estornos

## 🔐 Segurança

### Boas Práticas:
- ✅ Nunca commite chaves de API no Git
- ✅ Use variáveis de ambiente
- ✅ Valide dados antes de enviar para API
- ✅ Implemente logs de auditoria
- ✅ Configure webhooks para confirmação automática

### Não Fazer:
- ❌ Hardcode de chaves no código
- ❌ Usar chave de produção em desenvolvimento
- ❌ Expor chaves no frontend (use NEXT_PUBLIC_ apenas se necessário)

## 📞 Suporte

### Documentação Oficial:
- https://docs.asaas.com/
- https://docs.asaas.com/reference/overview

### Suporte Asaas:
- Email: suporte@asaas.com
- Chat no painel administrativo
- WhatsApp: (62) 3142-4242

## ✅ Checklist Final

- [ ] Conta Asaas criada e validada
- [ ] Chave de API copiada
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor reiniciado
- [ ] Console mostra "✅ USANDO API REAL DO ASAAS"
- [ ] Teste de pagamento PIX funcionando
- [ ] QR Code sendo gerado dinamicamente
- [ ] Pagamentos aparecendo no painel Asaas
- [ ] Webhooks configurados (opcional)
- [ ] Componente de debug removido (produção)