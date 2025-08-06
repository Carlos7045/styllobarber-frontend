/**
 * Sistema de Rate Limiting para tentativas de login
 * Implementa controle de tentativas por IP e por email
 */

interface RateLimitEntry {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

class RateLimiter {
  private ipAttempts = new Map<string, RateLimitEntry>()
  private emailAttempts = new Map<string, RateLimitEntry>()
  
  private readonly config: RateLimitConfig = {
    maxAttempts: 5, // Máximo 5 tentativas
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    blockDurationMs: 30 * 60 * 1000, // Bloqueio por 30 minutos
  }

  /**
   * Verifica se um IP está bloqueado
   */
  isIpBlocked(ip: string): boolean {
    const entry = this.ipAttempts.get(ip)
    if (!entry) return false

    const now = Date.now()
    
    // Se está explicitamente bloqueado
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true
    }

    // Se passou do tempo de bloqueio, limpar entrada
    if (entry.blockedUntil && now >= entry.blockedUntil) {
      this.ipAttempts.delete(ip)
      return false
    }

    return false
  }

  /**
   * Verifica se um email está bloqueado
   */
  isEmailBlocked(email: string): boolean {
    const entry = this.emailAttempts.get(email.toLowerCase())
    if (!entry) return false

    const now = Date.now()
    
    // Se está explicitamente bloqueado
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true
    }

    // Se passou do tempo de bloqueio, limpar entrada
    if (entry.blockedUntil && now >= entry.blockedUntil) {
      this.emailAttempts.delete(email.toLowerCase())
      return false
    }

    return false
  }

  /**
   * Registra uma tentativa de login falhada
   */
  recordFailedAttempt(ip: string, email: string): void {
    const now = Date.now()

    // Registrar tentativa por IP
    this.recordAttempt(this.ipAttempts, ip, now)
    
    // Registrar tentativa por email
    this.recordAttempt(this.emailAttempts, email.toLowerCase(), now)
  }

  /**
   * Registra uma tentativa bem-sucedida (limpa contadores)
   */
  recordSuccessfulAttempt(ip: string, email: string): void {
    this.ipAttempts.delete(ip)
    this.emailAttempts.delete(email.toLowerCase())
  }

  /**
   * Obtém informações sobre tentativas restantes
   */
  getRemainingAttempts(ip: string, email: string): {
    ipAttempts: number
    emailAttempts: number
    ipBlocked: boolean
    emailBlocked: boolean
    ipBlockedUntil?: number
    emailBlockedUntil?: number
  } {
    const ipEntry = this.ipAttempts.get(ip)
    const emailEntry = this.emailAttempts.get(email.toLowerCase())

    return {
      ipAttempts: ipEntry ? Math.max(0, this.config.maxAttempts - ipEntry.attempts) : this.config.maxAttempts,
      emailAttempts: emailEntry ? Math.max(0, this.config.maxAttempts - emailEntry.attempts) : this.config.maxAttempts,
      ipBlocked: this.isIpBlocked(ip),
      emailBlocked: this.isEmailBlocked(email),
      ipBlockedUntil: ipEntry?.blockedUntil,
      emailBlockedUntil: emailEntry?.blockedUntil,
    }
  }

  /**
   * Obtém tempo restante de bloqueio em minutos
   */
  getBlockTimeRemaining(ip: string, email: string): {
    ipMinutes?: number
    emailMinutes?: number
  } {
    const now = Date.now()
    const ipEntry = this.ipAttempts.get(ip)
    const emailEntry = this.emailAttempts.get(email.toLowerCase())

    return {
      ipMinutes: ipEntry?.blockedUntil ? Math.ceil((ipEntry.blockedUntil - now) / (60 * 1000)) : undefined,
      emailMinutes: emailEntry?.blockedUntil ? Math.ceil((emailEntry.blockedUntil - now) / (60 * 1000)) : undefined,
    }
  }

  /**
   * Limpa tentativas antigas (limpeza automática)
   */
  cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.config.windowMs

    // Limpar tentativas antigas de IP
    for (const [ip, entry] of this.ipAttempts.entries()) {
      if (entry.lastAttempt < cutoff && (!entry.blockedUntil || now >= entry.blockedUntil)) {
        this.ipAttempts.delete(ip)
      }
    }

    // Limpar tentativas antigas de email
    for (const [email, entry] of this.emailAttempts.entries()) {
      if (entry.lastAttempt < cutoff && (!entry.blockedUntil || now >= entry.blockedUntil)) {
        this.emailAttempts.delete(email)
      }
    }
  }

  /**
   * Método privado para registrar tentativa
   */
  private recordAttempt(map: Map<string, RateLimitEntry>, key: string, now: number): void {
    const entry = map.get(key)

    if (!entry) {
      // Primeira tentativa
      map.set(key, {
        attempts: 1,
        lastAttempt: now,
      })
    } else {
      // Verificar se está dentro da janela de tempo
      const isWithinWindow = (now - entry.lastAttempt) < this.config.windowMs

      if (isWithinWindow) {
        // Incrementar tentativas
        entry.attempts++
        entry.lastAttempt = now

        // Se excedeu o limite, bloquear
        if (entry.attempts >= this.config.maxAttempts) {
          entry.blockedUntil = now + this.config.blockDurationMs
        }
      } else {
        // Fora da janela, resetar contador
        entry.attempts = 1
        entry.lastAttempt = now
        delete entry.blockedUntil
      }
    }
  }

  /**
   * Força o desbloqueio de um IP ou email (para uso administrativo)
   */
  forceUnblock(ip?: string, email?: string): void {
    if (ip) {
      this.ipAttempts.delete(ip)
    }
    if (email) {
      this.emailAttempts.delete(email.toLowerCase())
    }
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getStats(): {
    totalIpEntries: number
    totalEmailEntries: number
    blockedIps: number
    blockedEmails: number
  } {
    const now = Date.now()
    
    let blockedIps = 0
    let blockedEmails = 0

    for (const entry of this.ipAttempts.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedIps++
      }
    }

    for (const entry of this.emailAttempts.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedEmails++
      }
    }

    return {
      totalIpEntries: this.ipAttempts.size,
      totalEmailEntries: this.emailAttempts.size,
      blockedIps,
      blockedEmails,
    }
  }
}

// Instância singleton do rate limiter
export const rateLimiter = new RateLimiter()

// Limpeza automática a cada 5 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    rateLimiter.cleanup()
  }, 5 * 60 * 1000)
}

// Utilitário para obter IP do cliente
export function getClientIp(request?: Request): string {
  if (typeof window !== 'undefined') {
    // No cliente, usar um identificador baseado em sessionStorage
    return sessionStorage.getItem('client-id') || 'unknown-client'
  }

  if (!request) return 'unknown'

  // Tentar obter IP real do cabeçalho
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')

  return forwarded?.split(',')[0] || realIp || remoteAddr || 'unknown'
}

// Tipos para o hook useRateLimit
interface RateLimitResult {
  blocked: boolean
  message?: string
  minutesRemaining?: number
  attemptsLeft?: number
}

// Hook para usar rate limiting no frontend
export function useRateLimit() {
  const checkRateLimit = (email: string): RateLimitResult => {
    const clientId = sessionStorage.getItem('client-id') || 'unknown-client'
    
    const isIpBlocked = rateLimiter.isIpBlocked(clientId)
    const isEmailBlocked = rateLimiter.isEmailBlocked(email)
    
    if (isIpBlocked || isEmailBlocked) {
      const timeRemaining = rateLimiter.getBlockTimeRemaining(clientId, email)
      const minutes = Math.max(timeRemaining.ipMinutes || 0, timeRemaining.emailMinutes || 0)
      
      return {
        blocked: true,
        message: `Muitas tentativas de login. Tente novamente em ${minutes} minutos.`,
        minutesRemaining: minutes
      }
    }

    const remaining = rateLimiter.getRemainingAttempts(clientId, email)
    const attemptsLeft = Math.min(remaining.ipAttempts, remaining.emailAttempts)

    return {
      blocked: false,
      attemptsLeft,
      message: attemptsLeft <= 2 ? `Restam ${attemptsLeft} tentativas antes do bloqueio.` : undefined
    }
  }

  const recordFailedAttempt = (email: string) => {
    const clientId = sessionStorage.getItem('client-id') || 'unknown-client'
    rateLimiter.recordFailedAttempt(clientId, email)
  }

  const recordSuccessfulAttempt = (email: string) => {
    const clientId = sessionStorage.getItem('client-id') || 'unknown-client'
    rateLimiter.recordSuccessfulAttempt(clientId, email)
  }

  return {
    checkRateLimit,
    recordFailedAttempt,
    recordSuccessfulAttempt
  }
}
