import { renderHook, act } from '@testing-library/react'
import { useAuthInterceptor } from '../auth-interceptor'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { supabase } from '@/lib/api/supabase'

// Mock dos hooks e dependências
jest.mock('@/domains/auth/hooks/use-auth')
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('useAuthInterceptor', () => {
  const mockCallbacks = {
    onTokenExpired: jest.fn(),
    onUnauthorized: jest.fn(),
    onSessionInvalid: jest.fn(),
    onAuthError: jest.fn(),
  }

  const mockUnsubscribe = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'valid-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
      loading: false,
    } as any)

    ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  it('deve configurar listener de mudanças de auth', () => {
    renderHook(() => useAuthInterceptor(mockCallbacks))

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('deve detectar token expirado', () => {
    const mockAuthStateCallback = jest.fn()
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Simular evento de token expirado
    act(() => {
      mockAuthStateCallback('TOKEN_REFRESHED', null)
    })

    expect(mockCallbacks.onTokenExpired).toHaveBeenCalled()
  })

  it('deve detectar sessão inválida', () => {
    const mockAuthStateCallback = jest.fn()
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Simular evento de sessão inválida
    act(() => {
      mockAuthStateCallback('SIGNED_OUT', null)
    })

    expect(mockCallbacks.onSessionInvalid).toHaveBeenCalled()
  })

  it('deve detectar erro de autenticação', () => {
    const mockAuthStateCallback = jest.fn()
    const mockError = new Error('Auth error')
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Simular erro de autenticação
    act(() => {
      mockAuthStateCallback('SIGNED_OUT', null, mockError)
    })

    expect(mockCallbacks.onAuthError).toHaveBeenCalledWith(mockError)
  })

  it('deve verificar expiração de token periodicamente', () => {
    jest.useFakeTimers()
    
    // Sessão que expira em 30 segundos
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'expiring-token',
        expires_at: Math.floor(Date.now() / 1000) + 30,
      },
      loading: false,
    } as any)

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Avançar tempo para trigger verificação
    act(() => {
      jest.advanceTimersByTime(60000) // 1 minuto
    })

    expect(mockCallbacks.onTokenExpired).toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('deve interceptar requisições HTTP', async () => {
    // Mock do fetch global
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    // Simular resposta 401
    mockFetch.mockResolvedValue({
      status: 401,
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Fazer uma requisição que retorna 401
    try {
      await fetch('/api/test')
    } catch (error) {
      // Erro esperado
    }

    // Aguardar processamento assíncrono
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(mockCallbacks.onUnauthorized).toHaveBeenCalled()
  })

  it('deve interceptar requisições com erro 403', async () => {
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    mockFetch.mockResolvedValue({
      status: 403,
      ok: false,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    try {
      await fetch('/api/test')
    } catch (error) {
      // Erro esperado
    }

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(mockCallbacks.onUnauthorized).toHaveBeenCalled()
  })

  it('deve ignorar requisições bem-sucedidas', async () => {
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: 'success' }),
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    await fetch('/api/test')

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(mockCallbacks.onUnauthorized).not.toHaveBeenCalled()
    expect(mockCallbacks.onAuthError).not.toHaveBeenCalled()
  })

  it('deve limpar intervalos ao desmontar', () => {
    jest.useFakeTimers()
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = renderHook(() => useAuthInterceptor(mockCallbacks))

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    expect(mockUnsubscribe).toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('deve lidar com sessão nula', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: false,
    } as any)

    expect(() => {
      renderHook(() => useAuthInterceptor(mockCallbacks))
    }).not.toThrow()
  })

  it('deve aguardar carregamento antes de iniciar verificações', () => {
    jest.useFakeTimers()
    
    mockUseAuth.mockReturnValue({
      session: null,
      loading: true,
    } as any)

    renderHook(() => useAuthInterceptor(mockCallbacks))

    // Avançar tempo - não deve fazer verificações enquanto loading
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    expect(mockCallbacks.onTokenExpired).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('deve usar callbacks opcionais', () => {
    const partialCallbacks = {
      onTokenExpired: jest.fn(),
      // Outros callbacks omitidos
    }

    expect(() => {
      renderHook(() => useAuthInterceptor(partialCallbacks))
    }).not.toThrow()
  })

  it('deve detectar diferentes eventos de auth state', () => {
    const mockAuthStateCallback = jest.fn()
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    renderHook(() => useAuthInterceptor(mockCallbacks))

    const events = [
      'SIGNED_IN',
      'SIGNED_OUT',
      'TOKEN_REFRESHED',
      'USER_UPDATED',
      'PASSWORD_RECOVERY',
    ]

    events.forEach(event => {
      act(() => {
        mockAuthStateCallback(event, null)
      })
    })

    // Verificar que os callbacks apropriados foram chamados
    expect(mockCallbacks.onSessionInvalid).toHaveBeenCalled()
    expect(mockCallbacks.onTokenExpired).toHaveBeenCalled()
  })

  it('deve configurar interceptor apenas uma vez', () => {
    const { rerender } = renderHook(() => useAuthInterceptor(mockCallbacks))

    const initialCallCount = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls.length

    rerender()

    expect((supabase.auth.onAuthStateChange as jest.Mock).mock.calls.length)
      .toBe(initialCallCount)
  })

  it('deve lidar com erro no listener de auth state', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(() => {
      throw new Error('Listener error')
    })

    expect(() => {
      renderHook(() => useAuthInterceptor(mockCallbacks))
    }).not.toThrow()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
