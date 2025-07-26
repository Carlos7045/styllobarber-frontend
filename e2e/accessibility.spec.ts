import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Acessibilidade E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar dados do navegador
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('página de login deve ser acessível', async ({ page }) => {
    await page.goto('/login')
    
    // Executar auditoria de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
    
    // Testes específicos de acessibilidade
    
    // 1. Verificar labels dos campos
    const emailInput = page.getByLabel(/email/i)
    const senhaInput = page.getByLabel(/senha/i)
    
    await expect(emailInput).toBeVisible()
    await expect(senhaInput).toBeVisible()
    
    // 2. Verificar que campos têm IDs únicos
    const emailId = await emailInput.getAttribute('id')
    const senhaId = await senhaInput.getAttribute('id')
    
    expect(emailId).toBeTruthy()
    expect(senhaId).toBeTruthy()
    expect(emailId).not.toBe(senhaId)
    
    // 3. Verificar navegação por teclado
    await page.keyboard.press('Tab')
    await expect(emailInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(senhaInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeFocused()
    
    // 4. Verificar que botão é ativável por Enter/Space
    await page.keyboard.press('Enter')
    // Deve tentar submeter o formulário (mesmo que com erro)
  })

  test('página de cadastro deve ser acessível', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Auditoria de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
    
    // Verificar estrutura semântica
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    
    // Verificar labels e associações
    const campos = [
      /nome completo/i,
      /email/i,
      /telefone/i,
      /^senha$/i,
      /confirmar senha/i
    ]
    
    for (const campo of campos) {
      const input = page.getByLabel(campo)
      await expect(input).toBeVisible()
      
      // Verificar que tem ID único
      const id = await input.getAttribute('id')
      expect(id).toBeTruthy()
    }
    
    // Testar navegação sequencial por teclado
    await page.keyboard.press('Tab') // Nome
    await expect(page.getByLabel(/nome completo/i)).toBeFocused()
    
    await page.keyboard.press('Tab') // Email
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab') // Telefone
    await expect(page.getByLabel(/telefone/i)).toBeFocused()
    
    await page.keyboard.press('Tab') // Senha
    await expect(page.getByLabel(/^senha$/i)).toBeFocused()
    
    await page.keyboard.press('Tab') // Confirmar senha
    await expect(page.getByLabel(/confirmar senha/i)).toBeFocused()
    
    await page.keyboard.press('Tab') // Botão
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeFocused()
  })

  test('mensagens de erro devem ser acessíveis', async ({ page }) => {
    await page.goto('/login')
    
    // Submeter formulário vazio para gerar erros
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Aguardar mensagens de erro
    await expect(page.getByText(/email é obrigatório/i)).toBeVisible({ timeout: 5000 })
    
    // Verificar que mensagens de erro têm role apropriado
    const errorMessages = page.locator('[role="alert"]')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      // Verificar que pelo menos uma mensagem de erro tem role="alert"
      await expect(errorMessages.first()).toBeVisible()
    }
    
    // Verificar que campos com erro têm aria-invalid
    const emailInput = page.getByLabel(/email/i)
    const ariaInvalid = await emailInput.getAttribute('aria-invalid')
    expect(ariaInvalid).toBe('true')
  })

  test('dashboard deve ser acessível', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Auditoria de acessibilidade
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
    
    // Verificar estrutura semântica
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Verificar que links de navegação são acessíveis
    const navLinks = page.getByRole('navigation').getByRole('link')
    const linkCount = await navLinks.count()
    
    if (linkCount > 0) {
      // Verificar que links têm texto acessível
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i)
        const text = await link.textContent()
        expect(text?.trim()).toBeTruthy()
      }
    }
    
    // Testar navegação por teclado no menu
    await page.keyboard.press('Tab')
    // Primeiro elemento focável deve estar visível
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('modais devem ser acessíveis', async ({ page }) => {
    // Fazer login como admin
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Tentar abrir modal (ex: logout)
    const logoutButton = page.getByRole('button', { name: /sair/i })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      
      // Verificar que modal tem role="dialog"
      const modal = page.locator('[role="dialog"]')
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible()
        
        // Verificar que modal tem aria-labelledby ou aria-label
        const ariaLabel = await modal.getAttribute('aria-label')
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby')
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy()
        
        // Verificar que foco está no modal
        const focusedElement = page.locator(':focus')
        const isInsideModal = await focusedElement.locator('..').locator('[role="dialog"]').count() > 0
        expect(isInsideModal).toBe(true)
        
        // Verificar que Escape fecha o modal
        await page.keyboard.press('Escape')
        await expect(modal).not.toBeVisible()
      }
    }
  })

  test('formulários devem ter validação acessível', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Preencher campo com dados inválidos
    await page.getByLabel(/email/i).fill('email-invalido')
    await page.getByLabel(/^senha$/i).fill('123') // Muito curta
    await page.getByLabel(/confirmar senha/i).fill('456') // Diferente
    
    // Submeter formulário
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Aguardar mensagens de validação
    await expect(page.getByText(/email inválido/i)).toBeVisible({ timeout: 5000 })
    
    // Verificar que campos têm aria-describedby apontando para mensagens de erro
    const emailInput = page.getByLabel(/email/i)
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby')
    
    if (ariaDescribedBy) {
      const errorElement = page.locator(`#${ariaDescribedBy}`)
      await expect(errorElement).toBeVisible()
    }
  })

  test('tabelas devem ser acessíveis', async ({ page }) => {
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
      // Verificar que tabela tem caption ou aria-label
      const caption = table.locator('caption')
      const ariaLabel = await table.getAttribute('aria-label')
      
      const hasCaption = await caption.count() > 0
      expect(hasCaption || ariaLabel).toBeTruthy()
      
      // Verificar que headers têm scope apropriado
      const headers = table.locator('th')
      const headerCount = await headers.count()
      
      if (headerCount > 0) {
        const firstHeader = headers.first()
        const scope = await firstHeader.getAttribute('scope')
        expect(scope).toBeTruthy() // Deve ter scope="col" ou scope="row"
      }
    }
  })

  test('deve suportar navegação apenas por teclado', async ({ page }) => {
    await page.goto('/login')
    
    // Navegar e preencher formulário apenas com teclado
    await page.keyboard.press('Tab') // Email
    await page.keyboard.type('test@example.com')
    
    await page.keyboard.press('Tab') // Senha
    await page.keyboard.type('password123')
    
    await page.keyboard.press('Tab') // Botão
    await page.keyboard.press('Enter') // Submeter
    
    // Verificar que tentou fazer login (mesmo que com erro)
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 10000 })
  })

  test('deve ter contraste adequado', async ({ page }) => {
    await page.goto('/login')
    
    // Auditoria específica de contraste
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    // Filtrar apenas violações de contraste
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(contrastViolations).toEqual([])
  })

  test('deve funcionar com leitor de tela', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar que elementos têm texto acessível
    const heading = page.getByRole('heading', { name: /entrar/i })
    await expect(heading).toBeVisible()
    
    const emailInput = page.getByLabel(/email/i)
    const senhaInput = page.getByLabel(/senha/i)
    const submitButton = page.getByRole('button', { name: /entrar/i })
    
    // Verificar que elementos têm nomes acessíveis
    await expect(emailInput).toHaveAccessibleName()
    await expect(senhaInput).toHaveAccessibleName()
    await expect(submitButton).toHaveAccessibleName()
    
    // Verificar que não há elementos apenas visuais sem alternativa textual
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaLabelledBy = await img.getAttribute('aria-labelledby')
      
      // Imagem deve ter alt, aria-label, ou aria-labelledby
      expect(alt !== null || ariaLabel || ariaLabelledBy).toBe(true)
    }
  })

  test('deve suportar zoom até 200%', async ({ page }) => {
    await page.goto('/login')
    
    // Simular zoom de 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    
    // Verificar que elementos principais ainda são visíveis e funcionais
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
    
    // Verificar que ainda é possível interagir
    await page.getByLabel(/email/i).fill('test@example.com')
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
    
    // Resetar zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1'
    })
  })
})