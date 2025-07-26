/**
 * Testes para o CacheManager
 */

import { CacheManager } from '../cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = new CacheManager()
  })

  afterEach(() => {
    cacheManager.clear()
    cacheManager.stopCleanup()
  })

  describe('Operações básicas', () => {
    test('deve armazenar e recuperar dados', () => {
      const testData = { id: '1', name: 'Test' }
      
      cacheManager.set('test-key', testData)
      const retrieved = cacheManager.get('test-key')
      
      expect(retrieved).toEqual(testData)
    })

    test('deve retornar null para chave inexistente', () => {
      const result = cacheManager.get('non-existent-key')
      expect(result).toBeNull()
    })

    test('deve deletar item específico', () => {
      cacheManager.set('test-key', 'test-value')
      
      const deleted = cacheManager.delete('test-key')
      const retrieved = cacheManager.get('test-key')
      
      expect(deleted).toBe(true)
      expect(retrieved).toBeNull()
    })

    test('deve limpar todo o cache', () => {
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      
      cacheManager.clear()
      
      expect(cacheManager.get('key1')).toBeNull()
      expect(cacheManager.get('key2')).toBeNull()
    })
  })

  describe('TTL (Time To Live)', () => {
    test('deve expirar item após TTL', async () => {
      const shortTTL = 100 // 100ms
      
      cacheManager.set('test-key', 'test-value', shortTTL)
      
      // Deve estar disponível imediatamente
      expect(cacheManager.get('test-key')).toBe('test-value')
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Deve ter expirado
      expect(cacheManager.get('test-key')).toBeNull()
    })

    test('deve usar TTL padrão quando não especificado', () => {
      cacheManager.set('test-key', 'test-value')
      
      const info = cacheManager.getInfo()
      const entry = info.entries.find(e => e.key === 'test-key')
      
      expect(entry).toBeDefined()
      expect(entry!.ttl).toBeGreaterThan(0)
    })
  })

  describe('Invalidação por padrão', () => {
    test('deve invalidar chaves que correspondem ao padrão', () => {
      cacheManager.set('user:123:profile', { id: '123' })
      cacheManager.set('user:123:session', { token: 'abc' })
      cacheManager.set('user:456:profile', { id: '456' })
      
      const removed = cacheManager.invalidatePattern('user:123:.*')
      
      expect(removed).toBe(2)
      expect(cacheManager.get('user:123:profile')).toBeNull()
      expect(cacheManager.get('user:123:session')).toBeNull()
      expect(cacheManager.get('user:456:profile')).not.toBeNull()
    })
  })

  describe('Métodos específicos para sessão', () => {
    test('deve gerenciar cache de sessão', () => {
      const userId = 'user-123'
      const sessionData = { token: 'abc123', expires: Date.now() + 3600000 }
      
      cacheManager.setSession(userId, sessionData)
      const retrieved = cacheManager.getSession(userId)
      
      expect(retrieved).toEqual(sessionData)
      
      cacheManager.invalidateSession(userId)
      expect(cacheManager.getSession(userId)).toBeNull()
    })
  })

  describe('Métodos específicos para perfil', () => {
    test('deve gerenciar cache de perfil', () => {
      const userId = 'user-123'
      const profileData = {
        id: 'profile-123',
        user_id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'client' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
      
      cacheManager.setProfile(userId, profileData)
      const retrieved = cacheManager.getProfile(userId)
      
      expect(retrieved).toEqual(profileData)
      
      cacheManager.invalidateProfile(userId)
      expect(cacheManager.getProfile(userId)).toBeNull()
    })
  })

  describe('Métodos específicos para usuário', () => {
    test('deve gerenciar cache de usuário', () => {
      const userId = 'user-123'
      const userData = {
        id: userId,
        email: 'test@example.com',
        user_metadata: { role: 'client' }
      } as any
      
      cacheManager.setUser(userId, userData)
      const retrieved = cacheManager.getUser(userId)
      
      expect(retrieved).toEqual(userData)
    })

    test('deve invalidar usuário e dados relacionados', () => {
      const userId = 'user-123'
      
      cacheManager.setUser(userId, { id: userId } as any)
      cacheManager.setProfile(userId, { id: 'profile-123' } as any)
      cacheManager.setSession(userId, { token: 'abc' })
      
      cacheManager.invalidateUser(userId)
      
      expect(cacheManager.getUser(userId)).toBeNull()
      expect(cacheManager.getProfile(userId)).toBeNull()
      expect(cacheManager.getSession(userId)).toBeNull()
    })
  })

  describe('Estatísticas', () => {
    test('deve rastrear hits e misses', () => {
      cacheManager.set('test-key', 'test-value')
      
      // Hit
      cacheManager.get('test-key')
      
      // Miss
      cacheManager.get('non-existent-key')
      
      const stats = cacheManager.getStats()
      
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(50)
    })

    test('deve rastrear tamanho do cache', () => {
      expect(cacheManager.getStats().size).toBe(0)
      
      cacheManager.set('key1', 'value1')
      expect(cacheManager.getStats().size).toBe(1)
      
      cacheManager.set('key2', 'value2')
      expect(cacheManager.getStats().size).toBe(2)
      
      cacheManager.delete('key1')
      expect(cacheManager.getStats().size).toBe(1)
    })
  })

  describe('Informações detalhadas', () => {
    test('deve retornar informações detalhadas do cache', () => {
      cacheManager.set('test-key', 'test-value', 5000)
      
      const info = cacheManager.getInfo()
      
      expect(info.stats).toBeDefined()
      expect(info.entries).toHaveLength(1)
      expect(info.entries[0].key).toBe('test-key')
      expect(info.entries[0].ttl).toBe(5000)
      expect(info.entries[0].age).toBeGreaterThanOrEqual(0)
      expect(info.entries[0].remainingTtl).toBeLessThanOrEqual(5000)
    })
  })

  describe('Warmup', () => {
    test('deve aquecer cache com dados do usuário', async () => {
      const userId = 'user-123'
      const userData = {
        user: { id: userId, email: 'test@example.com' } as any,
        profile: { id: 'profile-123', user_id: userId } as any,
        permissions: ['read', 'write']
      }
      
      await cacheManager.warmup(userId, userData)
      
      expect(cacheManager.getUser(userId)).toEqual(userData.user)
      expect(cacheManager.getProfile(userId)).toEqual(userData.profile)
      expect(cacheManager.getPermissions(userId)).toEqual(userData.permissions)
    })

    test('deve lidar com warmup sem dados', async () => {
      const userId = 'user-123'
      
      await expect(cacheManager.warmup(userId)).resolves.not.toThrow()
      
      expect(cacheManager.getUser(userId)).toBeNull()
    })
  })

  describe('Limpeza automática', () => {
    test('deve limpar itens expirados automaticamente', async () => {
      const shortTTL = 50
      
      cacheManager.set('expired-key', 'value', shortTTL)
      cacheManager.set('valid-key', 'value', 5000)
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Forçar limpeza (normalmente seria automática)
      const info = cacheManager.getInfo()
      
      // O item expirado deve ter sido removido ao tentar acessar
      expect(cacheManager.get('expired-key')).toBeNull()
      expect(cacheManager.get('valid-key')).toBe('value')
    })
  })
})