/**
 * Jest setup file
 * Configurações globais para todos os testes
 */

import '@testing-library/jest-dom'

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock do Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock do window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock do fetch
global.fetch = jest.fn()

// Mock do console para testes mais limpos
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Configurar timeout padrão para testes
jest.setTimeout(10000)

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})

// Configurar handlers de erro não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Configurar matchers customizados
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
  
  toHaveBeenCalledWithinTime(received, timeMs) {
    const calls = received.mock.calls
    if (calls.length === 0) {
      return {
        message: () => `expected function to have been called`,
        pass: false,
      }
    }
    
    const now = Date.now()
    const recentCalls = calls.filter(call => {
      const callTime = call[call.length - 1] // Assume timestamp is last arg
      return (now - callTime) <= timeMs
    })
    
    const pass = recentCalls.length > 0
    return {
      message: () =>
        pass
          ? `expected function not to have been called within ${timeMs}ms`
          : `expected function to have been called within ${timeMs}ms`,
      pass,
    }
  },
})

// Configurar performance monitoring para testes
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
}

// Mock do crypto para testes
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  },
})

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC'

// Helper para aguardar próximo tick
global.waitForNextTick = () => new Promise(resolve => process.nextTick(resolve))

// Helper para aguardar timeout
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper para criar mock de usuário
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    nome: 'Test User',
    telefone: '11999999999',
  },
  app_metadata: {
    role: 'client',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper para criar mock de perfil
global.createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  nome: 'Test User',
  email: 'test@example.com',
  telefone: '11999999999',
  role: 'client',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper para criar mock de sessão
global.createMockSession = (overrides = {}) => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: global.createMockUser(),
  ...overrides,
})