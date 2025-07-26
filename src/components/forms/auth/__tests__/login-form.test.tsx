import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'
import { useAuth } from '@/hooks/use-auth'

// Mock do hook useAuth
jest.mock('@/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock do useRouter
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

describe('LoginForm', () => {
  const mockSignIn = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      user: null,
      session: null,
      initialized: true,
      isAuthenticated: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    })

    // Mock do window.location.replace
    Object.defineProperty(window, 'location', {
      value: {
        replace: jest.fn(),
      },
      writable: true,
    })
  })

  it('deve renderizar o formulário corretamente', () => {
    render(<LoginForm />)

    expect(screen.getByText('Entrar no StylloBarber')).toBeInTheDocument()
    expect(screen.getByText('Faça login para acessar sua conta')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('deve exibir links para cadastro e recuperação de senha', () => {
    render(<LoginForm />)

    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument()
    
    const forgotPasswordLink = screen.getByText('Esqueceu sua senha?').closest('a')
    const signUpLink = screen.getByText('Cadastre-se').closest('a')
    
    expect(forgotPasswordLink).toHaveAttribute('href', '/recuperar-senha')
    expect(signUpLink).toHaveAttribute('href', '/cadastro')
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
      expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    })

    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('deve validar formato de email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'email-invalido')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })

    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('deve validar tamanho mínimo da senha', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    })

    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('deve submeter formulário com dados válidos', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ success: true, error: null })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        senha: 'password123',
      })
    })
  })

  it('deve exibir estado de loading durante submissão', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true, error: null }), 100)))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('Entrando...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Entrar')).toBeInTheDocument()
    })
  })

  it('deve redirecionar após login bem-sucedido', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ success: true, error: null })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    // Aguardar o timeout do redirecionamento
    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith('/dashboard')
    }, { timeout: 1000 })
  })

  it('deve exibir erro quando login falha', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ 
      success: false, 
      error: { message: 'Invalid login credentials' } 
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    // O erro é tratado pelo hook useAuth, não pelo componente
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      senha: 'wrongpassword',
    })
  })

  it('deve alternar visibilidade da senha', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText('Senha') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' }) // Botão do ícone

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('deve chamar onSuccess quando fornecido', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = jest.fn()
    mockSignIn.mockResolvedValue({ success: true, error: null })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('deve desabilitar campos quando loading é true', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      user: null,
      session: null,
      initialized: true,
      isAuthenticated: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrando...' })

    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})