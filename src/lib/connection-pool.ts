/**
 * Sistema de Connection Pooling para Supabase
 * Gerencia conexões de forma eficiente e monitora saúde
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js'

interface PoolConnection {
  id: string
  client: SupabaseClient
  isActive: boolean
  lastUsed: number
  createdAt: number
  errorCount: number
}

interface PoolConfig {
  minConnections: number
  maxConnections: number
  idleTimeout: number
  maxLifetime: number
  healthCheckInterval: number
  maxErrors: number
}

interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  totalRequests: number
  queuedRequests: number
  errors: number
  avgWaitTime: number
}

/**
 * Pool de Conexões para Supabase
 */
export class ConnectionPool {
  private connections: Map<string, PoolConnection> = new Map()
  private queue: Array<{
    resolve: (client: SupabaseClient) => void
    reject: (error: Error) => void
    timestamp: number
  }> = []
  
  private config: PoolConfig
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    totalRequests: 0,
    queuedRequests: 0,
    errors: 0,
    avgWaitTime: 0
  }
  
  private healthCheckTimer: NodeJS.Timeout | null = null
  private cleanupTimer: NodeJS.Timeout | null = null
  private waitTimes: number[] = []

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minConnections: 2,
      maxConnections: 10,
      idleTimeout: 30000, // 30 segundos
      maxLifetime: 3600000, // 1 hora
      healthCheckInterval: 60000, // 1 minuto
      maxErrors: 5,
      ...config
    }

    this.initialize()
  }

  /**
   * Inicializa o pool de conexões
   */
  private async initialize(): Promise<void> {
    try {
      // Criar conexões mínimas
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection()
      }

      // Iniciar timers de manutenção
      this.startHealthCheck()
      this.startCleanup()

      console.log('🏊 Connection pool inicializado', {
        config: this.config,
        initialConnections: this.connections.size
      })

    } catch (error) {
      console.error('❌ Erro ao inicializar connection pool', { error })
      throw error
    }
  }

  /**
   * Obtém uma conexão do pool
   */
  async getConnection(): Promise<SupabaseClient> {
    const startTime = Date.now()
    this.stats.totalRequests++

    return new Promise((resolve, reject) => {
      // Tentar obter conexão disponível
      const connection = this.getAvailableConnection()
      
      if (connection) {
        connection.isActive = true
        connection.lastUsed = Date.now()
        this.updateStats()
        
        const waitTime = Date.now() - startTime
        this.recordWaitTime(waitTime)
        
        console.log('🔗 Conexão obtida do pool', {
          connectionId: connection.id,
          waitTime
        })
        
        resolve(connection.client)
        return
      }

      // Se pode criar nova conexão
      if (this.connections.size < this.config.maxConnections) {
        this.createConnection()
          .then(connection => {
            connection.isActive = true
            connection.lastUsed = Date.now()
            this.updateStats()
            
            const waitTime = Date.now() - startTime
            this.recordWaitTime(waitTime)
            
            resolve(connection.client)
          })
          .catch(reject)
        return
      }

      // Adicionar à fila
      this.queue.push({
        resolve,
        reject,
        timestamp: startTime
      })
      
      this.stats.queuedRequests++
      
      console.log('⏳ Conexão adicionada à fila', {
        queueSize: this.queue.length
      })

      // Timeout para requisições na fila
      setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve)
        if (index !== -1) {
          this.queue.splice(index, 1)
          this.stats.queuedRequests--
          this.stats.errors++
          reject(new Error('Connection timeout'))
        }
      }, 10000) // 10 segundos timeout
    })
  }

  /**
   * Libera uma conexão de volta para o pool
   */
  releaseConnection(client: SupabaseClient): void {
    const connection = this.findConnectionByClient(client)
    
    if (!connection) {
      console.warn('⚠️ Tentativa de liberar conexão não encontrada')
      return
    }

    connection.isActive = false
    connection.lastUsed = Date.now()
    this.updateStats()

    console.log('🔓 Conexão liberada', {
      connectionId: connection.id
    })

    // Processar fila se houver requisições pendentes
    this.processQueue()
  }

  /**
   * Executa operação com conexão automática
   */
  async withConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection()
    
    try {
      const result = await operation(client)
      this.releaseConnection(client)
      return result
    } catch (error) {
      this.releaseConnection(client)
      
      // Incrementar contador de erros da conexão
      const connection = this.findConnectionByClient(client)
      if (connection) {
        connection.errorCount++
        
        // Remover conexão se muitos erros
        if (connection.errorCount >= this.config.maxErrors) {
          this.removeConnection(connection.id)
        }
      }
      
      this.stats.errors++
      throw error
    }
  }

  /**
   * Cria nova conexão
   */
  private async createConnection(): Promise<PoolConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false // Pool connections não persistem sessão
          }
        }
      )

      const connection: PoolConnection = {
        id,
        client,
        isActive: false,
        lastUsed: Date.now(),
        createdAt: Date.now(),
        errorCount: 0
      }

      this.connections.set(id, connection)
      this.stats.totalConnections++
      
      console.log('🆕 Nova conexão criada', {
        connectionId: id,
        totalConnections: this.connections.size
      })

      return connection

    } catch (error) {
      console.error('❌ Erro ao criar conexão', { error, connectionId: id })
      throw error
    }
  }

  /**
   * Obtém conexão disponível
   */
  private getAvailableConnection(): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        return connection
      }
    }
    return null
  }

  /**
   * Encontra conexão pelo client
   */
  private findConnectionByClient(client: SupabaseClient): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        return connection
      }
    }
    return null
  }

  /**
   * Remove conexão do pool
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      this.connections.delete(connectionId)
      this.stats.totalConnections--
      
      console.log('🗑️ Conexão removida', {
        connectionId,
        reason: 'max_errors_exceeded'
      })
    }
  }

  /**
   * Processa fila de requisições
   */
  private processQueue(): void {
    if (this.queue.length === 0) return

    const connection = this.getAvailableConnection()
    if (!connection) return

    const request = this.queue.shift()
    if (!request) return

    this.stats.queuedRequests--
    connection.isActive = true
    connection.lastUsed = Date.now()
    
    const waitTime = Date.now() - request.timestamp
    this.recordWaitTime(waitTime)
    
    console.log('✅ Requisição da fila processada', {
      connectionId: connection.id,
      waitTime,
      remainingQueue: this.queue.length
    })

    request.resolve(connection.client)
  }

  /**
   * Health check das conexões
   */
  private async healthCheck(): Promise<void> {
    const now = Date.now()
    const connectionsToRemove: string[] = []

    for (const [id, connection] of this.connections.entries()) {
      try {
        // Verificar se conexão expirou
        if (now - connection.createdAt > this.config.maxLifetime) {
          connectionsToRemove.push(id)
          continue
        }

        // Verificar se está idle há muito tempo
        if (!connection.isActive && 
            now - connection.lastUsed > this.config.idleTimeout) {
          // Manter conexões mínimas
          if (this.connections.size > this.config.minConnections) {
            connectionsToRemove.push(id)
            continue
          }
        }

        // Teste básico de conectividade
        if (!connection.isActive) {
          await connection.client.from('profiles').select('count').limit(1)
        }

      } catch (error) {
        console.warn('⚠️ Conexão falhou no health check', {
          connectionId: id,
          error
        })
        
        connection.errorCount++
        if (connection.errorCount >= this.config.maxErrors) {
          connectionsToRemove.push(id)
        }
      }
    }

    // Remover conexões problemáticas
    for (const id of connectionsToRemove) {
      this.removeConnection(id)
    }

    // Garantir conexões mínimas
    while (this.connections.size < this.config.minConnections) {
      try {
        await this.createConnection()
      } catch (error) {
        console.error('❌ Erro ao criar conexão mínima', { error })
        break
      }
    }

    this.updateStats()
  }

  /**
   * Inicia health check periódico
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.healthCheck().catch(error => {
        console.error('❌ Erro no health check', { error })
      })
    }, this.config.healthCheckInterval)
  }

  /**
   * Inicia limpeza periódica
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      // Limpar estatísticas antigas
      if (this.waitTimes.length > 1000) {
        this.waitTimes = this.waitTimes.slice(-100)
      }

      // Log de estatísticas
      console.log('📊 Estatísticas do connection pool', this.getStats())
    }, 5 * 60 * 1000) // A cada 5 minutos
  }

  /**
   * Registra tempo de espera
   */
  private recordWaitTime(waitTime: number): void {
    this.waitTimes.push(waitTime)
    
    if (this.waitTimes.length > 100) {
      this.waitTimes.shift()
    }

    this.stats.avgWaitTime = 
      this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    this.stats.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive).length
    
    this.stats.idleConnections = this.connections.size - this.stats.activeConnections
    this.stats.totalConnections = this.connections.size
  }

  /**
   * Retorna estatísticas do pool
   */
  getStats(): PoolStats & {
    config: PoolConfig
    healthStatus: 'healthy' | 'degraded' | 'critical'
  } {
    let healthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (this.stats.errors > 10 || this.stats.queuedRequests > 5) {
      healthStatus = 'degraded'
    }
    
    if (this.stats.errors > 50 || this.stats.queuedRequests > 20) {
      healthStatus = 'critical'
    }

    return {
      ...this.stats,
      config: this.config,
      healthStatus
    }
  }

  /**
   * Encerra o pool
   */
  async shutdown(): Promise<void> {
    // Parar timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // Rejeitar requisições pendentes
    for (const request of this.queue) {
      request.reject(new Error('Connection pool shutting down'))
    }
    this.queue.length = 0

    // Limpar conexões
    this.connections.clear()
    
    console.log('🔚 Connection pool encerrado')
  }
}

// Instância singleton
export const connectionPool = new ConnectionPool()

// Cleanup ao encerrar aplicação
if (typeof window === 'undefined') {
  process.on('SIGTERM', () => {
    connectionPool.shutdown()
  })

  process.on('SIGINT', () => {
    connectionPool.shutdown()
  })
}