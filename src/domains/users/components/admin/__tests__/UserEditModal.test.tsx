import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserEditModal } from '../UserEditModal'
import { supabase } from '@/lib/api/supabase'

// Mock do Supabase
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {},
              error: null
            }))
          }))
        }))
      }))
    })),
    auth: {
      admin: {
        updateUserById: jest.fn(() => Promise.resolve({ error: null }))
      }
    }
  }
}))

describe('UserEditModal', () => {
  const mockUser = {
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

  const mockProps = {
    user: mockUser,
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar modal quando aberto', () => {
    render(<UserEditModal {...mockProps} />)

    expect(screen.getByText('Editar Usuário')).toBeInTheDocument()
    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument()
  })

  it('não deve renderizar quando fechado', () => {
    render(<UserEditModal {...mockProps} isOpen={false} />)

    expect(screen.queryByText('Editar Usuário')).not.toBeInTheDocument()
  })

  it('deve preencher formulário com dados do usuário', () => {
    render(<UserEditModal {...mockProps} />)

    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
  })

  it('deve permitir editar campos', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    // Editar nome
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Santos')

    expect(screen.getByDisplayValue('João Santos')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    // Limpar nome (campo obrigatório)
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)

    // Tentar salvar
    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    // Deve mostrar erro de validação
    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument()
    })
  })

  it('deve salvar alterações com sucesso', async () => {
    const user = userEvent.setup()
    const mockSupabase = supabase as any
    
    mockSupabase.from.mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { ...mockUser, nome: 'João Santos' },
              error: null
            }))
          }))
        }))
      }))
    })

    render(<UserEditModal {...mockProps} />)

    // Editar nome
    const nomeInput = screen.getByDisplayValue('João Silva')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Santos')

    // Salvar
    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    // Verificar se foi chamado o callback de sucesso
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled()
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  it('deve fechar modal ao clicar em cancelar', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('deve fechar modal ao clicar no X', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    const closeButton = screen.getByRole('button', { name: /X/i })
    await user.click(closeButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('deve mostrar informações do sistema', () => {
    render(<UserEditModal {...mockProps} />)

    expect(screen.getByText('Criado em')).toBeInTheDocument()
    expect(screen.getByText('Última atualização')).toBeInTheDocument()
    expect(screen.getByText('01/01/2023')).toBeInTheDocument()
  })

  it('deve permitir alterar role', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    const roleSelect = screen.getByDisplayValue('Cliente')
    await user.selectOptions(roleSelect, 'barber')

    expect(screen.getByDisplayValue('Barbeiro')).toBeInTheDocument()
  })

  it('deve formatar telefone automaticamente', async () => {
    const user = userEvent.setup()
    render(<UserEditModal {...mockProps} />)

    const telefoneInput = screen.getByDisplayValue('(11) 99999-9999')
    await user.clear(telefoneInput)
    await user.type(telefoneInput, '11888887777')

    // Deve formatar automaticamente
    expect(screen.getByDisplayValue('(11) 88888-7777')).toBeInTheDocument()
  })

  it('deve mostrar erro quando falha ao salvar', async () => {
    const user = userEvent.setup()
    const mockSupabase = supabase as any
    
    mockSupabase.from.mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Erro no banco' }
            }))
          }))
        }))
      }))
    })

    render(<UserEditModal {...mockProps} />)

    // Tentar salvar
    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    // Deve mostrar erro
    await waitFor(() => {
      expect(screen.getByText('Erro no banco')).toBeInTheDocument()
    })
  })
})
