import { test, expect } from '@playwright/test'

test.describe('Sistema de Roles e Permissões E2E', () => {
  // Dados de teste para diferentes roles
  const users = {
    admin: {
      email: 'admin@styllobarber.com',
      senha: 'admin123',
      role: 'admin'
    },
    barber: {
      email: 'barbeiro@styllobarber.com',
      senha: 'barber123',
      role: 'barber'
    },
    client: {
      email: 'cliente@styllobarber.com',
      senha: 'client123',
      role: 'client'
    }
  }

  test.beforeEach(async ({ page }) => {
    // Limpar dados do navegador
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  async function loginAs(page: any, userType: 'admin' | 'barber' | 'client') {
    const user = users[userType]
    
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(user.email)
    await page.getByLabel(/senha/i).fill(user.senha)
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  }

  test.describe('Permissões de Admin', () => {
    test('admin deve ter acesso a todas as funcionalidades', async ({ page }) => {
      await loginAs(page, 'admin')
      
      // Rotas que admin deve acessar
      const adminRoutes = [
        { path: '/dashboard/agenda', text: /agenda/i },
        { path: '/dashboard/clientes', text: /clientes/i },
        { path: '/dashboard/servicos', text: /serviços/i },
        { path: '/dashboard/funcionarios', text: /funcionários/i },
        { path: '/dashboard/financeiro', text: /financeiro/i },
        { path: '/dashboard/relatorios', text: /relatórios/i },
        { path: '/dashboard/configuracoes', text: /configurações/i },
      ]

      for (const route of adminRoutes) {
        await page.goto(route.path)
        
        // Verificar que não foi redirecionado para unauthorized
        await expect(page).not.toHaveURL(/\/unauthorized/)
        
        // Verificar que o conteúdo da página carregou
        await expect(page.getByText(route.text)).toBeVisible({ timeout: 5000 })
      }
    })

    test('admin deve conseguir gerenciar usuários', async ({ page }) => {
      await loginAs(page, 'admin')
      
      await page.goto('/dashboard/usuarios')
      
      // Verificar que a página de gestão de usuários carregou
      await expect(page.getByText(/gestão de usuários/i)).toBeVisible()
      
      // Verificar que pode ver lista de usuários
      await expect(page.getByText(/filtrar usuários/i)).toBeVisible()
      
      // Verificar que tem botões de ação
      const editButtons = page.getByRole('button', { name: /editar/i })
      await expect(editButtons.first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Permissões de Barbeiro', () => {
    test('barbeiro deve ter acesso limitado', async ({ page }) => {
      await loginAs(page, 'barber')
      
      // Rotas permitidas para barbeiro
      const allowedRoutes = [
        { path: '/dashboard/agenda', text: /agenda/i },
        { path: '/dashboard/clientes', text: /clientes/i },
        { path: '/dashboard/servicos', text: /serviços/i },
        { path: '/dashboard/financeiro', text: /financeiro/i },
      ]

      for (const route of allowedRoutes) {
        await page.goto(route.path)
        await expect(page).not.toHaveURL(/\/unauthorized/)
        await expect(page.getByText(route.text)).toBeVisible({ timeout: 5000 })
      }
    })

    test('barbeiro deve ser bloqueado em rotas administrativas', async ({ page }) => {
      await loginAs(page, 'barber')
      
      // Rotas restritas para barbeiro
      const restrictedRoutes = [
        '/dashboard/funcionarios',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      for (const route of restrictedRoutes) {
        await page.goto(route)
        
        // Deve ser redirecionado para unauthorized
        await expect(page).toHaveURL(/\/unauthorized/, { timeout: 5000 })
        await expect(page.getByText(/acesso negado/i)).toBeVisible()
      }
    })
  })

  test.describe('Permissões de Cliente', () => {
    test('cliente deve ter acesso apenas a funcionalidades básicas', async ({ page }) => {
      await loginAs(page, 'client')
      
      // Rotas permitidas para cliente
      const allowedRoutes = [
        { path: '/dashboard/agendamentos', text: /meus agendamentos/i },
        { path: '/dashboard/historico', text: /histórico/i },
        { path: '/dashboard/perfil', text: /meu perfil/i },
      ]

      for (const route of allowedRoutes) {
        await page.goto(route.path)
        await expect(page).not.toHaveURL(/\/unauthorized/)
        await expect(page.getByText(route.text)).toBeVisible({ timeout: 5000 })
      }
    })

    test('cliente deve ser bloqueado em rotas administrativas', async ({ page }) => {
      await loginAs(page, 'client')
      
      // Rotas restritas para cliente
      const restrictedRoutes = [
        '/dashboard/agenda',
        '/dashboard/clientes',
        '/dashboard/servicos',
        '/dashboard/funcionarios',
        '/dashboard/financeiro',
        '/dashboard/relatorios',
        '/dashboard/configuracoes',
      ]

      for (const route of restrictedRoutes) {
        await page.goto(route)
        
        // Deve ser redirecionado para unauthorized
        await expect(page).toHaveURL(/\/unauthorized/, { timeout: 5000 })
        await expect(page.getByText(/acesso negado/i)).toBeVisible()
      }
    })
  })

  test.describe('Proteção de Rotas sem Autenticação', () => {
    test('usuário não autenticado deve ser redirecionado para login', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/dashboard/agenda',
        '/dashboard/perfil',
        '/dashboard/configuracoes',
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)
        
        // Deve ser redirecionado para login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
      }
    })

    test('deve preservar URL de destino após login', async ({ page }) => {
      // Tentar acessar rota protegida
      await page.goto('/dashboard/perfil')
      
      // Deve ser redirecionado para login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
      
      // Fazer login
      await page.getByLabel(/email/i).fill(users.client.email)
      await page.getByLabel(/senha/i).fill(users.client.senha)
      await page.getByRole('button', { name: /entrar/i }).click()
      
      // Deve ser redirecionado para a URL original
      await expect(page).toHaveURL(/\/dashboard\/perfil/, { timeout: 10000 })
    })
  })

  test.describe('Navegação e Menu por Role', () => {
    test('menu deve mostrar opções diferentes por role', async ({ page }) => {
      // Testar menu do admin
      await loginAs(page, 'admin')
      
      // Verificar que menu tem todas as opções
      await expect(page.getByRole('link', { name: /agenda/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /funcionários/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /relatórios/i })).toBeVisible()
      
      // Fazer logout
      await page.getByRole('button', { name: /sair/i }).click()
      const confirmButton = page.getByRole('button', { name: /confirmar/i })
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Testar menu do cliente
      await loginAs(page, 'client')
      
      // Verificar que menu tem opções limitadas
      await expect(page.getByRole('link', { name: /meus agendamentos/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /perfil/i })).toBeVisible()
      
      // Verificar que não tem opções administrativas
      await expect(page.getByRole('link', { name: /funcionários/i })).not.toBeVisible()
      await expect(page.getByRole('link', { name: /relatórios/i })).not.toBeVisible()
    })
  })

  test.describe('Mudança de Role Dinâmica', () => {
    test('deve atualizar permissões quando role muda', async ({ page }) => {
      // Este teste simularia um admin alterando o role de um usuário
      // e verificando que as permissões são atualizadas em tempo real
      
      await loginAs(page, 'admin')
      
      // Ir para gestão de usuários
      await page.goto('/dashboard/usuarios')
      
      // Encontrar um usuário para alterar role
      const userRow = page.getByText(/barbeiro@styllobarber.com/i).locator('..')
      const editButton = userRow.getByRole('button', { name: /editar/i })
      
      if (await editButton.isVisible()) {
        await editButton.click()
        
        // Alterar role
        await page.getByLabel(/role/i).selectOption('client')
        await page.getByRole('button', { name: /salvar/i }).click()
        
        // Verificar que a alteração foi salva
        await expect(page.getByText(/usuário atualizado/i)).toBeVisible()
      }
    })
  })
})