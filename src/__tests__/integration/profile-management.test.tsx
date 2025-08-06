import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProfile } from '@/components/profile/UserProfile'
import { supabase } from '@/lib/api/supabase'
import { uploadAvatar } from '@/lib/storage'

// Mock do Supabase
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
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

// Mock do storage
jest.mock('@/lib/storage', () => ({
  uploadAvatar: jest.fn(),
  removeAvatar: jest.fn(),
}))

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockSupabase = supabase as any
const mockUploadAvatar = uploadAvatar as jest.MockedFunction<typeof uploadAvatar>

describe('Integração: Gestão de Perfil Completa', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      nome: 'Test User',
      telefone: '(11) 99999-9999'
    }
  }

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token'
  }

  const mockProfile = {
    id: 'user-123',
    nome: 'Test User',
    email: 'test@example.com',
    telefone: '(11) 99999-9999',
    role: 'client',
    ativo: true,
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock padrão para sessão autenticada
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })

    // Mock padrão para perfil
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: mockProfile,
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockProfile,
              error: null
            }))
          }))
        }))
      }))
    })
  })

  describe('Carregamento e Exibição de Perfil', () => {
    it('deve carregar e exibir dados do perfil completo', async () => {
      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument()
      })

      // Verificar que os dados foram carregados do Supabase
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('deve mostrar estado de loading durante carregamento', async () => {
      // Mock de loading prolongado
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => new Promise(resolve => 
              setTimeout(() => resolve({ data: mockProfile, error: null }), 1000)
            ))
          }))
        }))
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      // Verificar estado de loading
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })
  })

  describe('Edição de Perfil Completa', () => {
    it('deve permitir edição completa dos dados do perfil', async () => {
      const user = userEvent.setup()
      
      const updatedProfile = {
        ...mockProfile,
        nome: 'Nome Atualizado',
        telefone: '(11) 88888-8888'
      }

      // Mock para atualização bem-sucedida
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { ...mockUser, user_metadata: { ...mockUser.user_metadata, nome: 'Nome Atualizado' } } },
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
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: updatedProfile,
                error: null
              }))
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Editar campos
      const nomeInput = screen.getByDisplayValue('Test User')
      const telefoneInput = screen.getByDisplayValue('(11) 99999-9999')

      await user.clear(nomeInput)
      await user.type(nomeInput, 'Nome Atualizado')
      
      await user.clear(telefoneInput)
      await user.type(telefoneInput, '11888888888')

      // Salvar alterações
      const saveButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(saveButton)

      // Verificar chamadas de atualização
      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            nome: 'Nome Atualizado',
            telefone: '(11) 88888-8888'
          }
        })
      })

      // Verificar mensagem de sucesso
      await waitFor(() => {
        expect(screen.getByText(/perfil atualizado com sucesso/i)).toBeInTheDocument()
      })
    })

    it('deve validar dados antes da atualização', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Limpar campo obrigatório
      const nomeInput = screen.getByDisplayValue('Test User')
      await user.clear(nomeInput)

      const saveButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(saveButton)

      // Verificar validação
      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument()
      })

      // Não deve chamar atualização
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
    })
  })

  describe('Upload de Avatar Completo', () => {
    it('deve realizar upload de avatar com sucesso', async () => {
      const user = userEvent.setup()
      
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const mockAvatarUrl = 'https://example.com/avatar.jpg'

      mockUploadAvatar.mockResolvedValue({
        success: true,
        url: mockAvatarUrl,
        error: null
      })

      // Mock para atualização do perfil com avatar
      const updatedProfile = {
        ...mockProfile,
        avatar_url: mockAvatarUrl
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockProfile,
              error: null
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: updatedProfile,
                error: null
              }))
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/alterar foto/i)).toBeInTheDocument()
      })

      // Upload de arquivo
      const fileInput = screen.getByLabelText(/upload de avatar/i)
      await user.upload(fileInput, mockFile)

      // Verificar upload
      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalledWith(mockFile, 'user-123', null)
      })

      // Verificar atualização do perfil
      await waitFor(() => {
        expect(screen.getByText(/avatar atualizado com sucesso/i)).toBeInTheDocument()
      })
    })

    it('deve lidar com erro no upload de avatar', async () => {
      const user = userEvent.setup()
      
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

      mockUploadAvatar.mockResolvedValue({
        success: false,
        url: null,
        error: 'Erro no upload'
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/alterar foto/i)).toBeInTheDocument()
      })

      const fileInput = screen.getByLabelText(/upload de avatar/i)
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/erro no upload/i)).toBeInTheDocument()
      })
    })

    it('deve validar tipo de arquivo no upload', async () => {
      const user = userEvent.setup()
      
      const invalidFile = new File(['text'], 'document.txt', { type: 'text/plain' })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/alterar foto/i)).toBeInTheDocument()
      })

      const fileInput = screen.getByLabelText(/upload de avatar/i)
      await user.upload(fileInput, invalidFile)

      await waitFor(() => {
        expect(screen.getByText(/tipo de arquivo não suportado/i)).toBeInTheDocument()
      })

      // Não deve chamar upload
      expect(mockUploadAvatar).not.toHaveBeenCalled()
    })
  })

  describe('Sincronização de Estado', () => {
    it('deve sincronizar alterações entre auth e perfil', async () => {
      const user = userEvent.setup()
      
      // Mock para atualização bem-sucedida
      const updatedUser = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          nome: 'Nome Sincronizado'
        }
      }

      const updatedProfile = {
        ...mockProfile,
        nome: 'Nome Sincronizado'
      }

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: updatedUser },
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
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: updatedProfile,
                error: null
              }))
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      // Alterar nome
      const nomeInput = screen.getByDisplayValue('Test User')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Nome Sincronizado')

      const saveButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(saveButton)

      // Verificar que ambos foram atualizados
      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalled()
      })

      // Verificar sincronização no contexto
      await waitFor(() => {
        expect(screen.getByDisplayValue('Nome Sincronizado')).toBeInTheDocument()
      })
    })
  })

  describe('Tratamento de Erros Integrado', () => {
    it('deve lidar com erro de rede durante atualização', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.updateUser.mockRejectedValue(
        new Error('Network error')
      )

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      })

      const nomeInput = screen.getByDisplayValue('Test User')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Novo Nome')

      const saveButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/erro de rede/i)).toBeInTheDocument()
      })
    })

    it('deve lidar com perfil não encontrado', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Profile not found' }
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/perfil não encontrado/i)).toBeInTheDocument()
      })
    })
  })
})
