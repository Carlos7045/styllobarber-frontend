import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'

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

// Mock dos utilitários de storage
jest.mock('@/lib/storage', () => ({
  uploadAvatar: jest.fn(() => Promise.resolve({ success: true, url: 'http://example.com/avatar.jpg' })),
  removeAvatar: jest.fn(() => Promise.resolve(true)),
}))

const mockSupabase = supabase as any

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock padrão para getSession
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    // Mock padrão para onAuthStateChange
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  it('deve inicializar com estado padrão', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.initialized).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('deve fazer login com sucesso', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.signIn({
        email: 'test@example.com',
        senha: 'password123'
      })
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('deve lidar com erro de login', async () => {
    const mockError = { message: 'Invalid credentials' }

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.signIn({
        email: 'test@example.com',
        senha: 'wrongpassword'
      })
      
      expect(response.success).toBe(false)
      expect(response.error).toEqual(mockError)
    })
  })

  it('deve fazer cadastro com sucesso', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.signUp({
        nome: 'Test User',
        email: 'test@example.com',
        telefone: '(11) 99999-9999',
        senha: 'password123',
        confirmarSenha: 'password123'
      })
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          nome: 'Test User',
          telefone: '(11) 99999-9999'
        }
      }
    })
  })

  it('deve fazer logout com sucesso', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.signOut()
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('deve resetar senha com sucesso', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.resetPassword({
        email: 'test@example.com'
      })
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: expect.stringContaining('/auth/reset-password') }
    )
  })

  it('deve atualizar perfil com sucesso', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockUpdatedProfile = { 
      id: '1', 
      nome: 'Updated Name', 
      email: 'test@example.com' 
    }

    // Mock para updateUser
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock para update na tabela profiles
    mockSupabase.from.mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockUpdatedProfile,
              error: null
            }))
          }))
        }))
      }))
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simular usuário logado
    act(() => {
      result.current.user = mockUser as any
    })

    await act(async () => {
      const response = await result.current.updateProfile({
        nome: 'Updated Name'
      })
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })
  })

  it('deve fazer upload de avatar com sucesso', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
    const mockAvatarUrl = 'http://example.com/avatar.jpg'

    // Mock para updateProfile
    const mockUpdateProfile = jest.fn().mockResolvedValue({
      success: true,
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simular usuário logado
    act(() => {
      result.current.user = mockUser as any
      result.current.updateProfile = mockUpdateProfile
    })

    await act(async () => {
      const response = await result.current.uploadUserAvatar(mockFile)
      
      expect(response.success).toBe(true)
      expect(response.error).toBeNull()
    })
  })

  it('deve verificar roles corretamente', () => {
    const mockProfile = { id: '1', role: 'admin' as const }

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.profile = mockProfile as any
    })

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('barber')).toBe(false)
    expect(result.current.hasRole('client')).toBe(false)
  })

  it('deve verificar permissões corretamente', () => {
    const mockProfile = { id: '1', role: 'admin' as const }

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.profile = mockProfile as any
    })

    // Admin tem todas as permissões
    expect(result.current.hasPermission('view_appointments')).toBe(true)
    expect(result.current.hasPermission('manage_users')).toBe(true)
    expect(result.current.hasPermission('any_permission')).toBe(true)
  })

  it('deve verificar permissões de barbeiro corretamente', () => {
    const mockProfile = { id: '1', role: 'barber' as const }

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.profile = mockProfile as any
    })

    // Barbeiro tem permissões específicas
    expect(result.current.hasPermission('view_appointments')).toBe(true)
    expect(result.current.hasPermission('manage_own_appointments')).toBe(true)
    expect(result.current.hasPermission('view_clients')).toBe(true)
    expect(result.current.hasPermission('manage_users')).toBe(false)
  })

  it('deve verificar permissões de cliente corretamente', () => {
    const mockProfile = { id: '1', role: 'client' as const }

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.profile = mockProfile as any
    })

    // Cliente tem permissões limitadas
    expect(result.current.hasPermission('view_own_appointments')).toBe(true)
    expect(result.current.hasPermission('create_appointments')).toBe(true)
    expect(result.current.hasPermission('view_appointments')).toBe(false)
    expect(result.current.hasPermission('manage_users')).toBe(false)
  })

  it('deve lidar com mudanças de estado de auth', async () => {
    const mockCallback = jest.fn()
    const mockSession = { user: { id: '1' }, access_token: 'token' }

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      mockCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    renderHook(() => useAuth(), { wrapper })

    // Simular mudança de estado
    await act(async () => {
      mockCallback('SIGNED_IN', mockSession)
    })

    expect(mockCallback).toHaveBeenCalled()
  })

  it('deve limpar estado no logout', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simular usuário logado
    act(() => {
      result.current.user = { id: '1' } as any
      result.current.profile = { id: '1', role: 'client' } as any
      result.current.session = { access_token: 'token' } as any
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.session).toBeNull()
  })
})