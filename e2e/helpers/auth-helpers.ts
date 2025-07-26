import { Page, expect } from '@playwright/test'
import { testUsers } from './test-data'

export async function loginAs(page: Page, userType: 'admin' | 'barber' | 'client') {
  const user = testUsers[userType]
  
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/senha/i).fill(user.senha)
  await page.getByRole('button', { name: /entrar/i }).click()
  
  // Aguardar redirecionamento
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /sair/i })
  await logoutButton.click()
  
  // Confirmar logout se houver modal
  const confirmButton = page.getByRole('button', { name: /confirmar/i })
  if (await confirmButton.isVisible()) {
    await confirmButton.click()
  }
  
  // Aguardar redirecionamento
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
}

export async function clearBrowserData(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function createTestUser(page: Page, userData: {
  nome: string
  email: string
  telefone: string
  senha: string
}) {
  await page.goto('/cadastro')
  
  await page.getByLabel(/nome completo/i).fill(userData.nome)
  await page.getByLabel(/email/i).fill(userData.email)
  await page.getByLabel(/telefone/i).fill(userData.telefone)
  await page.getByLabel(/^senha$/i).fill(userData.senha)
  await page.getByLabel(/confirmar senha/i).fill(userData.senha)
  
  await page.getByRole('button', { name: /criar conta/i }).click()
  
  // Aguardar confirmação
  await expect(page.getByText(/conta criada com sucesso/i)).toBeVisible({ timeout: 10000 })
}

export async function waitForPageLoad(page: Page, timeout = 5000) {
  await page.waitForLoadState('domcontentloaded', { timeout })
  await page.waitForLoadState('networkidle', { timeout })
}

export async function checkAuthenticatedState(page: Page, shouldBeAuthenticated: boolean) {
  if (shouldBeAuthenticated) {
    // Tentar acessar página protegida
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  } else {
    // Tentar acessar página protegida deve redirecionar para login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  }
}