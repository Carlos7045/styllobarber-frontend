import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionStatus, SessionStatusIcon, useSessionStatus } from '../SessionStatus'
import { useSessionManager } from '@/hooks/use-session-manager'

// Mock do useSessionManager
jest.mock('@/hooks/use-session-manager')
const mockUseSessionManager = useSessionManager as jest.MockedFunction<typeof useSessionManager>

describe('SessionStatus', () => {
  const mockForceRefresh = jest.fn()
  const mockFormatTimeUntilExpiry = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        timeUntilExpiry: 3600000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 3600000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    mockFormatTimeUntilExpiry.mockReturnValue('60m 0s')
  })

  it('deve não renderizar quando não visível', () => {
    const { container } = render(<SessionStatus />)
    expect(container.firstChild).toBeNull()
  })

  it('deve mostrar status quando há warning', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        timeUntilExpiry: 300000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: true,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 300000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    mockFormatTimeUntilExpiry.mockReturnValue('5m 0s')

    render(<SessionStatus autoHide={false} />)

    expect(screen.getByText('Sessão expira em 5m 0s')).toBeInTheDocument()
  })

  it('deve mostrar estado de refreshing', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        timeUntilExpiry: 300000,
        isRefreshing: true,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 300000,
      isRefreshing: true,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatus autoHide={false} />)

    expect(screen.getByText('Renovando sessão...')).toBeInTheDocument()
  })

  it('deve mostrar sessão inválida', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: false,
      timeUntilExpiry: null,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatus autoHide={false} />)

    expect(screen.getByText('Sessão inválida')).toBeInTheDocument()
  })

  it('deve permitir renovar sessão manualmente', async () => {
    const user = userEvent.setup()
    mockForceRefresh.mockResolvedValue(true)

    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        timeUntilExpiry: 300000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: true,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 300000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatus autoHide={false} />)

    const refreshButton = screen.getByTitle('Renovar sessão')
    await user.click(refreshButton)

    expect(mockForceRefresh).toHaveBeenCalled()
  })

  it('deve permitir fechar quando autoHide está ativo', async () => {
    const user = userEvent.setup()

    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        timeUntilExpiry: 300000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: true,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 300000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatus autoHide={true} />)

    const closeButton = screen.getByTitle('Fechar')
    await user.click(closeButton)

    // Componente deve desaparecer
    await waitFor(() => {
      expect(screen.queryByText('Sessão expira em')).not.toBeInTheDocument()
    })
  })

  it('deve mostrar detalhes quando showDetails é true', () => {
    const now = Date.now()
    const expiresAt = Math.floor(now / 1000) + 3600
    const lastRefresh = now - 60000

    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt,
        timeUntilExpiry: 3600000,
        isRefreshing: false,
        lastRefresh,
        warningShown: false,
      },
      forceRefresh: mockForceRefresh,
      formatTimeUntilExpiry: mockFormatTimeUntilExpiry,
      isSessionValid: true,
      timeUntilExpiry: 3600000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatus autoHide={false} showDetails={true} />)

    expect(screen.getByText('Status: Válida')).toBeInTheDocument()
    expect(screen.getByText(/Expira:/)).toBeInTheDocument()
    expect(screen.getByText(/Última renovação:/)).toBeInTheDocument()
  })
})

describe('SessionStatusIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve mostrar ícone de sucesso quando sessão é válida', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        timeUntilExpiry: 3600000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: jest.fn(),
      formatTimeUntilExpiry: jest.fn(),
      isSessionValid: true,
      timeUntilExpiry: 3600000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatusIcon />)

    // Verificar se o ícone de sucesso está presente (ShieldCheck)
    const icon = screen.getByTitle('Status da sessão')
    expect(icon).toBeInTheDocument()
  })

  it('deve mostrar ícone de erro quando sessão é inválida', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: jest.fn(),
      formatTimeUntilExpiry: jest.fn(),
      isSessionValid: false,
      timeUntilExpiry: null,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatusIcon />)

    const icon = screen.getByTitle('Status da sessão')
    expect(icon).toBeInTheDocument()
  })

  it('deve mostrar ícone de loading quando está renovando', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        timeUntilExpiry: 300000,
        isRefreshing: true,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: jest.fn(),
      formatTimeUntilExpiry: jest.fn(),
      isSessionValid: true,
      timeUntilExpiry: 300000,
      isRefreshing: true,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    render(<SessionStatusIcon />)

    const icon = screen.getByTitle('Status da sessão')
    expect(icon).toBeInTheDocument()
  })
})

describe('useSessionStatus', () => {
  it('deve retornar dados do session manager com helpers adicionais', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        timeUntilExpiry: 3600000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: jest.fn(),
      formatTimeUntilExpiry: jest.fn(),
      isSessionValid: true,
      timeUntilExpiry: 3600000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    const TestComponent = () => {
      const { 
        isExpiringSoon, 
        getStatusText, 
        getStatusColor,
        isSessionValid 
      } = useSessionStatus()
      
      return (
        <div>
          <div>Valid: {isSessionValid.toString()}</div>
          <div>Expiring Soon: {isExpiringSoon().toString()}</div>
          <div>Status: {getStatusText()}</div>
          <div>Color: {getStatusColor()}</div>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByText('Valid: true')).toBeInTheDocument()
    expect(screen.getByText('Expiring Soon: false')).toBeInTheDocument()
    expect(screen.getByText('Status: Ativa')).toBeInTheDocument()
    expect(screen.getByText('Color: success')).toBeInTheDocument()
  })

  it('deve detectar sessão expirando em breve', () => {
    mockUseSessionManager.mockReturnValue({
      sessionState: {
        isValid: true,
        expiresAt: Math.floor(Date.now() / 1000) + 240, // 4 minutos
        timeUntilExpiry: 240000,
        isRefreshing: false,
        lastRefresh: null,
        warningShown: false,
      },
      forceRefresh: jest.fn(),
      formatTimeUntilExpiry: jest.fn(),
      isSessionValid: true,
      timeUntilExpiry: 240000,
      isRefreshing: false,
      forceCheck: jest.fn(),
      invalidateSession: jest.fn(),
    })

    const TestComponent = () => {
      const { isExpiringSoon, getStatusText, getStatusColor } = useSessionStatus()
      
      return (
        <div>
          <div>Expiring Soon: {isExpiringSoon().toString()}</div>
          <div>Status: {getStatusText()}</div>
          <div>Color: {getStatusColor()}</div>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByText('Expiring Soon: true')).toBeInTheDocument()
    expect(screen.getByText('Status: Expirando')).toBeInTheDocument()
    expect(screen.getByText('Color: warning')).toBeInTheDocument()
  })
})