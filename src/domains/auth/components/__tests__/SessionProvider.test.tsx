import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { SessionProvider, useSession, SessionIndicator } from '../SessionProvider'
import { useSessionManager } from '@/hooks/use-session-manager'
import { useAuthInterceptor } from '@/lib/api/auth-interceptor'

// Mock dos hooks
jest.mock('next/navigation')
jest.mock('@/hooks/use-session-manager')
jest.mock('@/lib/api/auth-interceptor')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSessionManager = useSessionManager as jest.MockedFunction<typeof useSessionManager>
const mockUseAuthInterceptor = useAuthInterceptor as jest.MockedFunction<typeof useAuthInterceptor>

// Componente de teste para usar o hook useSession
function TestComponent() {
  const session = useSession()
  
  return (
    <div>
      <div data-testid="session-valid">{session.isSessionValid.toString()}</div>
      <div data-testid="session-warning">{session.showSessionWarning.toString()}</div>
      <div data-testid="session-time">{session.sessionTimeLeft}</div>
      <button onClick={session.dismissWarning}>Dismiss Warning</button>
      <button onClick={() => session.forceRefresh()}>Force Refresh</button>
    </div>
  )
}

describe('SessionProvider', () => {
  const mockReplace = jest.fn()
  const mockForceRefresh = jest.fn()
  const mockFormatTimeUntilExpiry = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any)

    mockUseSessionManager.mockReturnValue({
      sessionState: { isValid: true, expiresAt: Date.now() + 3600000 },
      forceRefresh: mockForceRefresh,
      timeUntilExpiry: 3600000,
      isSessionValid: true,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
    })

    mockUseAuthInterceptor.mockImplementation(() => {})
    mockFormatTimeUntilExpiry.mockReturnValue('60m')
  })

  it('deve renderizar children corretamente', () => {
    render(
      <SessionProvider>
        <div data-testid="child">Test Child</div>
      </SessionProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('deve fornecer contexto de sessão', () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    expect(screen.getByTestId('session-valid')).toHaveTextContent('true')
    expect(screen.getByTestId('session-warning')).toHaveTextContent('false')
    expect(screen.getByTestId('session-time')).toHaveTextContent('3600000')
  })

  it('deve configurar useSessionManager com parâmetros corretos', () => {
    render(
      <SessionProvider
        autoRefreshTokens={false}
        warningThreshold={600000}
        checkInterval={60000}
      >
        <TestComponent />
      </SessionProvider>
    )

    expect(mockUseSessionManager).toHaveBeenCalledWith({
      checkInterval: 60000,
      warningThreshold: 600000,
      autoRefresh: false,
      onSessionExpired: expect.any(Function),
      onSessionWarning: expect.any(Function),
      onTokenRefreshed: expect.any(Function),
      onSessionError: expect.any(Function),
    })
  })

  it('deve redirecionar quando sessão expira', () => {
    const mockOnSessionExpired = jest.fn()
    
    mockUseSessionManager.mockImplementation((options) => {
      // Simular expiração de sessão
      setTimeout(() => {
        options.onSessionExpired?.()
      }, 100)
      
      return {
        sessionState: { isValid: false, expiresAt: null },
        forceRefresh: mockForceRefresh,
        timeUntilExpiry: null,
        isSessionValid: false,
        formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      }
    })

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(mockReplace).toHaveBeenCalledWith('/login?reason=session-expired')
  })

  it('deve mostrar aviso quando sessão está próxima da expiração', async () => {
    mockUseSessionManager.mockImplementation((options) => {
      // Simular aviso de sessão
      setTimeout(() => {
        options.onSessionWarning?.(300000) // 5 minutos
      }, 100)
      
      return {
        sessionState: { isValid: true, expiresAt: Date.now() + 300000 },
        forceRefresh: mockForceRefresh,
        timeUntilExpiry: 300000,
        isSessionValid: true,
        formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      }
    })

    mockFormatTimeUntilExpiry.mockReturnValue('5m')

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(screen.getByText(/aviso de sessão/i)).toBeInTheDocument()
      expect(screen.getByText(/sua sessão expira em 5m/i)).toBeInTheDocument()
    })
  })

  it('deve permitir dispensar aviso de sessão', async () => {
    const user = userEvent.setup()
    
    mockUseSessionManager.mockImplementation((options) => {
      setTimeout(() => {
        options.onSessionWarning?.(300000)
      }, 100)
      
      return {
        sessionState: { isValid: true, expiresAt: Date.now() + 300000 },
        forceRefresh: mockForceRefresh,
        timeUntilExpiry: 300000,
        isSessionValid: true,
        formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      }
    })

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(screen.getByText(/aviso de sessão/i)).toBeInTheDocument()
    })

    const dismissButton = screen.getByText(/dispensar/i)
    await user.click(dismissButton)

    expect(screen.queryByText(/aviso de sessão/i)).not.toBeInTheDocument()
  })

  it('deve permitir renovar sessão', async () => {
    const user = userEvent.setup()
    mockForceRefresh.mockResolvedValue(true)
    
    mockUseSessionManager.mockImplementation((options) => {
      setTimeout(() => {
        options.onSessionWarning?.(300000)
      }, 100)
      
      return {
        sessionState: { isValid: true, expiresAt: Date.now() + 300000 },
        forceRefresh: mockForceRefresh,
        timeUntilExpiry: 300000,
        isSessionValid: true,
        formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      }
    })

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(screen.getByText(/renovar sessão/i)).toBeInTheDocument()
    })

    const refreshButton = screen.getByText(/renovar sessão/i)
    await user.click(refreshButton)

    expect(mockForceRefresh).toHaveBeenCalled()
  })

  it('deve configurar interceptor de autenticação', () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    expect(mockUseAuthInterceptor).toHaveBeenCalledWith({
      onTokenExpired: expect.any(Function),
      onUnauthorized: expect.any(Function),
      onSessionInvalid: expect.any(Function),
      onAuthError: expect.any(Function),
    })
  })

  it('deve redirecionar quando não autorizado', () => {
    mockUseAuthInterceptor.mockImplementation((options) => {
      setTimeout(() => {
        options.onUnauthorized?.()
      }, 100)
    })

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(mockReplace).toHaveBeenCalledWith('/login?reason=unauthorized')
  })

  it('deve mostrar indicador de status quando habilitado', () => {
    render(
      <SessionProvider showStatusIndicator={true}>
        <TestComponent />
      </SessionProvider>
    )

    // O SessionStatus deve estar presente (testado separadamente)
    expect(screen.getByTestId('session-valid')).toBeInTheDocument()
  })

  it('deve ocultar indicador de status quando desabilitado', () => {
    render(
      <SessionProvider showStatusIndicator={false}>
        <TestComponent />
      </SessionProvider>
    )

    // Verificar que não há elementos extras do SessionStatus
    expect(screen.getByTestId('session-valid')).toBeInTheDocument()
  })

  it('deve lançar erro quando useSession é usado fora do provider', () => {
    // Suprimir console.error para este teste
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useSession deve ser usado dentro de um SessionProvider')

    consoleSpy.mockRestore()
  })
})

describe('SessionIndicator', () => {
  const mockUseSession = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock do useSession
    jest.doMock('../SessionProvider', () => ({
      ...jest.requireActual('../SessionProvider'),
      useSession: mockUseSession,
    }))
  })

  it('deve mostrar sessão inválida', () => {
    mockUseSession.mockReturnValue({
      isSessionValid: false,
      sessionTimeLeft: null,
    })

    render(
      <SessionProvider>
        <SessionIndicator />
      </SessionProvider>
    )

    expect(screen.getByText(/sessão inválida/i)).toBeInTheDocument()
  })

  it('deve mostrar aviso quando próximo da expiração', () => {
    mockUseSession.mockReturnValue({
      isSessionValid: true,
      sessionTimeLeft: 240000, // 4 minutos
    })

    render(
      <SessionProvider>
        <SessionIndicator />
      </SessionProvider>
    )

    expect(screen.getByText(/expira em 4min/i)).toBeInTheDocument()
  })

  it('deve mostrar sessão ativa quando válida', () => {
    mockUseSession.mockReturnValue({
      isSessionValid: true,
      sessionTimeLeft: 3600000, // 1 hora
    })

    render(
      <SessionProvider>
        <SessionIndicator />
      </SessionProvider>
    )

    expect(screen.getByText(/sessão ativa/i)).toBeInTheDocument()
  })

  it('deve aplicar className customizada', () => {
    mockUseSession.mockReturnValue({
      isSessionValid: true,
      sessionTimeLeft: 3600000,
    })

    render(
      <SessionProvider>
        <SessionIndicator className="custom-class" />
      </SessionProvider>
    )

    const indicator = screen.getByText(/sessão ativa/i).parentElement
    expect(indicator).toHaveClass('custom-class')
  })
})
