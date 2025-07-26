/**
 * Testes E2E para fluxos de recovery de autenticação
 * Testa cenários completos de falha e recuperação
 */

import { test, expect, Page } from '@playwright/test'

// Configuração de teste
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  nome: 'Usuário Teste'
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Auth Recovery E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Interceptar requests para simular falhas
    await page.route('**/auth/v1/**', async (route) => {
      // Permitir requests normais por padrão
      await route.continue()
    })
  })

  test.afterEach(async () => {
    await page.close()
  })

  test.describe('Session Recovery', () => {
    test('deve recuperar sessão expirada automaticamente', async () => {
      // 1. Fazer login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Aguardar redirecionamento para dashboard
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // 2. Simular expiração de sessão
      await page.evaluate(() => {
        // Limpar token do localStorage para simular expiração
        localStorage.removeItem('supabase.auth.token')
      })
      
      // 3. Tentar acessar página protegida
      await page.goto(`${BASE_URL}/perfil`)
      
      // 4. Sistema deve tentar recovery automático
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 5000 })
      
      // 5. Se recovery falhar, deve redirecionar para login
      await page.waitForURL(`${BASE_URL}/login**`, { timeout: 10000 })
      
      // Verificar mensagem de sessão expirada
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible()
    })

    test('deve manter usuário logado após recovery bem-sucedido', async () => {
      // 1. Login inicial
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // 2. Simular falha temporária de rede
      await page.route('**/auth/v1/token**', async (route) => {
        // Primeira tentativa falha
        if (!route.request().url().includes('retry')) {
          await route.abort('failed')
        } else {
          await route.continue()
        }
      })
      
      // 3. Navegar para outra página (trigger validation)
      await page.goto(`${BASE_URL}/perfil`)
      
      // 4. Sistema deve fazer retry e manter usuário logado
      await expect(page).toHaveURL(`${BASE_URL}/perfil`)
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
    })
  })

  test.describe('Profile Recovery', () => {
    test('deve recuperar perfil ausente automaticamente', async () => {
      // 1. Login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // 2. Simular perfil ausente no database
      await page.route('**/rest/v1/profiles**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 404,
            body: JSON.stringify({ error: 'Profile not found' })
          })
        } else {
          await route.continue()
        }
      })
      
      // 3. Acessar página de perfil
      await page.goto(`${BASE_URL}/perfil`)
      
      // 4. Sistema deve detectar perfil ausente e tentar recovery
      await page.waitForSelector('[data-testid="profile-recovery-indicator"]', { timeout: 5000 })
      
      // 5. Após recovery, perfil deve estar disponível
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible({ timeout: 10000 })
    })

    test('deve sincronizar dados entre auth e database', async () => {
      // 1. Login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // 2. Simular dados dessincronizados
      await page.route('**/rest/v1/profiles**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              id: 'user-123',
              nome: 'Nome Antigo', // Diferente do auth
              email: TEST_USER.email,
              role: 'client'
            })
          })
        } else {
          await route.continue()
        }
      })
      
      // 3. Acessar perfil
      await page.goto(`${BASE_URL}/perfil`)
      
      // 4. Sistema deve detectar diferenças e sincronizar
      await page.waitForSelector('[data-testid="sync-indicator"]', { timeout: 5000 })
      
      // 5. Dados devem estar sincronizados
      await expect(page.locator('[data-testid="user-name"]')).toContainText(TEST_USER.nome)
    })
  })

  test.describe('Error Recovery', () => {
    test('deve lidar com falhas de rede temporárias', async () => {
      let requestCount = 0
      
      // Simular falha nas primeiras 2 tentativas
      await page.route('**/auth/v1/**', async (route) => {
        requestCount++
        if (requestCount <= 2) {
          await route.abort('failed')
        } else {
          await route.continue()
        }
      })
      
      // Tentar login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Sistema deve fazer retry e eventualmente ter sucesso
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 15000 })
    })

    test('deve ativar modo fallback após múltiplas falhas', async () => {
      // Simular falhas persistentes
      await page.route('**/auth/v1/**', async (route) => {
        await route.abort('failed')
      })
      
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Deve mostrar modo fallback
      await expect(page.locator('[data-testid="fallback-mode-indicator"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('[data-testid="fallback-message"]')).toContainText('funcionalidade limitada')
    })

    test('deve fazer logout automático em caso de falha crítica', async () => {
      // 1. Login inicial
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // 2. Simular erro crítico de autenticação
      await page.route('**/auth/v1/**', async (route) => {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Critical auth error' })
        })
      })
      
      // 3. Tentar acessar página protegida
      await page.goto(`${BASE_URL}/perfil`)
      
      // 4. Sistema deve fazer logout automático
      await page.waitForURL(`${BASE_URL}/login**`, { timeout: 10000 })
      await expect(page.locator('[data-testid="auto-logout-message"]')).toBeVisible()
    })
  })

  test.describe('Circuit Breaker', () => {
    test('deve ativar circuit breaker após muitas falhas', async () => {
      let requestCount = 0
      
      // Simular muitas falhas consecutivas
      await page.route('**/auth/v1/**', async (route) => {
        requestCount++
        if (requestCount <= 10) {
          await route.abort('failed')
        } else {
          await route.continue()
        }
      })
      
      // Múltiplas tentativas de login
      await page.goto(`${BASE_URL}/login`)
      
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', TEST_USER.email)
        await page.fill('[data-testid="password-input"]', TEST_USER.password)
        await page.click('[data-testid="login-button"]')
        await page.waitForTimeout(1000)
      }
      
      // Circuit breaker deve estar ativo
      await expect(page.locator('[data-testid="circuit-breaker-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled()
    })

    test('deve resetar circuit breaker após timeout', async () => {
      // Ativar circuit breaker
      await page.goto(`${BASE_URL}/login`)
      
      // Simular falhas para ativar circuit breaker
      await page.route('**/auth/v1/**', async (route) => {
        await route.abort('failed')
      })
      
      // Múltiplas tentativas
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', TEST_USER.email)
        await page.fill('[data-testid="password-input"]', TEST_USER.password)
        await page.click('[data-testid="login-button"]')
        await page.waitForTimeout(500)
      }
      
      // Verificar circuit breaker ativo
      await expect(page.locator('[data-testid="circuit-breaker-message"]')).toBeVisible()
      
      // Aguardar timeout (simular com JavaScript)
      await page.evaluate(() => {
        // Simular passagem de tempo para reset do circuit breaker
        window.dispatchEvent(new CustomEvent('circuit-breaker-reset'))
      })
      
      // Remover simulação de falha
      await page.unroute('**/auth/v1/**')
      
      // Tentar login novamente
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      // Deve funcionar normalmente
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
    })
  })

  test.describe('Performance Under Stress', () => {
    test('deve manter performance durante múltiplas operações simultâneas', async () => {
      // Login inicial
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Simular múltiplas operações simultâneas
      const startTime = Date.now()
      
      await Promise.all([
        page.goto(`${BASE_URL}/perfil`),
        page.goto(`${BASE_URL}/agendamentos`),
        page.goto(`${BASE_URL}/historico`),
        page.goto(`${BASE_URL}/configuracoes`)
      ])
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Deve completar em menos de 5 segundos
      expect(duration).toBeLessThan(5000)
      
      // Verificar se chegou na última página
      await expect(page).toHaveURL(`${BASE_URL}/configuracoes`)
    })

    test('deve lidar com alta frequência de validações de sessão', async () => {
      await page.goto(`${BASE_URL}/login`)
      await page.fill('[data-testid="email-input"]', TEST_USER.email)
      await page.fill('[data-testid="password-input"]', TEST_USER.password)
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Simular muitas validações rápidas
      for (let i = 0; i < 20; i++) {
        await page.evaluate(() => {
          // Trigger session validation
          window.dispatchEvent(new CustomEvent('validate-session'))
        })
        await page.waitForTimeout(100)
      }
      
      // Sistema deve permanecer estável
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    })
  })
})