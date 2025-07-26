import { test, expect } from '@playwright/test'

test.describe('Jornada Completa de Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar dados do navegador antes de cada teste
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('deve realizar jornada completa de cadastro, login e logout', async ({ page }) => {
    // Dados de teste únicos para evitar conflitos
    const timestamp = Date.now()
    const testUser = {
      nome: `Usuário Teste ${timestamp}`,
      email: `teste${timestamp}@example.com`,
      telefone: '11999999999',
      senha: 'senha123456'
    }

    // === FASE 1: CADASTRO ===
    await page.goto('/cadastro')
    
    // Verificar se a página de cadastro carregou
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
    
    // Preencher formulário de cadastro
    await page.getByLabel(/nome completo/i).fill(testUser.nome)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/telefone/i).fill(testUser.telefone)
    await page.getByLabel(/^senha$/i).fill(testUser.senha)
    await page.getByLabel(/confirmar senha/i).fill(testUser.senha)
    
    // Submeter cadastro
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Aguardar resposta e verificar sucesso
    await expect(page.getByText(/conta criada com sucesso/i)).toBeVisible({ timeout: 10000 })
    
    // === FASE 2: LOGIN ===
    await page.goto('/login')
    
    // Verificar se a página de login carregou
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
    
    // Preencher formulário de login
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/senha/i).fill(testUser.senha)
    
    // Submeter login
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Aguardar redirecionamento para dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Verificar se está no dashboard
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    
    // === FASE 3: NAVEGAÇÃO AUTENTICADA ===
    // Verificar se pode acessar perfil
    await page.goto('/dashboard/perfil')
    await expect(page.getByText(/meu perfil/i)).toBeVisible()
    
    // Verificar se dados do usuário estão presentes
    await expect(page.getByDisplayValue(testUser.nome)).toBeVisible()
    await expect(page.getByDisplayValue(testUser.email)).toBeVisible()
    
    // === FASE 4: LOGOUT ===
    // Encontrar e clicar no botão de logout
    await page.getByRole('button', { name: /sair/i }).click()
    
    // Confirmar logout se houver modal de confirmação
    const confirmButton = page.getByRole('button', { name: /confirmar/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
    
    // Aguardar redirecionamento para login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    
    // === FASE 5: VERIFICAR LOGOUT COMPLETO ===
    // Tentar acessar página protegida deve redirecionar para login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('deve mostrar erros de validação no cadastro', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Tentar submeter formulário vazio
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Verificar mensagens de erro
    await expect(page.getByText(/nome é obrigatório/i)).toBeVisible()
    await expect(page.getByText(/email é obrigatório/i)).toBeVisible()
    await expect(page.getByText(/telefone é obrigatório/i)).toBeVisible()
    await expect(page.getByText(/senha é obrigatória/i)).toBeVisible()
  })

  test('deve mostrar erro para credenciais inválidas no login', async ({ page }) => {
    await page.goto('/login')
    
    // Tentar login com credenciais inválidas
    await page.getByLabel(/email/i).fill('usuario@inexistente.com')
    await page.getByLabel(/senha/i).fill('senhaerrada')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Verificar mensagem de erro
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 10000 })
    
    // Verificar que não foi redirecionado
    await expect(page).toHaveURL(/\/login/)
  })

  test('deve validar formato de email', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Preencher com email inválido
    await page.getByLabel(/email/i).fill('email-invalido')
    await page.getByLabel(/nome completo/i).fill('Teste')
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Verificar mensagem de erro
    await expect(page.getByText(/email inválido/i)).toBeVisible()
  })

  test('deve validar confirmação de senha', async ({ page }) => {
    await page.goto('/cadastro')
    
    // Preencher senhas diferentes
    await page.getByLabel(/^senha$/i).fill('senha123')
    await page.getByLabel(/confirmar senha/i).fill('senha456')
    await page.getByLabel(/nome completo/i).fill('Teste')
    await page.getByRole('button', { name: /criar conta/i }).click()
    
    // Verificar mensagem de erro
    await expect(page.getByText(/senhas não coincidem/i)).toBeVisible()
  })

  test('deve formatar telefone automaticamente', async ({ page }) => {
    await page.goto('/cadastro')
    
    const telefoneInput = page.getByLabel(/telefone/i)
    
    // Digitar números
    await telefoneInput.fill('11999999999')
    
    // Verificar formatação
    await expect(telefoneInput).toHaveValue('(11) 99999-9999')
  })

  test('deve manter sessão após recarregar página', async ({ page }) => {
    // Simular usuário já logado (usando localStorage)
    await page.goto('/login')
    
    // Fazer login primeiro
    await page.getByLabel(/email/i).fill('admin@styllobarber.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Recarregar página
    await page.reload()
    
    // Verificar que ainda está logado
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })
})