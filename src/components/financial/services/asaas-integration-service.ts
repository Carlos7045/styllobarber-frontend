// Serviço de integração com API Asaas para pagamentos PIX
export interface AsaasCustomer {
  id: string
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
}

export interface AsaasPayment {
  id: string
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  billingType: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'UNDEFINED'
  value: number
  dueDate: string
  description: string
  customer: string
  pixTransaction?: {
    qrCode: string
    copyAndPaste: string
    expirationDate: string
  }
}

export interface CreateCustomerData {
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
}

export interface CreatePaymentData {
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO'
  value: number
  dueDate?: string
  description: string
  externalReference?: string
}

export class AsaasIntegrationService {
  private static readonly BASE_URL = '/api/asaas'

  /**
   * Criar ou buscar cliente na API Asaas
   */
  static async createOrFindCustomer(customerData: CreateCustomerData): Promise<AsaasCustomer | null> {
    try {
      console.log('🔍 Buscando/criando cliente no Asaas:', customerData.name)

      // Primeiro, tentar buscar cliente existente por email
      if (customerData.email) {
        const existingCustomer = await this.findCustomerByEmail(customerData.email)
        if (existingCustomer) {
          console.log('✅ Cliente encontrado no Asaas:', existingCustomer.id)
          return existingCustomer
        }
      }

      // Se não encontrou, criar novo cliente
      const response = await fetch(`${this.BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          mobilePhone: customerData.mobilePhone,
          cpfCnpj: customerData.cpfCnpj || this.generateValidCPF(), // Gerar CPF válido se não fornecido
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Erro ao criar cliente no Asaas:', error)
        return null
      }

      const customer = await response.json()
      console.log('✅ Cliente criado no Asaas:', customer.id)
      return customer

    } catch (error) {
      console.error('❌ Erro na integração com Asaas (cliente):', error)
      return null
    }
  }

  /**
   * Buscar cliente por email
   */
  static async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/customers?email=${encodeURIComponent(email)}`)
      
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      // API Asaas retorna uma lista, pegar o primeiro
      if (data.data && data.data.length > 0) {
        return data.data[0]
      }

      return null
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por email:', error)
      return null
    }
  }

  /**
   * Criar cobrança PIX
   */
  static async createPixPayment(paymentData: CreatePaymentData): Promise<AsaasPayment | null> {
    try {
      console.log('💰 Criando cobrança PIX no Asaas:', {
        customer: paymentData.customer,
        value: paymentData.value,
        description: paymentData.description
      })

      const response = await fetch(`${this.BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: paymentData.customer,
          billingType: 'PIX',
          value: paymentData.value,
          dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
          description: paymentData.description,
          externalReference: paymentData.externalReference || `pdv-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Erro ao criar cobrança PIX:', error)
        return null
      }

      const payment = await response.json()
      console.log('✅ Cobrança PIX criada:', payment.id)
      return payment

    } catch (error) {
      console.error('❌ Erro na integração com Asaas (pagamento):', error)
      return null
    }
  }

  /**
   * Buscar status de pagamento
   */
  static async getPaymentStatus(paymentId: string): Promise<AsaasPayment | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/payments?id=${paymentId}`)
      
      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erro ao buscar status do pagamento:', error)
      return null
    }
  }

  /**
   * Gerar CPF válido para testes (sandbox)
   */
  private static generateValidCPF(): string {
    // CPFs válidos para teste em sandbox
    const testCPFs = [
      '11144477735',
      '12345678909',
      '98765432100',
      '11111111111'
    ]
    
    return testCPFs[Math.floor(Math.random() * testCPFs.length)]
  }

  /**
   * Formatar telefone para padrão brasileiro
   */
  static formatPhoneNumber(phone: string): string {
    if (!phone) return ''
    
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Se tem 11 dígitos (celular com 9), formatar como (XX) 9XXXX-XXXX
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`
    }
    
    // Se tem 10 dígitos (fixo), formatar como (XX) XXXX-XXXX
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`
    }
    
    // Se não tem formato padrão, retornar vazio para evitar erro
    return ''
  }

  /**
   * Gerar email temporário para cliente sem email
   */
  static generateTemporaryEmail(customerName: string): string {
    const cleanName = customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10)
    
    const timestamp = Date.now()
    return `${cleanName}-${timestamp}@temp.styllobarber.com`
  }

  /**
   * Validar se deve usar integração Asaas
   */
  static shouldUseAsaasIntegration(metodoPagamento: string): boolean {
    // Por enquanto, apenas PIX usa integração Asaas
    return metodoPagamento === 'PIX'
  }

  /**
   * Buscar cliente no sistema local por nome
   */
  static async findLocalCustomerByName(customerName: string): Promise<{
    nome: string
    telefone?: string
    email?: string
    cpf?: string
  } | null> {
    try {
      const { supabase } = await import('@/lib/api/supabase')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, telefone, email, cpf')
        .eq('role', 'client')
        .eq('ativo', true)
        .ilike('nome', `%${customerName}%`)
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar cliente local:', error)
      return null
    }
  }

  /**
   * Processar pagamento completo (cliente + cobrança)
   */
  static async processPayment(transactionData: {
    cliente?: string
    valor: number
    descricao: string
    metodoPagamento: string
    telefone?: string
  }): Promise<{
    success: boolean
    customer?: AsaasCustomer
    payment?: AsaasPayment
    error?: string
  }> {
    try {
      if (!this.shouldUseAsaasIntegration(transactionData.metodoPagamento)) {
        return { success: false, error: 'Método de pagamento não suportado pela integração Asaas' }
      }

      // 1. Buscar dados do cliente no sistema local
      let localCustomer = null
      if (transactionData.cliente) {
        localCustomer = await this.findLocalCustomerByName(transactionData.cliente)
      }

      // 2. Criar/buscar cliente no Asaas
      const customerData: CreateCustomerData = {
        name: transactionData.cliente || 'Cliente PDV',
        email: localCustomer?.email || this.generateTemporaryEmail(transactionData.cliente || 'Cliente'),
        phone: localCustomer?.telefone || (transactionData.telefone ? this.formatPhoneNumber(transactionData.telefone) : undefined),
        mobilePhone: localCustomer?.telefone || (transactionData.telefone ? this.formatPhoneNumber(transactionData.telefone) : undefined),
        cpfCnpj: localCustomer?.cpf || this.generateValidCPF(), // Usar CPF do cliente local ou gerar um válido
      }

      const customer = await this.createOrFindCustomer(customerData)
      if (!customer) {
        return { success: false, error: 'Erro ao criar/buscar cliente no Asaas' }
      }

      // 3. Criar cobrança PIX
      const paymentData: CreatePaymentData = {
        customer: customer.id,
        billingType: 'PIX',
        value: transactionData.valor,
        description: transactionData.descricao,
        externalReference: `pdv-${Date.now()}`
      }

      const payment = await this.createPixPayment(paymentData)
      if (!payment) {
        return { success: false, error: 'Erro ao criar cobrança PIX no Asaas' }
      }

      return {
        success: true,
        customer,
        payment
      }

    } catch (error) {
      console.error('❌ Erro no processamento completo do pagamento:', error)
      return {
        success: false,
        error: 'Erro interno no processamento do pagamento'
      }
    }
  }
}