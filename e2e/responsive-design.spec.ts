import { test, expect } from '@playwright/test'

test.describe('Design Responsivo E2E', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ]

  test.beforeEach(async ({ page }) => {
    // Limpar dados do navegador
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height })
      })

      test('página de login deve ser responsiva', async ({ page }) => {
        await page.goto('/login')
        
        // Verificar elementos principais
        await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/senha/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
        
        // Verificar que formulário está bem posicionado
        const form = page.locator('form').first()
        const formBox = await form.boundingBox()
        
        if (formBox) {
          // Formulário deve estar dentro da viewport
          expect(formBox.x).toBeGreaterThanOrEqual(0)
          expect(formBox.y).toBeGreaterThanOrEqual(0)
          expect(formBox.x + formBox.width).toBeLessThanOrEqual(width)
          expect(formBox.y + formBox.height).toBeLessThanOrEqual(height)
        }
        
        // Testar interação
        await page.getByLabel(/email/i).fill('test@example.com')
        await page.getByLabel(/senha/i).fill('password123')
        
        // Verificar que campos são acessíveis
        await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
        await expect(page.getByLabel(/senha/i)).toHaveValue('password123')
      })

      test('página de cadastro deve ser responsiva', async ({ page }) => {
        await page.goto('/cadastro')
        
        // Verificar elementos principais
        await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
        await expect(page.getByLabel(/nome completo/i)).toBeVisible()
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/telefone/i)).toBeVisible()
        await expect(page.getByLabel(/^senha$/i)).toBeVisible()
        await expect(page.getByLabel(/confirmar senha/i)).toBeVisible()
        
        // Testar scroll se necessário (especialmente em mobile)
        if (name === 'Mobile') {
          // Verificar que pode rolar para ver todos os campos
          await page.getByLabel(/confirmar senha/i).scrollIntoViewIfNeeded()
          await expect(page.getByLabel(/confirmar senha/i)).toBeVisible()
        }
        
        // Testar preenchimento de formulário
        await page.getByLabel(/nome completo/i).fill('Usuário Teste')
        await page.getByLabel(/email/i).fill('teste@example.com')
        await page.getByLabel(/telefone/i).fill('11999999999')
        await page.getByLabel(/^senha$/i).fill('senha123')
        await page.getByLabel(/confirmar senha/i).fill('senha123')
        
        // Verificar formatação de telefone
        await expect(page.getByLabel(/telefone/i)).toHaveValue('(11) 99999-9999')
      })

      test('dashboard deve ser responsivo', async ({ page }) => {
        // Fazer login primeiro
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('admin@styllobarber.com')
        await page.getByLabel(/senha/i).fill('admin123')
        await page.getByRole('button', { name: /entrar/i }).click()
        
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
        
        // Verificar elementos do dashboard
        await expect(page.getByText(/dashboard/i)).toBeVisible()
        
        if (name === 'Mobile') {
          // Em mobile, menu pode estar em hamburger
          const menuButton = page.getByRole('button', { name: /menu/i })
          if (await menuButton.isVisible()) {
            await menuButton.click()
          }
        }
        
        // Verificar navegação
        const agendaLink = page.getByRole('link', { name: /agenda/i })
        if (await agendaLink.isVisible()) {
          await agendaLink.click()
          await expect(page).toHaveURL(/\/dashboard\/agenda/)
        }
      })

      test('formulários devem ser acessíveis por toque/click', async ({ page }) => {
        await page.goto('/login')
        
        // Testar interação com campos
        const emailInput = page.getByLabel(/email/i)
        const senhaInput = page.getByLabel(/senha/i)
        const submitButton = page.getByRole('button', { name: /entrar/i })
        
        // Verificar que elementos são clicáveis
        await emailInput.click()
        await expect(emailInput).toBeFocused()
        
        await senhaInput.click()
        await expect(senhaInput).toBeFocused()
        
        // Verificar tamanho mínimo para toque (especialmente mobile)
        if (name === 'Mobile') {
          const buttonBox = await submitButton.boundingBox()
          if (buttonBox) {
            // Botão deve ter pelo menos 44px de altura (recomendação iOS/Android)
            expect(buttonBox.height).toBeGreaterThanOrEqual(44)
          }
        }
      })

      test('mensagens de erro devem ser visíveis', async ({ page }) => {
        await page.goto('/login')
        
        // Tentar login com dados inválidos
        await page.getByLabel(/email/i).fill('invalid@email.com')
        await page.getByLabel(/senha/i).fill('wrongpassword')
        await page.getByRole('button', { name: /entrar/i }).click()
        
        // Verificar que mensagem de erro é visível
        const errorMessage = page.getByText(/credenciais inválidas/i)
        await expect(errorMessage).toBeVisible({ timeout: 10000 })
        
        // Verificar que mensagem não está cortada
        const errorBox = await errorMessage.boundingBox()
        if (errorBox) {
          expect(errorBox.x).toBeGreaterThanOrEqual(0)
          expect(errorBox.x + errorBox.width).toBeLessThanOrEqual(width)
        }
      })

      test('navegação deve funcionar em diferentes tamanhos', async ({ page }) => {
        // Fazer login
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('admin@styllobarber.com')
        await page.getByLabel(/senha/i).fill('admin123')
        await page.getByRole('button', { name: /entrar/i }).click()
        
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
        
        // Testar navegação entre páginas
        const routes = [
          { path: '/dashboard/perfil', text: /perfil/i },
          { path: '/dashboard/agenda', text: /agenda/i },
        ]
        
        for (const route of routes) {
          await page.goto(route.path)
          await expect(page.getByText(route.text)).toBeVisible({ timeout: 5000 })
          
          // Verificar que conteúdo não está cortado
          const content = page.getByText(route.text)
          const contentBox = await content.boundingBox()
          
          if (contentBox) {
            expect(contentBox.x).toBeGreaterThanOrEqual(0)
            expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(width)
          }
        }
      })

      test('modais devem ser responsivos', async ({ page }) => {
        // Fazer login como admin
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('admin@styllobarber.com')
        await page.getByLabel(/senha/i).fill('admin123')
        await page.getByRole('button', { name: /entrar/i }).click()
        
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
        
        // Ir para página que tem modais (ex: gestão de usuários)
        await page.goto('/dashboard/usuarios')
        
        // Abrir modal de edição se disponível
        const editButton = page.getByRole('button', { name: /editar/i }).first()
        if (await editButton.isVisible()) {
          await editButton.click()
          
          // Verificar que modal é visível e bem posicionado
          const modal = page.locator('[role="dialog"]').first()
          if (await modal.isVisible()) {
            const modalBox = await modal.boundingBox()
            
            if (modalBox) {
              // Modal deve estar dentro da viewport
              expect(modalBox.x).toBeGreaterThanOrEqual(0)
              expect(modalBox.y).toBeGreaterThanOrEqual(0)
              expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(width)
              expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(height)
            }
            
            // Fechar modal
            const closeButton = modal.getByRole('button', { name: /fechar|cancelar/i })
            if (await closeButton.isVisible()) {
              await closeButton.click()
            }
          }
        }
      })

      test('tabelas devem ser responsivas', async ({ page }) => {
        // Fazer login como admin
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('admin@styllobarber.com')
        await page.getByLabel(/senha/i).fill('admin123')
        await page.getByRole('button', { name: /entrar/i }).click()
        
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
        
        // Ir para página com tabela
        await page.goto('/dashboard/usuarios')
        
        const table = page.locator('table').first()
        if (await table.isVisible()) {
          if (name === 'Mobile') {
            // Em mobile, tabela pode ter scroll horizontal
            const tableBox = await table.boundingBox()
            if (tableBox && tableBox.width > width) {
              // Verificar que pode fazer scroll horizontal
              await table.hover()
              await page.mouse.wheel(50, 0) // Scroll horizontal
            }
          }
          
          // Verificar que pelo menos algumas células são visíveis
          const cells = table.locator('td')
          const cellCount = await cells.count()
          if (cellCount > 0) {
            await expect(cells.first()).toBeVisible()
          }
        }
      })
    })
  })

  test('deve manter funcionalidade ao rotacionar dispositivo', async ({ page }) => {
    // Simular rotação de dispositivo móvel
    await page.setViewportSize({ width: 375, height: 667 }) // Portrait
    
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    
    // Rotacionar para landscape
    await page.setViewportSize({ width: 667, height: 375 })
    
    // Verificar que dados permanecem
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
    
    // Verificar que layout ainda funciona
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })
})