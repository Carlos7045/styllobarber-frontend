import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/forms/auth/login-form'
import { SignUpForm } from '@/components/forms/auth/signup-form'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { supabase } from '@/lib/supabase'

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }))
  }
}))

// Mock dos utilitários de auth
jest.mock('@/lib/auth-utils', () => ({
  clearAuthLocalData: jest.fn(),
  prepareForLogout: jest.fn(() => Promise.resolve()),
}))

const mockSupabase = supabase as any
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Fluxo Completo de Autenticação', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockUnsubscribe = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    } as any)

    // Mock padrão para getSession
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    // Mock padrão para onAuthStateChange
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
  })

  describe('Fluxo de Login Completo', () => {
    it('deve realizar login completo com sucesso', async () => {
      const user = userEvent.setup()
      
      // Mock de usuário autenticado
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { nome: 'Test User' }
      }
      
      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }

      // Mock do perfil do usuário
      const mockProfile = {
        id: 'user-123',
        nome: 'Test User',
        email: 'test@example.com',
        role: 'client',
        ativo: true
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockProfile,
              error: null
            }))
          }))
        }))
      })

      // Renderizar formulário de login dentro do AuthProvider
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      // Preencher formulário
      const emailInput = screen.getByLabelText(/email/i)
      const senhaInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(senhaInput, 'password123')
      await user.click(submitButton)

      // Verificar chamadas
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // Verificar redirecionamento
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('deve lidar com erro de login e mostrar mensagem', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Credenciais inválidas' }
      })

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const senhaInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(senhaInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
      })

      // Não deve redirecionar
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Fluxo de Cadastro Completo', () => {
    it('deve realizar cadastro completo com criação de perfil', async () => {
      const user = userEvent.setup()
      
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        user_metadata: { 
          nome: 'Novo Usuário',
          telefone: '(11) 99999-9999'
        }
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      // Preencher formulário completo
      await user.type(screen.getByLabelText(/nome completo/i), 'Novo Usuário')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/telefone/i), '11999999999')
      await user.type(screen.getByLabelText(/^senha$/i), 'password123')
      await user.type(screen.getByLabelText(/confirmar senha/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /criar conta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          options: {
            data: {
              nome: 'Novo Usuário',
              telefone: '(11) 99999-9999'
            }
          }
        })
      })

      // Verificar mensagem de sucesso
      await waitFor(() => {
        expect(screen.getByText(/conta criada com sucesso/i)).toBeInTheDocument()
      })
    })

    it('deve validar dados antes do cadastro', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <SignUpForm />
        </AuthProvider>
      )

      // Tentar submeter sem preencher
      const submitButton = screen.getByRole('button', { name: /criar conta/i })
      await user.click(submitButton)

      // Verificar validações
      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/telefone é obrigatório/i)).toBeInTheDocument()
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument()
      })

      // Não deve chamar signUp
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })
  })

  describe('Fluxo de Logout Completo', () => {
    it('deve realizar logout completo com limpeza', async () => {
      const user = userEvent.setup()
      
      // Simular usuário logado
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token'
      }

      // Mock inicial com usuário logado
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      render(
        <AuthProvider>
          <LogoutButton />
        </AuthProvider>
      )

      // Aguardar carregamento do estado
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
      })

      const logoutButton = screen.getByRole('button', { name: /sair/i })
      await user.click(logoutButton)

      // Verificar confirmação
      await waitFor(() => {
        expect(screen.getByText(/tem certeza/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })

      // Verificar redirecionamento
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Persistência de Estado', () => {
    it('deve manter estado entre recarregamentos', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token'
      }

      const mockProfile = {
        id: 'user-123',
        nome: 'Test User',
        email: 'test@example.com',
        role: 'client'
      }

      // Simular sessão existente
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockProfile,
              error: null
            }))
          }))
        }))
      })

      const TestComponent = () => {
        return (
          <AuthProvider>
            <div data-testid="auth-state">
              {/* Componente que mostra estado de auth */}
            </div>
          </AuthProvider>
        )
      }

      render(<TestComponent />)

      // Verificar que getSession foi chamado
      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      })

      // Verificar que o perfil foi carregado
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      })
    })
  })

  describe('Mudanças de Estado de Auth', () => {
    it('deve reagir a mudanças de estado do Supabase', async () => {
      let authStateCallback: Function

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      render(
        <AuthProvider>
          <div data-testid="auth-provider">Test</div>
        </AuthProvider>
      )

      // Simular mudança de estado para SIGNED_IN
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token'
      }

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      // Verificar que o listener foi configurado
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })
})