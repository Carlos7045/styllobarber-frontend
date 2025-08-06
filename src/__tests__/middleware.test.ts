import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { middleware } from '../middleware'

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

describe('Middleware', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCreateMiddlewareClient.mockReturnValue(mockSupabaseClient as any)
    
    // Mock padrão para NextResponse.next()
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

  describe('Rotas públicas', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/cadastro',
      '/recuperar-senha',
      '/agendamento',
      '/termos',
      '/privacidade',
    ]

    publicRoutes.forEach(route => {
      it(`deve permitir acesso à rota pública ${route}`, async () => {
        const request = createMockRequest(route)
        
        const response = await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
      })
    })
  })

  describe('Redirecionamentos de rotas antigas', () => {
    it('deve redirecionar /auth/login para /login', async () => {
      const request = createMockRequest('/auth/login')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
        })
      )
    })

    it('deve preservar parâmetros de redirect', async () => {
      const request = createMockRequest('/auth/login', { redirect: '/dashboard' })
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          searchParams: expect.objectContaining({
            get: expect.any(Function),
          }),
        })
      )
    })
  })

  describe('Rotas protegidas sem autenticação', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })
    })

    const protectedRoutes = [
      '/dashboard',
      '/dashboard/agenda',
      '/dashboard/clientes',
      '/dashboard/servicos',
      '/dashboard/funcionarios',
      '/dashboard/financeiro',
      '/dashboard/relatorios',
      '/dashboard/configuracoes',
    ]

    protectedRoutes.forEach(route => {
      it(`deve redirecionar ${route} para login quando não autenticado`, async () => {
        const request = createMockRequest(route)
        
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
    })
  })

  describe('Rotas protegidas com autenticação', () => {
    const createMockSession = (role: string) => ({
      data: {
        session: {
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: { role },
          },
        },
      },
      error: null,
    })

    describe('Permissões de Admin', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('admin')
        )
      })

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

      adminRoutes.forEach(route => {
        it(`deve permitir admin acessar ${route}`, async () => {
          const request = createMockRequest(route)
          
          const response = await middleware(request)
          
          expect(NextResponse.next).toHaveBeenCalled()
          expect(NextResponse.redirect).not.toHaveBeenCalled()
        })
      })
    })

    describe('Permissões de Barbeiro', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('barber')
        )
      })

      const barberAllowedRoutes = [
        '/dashboard',
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/financeiro',
      ]

      const barberDeniedRoutes = [
        '/dashboard/funcionarios',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      barberAllowedRoutes.forEach(route => {
        it(`deve permitir barbeiro acessar ${route}`, async () => {
          const request = createMockRequest(route)
          
          await middleware(request)
          
          expect(NextResponse.next).toHaveBeenCalled()
          expect(NextResponse.redirect).not.toHaveBeenCalled()
        })
      })

      barberDeniedRoutes.forEach(route => {
        it(`deve negar barbeiro acesso a ${route}`, async () => {
          const request = createMockRequest(route)
          
          await middleware(request)
          
          expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/dashboard/unauthorized',
            })
          )
        })
      })
    })

    describe('Permissões de Cliente', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue(
          createMockSession('client')
        )
      })

      const clientAllowedRoutes = [
        '/dashboard',
        '/dashboard/agendamentos',
        '/dashboard/historico',
        '/dashboard/perfil',
      ]

      const clientDeniedRoutes = [
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/funcionarios',
        '/dashboard/financeiro',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      clientAllowedRoutes.forEach(route => {
        it(`deve permitir cliente acessar ${route}`, async () => {
          const request = createMockRequest(route)
          
          await middleware(request)
          
          expect(NextResponse.next).toHaveBeenCalled()
          expect(NextResponse.redirect).not.toHaveBeenCalled()
        })
      })

      clientDeniedRoutes.forEach(route => {
        it(`deve negar cliente acesso a ${route}`, async () => {
          const request = createMockRequest(route)
          
          await middleware(request)
          
          expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/dashboard/unauthorized',
            })
          )
        })
      })
    })
  })

  describe('Tratamento de erros', () => {
    it('deve lidar com erro na sessão', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Erro de sessão' },
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
        new Error('Erro de conexão')
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
        new Error('Erro de conexão')
      )

      const request = createMockRequest('/')
      
      const response = await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Role padrão', () => {
    it('deve usar role "client" quando não especificado', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: '123',
              email: 'test@example.com',
              user_metadata: {}, // Sem role
            },
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
  })

  describe('Subrotas', () => {
    it('deve permitir subrotas para roles autorizados', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('admin')
      )

      const request = createMockRequest('/dashboard/configuracoes/perfil')
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('deve negar subrotas para roles não autorizados', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue(
        createMockSession('client')
      )

      const request = createMockRequest('/dashboard/configuracoes/sistema')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/dashboard/unauthorized',
        })
      )
    })
  })

  function createMockSession(role: string) {
    return {
      data: {
        session: {
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: { role },
          },
        },
      },
      error: null,
    }
  }
})
