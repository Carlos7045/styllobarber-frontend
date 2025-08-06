// Testes unitários para o serviço de pagamentos Asaas

import { AsaasPaymentsService } from '../asaas-payments'
import { asaasClient } from '../asaas-client'
import { asaasCustomersService } from '../asaas-customers'

// Mock dos serviços
jest.mock('../asaas-client')
jest.mock('../asaas-customers')

describe('AsaasPaymentsService', () => {
  let paymentsService: AsaasPaymentsService
  const mockAsaasClient = asaasClient as jest.Mocked<typeof asaasClient>
  const mockCustomersService = asaasCustomersService as jest.Mocked<typeof asaasCustomersService>

  beforeEach(() => {
    paymentsService = new AsaasPaymentsService()
    jest.clearAllMocks()
  })

  describe('createPayment', () => {
    it('deve criar pagamento com sucesso', async () => {
      const paymentData = {
        customer: 'cus_123',
        billingType: 'PIX' as const,
        value: 100.00,
        dueDate: '2024-12-31',
        description: 'Teste'
      }

      const mockResponse = {
        object: 'payment',
        id: 'pay_123',
        ...paymentData,
        status: 'PENDING',
        dateCreated: '2024-01-01T00:00:00Z'
      }

      mockAsaasClient.post.mockResolvedValueOnce(mockResponse)

      const result = await paymentsService.createPayment(paymentData)

      expect(mockAsaasClient.post).toHaveBeenCalledWith('/payments', paymentData)
      expect(result).toEqual(mockResponse)
    })

    it('deve lançar erro ao falhar na criação', async () => {
      const paymentData = {
        customer: 'cus_123',
        billingType: 'PIX' as const,
        value: 100.00,
        dueDate: '2024-12-31'
      }

      mockAsaasClient.post.mockRejectedValueOnce(new Error('API Error'))

      await expect(paymentsService.createPayment(paymentData)).rejects.toThrow('API Error')
    })
  })

  describe('getPayment', () => {
    it('deve buscar pagamento por ID', async () => {
      const mockPayment = {
        object: 'payment',
        id: 'pay_123',
        customer: 'cus_123',
        value: 100.00,
        status: 'PENDING'
      }

      mockAsaasClient.get.mockResolvedValueOnce(mockPayment)

      const result = await paymentsService.getPayment('pay_123')

      expect(mockAsaasClient.get).toHaveBeenCalledWith('/payments/pay_123')
      expect(result).toEqual(mockPayment)
    })
  })

  describe('listPayments', () => {
    it('deve listar pagamentos com filtros', async () => {
      const mockResponse = {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        limit: 20,
        offset: 0,
        data: [
          {
            id: 'pay_123',
            customer: 'cus_123',
            value: 100.00,
            status: 'PENDING'
          }
        ]
      }

      const filters = {
        customer: 'cus_123',
        status: 'PENDING' as const,
        limit: 10
      }

      mockAsaasClient.get.mockResolvedValueOnce(mockResponse)

      const result = await paymentsService.listPayments(filters)

      expect(mockAsaasClient.get).toHaveBeenCalledWith('/payments', filters)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getPixQrCode', () => {
    it('deve obter QR Code PIX', async () => {
      const mockQrCode = {
        encodedImage: 'base64image',
        payload: 'pixpayload',
        expirationDate: '2024-12-31T23:59:59Z'
      }

      mockAsaasClient.get.mockResolvedValueOnce(mockQrCode)

      const result = await paymentsService.getPixQrCode('pay_123')

      expect(mockAsaasClient.get).toHaveBeenCalledWith('/payments/pay_123/pixQrCode')
      expect(result).toEqual(mockQrCode)
    })
  })

  describe('confirmCashPayment', () => {
    it('deve confirmar pagamento em dinheiro', async () => {
      const mockResponse = {
        object: 'payment',
        id: 'pay_123',
        status: 'RECEIVED',
        paymentDate: '2024-01-01'
      }

      mockAsaasClient.post.mockResolvedValueOnce(mockResponse)

      const result = await paymentsService.confirmCashPayment('pay_123', '2024-01-01', 100.00)

      expect(mockAsaasClient.post).toHaveBeenCalledWith(
        '/payments/pay_123/receiveInCash',
        { paymentDate: '2024-01-01', value: 100.00 }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createPaymentForAppointment', () => {
    it('deve criar pagamento para agendamento', async () => {
      const appointmentData = {
        clienteId: 'user_123',
        clienteNome: 'João Silva',
        clienteEmail: 'joao@email.com',
        clienteTelefone: '11999999999',
        valor: 50.00,
        dataVencimento: '2024-12-31',
        descricao: 'Corte de cabelo',
        agendamentoId: 'app_123',
        metodoPagamento: 'PIX' as const,
        descontoAntecipado: 10
      }

      const mockCustomer = {
        id: 'cus_123',
        name: 'João Silva',
        email: 'joao@email.com'
      }

      const mockPayment = {
        object: 'payment',
        id: 'pay_123',
        customer: 'cus_123',
        value: 45.00, // Com desconto
        status: 'PENDING'
      }

      mockCustomersService.findOrCreateCustomerFromProfile.mockResolvedValueOnce(mockCustomer as any)
      mockAsaasClient.post.mockResolvedValueOnce(mockPayment)

      const result = await paymentsService.createPaymentForAppointment(appointmentData)

      expect(mockCustomersService.findOrCreateCustomerFromProfile).toHaveBeenCalledWith({
        id: 'user_123',
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '11999999999'
      })

      expect(mockAsaasClient.post).toHaveBeenCalledWith('/payments', expect.objectContaining({
        customer: 'cus_123',
        billingType: 'PIX',
        value: 45.00,
        dueDate: '2024-12-31',
        description: 'Corte de cabelo',
        externalReference: 'app_123',
        discount: expect.objectContaining({
          value: 5.00,
          type: 'FIXED',
          dueDateLimitDays: 7
        })
      }))

      expect(result).toEqual(mockPayment)
    })
  })

  describe('syncPaymentStatus', () => {
    it('deve sincronizar status do pagamento', async () => {
      const mockPayment = {
        object: 'payment',
        id: 'pay_123',
        status: 'RECEIVED',
        value: 100.00
      }

      mockAsaasClient.get.mockResolvedValueOnce(mockPayment)

      const result = await paymentsService.syncPaymentStatus('pay_123')

      expect(result.asaasPayment).toEqual(mockPayment)
      expect(result.shouldUpdateLocal).toBe(true)
      expect(result.localStatus).toBe('RECEIVED')
    })

    it('deve mapear status desconhecido para PENDING', async () => {
      const mockPayment = {
        object: 'payment',
        id: 'pay_123',
        status: 'UNKNOWN_STATUS',
        value: 100.00
      }

      mockAsaasClient.get.mockResolvedValueOnce(mockPayment)

      const result = await paymentsService.syncPaymentStatus('pay_123')

      expect(result.localStatus).toBe('PENDING')
    })
  })

  describe('validatePaymentData', () => {
    it('deve validar dados corretos', () => {
      const validData = {
        customer: 'cus_123',
        billingType: 'PIX' as const,
        value: 10.00,
        dueDate: '2024-12-31'
      }

      const result = paymentsService.validatePaymentData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve detectar cliente ausente', () => {
      const invalidData = {
        customer: '',
        billingType: 'PIX' as const,
        value: 10.00,
        dueDate: '2024-12-31'
      }

      const result = paymentsService.validatePaymentData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ID do cliente é obrigatório')
    })

    it('deve detectar valor inválido', () => {
      const invalidData = {
        customer: 'cus_123',
        billingType: 'PIX' as const,
        value: 0,
        dueDate: '2024-12-31'
      }

      const result = paymentsService.validatePaymentData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Valor deve ser maior que zero')
    })

    it('deve detectar valor abaixo do mínimo para boleto', () => {
      const invalidData = {
        customer: 'cus_123',
        billingType: 'BOLETO' as const,
        value: 1.00, // Abaixo do mínimo de R$ 3,00
        dueDate: '2024-12-31'
      }

      const result = paymentsService.validatePaymentData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Valor mínimo para BOLETO é R$ 3.00')
    })

    it('deve detectar data de vencimento no passado', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const invalidData = {
        customer: 'cus_123',
        billingType: 'PIX' as const,
        value: 10.00,
        dueDate: yesterday.toISOString().split('T')[0]
      }

      const result = paymentsService.validatePaymentData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Data de vencimento não pode ser no passado')
    })
  })

  describe('generateSandboxPayment', () => {
    it('deve gerar dados de pagamento para sandbox', () => {
      const result = paymentsService.generateSandboxPayment('cus_123', 1)

      expect(result.customer).toBe('cus_123')
      expect(result.billingType).toBe('PIX')
      expect(result.value).toBe(60.00) // 50 + (1 * 10)
      expect(result.description).toContain('Pagamento de teste 1')
      expect(result.externalReference).toBe('test_payment_1')
      expect(result.notificationDisabled).toBe(true)
    })

    it('deve alternar tipos de cobrança baseado no índice', () => {
      const result1 = paymentsService.generateSandboxPayment('cus_123', 0)
      const result2 = paymentsService.generateSandboxPayment('cus_123', 1)
      const result3 = paymentsService.generateSandboxPayment('cus_123', 2)

      expect(result1.billingType).toBe('PIX')
      expect(result2.billingType).toBe('BOLETO')
      expect(result3.billingType).toBe('CREDIT_CARD')
    })
  })

  describe('generateSandboxWebhook', () => {
    it('deve gerar webhook de teste', () => {
      const result = paymentsService.generateSandboxWebhook('pay_123', 'PAYMENT_RECEIVED')

      expect(result.event).toBe('PAYMENT_RECEIVED')
      expect(result.payment.id).toBe('pay_123')
      expect(result.payment.status).toBe('RECEIVED')
      expect(result.payment.externalReference).toBe('test_payment_1')
    })
  })
})
