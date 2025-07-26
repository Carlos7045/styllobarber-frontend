'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Shield,
  User,
  Key,
  Settings
} from 'lucide-react'
import { authValidator } from '@/lib/auth-validator'

interface ValidationResult {
  success: boolean
  message: string
  details?: any
  timestamp: number
  duration: number
}

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

export function AuthValidationPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'Todos', icon: Settings },
    { value: 'auth', label: 'Autenticação', icon: Key },
    { value: 'profile', label: 'Perfil', icon: User },
    { value: 'permissions', label: 'Permissões', icon: Shield },
    { value: 'security', label: 'Segurança', icon: AlertTriangle }
  ]

  const priorities = [
    { value: 'all', label: 'Todas' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ]

  /**
   * Executar todos os testes
   */
  const runAllTests = async () => {
    setIsRunning(true)
    
    try {
      const options: any = {}
      
      if (selectedCategory !== 'all') {
        options.categories = [selectedCategory]
      }
      
      if (selectedPriority !== 'all') {
        options.priorities = [selectedPriority]
      }

      const result = await authValidator.runAllTests(options)
      setReport(result)
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Executar teste específico
   */
  const runSpecificTest = async (testName: string) => {
    setIsRunning(true)
    
    try {
      const result = await authValidator.runSpecificTest(testName)
      
      // Atualizar report com resultado específico
      if (report) {
        const updatedResults = report.results.map(r => 
          r.message.includes(testName) ? result : r
        )
        
        setReport({
          ...report,
          results: updatedResults,
          passed: updatedResults.filter(r => r.success).length,
          failed: updatedResults.filter(r => !r.success).length
        })
      }
    } catch (error) {
      console.error('Erro ao executar teste específico:', error)
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Formatar duração
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  /**
   * Obter cor baseada no status
   */
  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  /**
   * Obter ícone baseado no status
   */
  const getStatusIcon = (success: boolean) => {
    return success ? CheckCircle : XCircle
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validação de Fluxos de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-border-default rounded-lg bg-background-primary"
                disabled={isRunning}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full p-2 border border-border-default rounded-lg bg-background-primary"
                disabled={isRunning}
              >
                {priorities.map(pri => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Executando...' : 'Executar Testes'}
            </Button>

            {report && (
              <Button
                variant="outline"
                onClick={() => setReport(null)}
                disabled={isRunning}
              >
                Limpar Resultados
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resumo dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{report.totalTests}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.passed}</div>
                <div className="text-sm text-green-600">Passou</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.failed}</div>
                <div className="text-sm text-red-600">Falhou</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{formatDuration(report.duration)}</div>
                <div className="text-sm text-gray-600">Duração</div>
              </div>
            </div>

            {/* Taxa de sucesso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Taxa de Sucesso</span>
                <span>{((report.passed / report.totalTests) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    report.passed === report.totalTests ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${(report.passed / report.totalTests) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados Detalhados */}
      {report && report.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.results.map((result, index) => {
                const StatusIcon = getStatusIcon(result.success)
                
                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`h-5 w-5 mt-0.5 ${getStatusColor(result.success)}`} />
                        <div>
                          <h4 className={`font-medium ${getStatusColor(result.success)}`}>
                            {result.message}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(result.duration)}
                            </span>
                            <span>
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botão para executar teste específico */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const testName = result.message.match(/\[(.*?)\]/)?.[1]
                          if (testName) runSpecificTest(testName)
                        }}
                        disabled={isRunning}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Detalhes do resultado */}
                    {result.details && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!report && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Validação de Autenticação</h3>
              <p className="text-sm mb-4">
                Execute testes automatizados para validar todos os fluxos de autenticação do sistema.
              </p>
              <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                <li>• Login/logout para todos os tipos de usuário</li>
                <li>• Persistência e refresh de sessão</li>
                <li>• Redirecionamentos baseados em role</li>
                <li>• Recuperação de senha</li>
                <li>• Proteção de rotas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}