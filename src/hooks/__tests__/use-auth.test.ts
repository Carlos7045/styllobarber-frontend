import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../use-auth'
import { supabase } from '@/lib/api/supabase'

// Mock do supabase
jest.mock('@/lib/api/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock padrão para getSession
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    // Mock padrão para onAuthStateChange
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  describe('Inicialização', () => {
    it('deve inicializar com estado correto', async () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(true)
      expect(result.current.initialized).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.initialized).toBe(true)
      })
    })

    it('deve chamar getSession na inicialização', async () => {
      renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
      })
    })

    it('deve configurar listener de mudanças de auth', async () => {
      renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('signIn', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { nome: 'Test User' },
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signInResult
      await act(async () => {
        signInResult = await result.current.signIn({
          email: 'test@example.com',
          senha: 'password123',
        })
      })

      expect(signInResult).toEqual({ success: true, error: null })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('deve retornar erro quando login falha', async () => {
      const mockError = { message: 'Invalid login credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signInResult
      await act(async () => {
        signInResult = await result.current.signIn({
          email: 'test@example.com',
          senha: 'wrongpassword',
        })
      })

      expect(signInResult).toEqual({ success: false, error: mockError })
    })
  })

  describe('signUp', () => {
    it('deve fazer cadastro com sucesso', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp({
          nome: 'Test User',
          email: 'test@example.com',
          telefone: '(11) 99999-9999',
          senha: 'password123',
          confirmarSenha: 'password123',
        })
      })

      expect(signUpResult).toEqual({ success: true, error: null })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            nome: 'Test User',
            telefone: '(11) 99999-9999',
          },
        },
      })
    })

    it('deve retornar erro quando cadastro falha', async () => {
      const mockError = { message: 'User already registered' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp({
          nome: 'Test User',
          email: 'existing@example.com',
          telefone: '(11) 99999-9999',
          senha: 'password123',
          confirmarSenha: 'password123',
        })
      })

      expect(signUpResult).toEqual({ success: false, error: mockError })
    })
  })

  describe('signOut', () => {
    it('deve fazer logout com sucesso', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signOutResult
      await act(async () => {
        signOutResult = await result.current.signOut()
      })

      expect(signOutResult).toEqual({ success: true, error: null })
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando logout falha', async () => {
      const mockError = { message: 'Logout failed' }

      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let signOutResult
      await act(async () => {
        signOutResult = await result.current.signOut()
      })

      expect(signOutResult).toEqual({ success: false, error: mockError })
    })
  })

  describe('resetPassword', () => {
    it('deve enviar email de recuperação com sucesso', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword({
          email: 'test@example.com',
        })
      })

      expect(resetResult).toEqual({ success: true, error: null })
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      )
    })

    it('deve retornar erro quando envio falha', async () => {
      const mockError = { message: 'Email not found' }

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let resetResult
      await act(async () => {
        resetResult = await result.current.resetPassword({
          email: 'notfound@example.com',
        })
      })

      expect(resetResult).toEqual({ success: false, error: mockError })
    })
  })

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({
          nome: 'Updated Name',
          telefone: '(11) 88888-8888',
        })
      })

      expect(updateResult).toEqual({ success: true, error: null })
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          nome: 'Updated Name',
          telefone: '(11) 88888-8888',
        },
      })
    })

    it('deve retornar erro quando atualização falha', async () => {
      const mockError = { message: 'Update failed' }

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({
          nome: 'Updated Name',
        })
      })

      expect(updateResult).toEqual({ success: false, error: mockError })
    })
  })
})
