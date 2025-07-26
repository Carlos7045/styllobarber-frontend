import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from '../reset-password-form'
import { useAuth } from '@/hooks/use-auth'

// Mock do useAuth
jest.mock('@/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('ResetPasswordForm', () => {
  const mockResetPassword = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
    } as any)
  })

  it('deve renderizar campo de email e botão de envio', () => {
    render(<ResetPasswordForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument()
  })

  it('deve validar campo de email obrigatório', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument()
    })
  })

  it('deve validar formato de email', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'email-invalido')

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('deve submeter formulário com email válido', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ success: true, error: null })

    render(<ResetPasswordForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })
  })

  it('deve exibir mensagem de sucesso após envio', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ success: true, error: null })

    render(<ResetPasswordForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/link de recuperação enviado/i)).toBeInTheDocument()
      expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument()
    })
  })

  it('deve exibir erro quando envio falha', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email não encontrado'
    mockResetPassword.mockResolvedValue({ 
      success: false, 
      error: { message: errorMessage } 
    })

    render(<ResetPasswordForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'notfound@example.com')

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('deve mostrar estado de loading durante envio', async () => {
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      loading: true,
    } as any)

    render(<ResetPasswordForm />)

    const submitButton = screen.getByRole('button', { name: /enviando/i })
    expect(submitButton).toBeDisabled()
  })

  it('deve ter link para voltar ao login', () => {
    render(<ResetPasswordForm />)

    const loginLink = screen.getByRole('link', { name: /voltar ao login/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('deve limpar erro quando usuário começa a digitar', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ 
      success: false, 
      error: { message: 'Erro de teste' } 
    })

    render(<ResetPasswordForm />)

    // Submeter formulário para gerar erro
    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/erro de teste/i)).toBeInTheDocument()
    })

    // Começar a digitar deve limpar o erro
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    expect(screen.queryByText(/erro de teste/i)).not.toBeInTheDocument()
  })

  it('deve permitir reenvio após sucesso', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ success: true, error: null })

    render(<ResetPasswordForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: /enviar link/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/link de recuperação enviado/i)).toBeInTheDocument()
    })

    // Deve permitir reenvio
    const reenviarButton = screen.getByRole('button', { name: /reenviar link/i })
    expect(reenviarButton).toBeInTheDocument()
    expect(reenviarButton).not.toBeDisabled()

    await user.click(reenviarButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(2)
    })
  })

  it('deve exibir instruções claras para o usuário', () => {
    render(<ResetPasswordForm />)

    expect(screen.getByText(/esqueceu sua senha/i)).toBeInTheDocument()
    expect(screen.getByText(/digite seu email para receber/i)).toBeInTheDocument()
  })
})