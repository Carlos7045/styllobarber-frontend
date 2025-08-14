/**
 * Serviço para validação e correção automática de especialidades
 */

import { supabase } from '@/lib/supabase'
import type { FuncionarioComEspecialidades } from '@/types/funcionarios'
import type { Service } from '@/types/services'

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationIssue {
  type: 'missing_service' | 'inactive_service' | 'duplicate_assignment' | 'orphaned_assignment'
  severity: 'error' | 'warning' | 'info'
  funcionarioId?: string
  funcionarioNome?: string
  serviceId?: string
  serviceName?: string
  description: string
}

export interface ValidationSuggestion {
  type: 'remove_assignment' | 'add_service' | 'activate_service' | 'assign_to_other'
  description: string
  action: () => Promise<boolean>
}

export class EspecialidadesValidator {
  /**
   * Valida todas as especialidades do sistema
   */
  static async validateAll(): Promise<ValidationResult> {
    try {
      console.log('🔍 Iniciando validação completa de especialidades...')

      // Buscar todos os dados necessários
      const [funcionarios, services, assignments] = await Promise.all([
        this.getFuncionarios(),
        this.getServices(),
        this.getAssignments()
      ])

      const issues: ValidationIssue[] = []
      const suggestions: ValidationSuggestion[] = []

      // Validação 1: Especialidades referenciando serviços inexistentes
      const serviceIds = new Set(services.map(s => s.id))
      const orphanedAssignments = assignments.filter(a => !serviceIds.has(a.service_id))

      for (const assignment of orphanedAssignments) {
        const funcionario = funcionarios.find(f => f.id === assignment.funcionario_id)
        issues.push({
          type: 'missing_service',
          severity: 'error',
          funcionarioId: assignment.funcionario_id,
          funcionarioNome: funcionario?.nome || 'Desconhecido',
          serviceId: assignment.service_id,
          description: `Funcionário ${funcionario?.nome || assignment.funcionario_id} possui especialidade em serviço inexistente (ID: ${assignment.service_id})`
        })

        suggestions.push({
          type: 'remove_assignment',
          description: `Remover especialidade órfã de ${funcionario?.nome || assignment.funcionario_id}`,
          action: async () => {
            const { error } = await supabase
              .from('funcionario_servicos')
              .delete()
              .eq('funcionario_id', assignment.funcionario_id)
              .eq('service_id', assignment.service_id)
            
            return !error
          }
        })
      }

      // Validação 2: Especialidades em serviços desativados
      const inactiveServices = services.filter(s => !s.ativo)
      for (const service of inactiveServices) {
        const serviceAssignments = assignments.filter(a => a.service_id === service.id)
        
        for (const assignment of serviceAssignments) {
          const funcionario = funcionarios.find(f => f.id === assignment.funcionario_id)
          issues.push({
            type: 'inactive_service',
            severity: 'warning',
            funcionarioId: assignment.funcionario_id,
            funcionarioNome: funcionario?.nome || 'Desconhecido',
            serviceId: service.id,
            serviceName: service.nome,
            description: `${funcionario?.nome || assignment.funcionario_id} possui especialidade em serviço desativado: ${service.nome}`
          })

          suggestions.push({
            type: 'remove_assignment',
            description: `Remover especialidade em serviço desativado: ${service.nome}`,
            action: async () => {
              const { error } = await supabase
                .from('funcionario_servicos')
                .delete()
                .eq('funcionario_id', assignment.funcionario_id)
                .eq('service_id', service.id)
              
              return !error
            }
          })
        }
      }

      // Validação 3: Serviços sem nenhum funcionário especializado
      const assignedServiceIds = new Set(assignments.map(a => a.service_id))
      const unassignedServices = services.filter(s => s.ativo && !assignedServiceIds.has(s.id))

      for (const service of unassignedServices) {
        issues.push({
          type: 'orphaned_assignment',
          severity: 'info',
          serviceId: service.id,
          serviceName: service.nome,
          description: `Serviço "${service.nome}" não possui nenhum funcionário especializado`
        })
      }

      // Validação 4: Funcionários sem especialidades
      const funcionariosComEspecialidades = new Set(assignments.map(a => a.funcionario_id))
      const funcionariosSemEspecialidades = funcionarios.filter(f => 
        f.role === 'barber' && !funcionariosComEspecialidades.has(f.id)
      )

      for (const funcionario of funcionariosSemEspecialidades) {
        issues.push({
          type: 'missing_service',
          severity: 'warning',
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          description: `Barbeiro ${funcionario.nome} não possui especialidades definidas`
        })
      }

      const isValid = issues.filter(i => i.severity === 'error').length === 0

      console.log(`✅ Validação concluída: ${issues.length} problemas encontrados`)

      return {
        isValid,
        issues,
        suggestions
      }

    } catch (error) {
      console.error('❌ Erro na validação:', error)
      throw new Error('Erro ao validar especialidades')
    }
  }

  /**
   * Aplica correções automáticas sugeridas
   */
  static async applyAutoFixes(suggestions: ValidationSuggestion[]): Promise<{
    applied: number
    failed: number
    errors: string[]
  }> {
    let applied = 0
    let failed = 0
    const errors: string[] = []

    console.log(`🔧 Aplicando ${suggestions.length} correções automáticas...`)

    for (const suggestion of suggestions) {
      try {
        const success = await suggestion.action()
        if (success) {
          applied++
          console.log(`✅ Correção aplicada: ${suggestion.description}`)
        } else {
          failed++
          errors.push(`Falha ao aplicar: ${suggestion.description}`)
        }
      } catch (error) {
        failed++
        const errorMsg = `Erro ao aplicar: ${suggestion.description} - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        errors.push(errorMsg)
        console.error('❌', errorMsg)
      }
    }

    console.log(`🎯 Correções concluídas: ${applied} aplicadas, ${failed} falharam`)

    return { applied, failed, errors }
  }

  /**
   * Gera relatório de especialidades
   */
  static async generateReport(): Promise<{
    totalFuncionarios: number
    funcionariosComEspecialidades: number
    funcionariosSemEspecialidades: number
    totalServicos: number
    servicosComFuncionarios: number
    servicosSemFuncionarios: number
    especialidadesTotal: number
    mediaEspecialidadesPorFuncionario: number
  }> {
    const [funcionarios, services, assignments] = await Promise.all([
      this.getFuncionarios(),
      this.getServices(),
      this.getAssignments()
    ])

    const barbeiros = funcionarios.filter(f => f.role === 'barber')
    const funcionariosComEspecialidades = new Set(assignments.map(a => a.funcionario_id))
    const servicosComFuncionarios = new Set(assignments.map(a => a.service_id))

    return {
      totalFuncionarios: barbeiros.length,
      funcionariosComEspecialidades: barbeiros.filter(f => funcionariosComEspecialidades.has(f.id)).length,
      funcionariosSemEspecialidades: barbeiros.filter(f => !funcionariosComEspecialidades.has(f.id)).length,
      totalServicos: services.filter(s => s.ativo).length,
      servicosComFuncionarios: services.filter(s => s.ativo && servicosComFuncionarios.has(s.id)).length,
      servicosSemFuncionarios: services.filter(s => s.ativo && !servicosComFuncionarios.has(s.id)).length,
      especialidadesTotal: assignments.length,
      mediaEspecialidadesPorFuncionario: barbeiros.length > 0 ? assignments.length / barbeiros.length : 0
    }
  }

  // Métodos auxiliares privados
  private static async getFuncionarios(): Promise<Array<{id: string, nome: string, role: string}>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .in('role', ['admin', 'barber'])

    if (error) throw error
    return data || []
  }

  private static async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')

    if (error) throw error
    return data || []
  }

  private static async getAssignments(): Promise<Array<{funcionario_id: string, service_id: string}>> {
    const { data, error } = await supabase
      .from('funcionario_servicos')
      .select('funcionario_id, service_id')

    if (error) throw error
    return data || []
  }
}

/**
 * Hook para usar o validador de especialidades
 */
export function useEspecialidadesValidator() {
  const validateAll = async () => {
    return await EspecialidadesValidator.validateAll()
  }

  const applyAutoFixes = async (suggestions: ValidationSuggestion[]) => {
    return await EspecialidadesValidator.applyAutoFixes(suggestions)
  }

  const generateReport = async () => {
    return await EspecialidadesValidator.generateReport()
  }

  return {
    validateAll,
    applyAutoFixes,
    generateReport
  }
}