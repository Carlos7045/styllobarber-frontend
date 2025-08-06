// Serviço para gerenciar clientes na API Asaas

import { asaasClient, AsaasApiResponse } from './asaas-client'
import { AsaasCustomer } from '../types'

// Tipos específicos para clientes Asaas
export interface CreateAsaasCustomerData {
  name: string
  email?: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  country?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  observations?: string
}

export interface UpdateAsaasCustomerData extends Partial<CreateAsaasCustomerData> {
  id: string
}

export interface AsaasCustomerResponse extends AsaasCustomer {
  object: 'customer'
  dateCreated: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  country: string
  postalCode?: string
  cpfCnpj?: string
  personType: 'FISICA' | 'JURIDICA'
  deleted: boolean
  additionalEmails?: string
  externalReference?: string
  notificationDisabled: boolean
  municipalInscription?: string
  stateInscription?: string
  observations?: string
}

// Serviço para gerenciar clientes Asaas
export class AsaasCustomersService {
  // Criar novo cliente
  async createCustomer(customerData: CreateAsaasCustomerData): Promise<AsaasCustomerResponse> {
    try {
      const response = await asaasClient.post<AsaasCustomerResponse>('/customers', customerData)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Cliente Asaas criado:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao criar cliente Asaas:', error)
      throw error
    }
  }

  // Buscar cliente por ID
  async getCustomer(customerId: string): Promise<AsaasCustomerResponse> {
    try {
      return await asaasClient.get<AsaasCustomerResponse>(`/customers/${customerId}`)
    } catch (error) {
      console.error('Erro ao buscar cliente Asaas:', error)
      throw error
    }
  }

  // Listar clientes com filtros
  async listCustomers(params?: {
    name?: string
    email?: string
    cpfCnpj?: string
    groupName?: string
    externalReference?: string
    offset?: number
    limit?: number
  }): Promise<AsaasApiResponse<AsaasCustomerResponse>> {
    try {
      return await asaasClient.get<AsaasApiResponse<AsaasCustomerResponse>>('/customers', params)
    } catch (error) {
      console.error('Erro ao listar clientes Asaas:', error)
      throw error
    }
  }

  // Atualizar cliente
  async updateCustomer(customerData: UpdateAsaasCustomerData): Promise<AsaasCustomerResponse> {
    try {
      const { id, ...updateData } = customerData
      const response = await asaasClient.put<AsaasCustomerResponse>(`/customers/${id}`, updateData)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Cliente Asaas atualizado:', response)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao atualizar cliente Asaas:', error)
      throw error
    }
  }

  // Deletar cliente
  async deleteCustomer(customerId: string): Promise<{ deleted: boolean }> {
    try {
      const response = await asaasClient.delete<{ deleted: boolean }>(`/customers/${customerId}`)
      
      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Cliente Asaas deletado:', customerId)
      }
      
      return response
    } catch (error) {
      console.error('Erro ao deletar cliente Asaas:', error)
      throw error
    }
  }

  // Buscar ou criar cliente baseado no perfil do usuário
  async findOrCreateCustomerFromProfile(profile: {
    id: string
    nome: string
    email: string
    telefone?: string
  }): Promise<AsaasCustomerResponse> {
    try {
      // Primeiro, tentar encontrar cliente existente por email
      const existingCustomers = await this.listCustomers({
        email: profile.email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
      }

      // Se não encontrou, criar novo cliente
      const customerData: CreateAsaasCustomerData = {
        name: profile.nome,
        email: profile.email,
        phone: profile.telefone,
        externalReference: profile.id, // Referência para o ID interno
        notificationDisabled: false
      }

      return await this.createCustomer(customerData)
    } catch (error) {
      console.error('Erro ao buscar/criar cliente Asaas:', error)
      throw error
    }
  }

  // Sincronizar cliente com dados atualizados do perfil
  async syncCustomerWithProfile(
    asaasCustomerId: string,
    profile: {
      nome: string
      email: string
      telefone?: string
    }
  ): Promise<AsaasCustomerResponse> {
    try {
      const updateData: UpdateAsaasCustomerData = {
        id: asaasCustomerId,
        name: profile.nome,
        email: profile.email,
        phone: profile.telefone
      }

      return await this.updateCustomer(updateData)
    } catch (error) {
      console.error('Erro ao sincronizar cliente Asaas:', error)
      throw error
    }
  }

  // Validar dados do cliente antes de enviar para Asaas
  validateCustomerData(customerData: CreateAsaasCustomerData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Nome é obrigatório
    if (!customerData.name || customerData.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    // Validar email se fornecido
    if (customerData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerData.email)) {
        errors.push('Email inválido')
      }
    }

    // Validar CPF/CNPJ se fornecido
    if (customerData.cpfCnpj) {
      const cleanCpfCnpj = customerData.cpfCnpj.replace(/\D/g, '')
      if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
        errors.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
      }
    }

    // Validar telefone se fornecido
    if (customerData.phone) {
      const cleanPhone = customerData.phone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Gerar dados de cliente para sandbox/teste
  generateSandboxCustomer(index: number = 1): CreateAsaasCustomerData {
    return {
      name: `Cliente Teste ${index}`,
      email: `cliente.teste${index}@styllobarber.com`,
      phone: `11999${String(index).padStart(6, '0')}`,
      cpfCnpj: this.generateTestCpf(),
      postalCode: '01310-100',
      address: 'Av. Paulista',
      addressNumber: String(1000 + index),
      city: 'São Paulo',
      state: 'SP',
      externalReference: `test_customer_${index}`,
      observations: 'Cliente criado para testes - Sandbox'
    }
  }

  // Gerar CPF válido para testes
  private generateTestCpf(): string {
    // Gera CPF válido para testes (algoritmo simplificado)
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
    
    // Calcular primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i)
    }
    const firstDigit = ((sum * 10) % 11) % 10
    digits.push(firstDigit)
    
    // Calcular segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i)
    }
    const secondDigit = ((sum * 10) % 11) % 10
    digits.push(secondDigit)
    
    return digits.join('')
  }
}

// Instância singleton do serviço
export const asaasCustomersService = new AsaasCustomersService()
