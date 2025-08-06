/**
 * Testes de integração para ProfileSync
 * Testa sincronização entre auth e database
 */

import { ProfileSync } from '../profile-sync'
import { supabase } from '../supabase'

// Mock do Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

describe('ProfileSync Integration Tests', () => {
  let profileSync: ProfileSync
  const mockSupabase = supabase as jest.Mocked<typeof supabase>

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      nome: 'João Silva',
      telefone: '11999999999'
    }
  }

  const mockProfile = {
    id: 'user-123',
    nome: 'João Silva',
    email: 'test@example.com',
    telefone: '11999999999',
    role: 'client' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    profileSync = ProfileSync.getInstance()
    jest.clearAllMocks()
    
    // Reset singleton
    ;(ProfileSync as any).instance = undefined
    profileSync = ProfileSync.getInstance()
  })

  describe('syncProfile', () => {
    it('deve sincronizar perfil quando auth e database estão alinhados', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database profile
      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(true)
      expect(result.profile).toEqual(mockProfile)
      expect(result.differences).toHaveLength(0)
    })

    it('deve detectar diferenças entre auth e database', async () => {
      // Auth com dados diferentes
      const authUserWithDifferences = {
        ...mockUser,
        user_metadata: {
          nome: 'João Santos', // Nome diferente
          telefone: '11888888888' // Telefone diferente
        }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: authUserWithDifferences },
        error: null
      })

      // Database com dados originais
      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(true)
      expect(result.differences).toContain('nome')
      expect(result.differences).toContain('telefone')
    })

    it('deve criar perfil quando não existe no database', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Database retorna erro (perfil não encontrado)
      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // Not found
          })
        })
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })

      mockFrom.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      })

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('deve lidar com erro quando usuário não existe no auth', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' }
      })

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Usuário não encontrado')
    })
  })

  describe('ensureProfileExists', () => {
    it('deve garantir que perfil existe, criando se necessário', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Primeiro, perfil não existe
      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          }).mockResolvedValueOnce({
            data: mockProfile,
            error: null
          })
        })
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })

      mockFrom.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      })

      const result = await profileSync.ensureProfileExists('user-123')

      expect(result).toEqual(mockProfile)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('deve retornar perfil existente sem criar novo', async () => {
      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await profileSync.ensureProfileExists('user-123')

      expect(result).toEqual(mockProfile)
    })
  })

  describe('recoverProfile', () => {
    it('deve recuperar perfil corrompido', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Simular perfil corrompido (sem campos obrigatórios)
      const corruptedProfile = {
        id: 'user-123',
        nome: null, // Campo obrigatório ausente
        email: 'test@example.com'
      }

      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: corruptedProfile,
            error: null
          })
        })
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      mockFrom.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      })

      const result = await profileSync.recoverProfile('user-123')

      expect(result).toEqual(mockProfile)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('deve retornar null quando não consegue recuperar', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' }
      })

      const result = await profileSync.recoverProfile('user-123')

      expect(result).toBeNull()
    })
  })

  describe('validateProfileIntegrity', () => {
    it('deve validar perfil íntegro', () => {
      const isValid = profileSync.validateProfileIntegrity(mockProfile)
      expect(isValid).toBe(true)
    })

    it('deve detectar perfil com campos obrigatórios ausentes', () => {
      const invalidProfile = {
        ...mockProfile,
        nome: null, // Campo obrigatório ausente
        email: undefined // Campo obrigatório ausente
      }

      const isValid = profileSync.validateProfileIntegrity(invalidProfile as any)
      expect(isValid).toBe(false)
    })

    it('deve detectar perfil com role inválido', () => {
      const invalidProfile = {
        ...mockProfile,
        role: 'invalid_role' as any
      }

      const isValid = profileSync.validateProfileIntegrity(invalidProfile)
      expect(isValid).toBe(false)
    })
  })

  describe('error scenarios', () => {
    it('deve lidar com erro de rede durante sincronização', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('deve lidar com erro de database durante criação de perfil', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      })

      mockFrom.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      })

      const result = await profileSync.syncProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('performance tests', () => {
    it('deve completar sincronização em tempo razoável', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
      mockFrom.mockReturnValue({ select: mockSelect })

      const startTime = Date.now()
      await profileSync.syncProfile('user-123')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Menos de 1 segundo
    })

    it('deve lidar com múltiplas sincronizações simultâneas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
      mockFrom.mockReturnValue({ select: mockSelect })

      // Executar 10 sincronizações simultâneas
      const promises = Array.from({ length: 10 }, (_, i) => 
        profileSync.syncProfile(`user-${i}`)
      )

      const results = await Promise.all(promises)

      expect(results.every(r => r.success)).toBe(true)
    })
  })
})
