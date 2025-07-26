/**
 * Testes para o QueryOptimizer
 */

import { QueryOptimizer } from '../query-optimizer'
import { cacheManager } from '../cache-manager'

// Mock do Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: '1', name: 'Test' }, 
          error: null 
        })),
        order: jest.fn(() => Promise.resolve({ 
          data: [{ id: '1' }], 
          error: null 
        }))
      })),
      in: jest.fn(() => Promise.resolve({ 
        data: [{ id: '1' }], 
        error: null 
      }))
    }))
  }))
}

describe('QueryOptimizer', () => {
  let queryOptimizer: QueryOptimizer

  beforeEach(() => {
    queryOptimizer = new QueryOptimizer(mockSupabaseClient as any)
    cacheManager.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    cacheManager.clear()
  })

  describe('Query básica com cache', () => {
    test('deve executar query e armazenar no cache', async () => {
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      const result = await queryOptimizer.query(
        'profiles',
        queryBuilder,
        { cache: true }
      )

      expect(result).toEqual({ id: '1', name: 'Test' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    test('deve usar cache em segunda chamada', async () => {
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      // Primeira chamada
      await queryOptimizer.query('profiles', queryBuilder, { cache: true })
      
      // Segunda chamada deve usar cache
      const result = await queryOptimizer.query('profiles', queryBuilder, { cache: true })

      expect(result).toEqual({ id: '1', name: 'Test' })
      // Supabase deve ter sido chamado apenas uma vez
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
    })

    test('deve pular cache quando cache=false', async () => {
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      // Primeira chamada
      await queryOptimizer.query('profiles', queryBuilder, { cache: false })
      
      // Segunda chamada não deve usar cache
      await queryOptimizer.query('profiles', queryBuilder, { cache: false })

      // Supabase deve ter sido chamado duas vezes
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
    })
  })

  describe('Tratamento de erros', () => {
    test('deve lidar com erros de query', async () => {
      const errorClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: new Error('Database error') 
              }))
            }))
          }))
        }))
      }

      const errorOptimizer = new QueryOptimizer(errorClient as any)
      
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      await expect(
        errorOptimizer.query('profiles', queryBuilder)
      ).rejects.toThrow('Database error')
    })

    test('deve fazer retry em caso de erro', async () => {
      let callCount = 0
      const flakyClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => {
                callCount++
                if (callCount === 1) {
                  return Promise.resolve({ 
                    data: null, 
                    error: new Error('Temporary error') 
                  })
                }
                return Promise.resolve({ 
                  data: { id: '1', name: 'Test' }, 
                  error: null 
                })
              })
            }))
          }))
        }))
      }

      const flakyOptimizer = new QueryOptimizer(flakyClient as any)
      
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      const result = await flakyOptimizer.query(
        'profiles', 
        queryBuilder, 
        { retries: 1 }
      )

      expect(result).toEqual({ id: '1', name: 'Test' })
      expect(callCount).toBe(2)
    })
  })

  describe('Queries específicas para autenticação', () => {
    test('getUserProfile deve usar cache', async () => {
      const result = await queryOptimizer.getUserProfile('user-123')
      
      expect(result).toEqual({ id: '1', name: 'Test' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    test('getUserWithProfile deve fazer query otimizada', async () => {
      const result = await queryOptimizer.getUserWithProfile('user-123')
      
      expect(result).toEqual({ id: '1', name: 'Test' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    test('getActiveUserSessions deve retornar sessões ativas', async () => {
      // Mock para retornar array
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: [{ id: '1', is_active: true }], 
                error: null 
              }))
            }))
          }))
        }))
      })

      const result = await queryOptimizer.getActiveUserSessions('user-123')
      
      expect(result).toEqual([{ id: '1', is_active: true }])
    })

    test('getUserPermissions deve retornar array de permissões', async () => {
      // Mock para retornar permissões
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            data: [
              { permission: 'read' },
              { permission: 'write' }
            ], 
            error: null 
          }))
        }))
      })

      const result = await queryOptimizer.getUserPermissions('user-123')
      
      expect(result).toEqual(['read', 'write'])
    })
  })

  describe('Batch queries', () => {
    test('batchUserData deve executar queries em paralelo', async () => {
      // Mock diferentes retornos para diferentes queries
      let callCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        callCount++
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => {
              if (table === 'profiles') {
                return {
                  single: jest.fn(() => Promise.resolve({ 
                    data: { id: 'profile-1' }, 
                    error: null 
                  }))
                }
              } else if (table === 'user_sessions') {
                return {
                  eq: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({ 
                      data: [{ id: 'session-1' }], 
                      error: null 
                    }))
                  }))
                }
              } else if (table === 'user_permissions') {
                return Promise.resolve({ 
                  data: [{ permission: 'read' }], 
                  error: null 
                })
              }
              return Promise.resolve({ data: null, error: null })
            })
          }))
        }
      })

      const result = await queryOptimizer.batchUserData('user-123')
      
      expect(result).toHaveProperty('profile')
      expect(result).toHaveProperty('sessions')
      expect(result).toHaveProperty('permissions')
    })

    test('batchUserData deve usar cache em segunda chamada', async () => {
      // Primeira chamada
      await queryOptimizer.batchUserData('user-123')
      
      // Limpar mock calls
      jest.clearAllMocks()
      
      // Segunda chamada deve usar cache
      const result = await queryOptimizer.batchUserData('user-123')
      
      expect(result).toBeDefined()
      // Não deve ter feito novas chamadas ao Supabase
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('Invalidação de cache', () => {
    test('invalidateUserCache deve limpar cache do usuário', async () => {
      const userId = 'user-123'
      
      // Fazer algumas queries para popular o cache
      await queryOptimizer.getUserProfile(userId)
      
      // Verificar que está no cache
      const cachedProfile = cacheManager.getProfile(userId)
      expect(cachedProfile).toBeDefined()
      
      // Invalidar cache
      queryOptimizer.invalidateUserCache(userId)
      
      // Cache deve estar limpo
      const clearedProfile = cacheManager.getProfile(userId)
      expect(clearedProfile).toBeNull()
    })
  })

  describe('Warmup de queries', () => {
    test('warmupQueries deve pre-carregar dados frequentes', async () => {
      await queryOptimizer.warmupQueries('user-123')
      
      // Deve ter feito chamadas para carregar dados
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('Queries otimizadas', () => {
    test('optimizedSelect deve aplicar filtros corretamente', async () => {
      const filters = { user_id: 'user-123', active: true }
      
      await queryOptimizer.optimizedSelect(
        'profiles',
        '*',
        filters
      )
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    test('optimizedCount deve retornar contagem', async () => {
      // Mock para count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            count: 5, 
            error: null 
          }))
        }))
      })

      const count = await queryOptimizer.optimizedCount('profiles', { active: true })
      
      expect(count).toBe(5)
    })
  })

  describe('Estatísticas', () => {
    test('deve rastrear estatísticas de queries', async () => {
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      await queryOptimizer.query('profiles', queryBuilder)
      
      const stats = queryOptimizer.getStats()
      
      expect(stats.totalQueries).toBeGreaterThan(0)
      expect(stats.avgResponseTime).toBeGreaterThanOrEqual(0)
    })

    test('deve calcular cache hit rate', async () => {
      const queryBuilder = (client: any) => 
        client.from('profiles').select('*').eq('user_id', '123').single()

      // Primeira query (miss)
      await queryOptimizer.query('profiles', queryBuilder, { cache: true })
      
      // Segunda query (hit)
      await queryOptimizer.query('profiles', queryBuilder, { cache: true })
      
      const stats = queryOptimizer.getStats()
      
      expect(stats.cacheHitRate).toBeGreaterThan(0)
    })
  })
})