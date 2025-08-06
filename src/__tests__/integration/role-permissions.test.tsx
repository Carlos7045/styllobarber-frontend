import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'
import { RouteGuard } from '@/domains/auth/components/route-guard'
import { UserManagement } from '@/domains/users/components/admin/UserManagement'
import { supabase } from '@/lib/api/supabase'

// Mock do Supabase
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
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

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockSupabase = supabase as any

describe('Integração: Sistema de Roles e Permissões', () => {
  const createMockSession = (role: string, userId: string = 'user-123') => ({
    user: {
      id: userId,
      email: 'test@example.com',
      user_metadata: { role }
    },
    access_token: 'mock-token'
  })

  const createMockProfile = (role: string, userId: string = 'user-123') => ({
    id: userId,
    nome: 'Test User',
    email: 'test@example.com',
    role,
    ativo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  describe('Controle de Acesso por Role', () => {
    it('deve permitir admin acessar gestão de usuários', async () => {
      const adminSession = createMockSession('admin')
      const adminProfile = createMockProfile('admin')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: adminProfile,
              error: null
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [adminProfile],
              error: null,
              count: 1
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <UserManagement />
          </RouteGuard>
        </AuthProvider>
      )

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText(/gestão de usuários/i)).toBeInTheDocument()
      })

      // Verificar que o componente foi renderizado
      expect(screen.getByText(/filtrar usuários/i)).toBeInTheDocument()
    })

    it('deve bloquear barbeiro de acessar gestão de usuários', async () => {
      const barberSession = createMockSession('barber')
      const barberProfile = createMockProfile('barber')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: barberSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: barberProfile,
              error: null
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <UserManagement />
          </RouteGuard>
        </AuthProvider>
      )

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
      })

      // Não deve mostrar o componente protegido
      expect(screen.queryByText(/gestão de usuários/i)).not.toBeInTheDocument()
    })

    it('deve bloquear cliente de acessar gestão de usuários', async () => {
      const clientSession = createMockSession('client')
      const clientProfile = createMockProfile('client')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: clientSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: clientProfile,
              error: null
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <UserManagement />
          </RouteGuard>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(/gestão de usuários/i)).not.toBeInTheDocument()
    })
  })

  describe('Permissões Granulares', () => {
    it('deve permitir admin gerenciar todos os usuários', async () => {
      const user = userEvent.setup()
      const adminSession = createMockSession('admin')
      const adminProfile = createMockProfile('admin')

      const mockUsers = [
        createMockProfile('admin', 'admin-1'),
        createMockProfile('barber', 'barber-1'),
        createMockProfile('client', 'client-1'),
      ]

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: adminProfile,
              error: null
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: mockUsers,
              error: null,
              count: 3
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { ...mockUsers[1], role: 'admin' },
                error: null
              }))
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <UserManagement />
          </RouteGuard>
        </AuthProvider>
      )

      // Aguardar carregamento da lista
      await waitFor(() => {
        expect(screen.getByText(/admin-1/i)).toBeInTheDocument()
        expect(screen.getByText(/barber-1/i)).toBeInTheDocument()
        expect(screen.getByText(/client-1/i)).toBeInTheDocument()
      })

      // Testar alteração de role
      const editButtons = screen.getAllByText(/editar/i)
      await user.click(editButtons[1]) // Editar barbeiro

      await waitFor(() => {
        expect(screen.getByText(/editar usuário/i)).toBeInTheDocument()
      })

      // Alterar role para admin
      const roleSelect = screen.getByLabelText(/role/i)
      await user.selectOptions(roleSelect, 'admin')

      const saveButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(saveButton)

      // Verificar atualização
      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          role: 'admin'
        })
      })
    })

    it('deve permitir admin ativar/desativar usuários', async () => {
      const user = userEvent.setup()
      const adminSession = createMockSession('admin')
      const adminProfile = createMockProfile('admin')

      const inactiveUser = {
        ...createMockProfile('client', 'client-1'),
        ativo: false
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: adminProfile,
              error: null
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [inactiveUser],
              error: null,
              count: 1
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { ...inactiveUser, ativo: true },
                error: null
              }))
            }))
          }))
        }))
      })

      render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <UserManagement />
          </RouteGuard>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/client-1/i)).toBeInTheDocument()
      })

      // Ativar usuário
      const activateButton = screen.getByText(/ativar/i)
      await user.click(activateButton)

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          ativo: true
        })
      })
    })
  })

  describe('Proteção de Componentes por Permissão', () => {
    const TestComponent = ({ permission }: { permission: string }) => (
      <AuthProvider>
        <RouteGuard requiredPermission={permission}>
          <div>Componente Protegido</div>
        </RouteGuard>
      </AuthProvider>
    )

    it('deve permitir admin acessar todas as permissões', async () => {
      const adminSession = createMockSession('admin')
      const adminProfile = createMockProfile('admin')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: adminProfile,
              error: null
            }))
          }))
        }))
      })

      const permissions = [
        'manage_users',
        'view_reports',
        'manage_appointments',
        'view_clients'
      ]

      for (const permission of permissions) {
        const { unmount } = render(<TestComponent permission={permission} />)

        await waitFor(() => {
          expect(screen.getByText(/componente protegido/i)).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('deve restringir barbeiro a permissões específicas', async () => {
      const barberSession = createMockSession('barber')
      const barberProfile = createMockProfile('barber')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: barberSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: barberProfile,
              error: null
            }))
          }))
        }))
      })

      // Permissões permitidas para barbeiro
      const allowedPermissions = [
        'view_appointments',
        'manage_own_appointments',
        'view_clients'
      ]

      for (const permission of allowedPermissions) {
        const { unmount } = render(<TestComponent permission={permission} />)

        await waitFor(() => {
          expect(screen.getByText(/componente protegido/i)).toBeInTheDocument()
        })

        unmount()
      }

      // Permissões negadas para barbeiro
      const deniedPermissions = [
        'manage_users',
        'view_reports',
        'manage_system'
      ]

      for (const permission of deniedPermissions) {
        const { unmount } = render(<TestComponent permission={permission} />)

        await waitFor(() => {
          expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
        })

        expect(screen.queryByText(/componente protegido/i)).not.toBeInTheDocument()

        unmount()
      }
    })

    it('deve restringir cliente a permissões básicas', async () => {
      const clientSession = createMockSession('client')
      const clientProfile = createMockProfile('client')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: clientSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: clientProfile,
              error: null
            }))
          }))
        }))
      })

      // Permissões permitidas para cliente
      const allowedPermissions = [
        'view_own_appointments',
        'create_appointments',
        'view_own_profile'
      ]

      for (const permission of allowedPermissions) {
        const { unmount } = render(<TestComponent permission={permission} />)

        await waitFor(() => {
          expect(screen.getByText(/componente protegido/i)).toBeInTheDocument()
        })

        unmount()
      }

      // Permissões negadas para cliente
      const deniedPermissions = [
        'manage_users',
        'view_reports',
        'view_appointments',
        'manage_appointments'
      ]

      for (const permission of deniedPermissions) {
        const { unmount } = render(<TestComponent permission={permission} />)

        await waitFor(() => {
          expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
        })

        expect(screen.queryByText(/componente protegido/i)).not.toBeInTheDocument()

        unmount()
      }
    })
  })

  describe('Hierarquia de Roles', () => {
    it('deve respeitar hierarquia admin > barber > client', async () => {
      const roles = ['admin', 'barber', 'client']
      
      for (const role of roles) {
        const session = createMockSession(role)
        const profile = createMockProfile(role)

        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session },
          error: null
        })

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: profile,
                error: null
              }))
            }))
          }))
        })

        // Testar acesso a componente que requer role barber ou superior
        const { unmount } = render(
          <AuthProvider>
            <RouteGuard requiredRole="barber">
              <div>Componente para Barber+</div>
            </RouteGuard>
          </AuthProvider>
        )

        if (role === 'admin' || role === 'barber') {
          await waitFor(() => {
            expect(screen.getByText(/componente para barber\+/i)).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
          })
        }

        unmount()
      }
    })
  })

  describe('Estados de Transição de Role', () => {
    it('deve atualizar permissões quando role muda', async () => {
      let currentProfile = createMockProfile('client')
      const session = createMockSession('client')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: currentProfile,
              error: null
            }))
          }))
        }))
      })

      const { rerender } = render(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <div>Admin Only</div>
          </RouteGuard>
        </AuthProvider>
      )

      // Inicialmente deve negar acesso
      await waitFor(() => {
        expect(screen.getByText(/acesso negado/i)).toBeInTheDocument()
      })

      // Simular mudança de role para admin
      currentProfile = createMockProfile('admin')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: currentProfile,
              error: null
            }))
          }))
        }))
      })

      rerender(
        <AuthProvider>
          <RouteGuard requiredRole="admin">
            <div>Admin Only</div>
          </RouteGuard>
        </AuthProvider>
      )

      // Agora deve permitir acesso
      await waitFor(() => {
        expect(screen.getByText(/admin only/i)).toBeInTheDocument()
      })
    })
  })
})
