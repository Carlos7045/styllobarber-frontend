// Demonstração de uso dos serviços Asaas em ambiente sandbox

import {
  asaasClient,
  asaasCustomersService,
  asaasPaymentsService,
  asaasWebhookService,
  isAsaasConfigured,
  isSandboxMode
} from '../services'

// Classe para demonstrar funcionalidades em sandbox
export class AsaasSandboxDemo {
  private isInitialized = false

  // Inicializar demo (verificar configuração)
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Inicializando demo Asaas Sandbox...')
      
      // Verificar se está configurado
      if (!isAsaasConfigured()) {
        console.error('❌ API Asaas não está configurada')
        return false
      }

      // Verificar se está em modo sandbox
      if (!isSandboxMode()) {
        console.warn('⚠️  Não está em modo sandbox - demo cancelada por segurança')
        return false
      }

      // Testar conectividade
      const isConnected = await asaasClient.testConnection()
      if (!isConnected) {
        console.error('❌ Falha na conexão com API Asaas')
        return false
      }

      console.log('✅ Conexão com Asaas estabelecida')
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('❌ Erro na inicialização:', error)
      return false
    }
  }

  // Demo completa: criar cliente, pagamento e simular webhook
  async runCompleteDemo(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return
    }

    try {
      console.log('\n📋 Iniciando demo completa...')

      // 1. Criar cliente de teste
      console.log('\n👤 Criando cliente de teste...')
      const customerData = asaasCustomersService.generateSandboxCustomer(1)
      const customer = await asaasCustomersService.createCustomer(customerData)
      console.log('✅ Cliente criado:', customer.id, '-', customer.name)

      // 2. Criar pagamento PIX
      console.log('\n💳 Criando pagamento PIX...')
      const paymentData = asaasPaymentsService.generateSandboxPayment(customer.id, 1)
      const payment = await asaasPaymentsService.createPayment(paymentData)
      console.log('✅ Pagamento criado:', payment.id, '- R$', payment.value)

      // 3. Obter QR Code PIX (se for PIX)
      if (payment.billingType === 'PIX') {
        console.log('\n📱 Obtendo QR Code PIX...')
        try {
          const qrCode = await asaasPaymentsService.getPixQrCode(payment.id)
          console.log('✅ QR Code gerado, expira em:', qrCode.expirationDate)
        } catch (error) {
          console.log('⚠️  QR Code não disponível ainda (normal em sandbox)')
        }
      }

      // 4. Simular webhook de pagamento recebido
      console.log('\n🔔 Simulando webhook de pagamento recebido...')
      const webhookPayload = asaasWebhookService.generateTestWebhook(payment.id, 'PAYMENT_RECEIVED')
      const webhookResult = await asaasWebhookService.processWebhook(webhookPayload)
      console.log('✅ Webhook processado:', webhookResult.success ? 'Sucesso' : 'Falha')

      // 5. Sincronizar status do pagamento
      console.log('\n🔄 Sincronizando status do pagamento...')
      const syncResult = await asaasPaymentsService.syncPaymentStatus(payment.id)
      console.log('✅ Status sincronizado:', syncResult.localStatus)

      console.log('\n🎉 Demo completa finalizada com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro na demo:', error)
    }
  }

  // Demo de criação de múltiplos clientes
  async demoMultipleCustomers(count: number = 3): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return
    }

    try {
      console.log(`\n👥 Criando ${count} clientes de teste...`)

      const customers = []
      for (let i = 1; i <= count; i++) {
        const customerData = asaasCustomersService.generateSandboxCustomer(i)
        const customer = await asaasCustomersService.createCustomer(customerData)
        customers.push(customer)
        console.log(`✅ Cliente ${i} criado:`, customer.id, '-', customer.name)
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log(`\n📊 Total de clientes criados: ${customers.length}`)
      return customers
    } catch (error) {
      console.error('❌ Erro ao criar múltiplos clientes:', error)
    }
  }

  // Demo de diferentes tipos de pagamento
  async demoDifferentPaymentTypes(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return
    }

    try {
      console.log('\n💳 Testando diferentes tipos de pagamento...')

      // Criar cliente para os testes
      const customerData = asaasCustomersService.generateSandboxCustomer(99)
      const customer = await asaasCustomersService.createCustomer(customerData)
      console.log('✅ Cliente criado para testes:', customer.name)

      const paymentTypes = ['PIX', 'BOLETO', 'CREDIT_CARD'] as const
      const payments = []

      for (let i = 0; i < paymentTypes.length; i++) {
        const paymentData = {
          ...asaasPaymentsService.generateSandboxPayment(customer.id, i),
          billingType: paymentTypes[i],
          description: `Teste ${paymentTypes[i]} - Sandbox`
        }

        const payment = await asaasPaymentsService.createPayment(paymentData)
        payments.push(payment)
        console.log(`✅ Pagamento ${paymentTypes[i]} criado:`, payment.id, '- R$', payment.value)
        
        // Pausa entre criações
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`\n📊 Total de pagamentos criados: ${payments.length}`)
      return payments
    } catch (error) {
      console.error('❌ Erro ao testar tipos de pagamento:', error)
    }
  }

  // Demo de webhook processing
  async demoWebhookProcessing(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return
    }

    try {
      console.log('\n🔔 Testando processamento de webhooks...')

      const webhookEvents = [
        'PAYMENT_CREATED',
        'PAYMENT_UPDATED', 
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE'
      ] as const

      for (const event of webhookEvents) {
        console.log(`\n📨 Processando webhook: ${event}`)
        
        const webhookPayload = asaasWebhookService.generateTestWebhook(`pay_test_${Date.now()}`, event)
        const result = await asaasWebhookService.processWebhook(webhookPayload)
        
        console.log(`${result.success ? '✅' : '❌'} Resultado:`, result.message)
        
        // Pausa entre processamentos
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('\n🎉 Teste de webhooks finalizado!')
    } catch (error) {
      console.error('❌ Erro no teste de webhooks:', error)
    }
  }

  // Demo de validações
  async demoValidations(): Promise<void> {
    console.log('\n🔍 Testando validações...')

    // Validar dados de cliente
    console.log('\n👤 Validações de cliente:')
    const invalidCustomer = { name: 'A', email: 'invalid-email', cpfCnpj: '123' }
    const customerValidation = asaasCustomersService.validateCustomerData(invalidCustomer)
    console.log('❌ Cliente inválido:', customerValidation.errors)

    const validCustomer = asaasCustomersService.generateSandboxCustomer(1)
    const validCustomerValidation = asaasCustomersService.validateCustomerData(validCustomer)
    console.log('✅ Cliente válido:', validCustomerValidation.isValid)

    // Validar dados de pagamento
    console.log('\n💳 Validações de pagamento:')
    const invalidPayment = {
      customer: '',
      billingType: 'PIX' as const,
      value: 0,
      dueDate: '2020-01-01'
    }
    const paymentValidation = asaasPaymentsService.validatePaymentData(invalidPayment)
    console.log('❌ Pagamento inválido:', paymentValidation.errors)

    // Validar webhook
    console.log('\n🔔 Validações de webhook:')
    const invalidWebhook = { event: '', payment: null }
    const webhookValidation = asaasWebhookService.validateWebhookPayload(invalidWebhook)
    console.log('❌ Webhook inválido:', webhookValidation.errors)

    console.log('\n✅ Testes de validação finalizados!')
  }

  // Obter informações da conta
  async getAccountInfo(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return
    }

    try {
      console.log('\n🏢 Obtendo informações da conta...')
      const accountInfo = await asaasClient.getAccountInfo()
      console.log('✅ Conta:', accountInfo.name || 'Sandbox Account')
      console.log('📧 Email:', accountInfo.email || 'N/A')
      console.log('🆔 ID:', accountInfo.id || 'N/A')
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error)
    }
  }

  // Executar demo interativa no console
  async runInteractiveDemo(): Promise<void> {
    console.log('🎮 Demo Interativa Asaas Sandbox')
    console.log('================================')
    
    const initialized = await this.initialize()
    if (!initialized) return

    console.log('\nOpções disponíveis:')
    console.log('1. Demo completa')
    console.log('2. Criar múltiplos clientes')
    console.log('3. Testar tipos de pagamento')
    console.log('4. Processar webhooks')
    console.log('5. Testar validações')
    console.log('6. Informações da conta')
    
    // Em um ambiente real, você poderia usar readline para interação
    console.log('\n💡 Execute os métodos individualmente:')
    console.log('- demo.runCompleteDemo()')
    console.log('- demo.demoMultipleCustomers(5)')
    console.log('- demo.demoDifferentPaymentTypes()')
    console.log('- demo.demoWebhookProcessing()')
    console.log('- demo.demoValidations()')
    console.log('- demo.getAccountInfo()')
  }
}

// Instância singleton para uso
export const asaasSandboxDemo = new AsaasSandboxDemo()

// Função utilitária para executar demo rápida
export async function runQuickSandboxDemo(): Promise<void> {
  console.log('⚡ Executando demo rápida do Asaas Sandbox...')
  await asaasSandboxDemo.runCompleteDemo()
}

// Função para testar conectividade
export async function testAsaasConnection(): Promise<boolean> {
  try {
    if (!isAsaasConfigured()) {
      console.log('❌ Asaas não configurado')
      return false
    }

    const isConnected = await asaasClient.testConnection()
    console.log(isConnected ? '✅ Conectado ao Asaas' : '❌ Falha na conexão')
    return isConnected
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error)
    return false
  }
}