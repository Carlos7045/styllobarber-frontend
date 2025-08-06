// Serviço para gerenciar pagamentos na API Asaas

import { asaasClient, AsaasApiResponse } from './asaas-client'
import { asaasCustomersService } from './asaas-customers'
import { AsaasPayment, ASAAS_BILLING_TYPES, ASAAS_PAYMENT_STATUS } from '../types'

// Tipos específicos para pagamentos Asaas
export interface CreateAsaasPaymentData {
  customer: string // ID do cliente Asaas
  billingType: keyof typeof ASAAS_BILLING_TYPES
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  discount?: {
    value?: number
    dueDateLimitDays?: number
    type?: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value?: number
    type?: 'PERCENTAGE'
  }
  fine?: {
    value?: number
    type?: 'FIXED' | 'PERCENTAGE'
  }
  postalService?: boolean
  notificationDisabled?: boolean
  callback?: {
    successUrl?: string
    autoRedirect?: boolean
  }
}

export interface AsaasPaymentResponse {
  object: 'payment'
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  value: number
  netValue: number
  originalValue?: number
  interestValue?: number
  description?: string
  billingType: keyof typeof ASAAS_BILLING_TYPES
  pixTransaction?: string
  status: keyof typeof ASAAS_PAYMENT_STATUS
  dueDate: string
  originalDueDate: string
  paymentDate?: string
  clientPaymentDate?: string
  installmentNumber?: number
  invoiceUrl?: string
  invoiceNumber?: string
  externalReference?: string
  deleted: boolean
  anticipated: boolean
  anticipable: boolean
  creditDate?: string
  estimatedCreditDate?: string
  transactionReceiptUrl?: string
  nossoNumero?: string
  bankSlipUrl?: string
  lastInvoiceViewedDate?: string
  lastBankSlipViewedDate?: string
  discount?: {
    value: number
    limitDate?: string
    dueDateLimitDays: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  fine?: {
    value: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number
    type: 'PERCENTAGE'
  }
  postalService: boolean
  custody?: string
  refunds?: any[]
}

export interface PixQrCodeResponse {
  encodedImage: string
  payload: string
  expirationDate: string
}

// Serviço para gerenciar pagamentos Asaas
export class AsaasPaymentsService {
  // Criar nova cobrança
  async createPayment(paymentData: CreateAsaasPaymentData): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.post<AsaasPaymentResponse>('/payments', paymentData)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Pagamento Asaas criado:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao criar pagamento Asaas:', error)
      throw error
    }
  }

  // Buscar pagamento por ID
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      return await asaasClient.get<AsaasPaymentResponse>(`/payments/${paymentId}`)
    } catch (error) {
      console.error('Erro ao buscar pagamento Asaas:', error)
      throw error
    }
  }

  // Listar pagamentos com filtros
  async listPayments(params?: {
    customer?: string
    billingType?: keyof typeof ASAAS_BILLING_TYPES
    status?: keyof typeof ASAAS_PAYMENT_STATUS
    subscription?: string
    installment?: string
    externalReference?: string
    paymentDate?: string
    estimatedCreditDate?: string
    dueDate?: string
    user?: string
    offset?: number
    limit?: number
  }): Promise<AsaasApiResponse<AsaasPaymentResponse>> {
    try {
      return await asaasClient.get<AsaasApiResponse<AsaasPaymentResponse>>('/payments', params)
    } catch (error) {
      console.error('Erro ao listar pagamentos Asaas:', error)
      throw error
    }
  }

  // Atualizar pagamento
  async updatePayment(
    paymentId: string,
    updateData: Partial<CreateAsaasPaymentData>
  ): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.put<AsaasPaymentResponse>(`/payments/${paymentId}`, updateData)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Pagamento Asaas atualizado:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao atualizar pagamento Asaas:', error)
      throw error
    }
  }

  // Deletar pagamento
  async deletePayment(paymentId: string): Promise<{ deleted: boolean }> {
    try {
      const response = await asaasClient.delete<{ deleted: boolean }>(`/payments/${paymentId}`)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Pagamento Asaas deletado:', paymentId)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao deletar pagamento Asaas:', error)
      throw error
    }
  }

  // Obter QR Code PIX
  async getPixQrCode(paymentId: string): Promise<PixQrCodeResponse> {
    try {
      return await asaasClient.get<PixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`)
    } catch (error) {
      console.error('Erro ao obter QR Code PIX:', error)
      throw error
    }
  }

  // Confirmar pagamento em dinheiro
  async confirmCashPayment(
    paymentId: string,
    paymentDate?: string,
    value?: number
  ): Promise<AsaasPaymentResponse> {
    try {
      const data: any = {}
      if (paymentDate) data.paymentDate = paymentDate
      if (value) data.value = value

      const response = await asaasClient.post<AsaasPaymentResponse>(
        `/payments/${paymentId}/receiveInCash`,
        data
      )
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Pagamento em dinheiro confirmado:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao confirmar pagamento em dinheiro:', error)
      throw error
    }
  }

  // Desfazer confirmação de pagamento em dinheiro
  async undoCashPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.post<AsaasPaymentResponse>(
        `/payments/${paymentId}/undoReceivedInCash`
      )
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Confirmação de pagamento desfeita:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao desfazer confirmação de pagamento:', error)
      throw error
    }
  }

  // Criar cobrança para agendamento
  async createPaymentForAppointment(appointmentData: {
    clienteId: string
    clienteNome: string
    clienteEmail: string
    clienteTelefone?: string
    valor: number
    dataVencimento: string
    descricao: string
    agendamentoId: string
    metodoPagamento: keyof typeof ASAAS_BILLING_TYPES
    descontoAntecipado?: number
  }): Promise<AsaasPaymentResponse> {
    try {
      // Buscar ou criar cliente Asaas
      const customer = await asaasCustomersService.findOrCreateCustomerFromProfile({
        id: appointmentData.clienteId,
        nome: appointmentData.clienteNome,
        email: appointmentData.clienteEmail,
        telefone: appointmentData.clienteTelefone
      })

      // Calcular desconto se aplicável
      let finalValue = appointmentData.valor
      let discount
      
      if (appointmentData.descontoAntecipado && appointmentData.descontoAntecipado > 0) {
        const discountValue = (appointmentData.valor * appointmentData.descontoAntecipado) / 100
        finalValue = appointmentData.valor - discountValue
        
        discount = {
          value: discountValue,
          type: 'FIXED' as const,
          dueDateLimitDays: 7 // 7 dias para pagamento antecipado
        }
      }

      // Criar dados do pagamento
      const paymentData: CreateAsaasPaymentData = {
        customer: customer.id,
        billingType: appointmentData.metodoPagamento,
        value: finalValue,
        dueDate: appointmentData.dataVencimento,
        description: appointmentData.descricao,
        externalReference: appointmentData.agendamentoId,
        discount,
        notificationDisabled: false
      }

      return await this.createPayment(paymentData)
    } catch (error) {
      console.error('Erro ao criar pagamento para agendamento:', error)
      throw error
    }
  }

  // Sincronizar status de pagamento com banco local
  async syncPaymentStatus(asaasPaymentId: string): Promise<{
    asaasPayment: AsaasPaymentResponse
    shouldUpdateLocal: boolean
    localStatus: string
  }> {
    try {
      const asaasPayment = await this.getPayment(asaasPaymentId)
      
      // Mapear status Asaas para status local
      const statusMapping: Record<string, string> = {
        'PENDING': 'PENDING',
        'RECEIVED': 'RECEIVED',
        'CONFIRMED': 'RECEIVED',
        'OVERDUE': 'OVERDUE',
        'REFUNDED': 'CANCELLED',
        'RECEIVED_IN_CASH': 'RECEIVED',
        'REFUND_REQUESTED': 'CANCELLED',
        'REFUND_IN_PROGRESS': 'CANCELLED',
        'CHARGEBACK_REQUESTED': 'CANCELLED',
        'CHARGEBACK_DISPUTE': 'CANCELLED',
        'AWAITING_CHARGEBACK_REVERSAL': 'CANCELLED',
        'DUNNING_REQUESTED': 'OVERDUE',
        'DUNNING_RECEIVED': 'RECEIVED',
        'AWAITING_RISK_ANALYSIS': 'PENDING'
      }

      const localStatus = statusMapping[asaasPayment.status] || 'PENDING'
      
      return {
        asaasPayment,
        shouldUpdateLocal: true,
        localStatus
      }
    } catch (error) {
      console.error('Erro ao sincronizar status de pagamento:', error)
      throw error
    }
  }

  // Validar dados de pagamento
  validatePaymentData(paymentData: CreateAsaasPaymentData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Cliente é obrigatório
    if (!paymentData.customer) {
      errors.push('ID do cliente é obrigatório')
    }

    // Valor deve ser positivo
    if (!paymentData.value || paymentData.value <= 0) {
      errors.push('Valor deve ser maior que zero')
    }

    // Valor mínimo para diferentes tipos de cobrança
    const minValues = {
      PIX: 0.01,
      BOLETO: 3.00,
      CREDIT_CARD: 1.00
    }

    const minValue = minValues[paymentData.billingType]
    if (minValue && paymentData.value < minValue) {
      errors.push(`Valor mínimo para ${paymentData.billingType} é R$ ${minValue.toFixed(2)}`)
    }

    // Data de vencimento deve ser válida
    if (!paymentData.dueDate) {
      errors.push('Data de vencimento é obrigatória')
    } else {
      const dueDate = new Date(paymentData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        errors.push('Data de vencimento não pode ser no passado')
      }
    }

    // Validar tipo de cobrança
    if (!Object.keys(ASAAS_BILLING_TYPES).includes(paymentData.billingType)) {
      errors.push('Tipo de cobrança inválido')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Gerar dados de pagamento para sandbox/teste
  generateSandboxPayment(customerAsaasId: string, index: number = 1): CreateAsaasPaymentData {
    const billingTypes: (keyof typeof ASAAS_BILLING_TYPES)[] = ['PIX', 'BOLETO', 'CREDIT_CARD']
    const randomBillingType = billingTypes[index % billingTypes.length]
    
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7) // 7 dias a partir de hoje
    
    return {
      customer: customerAsaasId,
      billingType: randomBillingType,
      value: 50.00 + (index * 10), // Valores variados para teste
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Pagamento de teste ${index} - Sandbox`,
      externalReference: `test_payment_${index}`,
      discount: {
        value: 5.00,
        dueDateLimitDays: 3,
        type: 'FIXED'
      },
      notificationDisabled: true // Desabilitar notificações em sandbox
    }
  }

  // Simular webhook de pagamento para testes
  generateSandboxWebhook(paymentId: string, event: string = 'PAYMENT_RECEIVED'): any {
    return {
      event,
      payment: {
        object: 'payment',
        id: paymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_sandbox_123',
        value: 50.00,
        netValue: 48.50,
        billingType: 'PIX',
        status: 'RECEIVED',
        dueDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString(),
        externalReference: 'test_payment_1'
      },
      dateCreated: new Date().toISOString()
    }
  }
}

// Instância singleton do serviço
export const asaasPaymentsService = new AsaasPaymentsService()
