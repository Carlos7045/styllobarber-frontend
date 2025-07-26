import { test, expect } from '@playwright/test'

test.describe('Performance E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar dados do navegador
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('página de login deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/login')
    
    // Aguardar elementos principais carregarem
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Página deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000)
    
    // Verificar métricas de performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      }
    })
    
    // First Contentful Paint deve ser menor que 2 segundos
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000)
    
    // DOM Content Loaded deve ser rápido
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000)
  })

  test('transições entre páginas devem ser fluidas', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Medir tempo de navegação entre páginas
    const routes = [
      '/dashboard/perfil',
      '/dashboard/agenda',
      '/dashboard/usuarios',
    ]
    
    for (const route of routes) {
      const startTime = Date.now()
      
      await page.goto(route)
      
      // Aguardar conteúdo principal carregar
      await page.waitForLoadState('domcontentloaded')
      
      const navigationTime = Date.now() - startTime
      
      // Navegação deve ser rápida (menos de 2 segundos)
      expect(navigationTime).toBeLessThan(2000)
    }
  })

  test('formulários devem responder rapidamente', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Medir tempo de resposta ao digitar
    const startTime = Date.now()
    
    await page.getByLabel(/nome completo/i).fill('Usuário de Teste Performance')
    await page.getByLabel(/email/i).fill('performance@test.com')
    await page.getByLabel(/telefone/i).fill('11999999999')
    
    const typingTime = Date.now() - startTime
    
    // Digitação deve ser responsiva (menos de 500ms para preencher todos os campos)
    expect(typingTime).toBeLessThan(500)
    
    // Verificar que formatação de telefone é instantânea
    await expect(page.getByLabel(/telefone/i)).toHaveValue('(11) 99999-9999')
  })

  test('validação de formulários deve ser rápida', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Preencher com dados inválidos
    await page.getByLabel(/email/i).fill('email-invalido')
    await page.getByLabel(/^senha$/i).fill('123')
    await page.getByLabel(/confirmar senha/i).fill('456')
    
    const startTime = Date.now()
    
    // Submeter formulário
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Aguardar mensagens de erro aparecerem
    await expect(page.getByText(/email inválido/i)).toBeVisible()
    
    const validationTime = Date.now() - startTime
    
    // Validação deve ser instantânea (menos de 500ms)
    expect(validationTime).toBeLessThan(500)
  })

  test('carregamento de listas deve ser eficiente', async ({ page }) => {
    // Fazer login como admin
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Ir para página com lista (usuários)
    const startTime = Date.now()
    
    await page.goto('/dashboard/usuarios')
    
    // Aguardar lista carregar
    await page.waitForSelector('table', { timeout: 10000 })
    
    const listLoadTime = Date.now() - startTime
    
    // Lista deve carregar em menos de 3 segundos
    expect(listLoadTime).toBeLessThan(3000)
    
    // Verificar que pelo menos alguns itens são visíveis
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('busca e filtros devem ser responsivos', async ({ page }) => {
    // Fazer login como admin
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/dashboard/usuarios')
    
    // Aguardar lista carregar
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Testar busca se disponível
    const searchInput = page.getByPlaceholder(/buscar/i)
    if (await searchInput.isVisible()) {
      const startTime = Date.now()
      
      await searchInput.fill('admin')
      
      // Aguardar resultados da busca
      await page.waitForTimeout(500) // Aguardar debounce
      
      const searchTime = Date.now() - startTime
      
      // Busca deve ser rápida (menos de 1 segundo)
      expect(searchTime).toBeLessThan(1000)
    }
  })

  test('upload de arquivos deve ter feedback de progresso', async ({ page }) => {
    // Fazer login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Ir para perfil onde há upload de avatar
    await page.goto('/dashboard/perfil')
    
    // Procurar input de upload
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // Criar arquivo de teste
      const buffer = Buffer.from('fake image data')
      
      const startTime = Date.now()
      
      // Fazer upload
      await fileInput.setInputFiles({
        name: 'avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      })
      
      // Verificar que há indicador de loading/progresso
      const loadingIndicator = page.getByText(/carregando|enviando|processando/i)
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        // Se há indicador, aguardar completar
        await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 })
      }
      
      const uploadTime = Date.now() - startTime
      
      // Upload deve completar em tempo razoável (menos de 10 segundos)
      expect(uploadTime).toBeLessThan(10000)
    }
  })

  test('animações devem ser suaves', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar que não há layout shifts durante carregamento
    let layoutShifts = 0
    
    await page.evaluate(() => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            layoutShifts += (entry as any).value
          }
        }
      }).observe({ entryTypes: ['layout-shift'] })
    })
    
    // Aguardar página carregar completamente
    await page.waitForLoadState('networkidle')
    
    // Interagir com elementos para trigger animações
    await page.getByLabel(/email/i).focus()
    await page.getByLabel(/senha/i).focus()
    
    // Layout shifts devem ser mínimos (CLS < 0.1)
    const cls = await page.evaluate(() => layoutShifts)
    expect(cls).toBeLessThan(0.1)
  })

  test('deve funcionar bem com conexão lenta', async ({ page, context }) => {
    // Simular conexão lenta
    await context.route('**/*', async (route) => {
      // Adicionar delay de 100ms para simular latência
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })
    
    const startTime = Date.now()
    
    await page.goto('/login')
    
    // Aguardar elementos principais carregarem
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Mesmo com conexão lenta, deve carregar em tempo razoável
    expect(loadTime).toBeLessThan(5000)
    
    // Verificar que funcionalidade básica ainda funciona
    await page.getByLabel(/email/i).fill('test@example.com')
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
  })

  test('deve ter boa performance de memória', async ({ page }) => {
    // Navegar por várias páginas para testar vazamentos de memória
    const routes = [
      '/login',
      '/cadastro',
      '/recuperar-senha',
      '/login',
    ]
    
    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      
      // Forçar garbage collection se disponível
      if (page.evaluate(() => typeof window.gc === 'function')) {
        await page.evaluate(() => (window as any).gc())
      }
    }
    
    // Verificar que não há muitos listeners de evento acumulados
    const listenerCount = await page.evaluate(() => {
      const events = ['click', 'keydown', 'resize', 'scroll']
      let totalListeners = 0
      
      events.forEach(eventType => {
        const listeners = document.querySelectorAll(`[on${eventType}]`).length
        totalListeners += listeners
      })
      
      return totalListeners
    })
    
    // Não deve haver muitos listeners inline (indica possível vazamento)
    expect(listenerCount).toBeLessThan(50)
  })

  test('recursos devem ser otimizados', async ({ page }) => {
    await page.goto('/login')
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle')
    
    // Verificar tamanhos de recursos
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      return resources.map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        type: resource.initiatorType,
      }))
    })
    
    // Verificar que imagens não são muito grandes
    const images = resourceSizes.filter(r => r.type === 'img')
    images.forEach(img => {
      expect(img.size).toBeLessThan(500000) // 500KB por imagem
    })
    
    // Verificar que CSS não é muito grande
    const stylesheets = resourceSizes.filter(r => r.type === 'css')
    stylesheets.forEach(css => {
      expect(css.size).toBeLessThan(200000) // 200KB por CSS
    })
    
    // Verificar que JavaScript não é muito grande
    const scripts = resourceSizes.filter(r => r.type === 'script')
    const totalJSSize = scripts.reduce((total, script) => total + script.size, 0)
    expect(totalJSSize).toBeLessThan(1000000) // 1MB total de JS
  })
})