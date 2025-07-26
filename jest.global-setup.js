/**
 * Jest global setup
 * Executado uma vez antes de todos os testes
 */

module.exports = async () => {
  console.log('🚀 Iniciando setup global dos testes...')
  
  // Configurar variáveis de ambiente globais
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  
  // Configurar timezone
  process.env.TZ = 'UTC'
  
  // Configurar limites de memória para testes de stress
  if (process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS += ' --max-old-space-size=4096'
  } else {
    process.env.NODE_OPTIONS = '--max-old-space-size=4096'
  }
  
  // Timeout global será configurado no jest.config.js
  
  // Suprimir warnings específicos durante testes
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    
    // Suprimir warnings conhecidos que não afetam os testes
    if (
      typeof message === 'string' && (
        message.includes('Warning: ReactDOM.render is deprecated') ||
        message.includes('Warning: componentWillReceiveProps') ||
        message.includes('Warning: componentWillMount')
      )
    ) {
      return
    }
    
    originalWarn.apply(console, args)
  }
  
  // Configurar handlers de erro global
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection durante testes:', reason)
    // Não falhar os testes por rejeições não tratadas em alguns casos
    if (reason && reason.message && reason.message.includes('Network request failed')) {
      console.log('⚠️ Ignorando falha de rede durante testes')
      return
    }
    throw reason
  })
  
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception durante testes:', error)
    throw error
  })
  
  // Mock functions serão configurados no jest.setup.js onde jest está disponível
  
  // Configurar dados de teste padrão
  global.testData = {
    users: [
      {
        id: 'user-1',
        email: 'admin@test.com',
        user_metadata: { nome: 'Admin Test', role: 'admin' },
      },
      {
        id: 'user-2',
        email: 'barber@test.com',
        user_metadata: { nome: 'Barber Test', role: 'barber' },
      },
      {
        id: 'user-3',
        email: 'client@test.com',
        user_metadata: { nome: 'Client Test', role: 'client' },
      },
    ],
    profiles: [
      {
        id: 'user-1',
        nome: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin',
      },
      {
        id: 'user-2',
        nome: 'Barber Test',
        email: 'barber@test.com',
        role: 'barber',
      },
      {
        id: 'user-3',
        nome: 'Client Test',
        email: 'client@test.com',
        role: 'client',
      },
    ],
  }
  
  // Configurar métricas de performance para testes
  global.testMetrics = {
    startTime: Date.now(),
    operations: [],
    errors: [],
  }
  
  console.log('✅ Setup global dos testes concluído')
}