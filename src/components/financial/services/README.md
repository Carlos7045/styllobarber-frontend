# Serviços de Integração Asaas

Este diretório contém todos os serviços para integração com a API Asaas, incluindo gerenciamento de clientes, pagamentos e processamento de webhooks.

## Estrutura dos Serviços

### 🔧 AsaasClient (`asaas-client.ts`)
Cliente HTTP principal para comunicação com a API Asaas.

**Funcionalidades:**
- Requisições HTTP com retry automático
- Tratamento de erros específicos da API
- Validação de webhooks
- Teste de conectividade

**Exemplo de uso:**
```typescript
import { asaasClient } from '@/components/financial/services'

// Testar conexão
const isConnected = await asaasClient.testConnection()

// Fazer requisição GET
const account = await asaasClient.get('/myAccount')

// Fazer requisição POST
const customer = await asaasClient.post('/customers', customerData)
```

### 👥 AsaasCustomersService (`asaas-customers.ts`)
Gerenciamento de clientes na API Asaas.

**Funcionalidades:**
- Criar, buscar, atualizar e deletar clientes
- Buscar ou criar cliente baseado no perfil do usuário
- Sincronização de dados
- Validação de dados de cliente
- Geração de clientes para sandbox

**Exemplo de uso:**
```typescript
import { asaasCustomersService } from '@/components/financial/services'

// Criar cliente
const customer = await asaasCustomersService.createCustomer({
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '11999999999'
})

// Buscar ou criar baseado no perfil
const customer = await asaasCustomersService.findOrCreateCustomerFromProfile({
  id: 'user_123',
  nome: 'João Silva',
  email: 'joao@email.com'
})
```

### 💳 AsaasPaymentsService (`asaas-payments.ts`)
Gerenciamento de pagamentos e cobranças.

**Funcionalidades:**
- Criar, buscar, atualizar e deletar pagamentos
- Suporte a PIX, Boleto e Cartão de Crédito
- Obter QR Code PIX
- Confirmar pagamentos em dinheiro
- Criar pagamentos para agendamentos
- Sincronização de status
- Validação de dados

**Exemplo de uso:**
```typescript
import { asaasPaymentsService } from '@/components/financial/services'

// Criar pagamento PIX
const payment = await asaasPaymentsService.createPayment({
  customer: 'cus_123',
  billingType: 'PIX',
  value: 50.00,
  dueDate: '2024-12-31',
  description: 'Corte de cabelo'
})

// Obter QR Code PIX
const qrCode = await asaasPaymentsService.getPixQrCode(payment.id)

// Criar pagamento para agendamento
const payment = await asaasPaymentsService.createPaymentForAppointment({
  clienteId: 'user_123',
  clienteNome: 'João Silva',
  clienteEmail: 'joao@email.com',
  valor: 50.00,
  dataVencimento: '2024-12-31',
  descricao: 'Corte de cabelo',
  agendamentoId: 'app_123',
  metodoPagamento: 'PIX'
})
```

### 🔔 AsaasWebhookService (`asaas-webhook.ts`)
Processamento de webhooks da API Asaas.

**Funcionalidades:**
- Processar diferentes tipos de eventos
- Validação de assinatura
- Sincronização automática com banco local
- Criação de transações financeiras
- Sistema de notificações
- Auditoria de webhooks

**Exemplo de uso:**
```typescript
import { asaasWebhookService } from '@/components/financial/services'

// Processar webhook recebido
const result = await asaasWebhookService.processWebhook(webhookPayload, signature)

if (result.success) {
  console.log('Webhook processado:', result.message)
} else {
  console.error('Erro no webhook:', result.error)
}
```

## Configuração

### Variáveis de Ambiente Necessárias

```env
# API Asaas
ASAAS_API_KEY=your_api_key_here
ASAAS_ENVIRONMENT=sandbox  # ou 'production'
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcional - para webhooks
ASAAS_WEBHOOK_TOKEN=your_webhook_token
```

### Configuração no Código

```typescript
// src/components/financial/config/index.ts
export const asaasConfig = {
  baseUrl: 'https://www.asaas.com/api/v3',
  apiKey: process.env.ASAAS_API_KEY || '',
  environment: process.env.ASAAS_ENVIRONMENT || 'sandbox',
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/asaas`,
  timeout: 30000
}
```

## Ambiente Sandbox

### Configuração para Testes

1. **Criar conta sandbox** no [Asaas](https://www.asaas.com)
2. **Obter API Key** do ambiente sandbox
3. **Configurar webhook URL** (opcional para testes)

### Demo Interativa

```typescript
import { asaasSandboxDemo } from '@/components/financial/examples/sandbox-demo'

// Executar demo completa
await asaasSandboxDemo.runCompleteDemo()

// Testar diferentes funcionalidades
await asaasSandboxDemo.demoMultipleCustomers(5)
await asaasSandboxDemo.demoDifferentPaymentTypes()
await asaasSandboxDemo.demoWebhookProcessing()
```

### Dados de Teste

O sistema inclui geradores de dados para sandbox:

```typescript
// Cliente de teste
const customerData = asaasCustomersService.generateSandboxCustomer(1)

// Pagamento de teste
const paymentData = asaasPaymentsService.generateSandboxPayment('cus_123', 1)

// Webhook de teste
const webhook = asaasWebhookService.generateTestWebhook('pay_123', 'PAYMENT_RECEIVED')
```

## Tratamento de Erros

### Tipos de Erro

```typescript
import { AsaasApiError } from '@/components/financial/services'

try {
  await asaasPaymentsService.createPayment(paymentData)
} catch (error) {
  if (error instanceof AsaasApiError) {
    if (error.isValidationError()) {
      console.log('Erro de validação:', error.getErrorMessages())
    } else if (error.isAuthenticationError()) {
      console.log('Erro de autenticação')
    } else if (error.isRateLimitError()) {
      console.log('Rate limit excedido')
    }
  }
}
```

### Retry Automático

Todos os serviços incluem retry automático com backoff exponencial:

- **Máximo de tentativas:** 3
- **Delay inicial:** 1 segundo
- **Multiplicador:** 2x
- **Delay máximo:** 10 segundos

## Validações

### Validação de Cliente

```typescript
const validation = asaasCustomersService.validateCustomerData(customerData)
if (!validation.isValid) {
  console.log('Erros:', validation.errors)
}
```

### Validação de Pagamento

```typescript
const validation = asaasPaymentsService.validatePaymentData(paymentData)
if (!validation.isValid) {
  console.log('Erros:', validation.errors)
}
```

### Validação de Webhook

```typescript
const validation = asaasWebhookService.validateWebhookPayload(payload)
if (!validation.isValid) {
  console.log('Erros:', validation.errors)
}
```

## Testes

### Executar Testes

```bash
# Todos os testes
npm test src/components/financial/services

# Testes específicos
npm test asaas-client.test.ts
npm test asaas-payments.test.ts
```

### Cobertura de Testes

- ✅ AsaasClient - Requisições HTTP e tratamento de erros
- ✅ AsaasPaymentsService - Criação e gerenciamento de pagamentos
- ✅ AsaasCustomersService - Gerenciamento de clientes
- ✅ AsaasWebhookService - Processamento de webhooks

## Logs e Debugging

### Logs de Desenvolvimento

```typescript
// Logs automáticos em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Cliente Asaas criado:', response)
}
```

### Teste de Conectividade

```typescript
import { testAsaasConnection } from '@/components/financial/examples/sandbox-demo'

const isConnected = await testAsaasConnection()
```

## Próximos Passos

1. **Implementar Edge Functions** para webhooks
2. **Adicionar sistema de notificações** (WhatsApp/Email)
3. **Implementar cache** para consultas frequentes
4. **Adicionar métricas** de performance
5. **Implementar retry queue** para falhas

## Suporte

Para dúvidas sobre a integração Asaas:

- 📚 [Documentação oficial Asaas](https://docs.asaas.com)
- 🔧 [Postman Collection](https://www.postman.com/asaas-api)
- 💬 Suporte técnico: suporte@asaas.com