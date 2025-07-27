// Serviço para processar webhooks da API Asaas

import { asaasClient } from './asaas-client'
import { asaasPaymentsService } from './asaas-payments'
import { ASAAS_WEBHOOK_EVENTS } from '../constants'
import { WebhookAsaas } from '../types'

// Tipos para webhooks Asaas
export interface AsaasWebhookPayload {
  event: keyof typeof ASAAS_WEBHOOK_EVENTS
  payment: {
    object: 'payment'
    id: string
    dateCreated: string
    customer: string
    subscription?: string
    installment?: string
    paymentLink?: string
    value: number
    netValue: number
    originalValue?: number
    interestValue?: number
    description?: string
    billingType: string
    pixTransaction?: string
    status: string
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
  }
  dateCreated: string
}

export interface WebhookProcessResult {
  success: boolean
  message: string
  paymentId?: string
  event?: string
  error?: string
}

// Serviço para processar webhooks Asaas
export class AsaasWebhookService {
  // Processar webhook recebido
  async processWebhook(
    payload: AsaasWebhookPayload,
    signature?: string
  ): Promise<WebhookProcessResult> {
    try {
      // Validar assinatura do webhook (em produção)
      if (signature && !asaasClient.validateWebhook(JSON.stringify(payload), signature)) {
        return {
          success: false,
          message: 'Assinatura do webhook inválida',
          error: 'INVALID_SIGNATURE'
        }
      }

      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Processando webhook Asaas:', payload)
      }

      // Processar baseado no tipo de evento
      const result = await this.handleWebhookEvent(payload)
      
      // Salvar webhook no banco para auditoria
      await this.saveWebhookToDatabase(payload, result.success)
      
      return result
    } catch (error) {
      console.error('Erro ao processar webhook Asaas:', error)
      
      // Salvar webhook com erro no banco
      await this.saveWebhookToDatabase(payload, false, error)
      
      return {
        success: false,
        message: 'Erro interno ao processar webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Processar evento específico do webhook
  private async handleWebhookEvent(payload: AsaasWebhookPayload): Promise<WebhookProcessResult> {
    const { event, payment } = payload

    switch (event) {
      case 'PAYMENT_CREATED':
        return await this.handlePaymentCreated(payment)
      
      case 'PAYMENT_UPDATED':
        return await this.handlePaymentUpdated(payment)
      
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_RECEIVED_IN_CASH':
        return await this.handlePaymentReceived(payment)
      
      case 'PAYMENT_OVERDUE':
        return await this.handlePaymentOverdue(payment)
      
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        return await this.handlePaymentCancelled(payment)
      
      default:
        console.log(`Evento de webhook não tratado: ${event}`)
        return {
          success: true,
          message: `Evento ${event} recebido mas não processado`,
          paymentId: payment.id,
          event
        }
    }
  }

  // Processar pagamento criado
  private async handlePaymentCreated(payment: any): Promise<WebhookProcessResult> {
    try {
      // Atualizar ou criar registro local do pagamento Asaas
      await this.upsertAsaasPayment(payment, 'PENDING')
      
      return {
        success: true,
        message: 'Pagamento criado processado com sucesso',
        paymentId: payment.id,
        event: 'PAYMENT_CREATED'
      }
    } catch (error) {
      throw new Error(`Erro ao processar pagamento criado: ${error}`)
    }
  }

  // Processar pagamento atualizado
  private async handlePaymentUpdated(payment: any): Promise<WebhookProcessResult> {
    try {
      // Sincronizar dados do pagamento
      const statusMapping: Record<string, string> = {
        'PENDING': 'PENDING',
        'RECEIVED': 'RECEIVED',
        'CONFIRMED': 'RECEIVED',
        'OVERDUE': 'OVERDUE',
        'REFUNDED': 'CANCELLED'
      }

      const localStatus = statusMapping[payment.status] || 'PENDING'
      await this.upsertAsaasPayment(payment, localStatus)
      
      return {
        success: true,
        message: 'Pagamento atualizado processado com sucesso',
        paymentId: payment.id,
        event: 'PAYMENT_UPDATED'
      }
    } catch (error) {
      throw new Error(`Erro ao processar pagamento atualizado: ${error}`)
    }
  }

  // Processar pagamento recebido
  private async handlePaymentReceived(payment: any): Promise<WebhookProcessResult> {
    try {
      // Atualizar status do pagamento para recebido
      await this.upsertAsaasPayment(payment, 'RECEIVED')
      
      // Se tem referência externa (agendamento), criar transação financeira
      if (payment.externalReference) {
        await this.createFinancialTransaction(payment, 'RECEITA')
      }
      
      // Enviar notificações se necessário
      await this.sendPaymentNotifications(payment, 'RECEIVED')
      
      return {
        success: true,
        message: 'Pagamento recebido processado com sucesso',
        paymentId: payment.id,
        event: 'PAYMENT_RECEIVED'
      }
    } catch (error) {
      throw new Error(`Erro ao processar pagamento recebido: ${error}`)
    }
  }

  // Processar pagamento vencido
  private async handlePaymentOverdue(payment: any): Promise<WebhookProcessResult> {
    try {
      // Atualizar status do pagamento para vencido
      await this.upsertAsaasPayment(payment, 'OVERDUE')
      
      // Enviar notificações de pagamento vencido
      await this.sendPaymentNotifications(payment, 'OVERDUE')
      
      return {
        success: true,
        message: 'Pagamento vencido processado com sucesso',
        paymentId: payment.id,
        event: 'PAYMENT_OVERDUE'
      }
    } catch (error) {
      throw new Error(`Erro ao processar pagamento vencido: ${error}`)
    }
  }

  // Processar pagamento cancelado
  private async handlePaymentCancelled(payment: any): Promise<WebhookProcessResult> {
    try {
      // Atualizar status do pagamento para cancelado
      await this.upsertAsaasPayment(payment, 'CANCELLED')
      
      // Se tinha transação financeira, cancelar
      if (payment.externalReference) {
        await this.cancelFinancialTransaction(payment.externalReference)
      }
      
      return {
        success: true,
        message: 'Pagamento cancelado processado com sucesso',
        paymentId: payment.id,
        event: 'PAYMENT_CANCELLED'
      }
    } catch (error) {
      throw new Error(`Erro ao processar pagamento cancelado: ${error}`)
    }
  }

  // Atualizar ou criar pagamento Asaas no banco local
  private async upsertAsaasPayment(payment: any, status: string): Promise<void> {
    // Esta função seria implementada com acesso ao banco de dados
    // Por enquanto, apenas log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Atualizando pagamento Asaas no banco:', {
        asaasId: payment.id,
        status,
        value: payment.value,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate
      })
    }
    
    // TODO: Implementar upsert no banco de dados
    // await supabase.from('asaas_payments').upsert({...})
  }

  // Criar transação financeira baseada no pagamento
  private async createFinancialTransaction(payment: any, tipo: string): Promise<void> {
    // Esta função seria implementada com acesso ao banco de dados
    if (process.env.NODE_ENV === 'development') {
      console.log('Criando transação financeira:', {
        tipo,
        valor: payment.value,
        agendamentoId: payment.externalReference,
        asaasPaymentId: payment.id,
        status: 'CONFIRMADA'
      })
    }
    
    // TODO: Implementar criação de transação no banco
    // await supabase.from('transacoes_financeiras').insert({...})
  }

  // Cancelar transação financeira
  private async cancelFinancialTransaction(agendamentoId: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Cancelando transação financeira para agendamento:', agendamentoId)
    }
    
    // TODO: Implementar cancelamento de transação
    // await supabase.from('transacoes_financeiras')
    //   .update({ status: 'CANCELADA' })
    //   .eq('agendamento_id', agendamentoId)
  }

  // Enviar notificações baseadas no evento
  private async sendPaymentNotifications(payment: any, event: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Enviando notificações para pagamento:', {
        paymentId: payment.id,
        event,
        customer: payment.customer
      })
    }
    
    // TODO: Implementar sistema de notificações
    // - WhatsApp para cliente
    // - Email para administradores
    // - Notificação push se aplicável
  }

  // Salvar webhook no banco para auditoria
  private async saveWebhookToDatabase(
    payload: AsaasWebhookPayload,
    success: boolean,
    error?: any
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Salvando webhook para auditoria:', {
        event: payload.event,
        paymentId: payload.payment.id,
        success,
        error: error?.message
      })
    }
    
    // TODO: Implementar salvamento de webhook
    // await supabase.from('webhook_logs').insert({
    //   event: payload.event,
    //   payment_id: payload.payment.id,
    //   payload: payload,
    //   success,
    //   error_message: error?.message,
    //   processed_at: new Date().toISOString()
    // })
  }

  // Reprocessar webhook que falhou
  async reprocessWebhook(webhookId: string): Promise<WebhookProcessResult> {
    try {
      // TODO: Buscar webhook do banco e reprocessar
      // const webhook = await supabase.from('webhook_logs').select('*').eq('id', webhookId).single()
      // return await this.processWebhook(webhook.payload)
      
      return {
        success: false,
        message: 'Reprocessamento não implementado ainda'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao reprocessar webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Validar estrutura do webhook
  validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!payload.event) {
      errors.push('Campo "event" é obrigatório')
    }

    if (!payload.payment) {
      errors.push('Campo "payment" é obrigatório')
    } else {
      if (!payload.payment.id) {
        errors.push('Campo "payment.id" é obrigatório')
      }
      if (!payload.payment.status) {
        errors.push('Campo "payment.status" é obrigatório')
      }
    }

    if (!payload.dateCreated) {
      errors.push('Campo "dateCreated" é obrigatório')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Gerar webhook de teste para sandbox
  generateTestWebhook(paymentId: string, event: keyof typeof ASAAS_WEBHOOK_EVENTS): AsaasWebhookPayload {
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
        status: event === 'PAYMENT_RECEIVED' ? 'RECEIVED' : 'PENDING',
        dueDate: new Date().toISOString().split('T')[0],
        originalDueDate: new Date().toISOString().split('T')[0],
        paymentDate: event === 'PAYMENT_RECEIVED' ? new Date().toISOString() : undefined,
        externalReference: 'test_appointment_123',
        deleted: false,
        anticipated: false,
        anticipable: true
      },
      dateCreated: new Date().toISOString()
    }
  }
}

// Instância singleton do serviço
export const asaasWebhookService = new AsaasWebhookService()