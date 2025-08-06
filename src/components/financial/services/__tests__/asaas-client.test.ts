// Testes unitários para o cliente Asaas

import { AsaasClient, AsaasApiError } from '../asaas-client'

// Mock do fetch global
global.fetch = jest.fn()

describe('AsaasClient', () => {
  let asaasClient: AsaasClient
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    asaasClient = new AsaasClient()
    mockFetch.mockClear()
  })

  describe('makeRequest', () => {
    it('deve fazer requisição GET com sucesso', async () => {
      const mockResponse = { id: '123', name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await asaasClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'access_token': expect.any(String),
            'User-Agent': 'StylloBarber/1.0'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('deve fazer requisição POST com dados', async () => {
      const mockData = { name: 'Test Customer' }
      const mockResponse = { id: '123', ...mockData }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201,
        statusText: 'Created'
      } as Response)

      const result = await asaasClient.post('/customers', mockData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('deve lançar AsaasApiError para resposta de erro', async () => {
      const errorResponse = {
        errors: [{ code: 'invalid_customer', description: 'Cliente inválido' }]
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse
      } as Response)

      await expect(asaasClient.get('/invalid')).rejects.toThrow(AsaasApiError)
      
      try {
        await asaasClient.get('/invalid')
      } catch (error) {
        expect(error).toBeInstanceOf(AsaasApiError)
        expect((error as AsaasApiError).statusCode).toBe(400)
        expect((error as AsaasApiError).errorData).toEqual(errorResponse)
      }
    })

    it('deve lançar erro de timeout', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'))

      await expect(asaasClient.get('/timeout')).rejects.toThrow(AsaasApiError)
      
      try {
        await asaasClient.get('/timeout')
      } catch (error) {
        expect(error).toBeInstanceOf(AsaasApiError)
        expect((error as AsaasApiError).statusCode).toBe(408)
        expect((error as AsaasApiError).message).toBe('Request timeout')
      }
    })
  })

  describe('testConnection', () => {
    it('deve retornar true para conexão bem-sucedida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'acc_123' }),
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await asaasClient.testConnection()
      expect(result).toBe(true)
    })

    it('deve retornar false para conexão falhada', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await asaasClient.testConnection()
      expect(result).toBe(false)
    })
  })

  describe('validateWebhook', () => {
    it('deve retornar true em modo sandbox', () => {
      const result = asaasClient.validateWebhook('payload', 'signature')
      expect(result).toBe(true)
    })
  })
})

describe('AsaasApiError', () => {
  it('deve criar erro com informações corretas', () => {
    const errorData = { errors: [{ code: 'test', description: 'Test error' }] }
    const error = new AsaasApiError('Test message', 400, errorData)

    expect(error.message).toBe('Test message')
    expect(error.statusCode).toBe(400)
    expect(error.errorData).toEqual(errorData)
    expect(error.name).toBe('AsaasApiError')
  })

  it('deve identificar erro de validação', () => {
    const error = new AsaasApiError('Validation error', 400)
    expect(error.isValidationError()).toBe(true)
    expect(error.isAuthenticationError()).toBe(false)
  })

  it('deve identificar erro de autenticação', () => {
    const error = new AsaasApiError('Auth error', 401)
    expect(error.isAuthenticationError()).toBe(true)
    expect(error.isValidationError()).toBe(false)
  })

  it('deve identificar erro de rate limit', () => {
    const error = new AsaasApiError('Rate limit', 429)
    expect(error.isRateLimitError()).toBe(true)
  })

  it('deve extrair mensagens de erro', () => {
    const errorData = {
      errors: [
        { code: 'error1', description: 'Primeiro erro' },
        { code: 'error2', description: 'Segundo erro' }
      ]
    }
    const error = new AsaasApiError('Multiple errors', 400, errorData)
    
    const messages = error.getErrorMessages()
    expect(messages).toEqual(['Primeiro erro', 'Segundo erro'])
  })

  it('deve retornar mensagem padrão quando não há errorData', () => {
    const error = new AsaasApiError('Simple error', 500)
    const messages = error.getErrorMessages()
    expect(messages).toEqual(['Simple error'])
  })
})
