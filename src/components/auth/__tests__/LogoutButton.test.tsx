import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton, useLogout } from '../LogoutButton'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

// Mock do hook useAuth
jest.mock('@/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do useRouter
jest.mock('next/navigation')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock dos utilitários de auth
jest.mock('@/lib/auth-utils', () => ({
  clearAuthLocalData: jest.fn(),
  prepareForLogout: jest.fn(() => Promise.resolve()),
  shouldShowLogoutConfirmation: jest.fn(() => false),
  DEFAULT_LOGOUT_OPTIONS: {
    clearLocalData: true,
    forceCleanup: false,
    redirectTo: '/login',
    showConfirmation: false
  }
}))

// Mock do console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('LogoutButton', () => {
  const mockSignOut = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: null,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: mockSignOut,
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })

    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  afterEach(() => {
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()
  })

  it('deve renderizar botão de logout', () => {
    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button')
    expect(logoutButton).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('deve renderizar apenas ícone quando showText é false', () => {
    render(<LogoutButton showText={false} />)

    const logoutButton = screen.getByRole('button')
    expect(logoutButton).toBeInTheDocument()
    expect(screen.queryByText('Sair')).not.toBeInTheDocument()
  })

  it('deve fazer logout sem confirmação por padrão', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve mostrar dialog de confirmação quando showConfirmation é true', async () => {
    const user = userEvent.setup()
    render(<LogoutButton showConfirmation={true} />)

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    expect(screen.getByText('Confirmar Logout')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza que deseja sair do sistema?')).toBeInTheDocument()
  })

  it('deve confirmar logout no dialog', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutButton showConfirmation={true} />)

    // Clicar no botão de logout
    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    // Confirmar no dialog
    const confirmButton = screen.getByText('Sim, Sair')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve cancelar logout no dialog', async () => {
    const user = userEvent.setup()
    render(<LogoutButton showConfirmation={true} />)

    // Clicar no botão de logout
    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    // Cancelar no dialog
    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)

    expect(mockSignOut).not.toHaveBeenCalled()
    expect(screen.queryByText('Confirmar Logout')).not.toBeInTheDocument()
  })

  it('deve chamar callbacks de logout', async () => {
    const user = userEvent.setup()
    const onLogoutStart = jest.fn()
    const onLogoutComplete = jest.fn()
    
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(
      <LogoutButton 
        onLogoutStart={onLogoutStart}
        onLogoutComplete={onLogoutComplete}
      />
    )

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(onLogoutStart).toHaveBeenCalled()
      expect(onLogoutComplete).toHaveBeenCalled()
    })
  })

  it('deve lidar com erro no logout', async () => {
    const user = userEvent.setup()
    const onLogoutError = jest.fn()
    
    mockSignOut.mockResolvedValue({ 
      success: false, 
      error: { message: 'Erro de teste' } 
    })

    // Mock do alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation()

    render(
      <LogoutButton onLogoutError={onLogoutError} />
    )

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(onLogoutError).toHaveBeenCalledWith('Erro de teste')
      expect(mockAlert).toHaveBeenCalledWith('Erro no logout: Erro de teste')
      expect(mockReplace).toHaveBeenCalledWith('/login') // Deve redirecionar mesmo com erro
    })

    mockAlert.mockRestore()
  })

  it('deve mostrar estado de loading durante logout', async () => {
    const user = userEvent.setup()
    mockSignOut.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, error: null }), 100)
    ))

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    // Verificar estado de loading
    expect(screen.getByText('Saindo...')).toBeInTheDocument()
    expect(logoutButton).toBeDisabled()

    // Aguardar conclusão
    await waitFor(() => {
      expect(screen.queryByText('Saindo...')).not.toBeInTheDocument()
    })
  })

  it('deve usar redirectTo personalizado', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ success: true, error: null })

    render(<LogoutButton redirectTo="/custom-login" />)

    const logoutButton = screen.getByRole('button')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/custom-login')
    })
  })
})

describe('useLogout hook', () => {
  const mockSignOut = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
    } as any)

    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any)
  })

  it('deve fazer logout programático', async () => {
    mockSignOut.mockResolvedValue({ success: true, error: null })

    const TestComponent = () => {
      const { logout } = useLogout()
      
      return (
        <button onClick={() => logout()}>
          Logout Programático
        </button>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    const button = screen.getByText('Logout Programático')
    await user.click(button)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve chamar callbacks do hook', async () => {
    mockSignOut.mockResolvedValue({ success: true, error: null })
    const onSuccess = jest.fn()
    const onError = jest.fn()

    const TestComponent = () => {
      const { logout } = useLogout()
      
      return (
        <button onClick={() => logout({ onSuccess, onError })}>
          Logout com Callbacks
        </button>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    const button = screen.getByText('Logout com Callbacks')
    await user.click(button)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })
  })

  it('deve lidar com erro no hook', async () => {
    mockSignOut.mockResolvedValue({ 
      success: false, 
      error: { message: 'Erro do hook' } 
    })
    
    const onSuccess = jest.fn()
    const onError = jest.fn()

    const TestComponent = () => {
      const { logout } = useLogout()
      
      return (
        <button onClick={() => logout({ onSuccess, onError })}>
          Logout com Erro
        </button>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    const button = screen.getByText('Logout com Erro')
    await user.click(button)

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith('Erro do hook')
    })
  })
})