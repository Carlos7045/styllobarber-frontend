import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { RouteGuard, PermissionGate, usePermissions } from '../route-guard'
import { useAuth } from '@/domains/auth/hooks/use-auth'

// Mock do useAuth
jest.mock('@/domains/auth/hooks/use-auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock do Next.js navigation
jest.mock('next/navigation')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('RouteGuard', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any)

    mockUsePathname.mockReturnValue('/dashboard')
  })

  it('deve mostrar loading quando ainda está inicializando', () => {
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

    render(
      <RouteGuard>
        <div>Conteúdo protegido</div>
      </RouteGuard>
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve redirecionar para login quando não autenticado', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: false,
      initialized: true,
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

    render(
      <RouteGuard>
        <div>Conteúdo protegido</div>
      </RouteGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fdashboard')
    })
  })

  it('deve mostrar conteúdo quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'client' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
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

    render(
      <RouteGuard>
        <div>Conteúdo protegido</div>
      </RouteGuard>
    )

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('deve verificar roles quando especificado', async () => {
    const mockHasRole = jest.fn().mockReturnValue(false)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'client' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: mockHasRole,
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })

    render(
      <RouteGuard requiredRoles={['admin']}>
        <div>Conteúdo admin</div>
      </RouteGuard>
    )

    expect(mockHasRole).toHaveBeenCalledWith('admin')
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
  })

  it('deve mostrar conteúdo quando tem role necessário', () => {
    const mockHasRole = jest.fn().mockReturnValue(true)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'admin' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: mockHasRole,
      hasPermission: jest.fn(),
      refreshProfile: jest.fn(),
    })

    render(
      <RouteGuard requiredRoles={['admin']}>
        <div>Conteúdo admin</div>
      </RouteGuard>
    )

    expect(screen.getByText('Conteúdo admin')).toBeInTheDocument()
  })

  it('deve verificar permissões quando especificado', () => {
    const mockHasPermission = jest.fn().mockReturnValue(false)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'client' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: mockHasPermission,
      refreshProfile: jest.fn(),
    })

    render(
      <RouteGuard requiredPermissions={['manage_users']}>
        <div>Conteúdo com permissão</div>
      </RouteGuard>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('manage_users')
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument()
  })
})

describe('PermissionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve mostrar conteúdo quando tem permissão', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'admin' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: mockHasPermission,
      refreshProfile: jest.fn(),
    })

    render(
      <PermissionGate permission="manage_users">
        <div>Conteúdo com permissão</div>
      </PermissionGate>
    )

    expect(screen.getByText('Conteúdo com permissão')).toBeInTheDocument()
  })

  it('deve esconder conteúdo quando não tem permissão', () => {
    const mockHasPermission = jest.fn().mockReturnValue(false)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'client' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: mockHasPermission,
      refreshProfile: jest.fn(),
    })

    render(
      <PermissionGate permission="manage_users">
        <div>Conteúdo com permissão</div>
      </PermissionGate>
    )

    expect(screen.queryByText('Conteúdo com permissão')).not.toBeInTheDocument()
  })

  it('deve mostrar fallback quando não tem permissão', () => {
    const mockHasPermission = jest.fn().mockReturnValue(false)
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'client' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: mockHasPermission,
      refreshProfile: jest.fn(),
    })

    render(
      <PermissionGate 
        permission="manage_users"
        fallback={<div>Sem permissão</div>}
      >
        <div>Conteúdo com permissão</div>
      </PermissionGate>
    )

    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo com permissão')).not.toBeInTheDocument()
  })
})

describe('usePermissions', () => {
  it('deve retornar funções de verificação de permissão', () => {
    const mockHasRole = jest.fn()
    const mockHasPermission = jest.fn()
    
    mockUseAuth.mockReturnValue({
      user: { id: '1' } as any,
      profile: { id: '1', role: 'admin' } as any,
      session: {} as any,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      uploadUserAvatar: jest.fn(),
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
      refreshProfile: jest.fn(),
    })

    const TestComponent = () => {
      const { hasRole, hasPermission, isAuthenticated } = usePermissions()
      
      return (
        <div>
          <div>Authenticated: {isAuthenticated.toString()}</div>
          <button onClick={() => hasRole('admin')}>Check Admin</button>
          <button onClick={() => hasPermission('manage_users')}>Check Permission</button>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByText('Authenticated: true')).toBeInTheDocument()
  })
})
