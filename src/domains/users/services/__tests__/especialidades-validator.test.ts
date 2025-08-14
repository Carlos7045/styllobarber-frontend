/**
 * Testes para o validador de especialidades
 */

import { EspecialidadesValidator } from '../especialidades-validator'
import { supabase } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('EspecialidadesValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateAll', () => {
    it('should detect orphaned assignments', async () => {
      // Mock data
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: true },
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
        { funcionario_id: 'func-1', service_id: 'service-inexistente' }, // Órfão
      ]

      // Mock Supabase calls
      const mockSelect = jest.fn()
      const mockIn = jest.fn()

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: mockSelect.mockReturnValue({
              in: mockIn.mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: mockSelect.mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: mockSelect.mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: mockSelect }
      })

      const result = await EspecialidadesValidator.validateAll()

      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('missing_service')
      expect(result.issues[0].severity).toBe('error')
      expect(result.suggestions).toHaveLength(1)
    })

    it('should detect inactive service assignments', async () => {
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: false }, // Desativado
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: jest.fn() }
      })

      const result = await EspecialidadesValidator.validateAll()

      expect(result.issues.some(i => i.type === 'inactive_service')).toBe(true)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should detect unassigned services', async () => {
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: true },
        { id: 'service-2', nome: 'Barba', ativo: true }, // Sem funcionário
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: jest.fn() }
      })

      const result = await EspecialidadesValidator.validateAll()

      expect(result.issues.some(i => i.type === 'orphaned_assignment' && i.serviceName === 'Barba')).toBe(true)
    })

    it('should detect funcionarios without especialidades', async () => {
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
        { id: 'func-2', nome: 'Pedro Santos', role: 'barber' }, // Sem especialidades
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: true },
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: jest.fn() }
      })

      const result = await EspecialidadesValidator.validateAll()

      expect(result.issues.some(i => 
        i.type === 'missing_service' && 
        i.funcionarioNome === 'Pedro Santos'
      )).toBe(true)
    })

    it('should return valid when no issues found', async () => {
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: true },
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: jest.fn() }
      })

      const result = await EspecialidadesValidator.validateAll()

      expect(result.isValid).toBe(true)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('generateReport', () => {
    it('should generate correct statistics', async () => {
      const mockFuncionarios = [
        { id: 'func-1', nome: 'João Silva', role: 'barber' },
        { id: 'func-2', nome: 'Pedro Santos', role: 'barber' },
        { id: 'admin-1', nome: 'Admin', role: 'admin' },
      ]

      const mockServices = [
        { id: 'service-1', nome: 'Corte', ativo: true },
        { id: 'service-2', nome: 'Barba', ativo: true },
        { id: 'service-3', nome: 'Desativado', ativo: false },
      ]

      const mockAssignments = [
        { funcionario_id: 'func-1', service_id: 'service-1' },
        { funcionario_id: 'func-1', service_id: 'service-2' },
      ]

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockFuncionarios,
                error: null,
              }),
            }),
          }
        }
        if (table === 'services') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }
        }
        if (table === 'funcionario_servicos') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          }
        }
        return { select: jest.fn() }
      })

      const report = await EspecialidadesValidator.generateReport()

      expect(report.totalFuncionarios).toBe(2) // Apenas barbeiros
      expect(report.funcionariosComEspecialidades).toBe(1) // Apenas func-1
      expect(report.funcionariosSemEspecialidades).toBe(1) // func-2
      expect(report.totalServicos).toBe(2) // Apenas ativos
      expect(report.servicosComFuncionarios).toBe(2) // service-1 e service-2
      expect(report.servicosSemFuncionarios).toBe(0)
      expect(report.especialidadesTotal).toBe(2)
      expect(report.mediaEspecialidadesPorFuncionario).toBe(1) // 2 especialidades / 2 barbeiros
    })
  })

  describe('applyAutoFixes', () => {
    it('should apply fixes successfully', async () => {
      const mockSuggestions = [
        {
          type: 'remove_assignment' as const,
          description: 'Remover especialidade órfã',
          action: jest.fn().mockResolvedValue(true),
        },
        {
          type: 'remove_assignment' as const,
          description: 'Remover especialidade inativa',
          action: jest.fn().mockResolvedValue(false),
        },
      ]

      const result = await EspecialidadesValidator.applyAutoFixes(mockSuggestions)

      expect(result.applied).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(mockSuggestions[0].action).toHaveBeenCalled()
      expect(mockSuggestions[1].action).toHaveBeenCalled()
    })

    it('should handle errors in fixes', async () => {
      const mockSuggestions = [
        {
          type: 'remove_assignment' as const,
          description: 'Correção com erro',
          action: jest.fn().mockRejectedValue(new Error('Erro de teste')),
        },
      ]

      const result = await EspecialidadesValidator.applyAutoFixes(mockSuggestions)

      expect(result.applied).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Erro de teste')
    })
  })
})