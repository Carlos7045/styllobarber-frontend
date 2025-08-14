/**
 * Componente para validação e correção automática de especialidades
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useEspecialidadesValidator, type ValidationResult, type ValidationIssue } from '@/domains/users/services/especialidades-validator'
import { AlertTriangle, CheckCircle, Info, RefreshCw, Wrench, FileText, AlertCircle } from 'lucide-react'

interface EspecialidadesValidatorProps {
  className?: string
}

export function EspecialidadesValidator({ className }: EspecialidadesValidatorProps) {
  const { validateAll, applyAutoFixes, generateReport } = useEspecialidadesValidator()
  
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fixingIssues, setFixingIssues] = useState(false)

  // Executar validação
  const handleValidate = useCallback(async () => {
    setLoading(true)
    try {
      console.log('🔍 Executando validação de especialidades...')
      const result = await validateAll()
      setValidationResult(result)
      
      // Gerar relatório também
      const reportData = await generateReport()
      setReport(reportData)
      
      console.log('✅ Validação concluída:', result)
    } catch (error) {
      console.error('❌ Erro na validação:', error)
      alert('Erro ao executar validação')
    } finally {
      setLoading(false)
    }
  }, [validateAll, generateReport])

  // Aplicar correções automáticas
  const handleAutoFix = useCallback(async () => {
    if (!validationResult?.suggestions.length) return

    const confirmar = window.confirm(
      `Aplicar ${validationResult.suggestions.length} correção(ões) automática(s)?\n\n` +
      `Esta operação irá:\n` +
      `• Remover especialidades órfãs\n` +
      `• Remover especialidades de serviços desativados\n\n` +
      `Deseja continuar?`
    )

    if (!confirmar) return

    setFixingIssues(true)
    try {
      console.log('🔧 Aplicando correções automáticas...')
      const result = await applyAutoFixes(validationResult.suggestions)
      
      alert(
        `Correções aplicadas!\n\n` +
        `✅ Aplicadas: ${result.applied}\n` +
        `❌ Falharam: ${result.failed}\n\n` +
        `${result.errors.length > 0 ? `Erros:\n${result.errors.join('\n')}` : ''}`
      )

      // Re-executar validação
      await handleValidate()
      
    } catch (error) {
      console.error('❌ Erro ao aplicar correções:', error)
      alert('Erro ao aplicar correções automáticas')
    } finally {
      setFixingIssues(false)
    }
  }, [validationResult, applyAutoFixes, handleValidate])

  // Obter ícone e cor para tipo de issue
  const getIssueIcon = (issue: ValidationIssue) => {
    switch (issue.severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/20'
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-900/20'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/20'
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800/30 dark:bg-gray-900/20'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Validador de Especialidades
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleValidate}
            disabled={loading || fixingIssues}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Validando...' : 'Executar Validação'}
          </Button>

          {validationResult?.suggestions.length > 0 && (
            <Button
              onClick={handleAutoFix}
              disabled={loading || fixingIssues}
              variant="outline"
            >
              <Wrench className={`h-4 w-4 mr-2 ${fixingIssues ? 'animate-pulse' : ''}`} />
              {fixingIssues ? 'Corrigindo...' : `Corrigir ${validationResult.suggestions.length} Problema(s)`}
            </Button>
          )}
        </div>

        {/* Status da validação */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.isValid 
              ? 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {validationResult.isValid ? 'Sistema Válido' : 'Problemas Encontrados'}
              </span>
            </div>
            <div className={`text-sm ${
              validationResult.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {validationResult.isValid 
                ? 'Todas as especialidades estão consistentes e válidas.'
                : `${validationResult.issues.length} problema(s) encontrado(s) no sistema de especialidades.`
              }
            </div>
          </div>
        )}

        {/* Relatório */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600">{report.funcionariosComEspecialidades}</div>
              <div className="text-sm text-blue-600">Funcionários c/ Especialidades</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-600">{report.funcionariosSemEspecialidades}</div>
              <div className="text-sm text-orange-600">Funcionários s/ Especialidades</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">{report.servicosComFuncionarios}</div>
              <div className="text-sm text-green-600">Serviços c/ Funcionários</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg dark:bg-purple-900/20">
              <div className="text-2xl font-bold text-purple-600">{report.servicosSemFuncionarios}</div>
              <div className="text-sm text-purple-600">Serviços s/ Funcionários</div>
            </div>
          </div>
        )}

        {/* Lista de problemas */}
        {validationResult?.issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Problemas Encontrados</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationResult.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getIssueColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {getIssueIcon(issue)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {issue.type === 'missing_service' && 'Serviço Inexistente'}
                        {issue.type === 'inactive_service' && 'Serviço Desativado'}
                        {issue.type === 'duplicate_assignment' && 'Atribuição Duplicada'}
                        {issue.type === 'orphaned_assignment' && 'Serviço Sem Funcionários'}
                      </div>
                      <div className="text-sm opacity-90">
                        {issue.description}
                      </div>
                      {issue.funcionarioNome && (
                        <div className="text-xs opacity-75 mt-1">
                          Funcionário: {issue.funcionarioNome}
                        </div>
                      )}
                      {issue.serviceName && (
                        <div className="text-xs opacity-75 mt-1">
                          Serviço: {issue.serviceName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Como usar:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-6">
            <li>Execute a validação para verificar inconsistências</li>
            <li>Use "Corrigir Problemas" para aplicar correções automáticas</li>
            <li>Problemas críticos (vermelhos) devem ser corrigidos imediatamente</li>
            <li>Avisos (laranja) são recomendações de melhoria</li>
            <li>Informações (azul) são apenas para conhecimento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}