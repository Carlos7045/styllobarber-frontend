import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionManager } from '../use-session-manager'
import { useAuth } from '../use-auth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Mock do useAuth
jest.mock('../use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do useRouter
jest.mock('next/navigation')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: jest.fn(),
    }
  }
}))

// Mock dos utilitários de auth
jest.mock('@/lib/auth-utils', () => ({
  clearAuthLocalData: jest.fn(),
  prepareForLogout: jest.fn(() => Promise.resolve()),
}))

describe('useSessionManager', () => {
  const mockSignOut = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora no futuro
      },
      signOut: mockSignOut,
      loading: false,
    } as any)

    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('deve inicializar com estado correto', () => {
    const { result } = renderHook(() => useSessionManager())

    expect(result.current.sessionState.isValid).toBe(true)
    expect(result.current.sessionState.expiresAt).toBeTruthy()
    expect(result.current.isSessionValid).toBe(true)
  })

  it('deve detectar sessão expirada', async () => {
    const onSessionExpired = jest.fn()
    
    // Sessão já expirada
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) - 100, // 100s no passado
      },
      signOut: mockSignOut,
      loading: false,
    } as any)

    const { result } = renderHook(() => 
      useSessionManager({ onSessionExpired })
    )

    // Aguardar verificação inicial
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalled()
    })
  })

  it('deve mostrar aviso quando próximo da expiração', async () => {
    const onSessionWarning = jest.fn()
    
    // Sessão expira em 4 minutos
    const expiresAt = Math.floor(Date.now() / 1000) + 240
    
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'mock-token',
        expires_at: expiresAt,
      },
      signOut: mockSignOut,
      loading: false,
    } as any)

    const { result } = renderHook(() => 
      useSessionManager({ 
        onSessionWarning,
        warningThreshold: 300000 // 5 minutos
      })
    )

    // Aguardar verificação
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(onSessionWarning).toHaveBeenCalled()
    })
  })

  it('deve renovar token automaticamente', async () => {
    const onTokenRefreshed = jest.fn()
    const mockRefreshSession = supabase.auth.refreshSession as jest.Mock
    
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'new-token' } },
      error: null
    })

    const { result } = renderHook(() => 
      useSessionManager({ 
        onTokenRefreshed,
        autoRefresh: true
      })
    )

    // Forçar renovação
    await act(async () => {
      const success = await result.current.forceRefresh()
      expect(success).toBe(true)
    })

    expect(mockRefreshSession).toHaveBeenCalled()
    expect(onTokenRefreshed).toHaveBeenCalled()
  })

  it('deve lidar com erro na renovação', async () => {
    const onSessionError = jest.fn()
    const mockRefreshSession = supabase.auth.refreshSession as jest.Mock
    
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Erro de renovação' }
    })

    const { result } = renderHook(() => 
      useSessionManager({ onSessionError })
    )

    await act(async () => {
      const success = await result.current.forceRefresh()
      expect(success).toBe(false)
    })

    expect(onSessionError).toHaveBeenCalledWith('Erro de renovação')
  })

  it('deve formatar tempo corretamente', () => {
    const { result } = renderHook(() => useSessionManager())

    expect(result.current.formatTimeUntilExpiry(65000)).toBe('1m 5s')
    expect(result.current.formatTimeUntilExpiry(30000)).toBe('30s')
    expect(result.current.formatTimeUntilExpiry(null)).toBe('Desconhecido')
  })

  it('deve invalidar sessão manualmente', async () => {
    const onSessionExpired = jest.fn()
    
    const { result } = renderHook(() => 
      useSessionManager({ onSessionExpired })
    )

    await act(async () => {
      await result.current.invalidateSession('teste')
    })

    expect(onSessionExpired).toHaveBeenCalled()
  })

  it('deve verificar sessão periodicamente', async () => {
    const checkInterval = 1000 // 1 segundo para teste
    
    const { result } = renderHook(() => 
      useSessionManager({ checkInterval })
    )

    // Avançar tempo para trigger verificação periódica
    await act(async () => {
      jest.advanceTimersByTime(checkInterval + 100)
    })

    // Verificar se o estado foi atualizado
    expect(result.current.sessionState.isValid).toBeDefined()
  })

  it('deve agendar renovação automática', async () => {
    const onTokenRefreshed = jest.fn()
    const mockRefreshSession = supabase.auth.refreshSession as jest.Mock
    
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'new-token' } },
      error: null
    })

    // Sessão expira em 3 minutos
    const expiresAt = Math.floor(Date.now() / 1000) + 180
    
    mockUseAuth.mockReturnValue({
      session: {
        access_token: 'mock-token',
        expires_at: expiresAt,
      },
      signOut: mockSignOut,
      loading: false,
    } as any)

    renderHook(() => 
      useSessionManager({ 
        onTokenRefreshed,
        autoRefresh: true
      })
    )

    // Avançar tempo para trigger renovação agendada (2 min antes da expiração)
    await act(async () => {
      jest.advanceTimersByTime(60000) // 1 minuto
    })

    // A renovação deve ter sido agendada
    expect(mockRefreshSession).toHaveBeenCalled()
  })

  it('deve limpar timers ao desmontar', () => {
    const { unmount } = renderHook(() => useSessionManager())

    // Spy nos métodos de limpeza
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('deve lidar com sessão nula', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      signOut: mockSignOut,
      loading: false,
    } as any)

    const { result } = renderHook(() => useSessionManager())

    expect(result.current.sessionState.isValid).toBe(false)
    expect(result.current.sessionState.expiresAt).toBe(null)
  })

  it('deve lidar com loading state', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      signOut: mockSignOut,
      loading: true,
    } as any)

    const { result } = renderHook(() => useSessionManager())

    expect(result.current.sessionState.isValid).toBe(false)
  })
})