import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que requerem autenticação
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

// Rotas que só podem ser acessadas por usuários não autenticados
const authRoutes = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
]

// Rotas públicas que não precisam de verificação
const publicRoutes = [
  '/',
  '/agendamento', // Agendamento público
  '/termos',
  '/privacidade',
]

// Middleware de autenticação corrigido
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Rotas públicas que sempre devem ser permitidas
  const publicRoutes = [
    '/',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/agendamento',
    '/termos',
    '/privacidade',
  ]

  // Se é rota pública, permitir sempre
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return response
  }

  // Redirecionamento para URLs antigas de auth
  if (pathname.startsWith('/auth/login')) {
    const loginUrl = new URL('/login', request.url)
    // Preservar query parameters
    if (request.nextUrl.searchParams.get('redirect')) {
      loginUrl.searchParams.set('redirect', request.nextUrl.searchParams.get('redirect')!)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Criar cliente Supabase para middleware
  const supabase = createMiddlewareClient({ req: request, res: response })

  try {
    // Verificar sessão atual
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Erro no middleware de auth:', error)
    }

    const isAuthenticated = !!session?.user
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )

    // Se é uma rota protegida e o usuário não está autenticado
    if (isProtectedRoute && !isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar permissões baseadas em role para usuários autenticados
    if (isAuthenticated && isProtectedRoute) {
      const userRole = session.user.user_metadata?.role || 'client'
      
      // Verificar se o usuário tem permissão para acessar a rota
      const hasPermission = checkRoutePermission(pathname, userRole)
      
      if (!hasPermission) {
        const unauthorizedUrl = new URL('/dashboard/unauthorized', request.url)
        return NextResponse.redirect(unauthorizedUrl)
      }
    }

    return response
  } catch (error) {
    console.error('Erro no middleware:', error)
    
    // Em caso de erro, redirecionar rotas protegidas para login
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    return response
  }
}

// Função para verificar permissões de rota baseada no role
function checkRoutePermission(pathname: string, userRole: string): boolean {
  // Definir permissões por role
  const rolePermissions: Record<string, string[]> = {
    admin: [
      '/dashboard',
      '/dashboard/agenda',
      '/dashboard/clientes',
      '/dashboard/servicos',
      '/dashboard/funcionarios',
      '/dashboard/financeiro',
      '/dashboard/relatorios',
      '/dashboard/configuracoes',
    ],
    barber: [
      '/dashboard',
      '/dashboard/agenda',
      '/dashboard/clientes',
      '/dashboard/servicos',
      '/dashboard/financeiro',
    ],
    client: [
      '/dashboard',
      '/dashboard/agendamentos',
      '/dashboard/historico',
      '/dashboard/perfil',
    ],
  }

  const allowedRoutes = rolePermissions[userRole] || []
  
  // Verificar se a rota está permitida para o role
  return allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}