import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '../signup-form'
import { useAuth } from '@/domains/auth/hooks/use-auth'

// Mock do useAuth
jest.mock('@/domains/auth/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('SignUpForm', () => {
  const mockSignUp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
    } as any)
  })

  it('deve renderizar todos os campos obrigatórios', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/telefone é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument()
    })
  })

  it('deve validar formato de email', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'email-invalido')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('deve validar confirmação de senha', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const senhaInput = screen.getByLabelText(/^senha$/i)
    const confirmarSenhaInput = screen.getByLabelText(/confirmar senha/i)

    await user.type(senhaInput, 'password123')
    await user.type(confirmarSenhaInput, 'password456')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
    })
  })

  it('deve formatar telefone automaticamente', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const telefoneInput = screen.getByLabelText(/telefone/i)
    await user.type(telefoneInput, '11999999999')

    expect(telefoneInput).toHaveValue('(11) 99999-9999')
  })

  it('deve submeter formulário com dados válidos', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ success: true, error: null })

    render(<SignUpForm />)

    // Preencher todos os campos
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/^senha$/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        senha: 'password123',
        confirmarSenha: 'password123',
      })
    })
  })

  it('deve exibir erro quando cadastro falha', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email já está em uso'
    mockSignUp.mockResolvedValue({ 
      success: false, 
      error: { message: errorMessage } 
    })

    render(<SignUpForm />)

    // Preencher formulário
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/^senha$/i), 'password123')
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('deve mostrar estado de loading durante submissão', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      loading: true,
    } as any)

    render(<SignUpForm />)

    const submitButton = screen.getByRole('button', { name: /criando conta/i })
    expect(submitButton).toBeDisabled()
  })

  it('deve ter link para página de login', () => {
    render(<SignUpForm />)

    const loginLink = screen.getByRole('link', { name: /fazer login/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('deve validar tamanho mínimo da senha', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const senhaInput = screen.getByLabelText(/^senha$/i)
    await user.type(senhaInput, '123')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument()
    })
  })

  it('deve validar tamanho mínimo do nome', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const nomeInput = screen.getByLabelText(/nome completo/i)
    await user.type(nomeInput, 'A')

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument()
    })
  })

  it('deve limpar erro quando usuário começa a digitar', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ 
      success: false, 
      error: { message: 'Erro de teste' } 
    })

    render(<SignUpForm />)

    // Submeter formulário para gerar erro
    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/erro de teste/i)).toBeInTheDocument()
    })

    // Começar a digitar deve limpar o erro
    const nomeInput = screen.getByLabelText(/nome completo/i)
    await user.type(nomeInput, 'João')

    expect(screen.queryByText(/erro de teste/i)).not.toBeInTheDocument()
  })
})
