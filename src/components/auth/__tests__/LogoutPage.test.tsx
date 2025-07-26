import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoutPage } from '../LogoutPage'
import { useAuth } from '@/hooks/use-auth'
import { clearAuthLocalData, prepareForLogout } from '@/lib/auth-utils'

// Mock dos hooks e utilitários
jest.mock('next/navigation')
jest.mock('@/hooks/use-auth')
jest.mock('@/lib/auth-utils')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockClearAuthLocalData = clearAuthLocalData as jest.MockedFunction<typeof clearAuthLocalData>
const mockPrepareForLogout = prepareForLogout as jest.MockedFunction<typeof prepareForLogout>

describe('LogoutPage', () => {
  const mockReplace = jest.fn()
  const mockBack = jest.fn()
  const mockSignOut = jest.fn()
  const mockSearchParams = new URLSearchParams()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      back: mockBack,
    } as any)

    mockUseSearchParams.mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
    } as any)

    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: true,
      loading: false,
    } as any)

    mockPrepareForLogout.mockResolvedValue(undefined)
    mockClearAuthLocalData.mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('deve renderizar página de logout padrão', () => {
    render(<LogoutPage />)

    expect(screen.getByText(/sair do sistema/i)).toBeInTheDocument()
    expect(screen.getByText(/tem certeza que deseja sair/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar logout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('deve mostrar mensagem baseada no motivo', () => {
    mockSearchParams.set('reason', 'session-expired')
    
    render(<LogoutPage />)

    expect(screen.getByText(/sua sessão expirou/i)).toBeInTheDocument()
  })

  it('deve mostrar diferentes mensagens para diferentes motivos', () => {
    const reasons = [
      { reason: 'security', message: /por motivos de segurança/i },
      { reason: 'inactivity', message: /desconectado por inatividade/i },
      { reason: 'forced', message: /logout forçado pelo sistema/i },
    ]

    reasons.forEach(({ reason, message }) => {
      mockSearchParams.set('reason', reason)
      
      const { unmount } = render(<LogoutPage />)
      
      expect(screen.getByText(message)).toBeInTheDocument()
      
      unmount()
    })
  })

  it('deve fazer logout automático quando auto=true', async () => {
    mockSearchParams.set('auto', 'true')
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    await waitFor(() => {
      expect(screen.getByText(/fazendo logout/i)).toBeInTheDocument()
    })

    expect(mockPrepareForLogout).toHaveBeenCalled()
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('deve fazer logout manual quando usuário confirma', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/fazendo logout/i)).toBeInTheDocument()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('deve mostrar sucesso e iniciar countdown', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/logout realizado/i)).toBeInTheDocument()
      expect(screen.getByText(/redirecionando em 5 segundos/i)).toBeInTheDocument()
    })

    // Avançar tempo para testar countdown
    jest.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText(/redirecionando em 4 segundos/i)).toBeInTheDocument()
    })
  })

  it('deve redirecionar após countdown', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/logout realizado/i)).toBeInTheDocument()
    })

    // Avançar tempo para completar countdown
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve usar redirectTo customizado', async () => {
    mockSearchParams.set('redirect', '/dashboard')
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/logout realizado/i)).toBeInTheDocument()
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('deve mostrar erro quando logout falha', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Erro de rede'
    mockSignOut.mockResolvedValue({ 
      success: false, 
      error: { message: errorMessage } 
    })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/erro no logout/i)).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('deve limpar dados locais mesmo com erro', async () => {
    const user = userEvent.setup()
    mockSignOut.mockRejectedValue(new Error('Erro de teste'))

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/erro no logout/i)).toBeInTheDocument()
    })

    expect(mockClearAuthLocalData).toHaveBeenCalled()
  })

  it('deve redirecionar após erro com timeout', async () => {
    const user = userEvent.setup()
    mockSignOut.mockRejectedValue(new Error('Erro de teste'))

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/erro no logout/i)).toBeInTheDocument()
    })

    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve permitir cancelar logout', async () => {
    const user = userEvent.setup()
    
    render(<LogoutPage />)

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockBack).toHaveBeenCalled()
  })

  it('deve redirecionar se não autenticado', () => {
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: false,
      loading: false,
    } as any)

    render(<LogoutPage />)

    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('deve mostrar loading enquanto carrega', () => {
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: true,
      loading: true,
    } as any)

    render(<LogoutPage />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('deve desabilitar botões durante loading', () => {
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: true,
      loading: true,
    } as any)

    const { rerender } = render(<LogoutPage />)

    // Simular fim do loading
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: true,
      loading: false,
    } as any)

    rerender(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })

    expect(confirmButton).not.toBeDisabled()
    expect(cancelButton).not.toBeDisabled()
  })

  it('deve chamar prepareForLogout antes do logout', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockPrepareForLogout).toHaveBeenCalled()
    })

    expect(mockPrepareForLogout).toHaveBeenCalledBefore(mockSignOut as jest.Mock)
  })

  it('deve mostrar botão para ir ao login na tela de erro', async () => {
    const user = userEvent.setup()
    mockSignOut.mockRejectedValue(new Error('Erro de teste'))

    render(<LogoutPage />)

    const confirmButton = screen.getByRole('button', { name: /confirmar logout/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/ir para login/i)).toBeInTheDocument()
    })

    const loginButton = screen.getByRole('button', { name: /ir para login/i })
    await user.click(loginButton)

    expect(mockReplace).toHaveBeenCalledWith('/login')
  })
})