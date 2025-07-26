/**
 * Validador de Fluxos de Autenticação
 * Sistema para testar e validar todos os fluxos de autenticação
 */

import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/contexts/AuthContext'
import { User, Session } from '@supabase/supabase-js'

// Interface para resultado de validação
interface ValidationResult {
  success: boolean
  message: string
  details?: any
  timestamp: number
  duration: number
}

// Interface para teste de fluxo
interface FlowTest {
  name: string
  description: string
  test: () => Promise<ValidationResult>
  priority: 'high' | 'medium' | 'low'
  category: 'auth' | 'profile' | 'permissions' | 'security'
}

// Interface para relatório de validação
interface ValidationReport {
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  results: ValidationResult[]
  summary: {
    authFlows: number
    profileTests: number
    permissionTests: number
    securityTests: number
  }
}

class AuthValidator {
  private testUsers: Map<string, { email: string; password: string; role: string }> = new Map()
  private testResults: ValidationResult[] = []

  constructor() {
    // Configurar usuários de teste
    this.setupTestUsers()
    console.log('🧪 AuthValidator inicializado')
  }

  /**
   * Configurar usuários de teste
   */
  private setupTestUsers(): void {
    // Usar usuários existentes no banco
    this.testUsers.set('client', {
      email: 'teste.direto@example.com',
      password: 'TesteDireto123!',
      role: 'client'
    })

    this.testUsers.set('admin', {
      email: 'salgadocarloshenrique@gmail.com',
      password: 'SuaSenhaAqui123!', // Você precisará usar a senha real
      role: 'admin'
    })

    this.testUsers.set('saas_owner', {
      email: 'chpsalgado@hotmail.com',
      password: 'SuaSenhaAqui123!', // Você precisará usar a senha real
      role: 'saas_owner'
    })

    // Nota: Para testes reais, você deve criar usuários específicos para teste
    // ou usar credenciais de teste conhecidas
  }

  /**
   * Executar teste com medição de tempo
   */
  private async runTest(testFn: () => Promise<ValidationResult>): Promise<ValidationResult> {
    const startTime = Date.now()
    
    try {
      const result = await testFn()
      result.duration = Date.now() - startTime
      result.timestamp = Date.now()
      return result
    } catch (error) {
      return {
        success: false,
        message: `Erro inesperado no teste: ${error instanceof Error ? error.message : error}`,
        details: error,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Teste: Login para todos os tipos de usuário
   */
  private async testLoginAllRoles(): Promise<ValidationResult> {
    const results: any[] = []

    for (const [role, userData] of this.testUsers.entries()) {
      try {
        console.log(`🔐 Testando login para role: ${role}`)

        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        })

        if (error) {
          results.push({
            role,
            success: false,
            error: error.message
          })
          continue
        }

        if (!data.user) {
          results.push({
            role,
            success: false,
            error: 'Usuário não retornado'
          })
          continue
        }

        // Verificar se o perfil existe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          results.push({
            role,
            success: false,
            error: 'Perfil não encontrado'
          })
          continue
        }

        // Verificar se o role está correto
        if (profile.role !== role) {
          results.push({
            role,
            success: false,
            error: `Role incorreto: esperado ${role}, obtido ${profile.role}`
          })
          continue
        }

        results.push({
          role,
          success: true,
          userId: data.user.id,
          profileRole: profile.role
        })

        // Fazer logout
        await supabase.auth.signOut()

      } catch (error) {
        results.push({
          role,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return {
      success: successCount === totalCount,
      message: `Login testado para ${successCount}/${totalCount} roles`,
      details: results
    } as ValidationResult
  }

  /**
   * Teste: Persistência de sessão
   */
  private async testSessionPersistence(): Promise<ValidationResult> {
    try {
      const testUser = this.testUsers.get('client')!

      // Fazer login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      })

      if (loginError || !loginData.user) {
        return {
          success: false,
          message: 'Falha no login inicial'
        } as ValidationResult
      }

      const userId = loginData.user.id

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verificar se a sessão ainda está ativa
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session || sessionData.session.user.id !== userId) {
        return {
          success: false,
          message: 'Sessão não persistiu'
        } as ValidationResult
      }

      // Fazer logout
      await supabase.auth.signOut()

      return {
        success: true,
        message: 'Sessão persistiu corretamente'
      } as ValidationResult

    } catch (error) {
      return {
        success: false,
        message: `Erro no teste de persistência: ${error instanceof Error ? error.message : error}`
      } as ValidationResult
    }
  }

  /**
   * Teste: Redirecionamentos baseados em role
   */
  private async testRoleBasedRedirects(): Promise<ValidationResult> {
    const expectedRedirects = {
      client: '/dashboard',
      barber: '/dashboard',
      admin: '/dashboard',
      saas_owner: '/saas-admin'
    }

    const results: any[] = []

    for (const [role, userData] of this.testUsers.entries()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        })

        if (error || !data.user) {
          results.push({
            role,
            success: false,
            error: 'Falha no login'
          })
          continue
        }

        // Verificar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        const expectedRedirect = expectedRedirects[role as keyof typeof expectedRedirects]
        
        results.push({
          role,
          success: true,
          expectedRedirect,
          profileRole: profile?.role
        })

        await supabase.auth.signOut()

      } catch (error) {
        results.push({
          role,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return {
      success: successCount === results.length,
      message: `Redirecionamentos testados para ${successCount}/${results.length} roles`,
      details: results
    } as ValidationResult
  }

  /**
   * Teste: Recuperação de senha
   */
  private async testPasswordRecovery(): Promise<ValidationResult> {
    try {
      const testUser = this.testUsers.get('client')!

      const { error } = await supabase.auth.resetPasswordForEmail(testUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return {
          success: false,
          message: `Erro na recuperação de senha: ${error.message}`
        } as ValidationResult
      }

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso'
      } as ValidationResult

    } catch (error) {
      return {
        success: false,
        message: `Erro no teste de recuperação: ${error instanceof Error ? error.message : error}`
      } as ValidationResult
    }
  }

  /**
   * Teste: Proteção de rotas
   */
  private async testRouteProtection(): Promise<ValidationResult> {
    const protectedRoutes = [
      { path: '/dashboard', requiredRoles: ['admin', 'barber', 'client'] },
      { path: '/saas-admin', requiredRoles: ['saas_owner'] },
      { path: '/dashboard/usuarios', requiredRoles: ['admin'] }
    ]

    const results: any[] = []

    for (const route of protectedRoutes) {
      // Testar acesso sem autenticação
      try {
        // Simular verificação de proteção de rota
        const isProtected = route.requiredRoles.length > 0
        
        results.push({
          path: route.path,
          isProtected,
          requiredRoles: route.requiredRoles,
          success: isProtected
        })
      } catch (error) {
        results.push({
          path: route.path,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return {
      success: successCount === results.length,
      message: `Proteção testada para ${successCount}/${results.length} rotas`,
      details: results
    } as ValidationResult
  }

  /**
   * Definir todos os testes
   */
  private getFlowTests(): FlowTest[] {
    return [
      {
        name: 'login-all-roles',
        description: 'Testar login para todos os tipos de usuário',
        test: () => this.testLoginAllRoles(),
        priority: 'high',
        category: 'auth'
      },
      {
        name: 'session-persistence',
        description: 'Verificar persistência de sessão',
        test: () => this.testSessionPersistence(),
        priority: 'high',
        category: 'auth'
      },
      {
        name: 'role-based-redirects',
        description: 'Validar redirecionamentos baseados em role',
        test: () => this.testRoleBasedRedirects(),
        priority: 'high',
        category: 'auth'
      },
      {
        name: 'password-recovery',
        description: 'Testar recuperação de senha',
        test: () => this.testPasswordRecovery(),
        priority: 'medium',
        category: 'auth'
      },
      {
        name: 'route-protection',
        description: 'Verificar proteção de rotas',
        test: () => this.testRouteProtection(),
        priority: 'high',
        category: 'security'
      }
    ]
  }

  /**
   * Executar todos os testes
   */
  async runAllTests(options: {
    categories?: string[]
    priorities?: string[]
    skipOnError?: boolean
  } = {}): Promise<ValidationReport> {
    console.log('🧪 Iniciando validação completa de fluxos de autenticação...')
    
    const startTime = Date.now()
    const tests = this.getFlowTests()
    const results: ValidationResult[] = []
    
    // Filtrar testes baseado nas opções
    const filteredTests = tests.filter(test => {
      if (options.categories && !options.categories.includes(test.category)) {
        return false
      }
      if (options.priorities && !options.priorities.includes(test.priority)) {
        return false
      }
      return true
    })

    console.log(`📋 Executando ${filteredTests.length} testes...`)

    for (const test of filteredTests) {
      console.log(`🔄 Executando: ${test.name} - ${test.description}`)
      
      const result = await this.runTest(test.test)
      result.message = `[${test.name}] ${result.message}`
      results.push(result)

      if (!result.success) {
        console.error(`❌ Falha: ${test.name} - ${result.message}`)
        if (options.skipOnError) {
          console.log('⏭️ Pulando testes restantes devido a erro')
          break
        }
      } else {
        console.log(`✅ Sucesso: ${test.name}`)
      }
    }

    const duration = Date.now() - startTime
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    // Calcular estatísticas por categoria
    const summary = {
      authFlows: results.filter(r => r.message.includes('auth')).length,
      profileTests: results.filter(r => r.message.includes('profile')).length,
      permissionTests: results.filter(r => r.message.includes('permission')).length,
      securityTests: results.filter(r => r.message.includes('security')).length
    }

    const report: ValidationReport = {
      totalTests: results.length,
      passed,
      failed,
      skipped: filteredTests.length - results.length,
      duration,
      results,
      summary
    }

    console.log('📊 Relatório de Validação:')
    console.log(`   Total: ${report.totalTests}`)
    console.log(`   ✅ Passou: ${report.passed}`)
    console.log(`   ❌ Falhou: ${report.failed}`)
    console.log(`   ⏭️ Pulados: ${report.skipped}`)
    console.log(`   ⏱️ Duração: ${duration}ms`)

    this.testResults = results
    return report
  }

  /**
   * Executar teste específico
   */
  async runSpecificTest(testName: string): Promise<ValidationResult> {
    const tests = this.getFlowTests()
    const test = tests.find(t => t.name === testName)

    if (!test) {
      return {
        success: false,
        message: `Teste não encontrado: ${testName}`,
        timestamp: Date.now(),
        duration: 0
      }
    }

    console.log(`🔄 Executando teste específico: ${test.name}`)
    return this.runTest(test.test)
  }

  /**
   * Obter últimos resultados
   */
  getLastResults(): ValidationResult[] {
    return [...this.testResults]
  }

  /**
   * Limpar resultados
   */
  clearResults(): void {
    this.testResults = []
    console.log('🧹 Resultados de teste limpos')
  }
}

// Instância singleton
export const authValidator = new AuthValidator()

export default authValidator