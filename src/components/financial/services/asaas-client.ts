// Cliente HTTP para integração com API Asaas

import { asaasConfig } from '../config'
import { retryWithBackoff } from '../utils'

// Tipos para respostas da API Asaas
export interface AsaasApiResponse<T = any> {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}

export interface AsaasError {
  code: string
  description: string
}

export interface AsaasErrorResponse {
  errors: AsaasError[]
}

// Cliente HTTP principal para API Asaas
export class AsaasClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor() {
    this.baseUrl = asaasConfig.baseUrl
    this.apiKey = asaasConfig.apiKey
    this.timeout = asaasConfig.timeout
  }

  // Método privado para fazer requisições HTTP
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': 'StylloBarber/1.0'
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    }

    try {
      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AsaasApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof AsaasApiError) {
        throw error
      }
      
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new AsaasApiError('Request timeout', 408)
      }
      
      throw new AsaasApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      )
    }
  }

  // Método GET com retry automático
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const searchParams = params ? new URLSearchParams(params).toString() : ''
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint

    return retryWithBackoff(
      () => this.makeRequest<T>(url, { method: 'GET' }),
      asaasConfig.retryConfig.MAX_ATTEMPTS,
      asaasConfig.retryConfig.INITIAL_DELAY
    )
  }

  // Método POST com retry automático
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return retryWithBackoff(
      () => this.makeRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      }),
      asaasConfig.retryConfig.MAX_ATTEMPTS,
      asaasConfig.retryConfig.INITIAL_DELAY
    )
  }

  // Método PUT com retry automático
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return retryWithBackoff(
      () => this.makeRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      }),
      asaasConfig.retryConfig.MAX_ATTEMPTS,
      asaasConfig.retryConfig.INITIAL_DELAY
    )
  }

  // Método DELETE com retry automático
  async delete<T>(endpoint: string): Promise<T> {
    return retryWithBackoff(
      () => this.makeRequest<T>(endpoint, { method: 'DELETE' }),
      asaasConfig.retryConfig.MAX_ATTEMPTS,
      asaasConfig.retryConfig.INITIAL_DELAY
    )
  }

  // Método para testar conectividade com a API
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/myAccount')
      return true
    } catch (error) {
      console.error('Erro ao testar conexão com Asaas:', error)
      return false
    }
  }

  // Método para obter informações da conta
  async getAccountInfo(): Promise<any> {
    return this.get('/myAccount')
  }

  // Método para validar webhook
  validateWebhook(payload: string, signature: string): boolean {
    // Implementar validação de assinatura do webhook
    // Por enquanto, retorna true para desenvolvimento
    if (asaasConfig.environment === 'sandbox') {
      return true
    }
    
    // TODO: Implementar validação real da assinatura
    return signature.length > 0
  }
}

// Classe de erro personalizada para API Asaas
export class AsaasApiError extends Error {
  public statusCode: number
  public errorData?: any

  constructor(message: string, statusCode: number, errorData?: any) {
    super(message)
    this.name = 'AsaasApiError'
    this.statusCode = statusCode
    this.errorData = errorData
  }

  // Método para verificar se é erro de validação
  isValidationError(): boolean {
    return this.statusCode === 400
  }

  // Método para verificar se é erro de autenticação
  isAuthenticationError(): boolean {
    return this.statusCode === 401
  }

  // Método para verificar se é erro de rate limit
  isRateLimitError(): boolean {
    return this.statusCode === 429
  }

  // Método para obter mensagens de erro formatadas
  getErrorMessages(): string[] {
    if (this.errorData?.errors) {
      return this.errorData.errors.map((error: AsaasError) => error.description)
    }
    return [this.message]
  }
}

// Instância singleton do cliente Asaas
export const asaasClient = new AsaasClient()

// Função utilitária para verificar se a API está configurada
export function isAsaasConfigured(): boolean {
  return Boolean(asaasConfig.apiKey && asaasConfig.baseUrl)
}

// Função utilitária para verificar se está em modo sandbox
export function isSandboxMode(): boolean {
  return asaasConfig.environment === 'sandbox'
}

// Função para formatar erros da API Asaas
export function formatAsaasError(error: unknown): string {
  if (error instanceof AsaasApiError) {
    const messages = error.getErrorMessages()
    return messages.join(', ')
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Erro desconhecido na API Asaas'
}
