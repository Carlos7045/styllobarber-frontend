import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { middleware } from '../../middleware'

// Mock do Supabase middleware client
jest.mock('@supabase/auth-helpers-nextjs')
const mockCreateMiddlewareClient = createMiddlewareClient as jest.MockedFunction<typeof createMiddlewareClient>

// Mock do NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ headers: new Map() })),
    redirect: jest.fn((url) => ({ redirect: url })),
  },
}))

describe('Integração: Middleware de Proteção de Rotas', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
    
    ;(NextResponse.next as jest.Mock).mockReturnValue({
      headers: new Map(),
    })
  })

  const createMockRequest = (pathname: string, searchParams?: Record<string, string>) => {
    const url = new URL(`http://localhost:3000${pathname}`)
    
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    return {
      nextUrl: url,
      url: url.toString(),
    } as NextRequest
  }

  const createMockSession = (role: string, userId: string = 'user-123') => ({
    data: {
      session: {
        user: {
          id: userId,
          email: 'test@example.com',
          user_metadata: { role },
        },
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    },
    error: null,
  })

  describe('Fluxo Completo de Proteção por Role', () => {
    it('deve permitir jornada completa do admin', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('admin')
      )

      const adminRoutes = [
        '/dashboard',
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/funcionarios',
        '/dashboard/financeiro',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      // Testar todas as rotas de admin em sequência
      for (const route of adminRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
        
        // Reset mocks para próxima iteração
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        ;(NextResponse.next as jest.Mock).mockReturnValue({ headers: new Map() })
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('admin')
        )
      }
    })

    it('deve bloquear barbeiro em rotas administrativas', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('barber')
      )

      const restrictedRoutes = [
        '/dashboard/funcionarios',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      for (const route of restrictedRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/dashboard/unauthorized',
          })
        )
        
        // Reset para próxima iteração
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('barber')
        )
      }
    })

    it('deve permitir barbeiro em rotas autorizadas', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('barber')
      )

      const allowedRoutes = [
        '/dashboard',
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/financeiro',
      ]

      for (const route of allowedRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
        
        // Reset para próxima iteração
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        ;(NextResponse.next as jest.Mock).mockReturnValue({ headers: new Map() })
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('barber')
        )
      }
    })

    it('deve restringir cliente a rotas específicas', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('client')
      )

      const clientRoutes = [
        '/dashboard',
        '/dashboard/agendamentos',
        '/dashboard/historico',
        '/dashboard/perfil',
      ]

      const restrictedRoutes = [
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/funcionarios',
        '/dashboard/financeiro',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      // Testar rotas permitidas
      for (const route of clientRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
        
        // Reset
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        ;(NextResponse.next as jest.Mock).mockReturnValue({ headers: new Map() })
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('client')
        )
      }

      // Testar rotas restritas
      for (const route of restrictedRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/dashboard/unauthorized',
          })
        )
        
        // Reset
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('client')
        )
      }
    })
  })

  describe('Fluxo de Redirecionamento com Preservação de Estado', () => {
    it('deve preservar URL de destino no redirecionamento para login', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const targetRoute = '/dashboard/configuracoes'
      const request = createMockRequest(targetRoute)
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
          searchParams: expect.objectContaining({
            get: expect.any(Function),
          }),
        })
      )
    })

    it('deve redirecionar rotas antigas de auth', async () => {
      const request = createMockRequest('/auth/login', { redirect: '/dashboard' })
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
        })
      )
    })
  })

  describe('Cenários de Erro e Recuperação', () => {
    it('deve lidar com erro de sessão e redirecionar para login', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      })

      const request = createMockRequest('/dashboard')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
        })
      )
    })

    it('deve lidar com exceção no middleware', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(
        new Error('Network error')
      )

      const request = createMockRequest('/dashboard')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
        })
      )
    })

    it('deve permitir rotas públicas mesmo com erro', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(
        new Error('Network error')
      )

      const publicRoutes = ['/', '/login', '/cadastro', '/agendamento']

      for (const route of publicRoutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
        
        // Reset
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        ;(NextResponse.next as jest.Mock).mockReturnValue({ headers: new Map() })
      }
    })
  })

  describe('Subrotas e Permissões Granulares', () => {
    it('deve permitir subrotas para roles autorizados', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('admin')
      )

      const subroutes = [
        '/dashboard/configuracoes/perfil',
        '/dashboard/configuracoes/sistema',
        '/dashboard/funcionarios/novo',
        '/dashboard/relatorios/vendas',
      ]

      for (const route of subroutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
        
        // Reset
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        ;(NextResponse.next as jest.Mock).mockReturnValue({ headers: new Map() })
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('admin')
        )
      }
    })

    it('deve bloquear subrotas para roles não autorizados', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('client')
      )

      const restrictedSubroutes = [
        '/dashboard/configuracoes/sistema',
        '/dashboard/funcionarios/novo',
        '/dashboard/relatorios/vendas',
        '/dashboard/agenda/configurar',
      ]

      for (const route of restrictedSubroutes) {
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/dashboard/unauthorized',
          })
        )
        
        // Reset
        jest.clearAllMocks()
        mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('client')
        )
      }
    })
  })

  describe('Role Padrão e Casos Extremos', () => {
    it('deve usar role client como padrão quando não especificado', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {}, // Sem role
            },
            access_token: 'mock-token',
          },
        },
        error: null,
      })

      const request = createMockRequest('/dashboard/agenda')
      
      await middleware(request)
      
      // Cliente não deve ter acesso à agenda
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/dashboard/unauthorized',
        })
      )
    })

    it('deve lidar com role inválido', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: { role: 'invalid_role' },
            },
            access_token: 'mock-token',
          },
        },
        error: null,
      })

      const request = createMockRequest('/dashboard')
      
      await middleware(request)
      
      // Role inválido deve ser tratado como sem permissões
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/dashboard/unauthorized',
        })
      )
    })
  })
})