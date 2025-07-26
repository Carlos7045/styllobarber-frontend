import {
  clearAuthLocalData,
  hasResidualSessionData,
  forceCleanup,
  saveTemporaryData,
  getTemporaryData,
  clearTemporaryData,
  shouldShowLogoutConfirmation,
  prepareForLogout,
  DEFAULT_LOGOUT_OPTIONS
} from '../auth-utils'

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}

// Mock do sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}

// Mock do document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
})

// Mock do console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()

describe('auth-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Configurar mocks do Storage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    })

    // Reset document.cookie
    document.cookie = ''
  })

  afterEach(() => {
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()
    mockConsoleWarn.mockRestore()
  })

  describe('clearAuthLocalData', () => {
    it('deve limpar todas as chaves do localStorage', () => {
      clearAuthLocalData()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-auth-token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user-preferences')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app-cache')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('temp-data')
    })

    it('deve limpar sessionStorage', () => {
      clearAuthLocalData()

      expect(mockSessionStorage.clear).toHaveBeenCalled()
    })

    it('deve lidar com erros graciosamente', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => clearAuthLocalData()).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('hasResidualSessionData', () => {
    it('deve retornar true quando há dados no localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'supabase.auth.token') return 'some-token'
        return null
      })

      const result = hasResidualSessionData()
      expect(result).toBe(true)
    })

    it('deve retornar true quando há dados no sessionStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockSessionStorage.length = 1

      const result = hasResidualSessionData()
      expect(result).toBe(true)
    })

    it('deve retornar false quando não há dados residuais', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockSessionStorage.length = 0
      document.cookie = ''

      const result = hasResidualSessionData()
      expect(result).toBe(false)
    })

    it('deve lidar com erros e retornar false', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = hasResidualSessionData()
      expect(result).toBe(false)
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('forceCleanup', () => {
    it('deve limpar todo o localStorage e sessionStorage', () => {
      forceCleanup()

      expect(mockLocalStorage.clear).toHaveBeenCalled()
      expect(mockSessionStorage.clear).toHaveBeenCalled()
    })

    it('deve tentar limpar cookies existentes', () => {
      document.cookie = 'test-cookie=value; another-cookie=value2'
      
      forceCleanup()

      // Verificar se tentou limpar cookies (difícil de testar diretamente)
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Limpeza forçada concluída')
    })

    it('deve lidar com erros graciosamente', () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => forceCleanup()).not.toThrow()
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('saveTemporaryData', () => {
    it('deve salvar dados temporários no localStorage', () => {
      const testData = { key: 'value', number: 123 }
      
      saveTemporaryData(testData)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'temp-logout-data',
        expect.stringContaining('"data":{"key":"value","number":123}')
      )
    })

    it('deve incluir timestamp nos dados salvos', () => {
      const testData = { key: 'value' }
      const mockNow = 1234567890
      jest.spyOn(Date, 'now').mockReturnValue(mockNow)
      
      saveTemporaryData(testData)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'temp-logout-data',
        expect.stringContaining(`"timestamp":${mockNow}`)
      )
    })

    it('deve lidar com erros de salvamento', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      expect(() => saveTemporaryData({ key: 'value' })).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('getTemporaryData', () => {
    it('deve retornar dados temporários válidos', () => {
      const testData = { key: 'value' }
      const recentTimestamp = Date.now() - 30000 // 30 segundos atrás
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        timestamp: recentTimestamp,
        data: testData
      }))

      const result = getTemporaryData()
      expect(result).toEqual(testData)
    })

    it('deve retornar null para dados expirados', () => {
      const testData = { key: 'value' }
      const oldTimestamp = Date.now() - 3700000 // Mais de 1 hora atrás
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        timestamp: oldTimestamp,
        data: testData
      }))

      const result = getTemporaryData()
      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('temp-logout-data')
    })

    it('deve retornar null quando não há dados', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getTemporaryData()
      expect(result).toBeNull()
    })

    it('deve lidar com JSON inválido', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const result = getTemporaryData()
      expect(result).toBeNull()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('clearTemporaryData', () => {
    it('deve remover dados temporários', () => {
      clearTemporaryData()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('temp-logout-data')
    })

    it('deve lidar com erros graciosamente', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => clearTemporaryData()).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('shouldShowLogoutConfirmation', () => {
    it('deve retornar true quando há dados não salvos', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'draft-data') return 'some-draft'
        return null
      })

      const result = shouldShowLogoutConfirmation()
      expect(result).toBe(true)
    })

    it('deve retornar true quando há operações em andamento', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === 'ongoing-operations') return 'some-operation'
        return null
      })

      const result = shouldShowLogoutConfirmation()
      expect(result).toBe(true)
    })

    it('deve retornar false quando não há dados críticos', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockSessionStorage.getItem.mockReturnValue(null)

      const result = shouldShowLogoutConfirmation()
      expect(result).toBe(false)
    })

    it('deve lidar com erros e retornar false', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = shouldShowLogoutConfirmation()
      expect(result).toBe(false)
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('prepareForLogout', () => {
    it('deve salvar dados importantes temporariamente', async () => {
      // Mock do window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard/test' },
        writable: true
      })

      await prepareForLogout()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'temp-logout-data',
        expect.stringContaining('/dashboard/test')
      )
    })

    it('deve aguardar um tempo para operações assíncronas', async () => {
      const startTime = Date.now()
      
      await prepareForLogout()
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
    })

    it('deve lidar com erros graciosamente', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      await expect(prepareForLogout()).resolves.not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('DEFAULT_LOGOUT_OPTIONS', () => {
    it('deve ter configurações padrão corretas', () => {
      expect(DEFAULT_LOGOUT_OPTIONS).toEqual({
        clearLocalData: true,
        forceCleanup: false,
        redirectTo: '/login',
        showConfirmation: false
      })
    })
  })
})