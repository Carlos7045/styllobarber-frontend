import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from '../UserProfile'
import { useAuth } from '@/hooks/use-auth'

// Mock do hook useAuth
jest.mock('@/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock das funções de storage
jest.mock('@/lib/storage', () => ({
  validateFile: jest.fn(() => ({ valid: true })),
  resizeImage: jest.fn((file) => Promise.resolve(file)),
  uploadAvatar: jest.fn(() => Promise.resolve({ success: true, url: 'http://example.com/avatar.jpg' })),
  removeAvatar: jest.fn(() => Promise.resolve(true)),
}))

// Mock do window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

// Mock do window.confirm
const mockConfirm = jest.fn(() => true)
global.confirm = mockConfirm

describe('UserProfile', () => {
  const mockUpdateProfile = jest.fn()
  const mockUploadUserAvatar = jest.fn()

  const mockProfile = {
    id: '1',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '(11) 99999-9999',
    role: 'client' as const,
    avatar_url: '',
    data_nascimento: '1990-01-01',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: mockProfile,
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: mockUpdateProfile,
      uploadUserAvatar: mockUploadUserAvatar,
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })
  })

  it('deve renderizar informações do perfil corretamente', () => {
    render(<UserProfile />)

    expect(screen.getByText('Meu Perfil')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('client')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument()
    expect(screen.getByText('O email não pode ser alterado')).toBeInTheDocument()
  })

  it('deve mostrar botão de editar quando não está editando', () => {
    render(<UserProfile />)

    const editButton = screen.getByText('Editar')
    expect(editButton).toBeInTheDocument()
  })

  it('deve entrar em modo de edição ao clicar em editar', async () => {
    const user = userEvent.setup()
    render(<UserProfile />)

    const editButton = screen.getByText('Editar')
    await user.click(editButton)

    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('deve permitir editar nome', async () => {
    const user = userEvent.setup()
    render(<UserProfile />)

    // Entrar em modo de edição
    await user.click(screen.getByText('Editar'))

    // Editar nome
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Santos')

    expect(screen.getByDisplayValue('João Santos')).toBeInTheDocument()
  })

  it('deve salvar alterações do perfil', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValue({ success: true })

    render(<UserProfile />)

    // Entrar em modo de edição
    await user.click(screen.getByText('Editar'))

    // Editar nome
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Santos')

    // Salvar
    await user.click(screen.getByText('Salvar Alterações'))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        nome: 'João Santos',
      })
    })

    expect(mockAlert).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
  })

  it('deve cancelar edição e restaurar valores originais', async () => {
    const user = userEvent.setup()
    render(<UserProfile />)

    // Entrar em modo de edição
    await user.click(screen.getByText('Editar'))

    // Editar nome
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Santos')

    // Cancelar
    await user.click(screen.getByText('Cancelar'))

    // Verificar se voltou ao modo de visualização
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.queryByText('Salvar Alterações')).not.toBeInTheDocument()
  })

  it('deve mostrar estado de carregamento quando não há usuário', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: true,
      initialized: false,
      isAuthenticated: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })

    render(<UserProfile />)

    expect(screen.getByText('Carregando perfil...')).toBeInTheDocument()
  })

  it('deve mostrar avatar inicial quando não há avatar_url', () => {
    render(<UserProfile />)

    // Deve mostrar a primeira letra do nome
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('deve validar formato de telefone', async () => {
    const user = userEvent.setup()
    render(<UserProfile />)

    // Entrar em modo de edição
    await user.click(screen.getByText('Editar'))

    // Tentar inserir telefone inválido
    const telefoneInput = screen.getByDisplayValue('(11) 99999-9999')
    await user.clear(telefoneInput)
    await user.type(telefoneInput, '123456')

    // Tentar salvar
    await user.click(screen.getByText('Salvar Alterações'))

    // Deve mostrar erro de validação
    await waitFor(() => {
      expect(screen.getByText('Formato de telefone inválido: (XX) XXXXX-XXXX')).toBeInTheDocument()
    })
  })

  it('deve mostrar informações de sistema', () => {
    render(<UserProfile />)

    expect(screen.getByText('Membro desde')).toBeInTheDocument()
    expect(screen.getByText('Última atualização')).toBeInTheDocument()
    expect(screen.getByText('01/01/2023')).toBeInTheDocument()
  })
})