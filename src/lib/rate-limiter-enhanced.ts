/**
 * Sistema de Rate Limiting Avançado
 * Implementa múltiplas estratégias de rate limiting para segurança
 */

import { securityLogger } from '@/lib/security-logger'

// Interface para configuração de rate limit
interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requests na janela
  skipSuccessfulRequests?: boolean // Pular requests bem-sucedidos
  skipFailedRequests?: boolean // Pular requests que falharam
  keyGenerator?: (identifier: string) => string // Gerador de chave customizado
  onLimitReached?: (identifier: string, info: RateLimitInfo) => void // Callback quando limite é atingido
}

// Interface para informações de rate limit
interface RateLimitInfo {
  identifier: string
  requests: number
  windowStart: number
  windowEnd: number
  resetTime: number
  isBlocked: boolean
}

// Interface para resultado de verificação
interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
  retryAfter?: number
}

// Configurações predefinidas
const RATE_LIMIT_CONFIGS = {
  // Login: 5 tentativas por 15 minutos
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    skipSuccessfulRequests: true
  },
  
  // Signup: 3 cadastros por hora
  signup: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    skipSuccessfulRequests: true
  },
  
  // Password recovery: 3 tentativas por hora
  passwordRecovery: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    skipSuccessfulRequests: true
  },
  
  // API geral: 100 requests por minuto
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100
  },
  
  // Strict: Para ações sensíveis - 1 por minuto
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 1
  }
}

class RateLimiterEnhanced {
  private store = new Map<string, Array<{ timestamp: number; success?: boolean }>>()
  private blockedUntil = new Map<string, number>()
  private configs = new Map<string, RateLimitConfig>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Registrar configurações padrão
    Object.entries(RATE_LIMIT_CONFIGS).forEach(([name, config]) => {
      this.registerConfig(name, config)
    })

    // Iniciar limpeza automática
    this.startCleanup()
    console.log('🛡️ RateLimiterEnhanced inicializado')
  }

  /**
   * Registrar configuração de rate limit
   */
  registerConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config)
    console.log(`📝 Rate limit registrado: ${name}`)
  }

  /**
   * Gerar chave para o store
   */
  private generateKey(configName: string, identifier: string, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(identifier)
    }
    return `${configName}:${identifier}`
  }

  /**
   * Limpar registros expirados
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    // Limpar store
    for (const [key, requests] of this.store.entries()) {
      const configName = key.split(':')[0]
      const config = this.configs.get(configName)
      
      if (config) {
        const validRequests = requests.filter(
          req => now - req.timestamp < config.windowMs
        )
        
        if (validRequests.length === 0) {
          this.store.delete(key)
          cleaned++
        } else if (validRequests.length < requests.length) {
          this.store.set(key, validRequests)
        }
      }
    }

    // Limpar bloqueios expirados
    for (const [key, blockedUntil] of this.blockedUntil.entries()) {
      if (now > blockedUntil) {
        this.blockedUntil.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: ${cleaned} entradas removidas`)
    }
  }

  /**
   * Iniciar limpeza automática
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // Limpeza a cada 5 minutos
  }

  /**
   * Parar limpeza automática
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Verificar rate limit
   */
  check(configName: string, identifier: string): RateLimitResult {
    const config = this.configs.get(configName)
    if (!config) {
      console.warn(`⚠️ Configuração de rate limit não encontrada: ${configName}`)
      return {
        allowed: true,
        info: {
          identifier,
          requests: 0,
          windowStart: Date.now(),
          windowEnd: Date.now() + 60000,
          resetTime: Date.now() + 60000,
          isBlocked: false
        }
      }
    }

    const key = this.generateKey(configName, identifier, config)
    const now = Date.now()
    const windowStart = now - config.windowMs
    const windowEnd = now
    const resetTime = now + config.windowMs

    // Verificar se está bloqueado
    const blockedUntil = this.blockedUntil.get(key)
    if (blockedUntil && now < blockedUntil) {
      const info: RateLimitInfo = {
        identifier,
        requests: config.maxRequests,
        windowStart,
        windowEnd,
        resetTime: blockedUntil,
        isBlocked: true
      }

      return {
        allowed: false,
        info,
        retryAfter: Math.ceil((blockedUntil - now) / 1000)
      }
    }

    // Obter requests na janela atual
    const requests = this.store.get(key) || []
    const validRequests = requests.filter(req => req.timestamp > windowStart)

    const info: RateLimitInfo = {
      identifier,
      requests: validRequests.length,
      windowStart,
      windowEnd,
      resetTime,
      isBlocked: false
    }

    // Verificar se excedeu o limite
    if (validRequests.length >= config.maxRequests) {
      // Bloquear por um período adicional (dobrar a janela)
      const blockUntil = now + (config.windowMs * 2)
      this.blockedUntil.set(key, blockUntil)

      info.isBlocked = true
      info.resetTime = blockUntil

      // Log de segurança
      securityLogger.logSuspiciousActivity(`Rate limit exceeded for ${configName}`, identifier, undefined, {
        requests: validRequests.length,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        blockedUntil: blockUntil
      })

      // Callback personalizado
      if (config.onLimitReached) {
        config.onLimitReached(identifier, info)
      }

      return {
        allowed: false,
        info,
        retryAfter: Math.ceil((blockUntil - now) / 1000)
      }
    }

    return {
      allowed: true,
      info
    }
  }

  /**
   * Registrar tentativa
   */
  record(configName: string, identifier: string, success?: boolean): void {
    const config = this.configs.get(configName)
    if (!config) return

    // Verificar se deve pular este registro
    if (success && config.skipSuccessfulRequests) return
    if (!success && config.skipFailedRequests) return

    const key = this.generateKey(configName, identifier, config)
    const requests = this.store.get(key) || []
    
    requests.push({
      timestamp: Date.now(),
      success
    })

    this.store.set(key, requests)
  }

  /**
   * Resetar rate limit para um identificador
   */
  reset(configName: string, identifier: string): void {
    const config = this.configs.get(configName)
    if (!config) return

    const key = this.generateKey(configName, identifier, config)
    this.store.delete(key)
    this.blockedUntil.delete(key)

    console.log(`🔄 Rate limit resetado: ${key}`)
  }

  /**
   * Obter estatísticas
   */
  getStats(): {
    totalKeys: number
    blockedKeys: number
    configs: string[]
    topIdentifiers: Array<{ key: string; requests: number }>
  } {
    const now = Date.now()
    const blockedKeys = Array.from(this.blockedUntil.entries())
      .filter(([_, blockedUntil]) => now < blockedUntil)
      .length

    const topIdentifiers = Array.from(this.store.entries())
      .map(([key, requests]) => ({
        key,
        requests: requests.length
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)

    return {
      totalKeys: this.store.size,
      blockedKeys,
      configs: Array.from(this.configs.keys()),
      topIdentifiers
    }
  }

  /**
   * Verificar se identificador está bloqueado
   */
  isBlocked(configName: string, identifier: string): boolean {
    const config = this.configs.get(configName)
    if (!config) return false

    const key = this.generateKey(configName, identifier, config)
    const blockedUntil = this.blockedUntil.get(key)
    
    return blockedUntil ? Date.now() < blockedUntil : false
  }

  /**
   * Obter tempo restante de bloqueio
   */
  getBlockTimeRemaining(configName: string, identifier: string): number {
    const config = this.configs.get(configName)
    if (!config) return 0

    const key = this.generateKey(configName, identifier, config)
    const blockedUntil = this.blockedUntil.get(key)
    
    if (!blockedUntil) return 0
    
    const remaining = blockedUntil - Date.now()
    return Math.max(0, remaining)
  }

  /**
   * Middleware para Express/Next.js
   */
  middleware(configName: string, getIdentifier?: (req: any) => string) {
    return (req: any, res: any, next: any) => {
      const identifier = getIdentifier ? getIdentifier(req) : 
                        req.ip || req.connection.remoteAddress || 'unknown'

      const result = this.check(configName, identifier)

      if (!result.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          resetTime: result.info.resetTime
        })
        return
      }

      // Adicionar headers informativos
      res.set({
        'X-RateLimit-Limit': this.configs.get(configName)?.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.configs.get(configName)?.maxRequests! - result.info.requests).toString(),
        'X-RateLimit-Reset': new Date(result.info.resetTime).toISOString()
      })

      next()
    }
  }

  /**
   * Destruir rate limiter
   */
  destroy(): void {
    this.stopCleanup()
    this.store.clear()
    this.blockedUntil.clear()
    this.configs.clear()
    console.log('🛡️ RateLimiterEnhanced destruído')
  }
}

// Instância singleton
export const rateLimiterEnhanced = new RateLimiterEnhanced()

// Funções de conveniência
export const checkLoginRateLimit = (identifier: string) => 
  rateLimiterEnhanced.check('login', identifier)

export const recordLoginAttempt = (identifier: string, success: boolean) => 
  rateLimiterEnhanced.record('login', identifier, success)

export const checkSignupRateLimit = (identifier: string) => 
  rateLimiterEnhanced.check('signup', identifier)

export const recordSignupAttempt = (identifier: string, success: boolean) => 
  rateLimiterEnhanced.record('signup', identifier, success)

export const checkPasswordRecoveryRateLimit = (identifier: string) => 
  rateLimiterEnhanced.check('passwordRecovery', identifier)

export const recordPasswordRecoveryAttempt = (identifier: string, success: boolean) => 
  rateLimiterEnhanced.record('passwordRecovery', identifier, success)

// Limpar rate limiter quando a página é fechada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    rateLimiterEnhanced.destroy()
  })
}

export default rateLimiterEnhanced