// Dados de teste para E2E
export const testUsers = {
  admin: {
    email: 'admin@styllobarber.com',
    senha: 'admin123',
    nome: 'Administrador',
    role: 'admin'
  },
  barber: {
    email: 'barbeiro@styllobarber.com',
    senha: 'barber123',
    nome: 'João Barbeiro',
    role: 'barber'
  },
  client: {
    email: 'cliente@styllobarber.com',
    senha: 'client123',
    nome: 'Maria Cliente',
    role: 'client'
  }
}

export const testRoutes = {
  public: [
    '/',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/agendamento',
  ],
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
  ]
}

export const generateTestUser = () => {
  const timestamp = Date.now()
  return {
    nome: `Usuário Teste ${timestamp}`,
    email: `teste${timestamp}@example.com`,
    telefone: '11999999999',
    senha: 'senha123456'
  }
}

export const performanceThresholds = {
  pageLoad: 3000, // 3 segundos
  firstContentfulPaint: 2000, // 2 segundos
  domContentLoaded: 1000, // 1 segundo
  formValidation: 500, // 500ms
  navigation: 2000, // 2 segundos
  upload: 10000, // 10 segundos
}

export const accessibilityStandards = {
  wcag: ['wcag2a', 'wcag2aa'],
  minContrastRatio: 4.5,
  minTouchTarget: 44, // pixels
}

export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
}