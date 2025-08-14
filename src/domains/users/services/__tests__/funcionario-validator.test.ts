/**
 * Testes para o FuncionarioValidator
 */

import { FuncionarioValidator } from '../funcionario-validator'
import { supabase } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          neq: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        in: jest.fn(() => ({
          single: jest.fn()
        })),
        gte: jest.fn(() => ({
          neq: jest.fn()
        })),
        lt: jest.fn()
      }))
    }))
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('FuncionarioValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateCreate', () => {
    it('deve validar dados válidos para criação', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Não encontrado
            })
          })
        })
      } as any)

      const validData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '(11) 99999-9999',
        role: 'barber' as const,
        especialidades: []
      }

      const result = await FuncionarioValidator.validateCreate(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar nome inválido', async () => {
      const invalidData = {
        nome: 'J', // Muito curto
        email: 'joao@teste.com',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'nome',
          code: 'NOME_REQUIRED'
        })
      )
    })

    it('deve rejeitar nome sem sobrenome', async () => {
      const invalidData = {
        nome: 'João',
        email: 'joao@teste.com',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'nome',
          code: 'NOME_INCOMPLETE'
        })
      )
    })

    it('deve rejeitar email inválido', async () => {
      const invalidData = {
        nome: 'João Silva',
        email: 'email-invalido',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          code: 'EMAIL_INVALID'
        })
      )
    })

    it('deve rejeitar email já existente', async () => {
      // Mock para email existente
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-id' },
              error: null
            })
          })
        })
      } as any)

      const invalidData = {
        nome: 'João Silva',
        email: 'existente@teste.com',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          code: 'EMAIL_ALREADY_EXISTS'
        })
      )
    })

    it('deve rejeitar telefone inválido', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const invalidData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '123', // Muito curto
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'telefone',
          code: 'TELEFONE_INVALID_LENGTH'
        })
      )
    })

    it('deve aceitar telefones brasileiros válidos', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const telefonesValidos = [
        '(11) 99999-9999',
        '11999999999',
        '+55 11 99999-9999',
        '(11) 9999-9999',
        '11 99999 9999'
      ]

      for (const telefone of telefonesValidos) {
        const validData = {
          nome: 'João Silva',
          email: `joao${Math.random()}@teste.com`,
          telefone,
          role: 'barber' as const
        }

        const result = await FuncionarioValidator.validateCreate(validData)
        
        const telefoneErrors = result.errors.filter(e => e.field === 'telefone')
        expect(telefoneErrors).toHaveLength(0)
      }
    })

    it('deve rejeitar role inválido', async () => {
      const invalidData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        role: 'invalid' as any
      }

      const result = await FuncionarioValidator.validateCreate(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'role',
          code: 'INVALID_ROLE'
        })
      )
    })

    it('deve avisar quando barbeiro não tem especialidades', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const validData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        role: 'barber' as const,
        especialidades: []
      }

      const result = await FuncionarioValidator.validateCreate(validData)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'especialidades',
          code: 'BARBER_NO_ESPECIALIDADES'
        })
      )
    })

    it('deve avisar quando admin tem especialidades', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const validData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        role: 'admin' as const,
        especialidades: ['service-1']
      }

      const result = await FuncionarioValidator.validateCreate(validData)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'especialidades',
          code: 'ADMIN_WITH_ESPECIALIDADES'
        })
      )
    })

    it('deve sanitizar dados de entrada', async () => {
      // Mock para email único
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const dataWithSpaces = {
        nome: '  João Silva  ',
        email: '  JOAO@TESTE.COM  ',
        telefone: '  (11) 99999-9999  ',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(dataWithSpaces)

      expect(result.isValid).toBe(true)
      // Os dados devem ter sido sanitizados internamente
    })
  })

  describe('validateUpdate', () => {
    it('deve validar atualização válida', async () => {
      // Mock para funcionário existente
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'func-1', role: 'barber' },
              error: null
            }),
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      } as any)

      const validUpdate = {
        id: 'func-1',
        nome: 'João Silva Santos',
        telefone: '(11) 88888-8888'
      }

      const result = await FuncionarioValidator.validateUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar funcionário inexistente', async () => {
      // Mock para funcionário não encontrado
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      } as any)

      const invalidUpdate = {
        id: 'func-inexistente',
        nome: 'João Silva'
      }

      const result = await FuncionarioValidator.validateUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'id',
          code: 'FUNCIONARIO_NOT_FOUND'
        })
      )
    })
  })

  describe('validateDelete', () => {
    it('deve permitir deleção válida', async () => {
      // Mock para funcionário existente
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'func-1' },
              error: null
            })
          })
        })
      } as any)

      // Mock para sem agendamentos futuros
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      } as any)

      // Mock para não é último admin (role barber)
      const validDelete = {
        id: 'func-1',
        nome: 'João Silva',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateDelete(validDelete)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar deleção com agendamentos futuros', async () => {
      // Mock para funcionário existente
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'func-1' },
              error: null
            })
          })
        })
      } as any)

      // Mock para agendamentos futuros
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [{ id: 'apt-1' }, { id: 'apt-2' }],
                error: null
              })
            })
          })
        })
      } as any)

      const invalidDelete = {
        id: 'func-1',
        nome: 'João Silva',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateDelete(invalidDelete)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'agendamentos',
          code: 'HAS_FUTURE_APPOINTMENTS'
        })
      )
    })
  })

  describe('Validações de segurança', () => {
    it('deve detectar tentativas de XSS no nome', async () => {
      const maliciousData = {
        nome: 'João <script>alert("xss")</script>',
        email: 'joao@teste.com',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(maliciousData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'nome',
          code: 'NOME_INVALID_CHARS'
        })
      )
    })

    it('deve detectar tentativas de XSS no email', async () => {
      const maliciousData = {
        nome: 'João Silva',
        email: 'javascript:alert("xss")@teste.com',
        role: 'barber' as const
      }

      const result = await FuncionarioValidator.validateCreate(maliciousData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          code: 'EMAIL_INVALID_CHARS'
        })
      )
    })
  })
})