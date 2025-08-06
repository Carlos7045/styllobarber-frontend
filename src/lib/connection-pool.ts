/**
 * Connection Pool para Supabase
 * Gerencia conexões de forma eficiente para melhorar performance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Interface para configuração do pool
interface PoolConfig {
  minConnections: number
  maxConnections: number
  acquireTimeout: number
  idleTimeout: number
  maxRetries: number
}

// Interface para conexão do pool
interface PoolConnection {
  id: string
  client: SupabaseClient
  inUse: boolean
  createdAt: number
  lastUsed: number
  usageCount: number
}

// Interface para estatísticas do pool
interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  totalAcquired: number
  totalReleased: number
  totalCreated: number
  totalDestroyed: number
  avgUsagePerConnection: number
}

// Configuração padrão
const DEFAULT_CONFIG: PoolConfig = {
  minConnections: 2,
  maxConnections: 10,
  acquireTimeout: 5000, // 5 segundos
  idleTimeout: 30000,   // 30 segundos
  maxRetries: 3
}

class ConnectionPool {
  private config: PoolConfig
  private connections: Map<string, PoolConnection> = new Map()
  private waitingQueue: Array<{
    resolve: (connection: PoolConnection) => void
    reject: (error: Error) => void
    timestamp: number
  }> = []
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0,
    avgUsagePerConnection: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private initialized = false

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    console.log('🏊 ConnectionPool criado com configuração:', this.config)
  }

  /**
   * Inicializar o pool
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🚀 Inicializando ConnectionPool...')

    // Criar conexões mínimas
    for (let i = 0; i < this.config.minConnections; i++) {
      await this.createConnection()
    }

    // Iniciar limpeza automática
    this.startCleanupTimer()

    this.initialized = true
    console.log(`✅ ConnectionPool inicializado com ${this.connections.size} conexões`)
  }

  /**
   * Criar nova conexão
   */
  private async createConnection(): Promise<PoolConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false, // Não persistir sessão em conexões do pool
          autoRefreshToken: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10 // Limitar eventos em tempo real
          }
        }
      }
    )

    const connection: PoolConnection = {
      id,
      client,
      inUse: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0
    }

    this.connections.set(id, connection)
    this.stats.totalCreated++
    this.updateStats()

    console.log(`🔗 Nova conexão criada: ${id}`)
    return connection
  }

  /**
   * Destruir conexão
   */
  private async destroyConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Não destruir conexões em uso
    if (connection.inUse) {
      console.warn(`⚠️ Tentativa de destruir conexão em uso: ${connectionId}`)
      return
    }

    this.connections.delete(connectionId)
    this.stats.totalDestroyed++
    this.updateStats()

    console.log(`💥 Conexão destruída: ${connectionId}`)
  }

  /**
   * Adquirir conexão do pool
   */
  async acquire(): Promise<PoolConnection> {
    if (!this.initialized) {
      await this.initialize()
    }

    this.stats.totalAcquired++

    // Procurar conexão idle
    for (const connection of this.connections.values()) {
      if (!connection.inUse) {
        connection.inUse = true
        connection.lastUsed = Date.now()
        connection.usageCount++
        this.updateStats()
        
        console.log(`📤 Conexão adquirida: ${connection.id}`)
        return connection
      }
    }

    // Se não há conexões idle, criar nova se possível
    if (this.connections.size < this.config.maxConnections) {
      const connection = await this.createConnection()
      connection.inUse = true
      connection.usageCount++
      this.updateStats()
      
      console.log(`📤 Nova conexão criada e adquirida: ${connection.id}`)
      return connection
    }

    // Se chegou ao limite, aguardar na fila
    console.log('⏳ Pool cheio, aguardando na fila...')
    return this.waitForConnection()
  }

  /**
   * Aguardar conexão disponível
   */
  private async waitForConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      const request = {
        resolve,
        reject,
        timestamp: Date.now()
      }

      this.waitingQueue.push(request)
      this.stats.waitingRequests = this.waitingQueue.length
      this.updateStats()

      // Timeout para requisição
      setTimeout(() => {
        const index = this.waitingQueue.indexOf(request)
        if (index !== -1) {
          this.waitingQueue.splice(index, 1)
          this.stats.waitingRequests = this.waitingQueue.length
          this.updateStats()
          reject(new Error('Connection acquire timeout'))
        }
      }, this.config.acquireTimeout)
    })
  }

  /**
   * Liberar conexão de volta ao pool
   */
  release(connection: PoolConnection): void {
    if (!this.connections.has(connection.id)) {
      console.warn(`⚠️ Tentativa de liberar conexão inexistente: ${connection.id}`)
      return
    }

    connection.inUse = false
    connection.lastUsed = Date.now()
    this.stats.totalReleased++
    this.updateStats()

    console.log(`📥 Conexão liberada: ${connection.id}`)

    // Processar fila de espera
    if (this.waitingQueue.length > 0) {
      const request = this.waitingQueue.shift()!
      connection.inUse = true
      connection.usageCount++
      this.stats.waitingRequests = this.waitingQueue.length
      this.updateStats()
      
      console.log(`📤 Conexão da fila adquirida: ${connection.id}`)
      request.resolve(connection)
    }
  }

  /**
   * Executar operação com conexão do pool
   */
  async withConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const connection = await this.acquire()
    
    try {
      const result = await operation(connection.client)
      return result
    } finally {
      this.release(connection)
    }
  }

  /**
   * Iniciar timer de limpeza
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 10000) // Limpeza a cada 10 segundos
  }

  /**
   * Parar timer de limpeza
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Limpeza de conexões idle
   */
  private async cleanup(): Promise<void> {
    const now = Date.now()
    const connectionsToDestroy: string[] = []

    for (const [id, connection] of this.connections.entries()) {
      // Não limpar conexões em uso
      if (connection.inUse) continue

      // Verificar se está idle há muito tempo
      const idleTime = now - connection.lastUsed
      if (idleTime > this.config.idleTimeout) {
        // Manter pelo menos o mínimo de conexões
        if (this.connections.size > this.config.minConnections) {
          connectionsToDestroy.push(id)
        }
      }
    }

    // Destruir conexões idle
    for (const id of connectionsToDestroy) {
      await this.destroyConnection(id)
    }

    if (connectionsToDestroy.length > 0) {
      console.log(`🧹 Limpeza: ${connectionsToDestroy.length} conexões idle removidas`)
    }
  }

  /**
   * Atualizar estatísticas
   */
  private updateStats(): void {
    this.stats.totalConnections = this.connections.size
    this.stats.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.inUse).length
    this.stats.idleConnections = this.stats.totalConnections - this.stats.activeConnections

    // Calcular uso médio por conexão
    const totalUsage = Array.from(this.connections.values())
      .reduce((sum, conn) => sum + conn.usageCount, 0)
    this.stats.avgUsagePerConnection = this.stats.totalConnections > 0 
      ? totalUsage / this.stats.totalConnections 
      : 0
  }

  /**
   * Obter estatísticas do pool
   */
  getStats(): PoolStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Obter informações detalhadas
   */
  getInfo(): {
    config: PoolConfig
    stats: PoolStats
    connections: Array<{
      id: string
      inUse: boolean
      age: number
      idleTime: number
      usageCount: number
    }>
  } {
    const now = Date.now()
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      inUse: conn.inUse,
      age: now - conn.createdAt,
      idleTime: now - conn.lastUsed,
      usageCount: conn.usageCount
    }))

    return {
      config: this.config,
      stats: this.getStats(),
      connections
    }
  }

  /**
   * Destruir pool
   */
  async destroy(): Promise<void> {
    console.log('💥 Destruindo ConnectionPool...')

    this.stopCleanupTimer()

    // Aguardar conexões ativas terminarem (com timeout)
    const maxWait = 5000 // 5 segundos
    const startTime = Date.now()

    while (this.stats.activeConnections > 0 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
      this.updateStats()
    }

    // Destruir todas as conexões
    const connectionIds = Array.from(this.connections.keys())
    for (const id of connectionIds) {
      await this.destroyConnection(id)
    }

    // Rejeitar requisições pendentes
    this.waitingQueue.forEach(request => {
      request.reject(new Error('Connection pool destroyed'))
    })
    this.waitingQueue.length = 0

    this.initialized = false
    console.log('✅ ConnectionPool destruído')
  }
}

// Instância singleton
export const connectionPool = new ConnectionPool()

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  connectionPool.initialize().catch(console.error)
  
  // Destruir pool quando a página é fechada
  window.addEventListener('beforeunload', () => {
    connectionPool.destroy().catch(console.error)
  })
}

export default connectionPool
