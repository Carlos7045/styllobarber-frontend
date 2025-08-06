import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserManagement } from '../UserManagement'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { supabase } from '@/lib/api/supabase'

// Mock do hook useAuth
jest.mock('@/domains/auth/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do Supabase
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      }))
    }))
  }
}))

// Mock do window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

// Mock do window.confirm
const mockConfirm = jest.fn(() => true)
global.confirm = mockConfirm

describe('UserManagement', () => {
  const mockUsers = [
    {
      id: '1',
      nome: 'João Admin',
      email: 'admin@example.com',
      telefone: '(11) 99999-9999',
      role: 'admin' as const,
      avatar_url: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      nome: 'Maria Barbeira',
      email: 'maria@example.com',
      telefone: '(11) 88888-8888',
      role: 'barber' as const,
      avatar_url: '',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: '3',
      nome: 'Pedro Cliente',
      email: 'pedro@example.com',
      telefone: '',
      role: 'client' as const,
      avatar_url: '',
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: mockUsers[0] as any,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn((role) => role === 'admin'),
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })

    // Mock do Supabase para retornar usuários
    const mockSupabase = supabase as any
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: mockUsers,
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: {},
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: {},
          error: null
        }))
      }))
    })
  })

  it('deve renderizar componente para admin', async () => {
    render(<UserManagement />)

    expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument()
    
    // Aguardar carregamento dos usuários
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
      expect(screen.getByText('Maria Barbeira')).toBeInTheDocument()
      expect(screen.getByText('Pedro Cliente')).toBeInTheDocument()
    })
  })

  it('deve negar acesso para não-admin', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      hasRole: jest.fn(() => false),
    } as any)

    render(<UserManagement />)

    expect(screen.getByText('Acesso negado. Apenas administradores podem gerenciar usuários.')).toBeInTheDocument()
  })

  it('deve filtrar usuários por busca', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
    })

    // Buscar por nome
    const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou telefone...')
    await user.type(searchInput, 'Maria')

    // Deve mostrar apenas Maria
    expect(screen.getByText('Maria Barbeira')).toBeInTheDocument()
    expect(screen.queryByText('João Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Cliente')).not.toBeInTheDocument()
  })

  it('deve filtrar usuários por role', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
    })

    // Filtrar por barbeiros
    const roleFilter = screen.getAllByRole('combobox')[0] // Primeiro select é o de role
    await user.selectOptions(roleFilter, 'barber')

    // Deve mostrar apenas barbeiros
    expect(screen.getByText('Maria Barbeira')).toBeInTheDocument()
    expect(screen.queryByText('João Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Cliente')).not.toBeInTheDocument()
  })

  it('deve mostrar estatísticas corretas', async () => {
    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // 1 admin
      expect(screen.getByText('Administradores')).toBeInTheDocument()
    })

    // Verificar estatísticas
    const stats = screen.getAllByText(/\d+/)
    expect(stats).toHaveLength(3) // 3 estatísticas
  })

  it('deve permitir exportar usuários', async () => {
    const user = userEvent.setup()
    
    // Mock do createElement e click
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: '' }
    }
    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation()
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation()

    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
    })

    // Clicar no botão de exportar
    const exportButton = screen.getByTitle('Download')
    await user.click(exportButton)

    // Verificar se o download foi iniciado
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockLink.click).toHaveBeenCalled()

    // Cleanup
    mockCreateElement.mockRestore()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })

  it('deve permitir recarregar lista de usuários', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
    })

    // Clicar no botão de refresh
    const refreshButton = screen.getByTitle('RefreshCw')
    await user.click(refreshButton)

    // Verificar se o Supabase foi chamado novamente
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('deve mostrar modal de edição ao clicar em editar', async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('João Admin')).toBeInTheDocument()
    })

    // Clicar no botão de editar
    const editButtons = screen.getAllByTitle('Editar usuário')
    await user.click(editButtons[0])

    // Verificar se o modal abriu
    expect(screen.getByText('Editar Usuário')).toBeInTheDocument()
  })

  it('deve mostrar contagem correta de usuários filtrados', async () => {
    render(<UserManagement />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('3 usuários')).toBeInTheDocument()
    })
  })
})
