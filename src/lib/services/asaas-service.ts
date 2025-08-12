/**
 * Serviço de integração com Asaas
 * Gerencia pagamentos via API do Asaas
 */

interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone?: string
  cpfCnpj?: string
}

interface AsaasPayment {
  id?: string
  customer: string // ID do cliente
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
}

interface AsaasPaymentResponse {
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  value: number
  netValue: number
  originalValue?: number
  interestValue?: number
  description?: string
  billingType: string
  pixTransaction?: {
    encodedImage: string
    payload: string
    expirationDate: string
  }
}

class AsaasService {
  private baseUrl: string
  private apiKey: string
  private isDevelopment: boolean

  constructor() {
    // Configuração das variáveis de ambiente
    this.baseUrl = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'
    this.apiKey = process.env.NEXT_PUBLIC_ASAAS_API_KEY || ''
    
    // Usar mock apenas se não tiver API key configurada
    this.isDevelopment = !this.apiKey
    
    console.log('🔧 Asaas Service configurado:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'VAZIA',
      isDevelopment: this.isDevelopment,
      nodeEnv: process.env.NODE_ENV,
      willUseMock: this.isDevelopment,
      allEnvVars: {
        NEXT_PUBLIC_ASAAS_BASE_URL: process.env.NEXT_PUBLIC_ASAAS_BASE_URL,
        NEXT_PUBLIC_ASAAS_API_KEY: process.env.NEXT_PUBLIC_ASAAS_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
      }
    })
    
    // DEBUG: Verificar se as variáveis estão sendo carregadas
    console.log('🔍 DEBUG ENV VARS:', {
      ASAAS_API_KEY_RAW: process.env.NEXT_PUBLIC_ASAAS_API_KEY,
      ASAAS_BASE_URL_RAW: process.env.NEXT_PUBLIC_ASAAS_BASE_URL,
      API_KEY_LENGTH: process.env.NEXT_PUBLIC_ASAAS_API_KEY?.length,
      HAS_API_KEY: !!process.env.NEXT_PUBLIC_ASAAS_API_KEY
    })
    
    if (this.isDevelopment) {
      console.log('⚠️ USANDO MOCK - Configure NEXT_PUBLIC_ASAAS_API_KEY para usar API real')
      console.log('💡 Verifique se o arquivo .env.local contém: NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_aqui')
    } else {
      console.log('✅ USANDO API REAL DO ASAAS')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Em desenvolvimento, usar dados mock
    if (this.isDevelopment) {
      return this.mockRequest(endpoint, options)
    }

    // Usar API routes do Next.js em vez de chamar diretamente o Asaas
    let apiUrl = ''
    
    if (endpoint.includes('/customers')) {
      if (options.method === 'POST') {
        apiUrl = '/api/asaas/customers'
      } else {
        // GET com query params
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '')
        apiUrl = `/api/asaas/customers?${urlParams.toString()}`
      }
    } else if (endpoint.includes('/payments')) {
      if (options.method === 'POST') {
        apiUrl = '/api/asaas/payments'
      } else {
        // GET específico
        const paymentId = endpoint.split('/payments/')[1]
        apiUrl = `/api/asaas/payments?id=${paymentId}`
      }
    } else {
      throw new Error(`Endpoint não suportado: ${endpoint}`)
    }

    console.log('🔄 Fazendo requisição via API route:', apiUrl)
    
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.error || error.message || `Erro HTTP: ${response.status}`)
    }

    return response.json()
  }

  private generateMockQRCode(payload: string): string {
    // Gerar um QR Code base64 mock mais realista
    // Em produção, isso viria da API do Asaas
    const mockQRCodeBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVBiVY/z//z8DJQAggBhJVQcQQIykqgMIIEZS1QEEECO56gACiJFcdQABxEiuOoAAYiRXHUAAMZKrDiCAGMlVBxBAjOSqAwggRnLVAQQQI7nqAAKIkVx1AAHESKo6gABiJFUdQAAxkqoOIIAYSVUHEECMpKoDCCBGUtUBBBAjqeoAAoiRVHUAAcRIqjqAAGIkVR1AADGSqw4ggBjJVQcQQIzkqgMIIEZy1QEEECO56gACiJFcdQABxEiuOoAAYiRXHUAAMZKrDiCAGMlVBxBAjOSqAwggRnLVAQQQI7nqAAKIkVx1AAHESKo6gABiJFUdQAAxkqoOIIAYSVUHEECMpKoDCCBGUtUBBBAjqeoAAoiRVHUAAcRIqjqAAGIkVR1AADGSqw4ggBjJVQcQQIzkqgMIIEZy1QEEECO56gACiJFcdQABxEiuOoAAYiRXHUAAMZKrDiCAGAEALvAH+/+oQwAAAABJRU5ErkJggg==`
    return mockQRCodeBase64.split(',')[1] // Retornar apenas a parte base64
  }

  private async mockRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('🧪 Mock Asaas Request:', { endpoint, method: options.method || 'GET' })

    // Mock para criação/busca de cliente
    if (endpoint.includes('/customers')) {
      if (options.method === 'POST') {
        return {
          id: `mock_customer_${Date.now()}`,
          name: 'Cliente Mock',
          email: 'cliente@mock.com',
          dateCreated: new Date().toISOString(),
        }
      } else {
        // Busca de cliente - simular que não existe
        return { data: [] }
      }
    }

    // Mock para criação de cobrança
    if (endpoint.includes('/payments') && options.method === 'POST') {
      const body = JSON.parse(options.body as string)
      const paymentId = `mock_payment_${Date.now()}`
      
      const mockPayment: AsaasPaymentResponse = {
        id: paymentId,
        dateCreated: new Date().toISOString(),
        customer: body.customer,
        status: 'PENDING',
        value: body.value,
        netValue: body.value * 0.97, // Simular taxa
        description: body.description,
        billingType: body.billingType,
      }

      // Se for PIX, adicionar dados do PIX
      if (body.billingType === 'PIX') {
        // Gerar um payload PIX mais realista
        const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${paymentId}520400005303986540${body.value.toFixed(2).padStart(6, '0')}5802BR5913STYLLOBARBER6009SAO PAULO62070503***63041D3D`
        
        mockPayment.pixTransaction = {
          encodedImage: this.generateMockQRCode(pixPayload), // QR Code base64 mock
          payload: pixPayload,
          expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        }
      }

      // Se for cartão de crédito, adicionar link de pagamento
      if (body.billingType === 'CREDIT_CARD') {
        mockPayment.paymentLink = `https://sandbox.asaas.com/checkout/${paymentId}`
        mockPayment.invoiceUrl = `https://sandbox.asaas.com/invoice/${paymentId}`
        // Para mock, marcar como confirmado imediatamente
        mockPayment.status = 'CONFIRMED'
      }

      return mockPayment
    }

    // Mock para busca de pagamento
    if (endpoint.includes('/payments/') && !options.method) {
      return {
        id: endpoint.split('/').pop(),
        status: 'RECEIVED',
        value: 45.00,
        dateCreated: new Date().toISOString(),
      }
    }

    // Fallback
    return { success: true, mock: true }
  }

  /**
   * Cria ou atualiza um cliente no Asaas
   */
  async createOrUpdateCustomer(customer: AsaasCustomer): Promise<string> {
    try {
      // Primeiro, tenta buscar o cliente pelo email
      const existingCustomers = await this.makeRequest(`/customers?email=${customer.email}`)
      
      if (existingCustomers.data && existingCustomers.data.length > 0) {
        // Cliente já existe, retorna o ID
        return existingCustomers.data[0].id
      }

      // Cliente não existe, cria um novo
      const newCustomer = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      })

      return newCustomer.id
    } catch (error) {
      console.error('Erro ao criar/atualizar cliente no Asaas:', error)
      throw error
    }
  }

  /**
   * Cria uma cobrança no Asaas
   */
  async createPayment(payment: AsaasPayment): Promise<AsaasPaymentResponse> {
    try {
      const response = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(payment),
      })

      return response
    } catch (error) {
      console.error('Erro ao criar cobrança no Asaas:', error)
      throw error
    }
  }

  /**
   * Busca uma cobrança pelo ID
   */
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      const response = await this.makeRequest(`/payments/${paymentId}`)
      return response
    } catch (error) {
      console.error('Erro ao buscar cobrança no Asaas:', error)
      throw error
    }
  }

  /**
   * Cria uma cobrança PIX
   */
  async createPixPayment(
    customerId: string,
    value: number,
    description: string,
    externalReference?: string
  ): Promise<AsaasPaymentResponse> {
    const payment: AsaasPayment = {
      customer: customerId,
      billingType: 'PIX',
      value,
      dueDate: new Date().toISOString().split('T')[0], // Hoje
      description,
      externalReference,
    }

    return this.createPayment(payment)
  }

  /**
   * Cria uma cobrança por cartão de crédito
   */
  async createCreditCardPayment(
    customerId: string,
    value: number,
    description: string,
    installments: number = 1,
    externalReference?: string
  ): Promise<AsaasPaymentResponse> {
    const payment: AsaasPayment = {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value,
      dueDate: new Date().toISOString().split('T')[0],
      description,
      externalReference,
      installmentCount: installments,
      installmentValue: installments > 1 ? value / installments : undefined,
    }

    return this.createPayment(payment)
  }

  /**
   * Processa pagamento para agendamento
   */
  async processAppointmentPayment(
    customerData: {
      name: string
      email: string
      phone?: string
    },
    paymentData: {
      amount: number
      description: string
      appointmentId: string
      paymentMethod: 'pix' | 'card' | 'cash'
    }
  ): Promise<{
    success: boolean
    paymentId?: string
    pixQrCode?: string
    pixPayload?: string
    paymentLink?: string
    error?: string
  }> {
    try {
      // 1. Criar/buscar cliente
      const customerId = await this.createOrUpdateCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
      })

      // 2. Criar cobrança baseada no método
      let paymentResponse: AsaasPaymentResponse

      switch (paymentData.paymentMethod) {
        case 'pix':
          paymentResponse = await this.createPixPayment(
            customerId,
            paymentData.amount,
            paymentData.description,
            paymentData.appointmentId
          )
          break

        case 'card':
          paymentResponse = await this.createCreditCardPayment(
            customerId,
            paymentData.amount,
            paymentData.description,
            1, // 1 parcela por padrão
            paymentData.appointmentId
          )
          break

        case 'cash':
          // Para dinheiro, criar cobrança como "recebido em dinheiro"
          paymentResponse = await this.createPayment({
            customer: customerId,
            billingType: 'UNDEFINED',
            value: paymentData.amount,
            dueDate: new Date().toISOString().split('T')[0],
            description: paymentData.description,
            externalReference: paymentData.appointmentId,
          })
          break

        default:
          throw new Error('Método de pagamento não suportado')
      }

      return {
        success: true,
        paymentId: paymentResponse.id,
        pixQrCode: paymentResponse.pixTransaction?.encodedImage,
        pixPayload: paymentResponse.pixTransaction?.payload,
        paymentLink: paymentResponse.paymentLink,
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Verifica o status de um pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<{
    status: string
    paid: boolean
    value: number
    paidDate?: string
  }> {
    try {
      const payment = await this.getPayment(paymentId)
      
      return {
        status: payment.status,
        paid: ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status),
        value: payment.value,
        paidDate: payment.status === 'RECEIVED' ? new Date().toISOString() : undefined,
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error)
      throw error
    }
  }
}

// Instância singleton
export const asaasService = new AsaasService()

// Tipos exportados
export type { AsaasCustomer, AsaasPayment, AsaasPaymentResponse }