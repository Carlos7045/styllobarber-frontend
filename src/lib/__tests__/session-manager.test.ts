/**
 * Testes unitários para SessionManager
 * Testa validação, recovery e monitoramento de sessão
 */

import { SessionManager } from '../session-manager'
import { supabase } from '../supabase'

// Mock do Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}))

describe('SessionManager', () => {
  let sessionManager: SessionManager
  const mockSupabase = supabase as jest.Mocked<typeof supabase>

  beforeEach(() => {
    sessionManager = SessionManager.getInstance()
    jest.clearAllMocks()
    
    // Reset singleton para cada teste
    ;(SessionManager as any).instance = undefined
    sessionManager = SessionManager.getInstance()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('getInstance', () => {
    it('deve retornar a mesma instância (singleton)', () => {
      const instance1 = SessionManager.getInstance()
      const instance2 = SessionManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('getCurrentSession', () => {
    it('deve retornar sessão válida quando existe', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.getCurrentSession()
      
      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('deve retornar null quando não há sessão', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await sessionManager.getCurrentSession()
      
      expect(result).toBeNull()
    })

    it('deve lidar com erros do Supabase', async () => {
      const mockError = new Error('Supabase error')
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await sessionManager.getCurrentSession()
      
      expect(result).toBeNull()
    })
  })

  describe('validateSession', () => {
    it('deve validar sessão existente e válida', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'valid-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hora no futuro
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.validateSession()
      
      expect(result).toBe(true)
    })

    it('deve invalidar sessão expirada', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hora no passado
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.validateSession()
      
      expect(result).toBe(false)
    })

    it('deve invalidar quando não há sessão', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await sessionManager.validateSession()
      
      expect(result).toBe(false)
    })
  })

  describe('signOut', () => {
    it('deve fazer logout com sucesso', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await sessionManager.signOut()
      
      expect(result).toBe(true)
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('deve lidar com erro no logout', async () => {
      const mockError = new Error('Logout failed')
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      const result = await sessionManager.signOut()
      
      expect(result).toBe(false)
    })
  })

  describe('refreshSession', () => {
    it('deve fazer refresh da sessão com sucesso', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'new-token'
      }

      // Mock para getSession retornar sessão atual
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.refreshSession()
      
      expect(result).toBe(true)
    })

    it('deve falhar quando não há sessão para refresh', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await sessionManager.refreshSession()
      
      expect(result).toBe(false)
    })
  })

  describe('recoverFromError', () => {
    it('deve tentar recovery com refresh primeiro', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'recovered-token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.recoverFromError()
      
      expect(result).toBe(true)
    })

    it('deve falhar recovery quando não consegue recuperar', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await sessionManager.recoverFromError()
      
      expect(result).toBe(false)
    })
  })

  describe('getSessionHealth', () => {
    it('deve retornar estado de saúde da sessão', () => {
      const health = sessionManager.getSessionHealth()
      
      expect(health).toHaveProperty('isValid')
      expect(health).toHaveProperty('lastValidated')
      expect(health).toHaveProperty('errorCount')
      expect(typeof health.isValid).toBe('boolean')
      expect(health.lastValidated).toBeInstanceOf(Date)
      expect(typeof health.errorCount).toBe('number')
    })
  })

  describe('logSessionEvent', () => {
    it('deve registrar eventos de sessão', () => {
      const event = {
        type: 'login' as const,
        timestamp: new Date(),
        userId: 'user-123',
        details: { action: 'test' }
      }

      sessionManager.logSessionEvent(event)
      
      const eventLog = sessionManager.getEventLog()
      expect(eventLog).toContain(event)
    })

    it('deve limitar o log a 100 eventos', () => {
      // Adicionar 150 eventos
      for (let i = 0; i < 150; i++) {
        sessionManager.logSessionEvent({
          type: 'validation',
          timestamp: new Date(),
          details: { action: `test-${i}` }
        })
      }

      const eventLog = sessionManager.getEventLog()
      expect(eventLog.length).toBe(100)
    })
  })

  describe('error handling', () => {
    it('deve atualizar contador de erros quando há falhas', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      await sessionManager.validateSession()
      
      const health = sessionManager.getSessionHealth()
      expect(health.errorCount).toBeGreaterThan(0)
      expect(health.isValid).toBe(false)
    })

    it('deve resetar contador de erros após sucesso', async () => {
      // Primeiro, causar um erro
      mockSupabase.auth.getSession.mockRejectedValueOnce(new Error('Network error'))
      await sessionManager.validateSession()

      // Depois, sucesso
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'valid-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      await sessionManager.validateSession()
      
      const health = sessionManager.getSessionHealth()
      expect(health.errorCount).toBe(0)
      expect(health.isValid).toBe(true)
    })
  })

  describe('session expiry handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('deve detectar e lidar com sessão expirada', async () => {
      const expiredSession = {
        user: { id: 'user-123' },
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 1 // Expirada
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      const result = await sessionManager.validateSession()
      
      expect(result).toBe(false)
    })
  })
})