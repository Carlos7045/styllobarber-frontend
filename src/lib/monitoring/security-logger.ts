/**
 * Sistema de Logs de Segurança para StylloBarber
 * Registra ações críticas de autenticação e segurança
 */

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'login_blocked'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'account_created'
  | 'account_locked'
  | 'unauthorized_access'
  | 'permission_denied'
  | 'session_expired'
  | 'suspicious_activity'

export interface SecurityLogEntry {
  id: string
  timestamp: number
  event: SecurityEventType
  userId?: string
  email?: string
  ip: string
  userAgent: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  location?: {
    country?: string
    city?: string
    region?: string
  }
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = []
  private maxLogs = 1000 // Manter apenas os últimos 1000 logs em memória

  /**
   * Registra um evento de segurança
   */
  log(
    event: SecurityEventType,
    details: Record<string, any> = {},
    options: {
      userId?: string
      email?: string
      ip?: string
      userAgent?: string
      severity?: SecurityLogEntry['severity']
    } = {}
  ): void {
    const entry: SecurityLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      event,
      userId: options.userId,
      email: options.email,
      ip: options.ip || this.getClientIp(),
      userAgent: options.userAgent || this.getUserAgent(),
      details,
      severity: options.severity || this.getSeverityForEvent(event),
    }

    // Adicionar localização se disponível
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      this.addLocationInfo(entry)
    }

    this.logs.push(entry)

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log no console para desenvolvimento
    this.logToConsole(entry)

    // Em produção, enviar para serviço de logging
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry)
    }
  }

  /**
   * Métodos de conveniência para eventos específicos
   */
  logLoginSuccess(userId: string, email: string, details: Record<string, any> = {}): void {
    this.log('login_success', {
      ...details,
      message: `Login bem-sucedido para ${email}`
    }, { userId, email, severity: 'low' })
  }

  logLoginFailed(email: string, reason: string, details: Record<string, any> = {}): void {
    this.log('login_failed', {
      ...details,
      reason,
      message: `Tentativa de login falhada para ${email}: ${reason}`
    }, { email, severity: 'medium' })
  }

  logLoginBlocked(email: string, details: Record<string, any> = {}): void {
    this.log('login_blocked', {
      ...details,
      message: `Login bloqueado por rate limiting para ${email}`
    }, { email, severity: 'high' })
  }

  logLogout(userId: string, email: string, details: Record<string, any> = {}): void {
    this.log('logout', {
      ...details,
      message: `Logout realizado para ${email}`
    }, { userId, email, severity: 'low' })
  }

  logUnauthorizedAccess(path: string, userId?: string, email?: string, details: Record<string, any> = {}): void {
    this.log('unauthorized_access', {
      ...details,
      path,
      message: `Tentativa de acesso não autorizado a ${path}${email ? ` por ${email}` : ''}`
    }, { userId, email, severity: 'high' })
  }

  logSuspiciousActivity(description: string, userId?: string, email?: string, details: Record<string, any> = {}): void {
    this.log('suspicious_activity', {
      ...details,
      description,
      message: `Atividade suspeita detectada: ${description}`
    }, { userId, email, severity: 'critical' })
  }

  /**
   * Obtém logs filtrados
   */
  getLogs(filter: {
    event?: SecurityEventType
    userId?: string
    email?: string
    severity?: SecurityLogEntry['severity']
    since?: number
    limit?: number
  } = {}): SecurityLogEntry[] {
    let filteredLogs = [...this.logs]

    // Filtrar por evento
    if (filter.event) {
      filteredLogs = filteredLogs.filter(log => log.event === filter.event)
    }

    // Filtrar por usuário
    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
    }

    // Filtrar por email
    if (filter.email) {
      filteredLogs = filteredLogs.filter(log => log.email === filter.email)
    }

    // Filtrar por severidade
    if (filter.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filter.severity)
    }

    // Filtrar por timestamp
    if (filter.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!)
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp)

    // Limitar resultados
    if (filter.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit)
    }

    return filteredLogs
  }

  /**
   * Obtém estatísticas de segurança
   */
  getStats(since?: number): {
    totalEvents: number
    eventsByType: Record<SecurityEventType, number>
    eventsBySeverity: Record<string, number>
    uniqueUsers: number
    uniqueIps: number
    recentCriticalEvents: SecurityLogEntry[]
  } {
    const logs = since ? this.logs.filter(log => log.timestamp >= since) : this.logs

    const eventsByType = {} as Record<SecurityEventType, number>
    const eventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 }
    const uniqueUsers = new Set<string>()
    const uniqueIps = new Set<string>()

    logs.forEach(log => {
      // Contar por tipo
      eventsByType[log.event] = (eventsByType[log.event] || 0) + 1
      
      // Contar por severidade
      eventsBySeverity[log.severity]++
      
      // Usuários únicos
      if (log.userId) uniqueUsers.add(log.userId)
      
      // IPs únicos
      uniqueIps.add(log.ip)
    })

    // Eventos críticos recentes (últimas 24h)
    const last24h = Date.now() - (24 * 60 * 60 * 1000)
    const recentCriticalEvents = logs
      .filter(log => log.severity === 'critical' && log.timestamp >= last24h)
      .slice(0, 10)

    return {
      totalEvents: logs.length,
      eventsByType,
      eventsBySeverity,
      uniqueUsers: uniqueUsers.size,
      uniqueIps: uniqueIps.size,
      recentCriticalEvents
    }
  }

  /**
   * Exporta logs para análise
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'event', 'severity', 'userId', 'email', 'ip', 'details']
      const rows = this.logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.event,
        log.severity,
        log.userId || '',
        log.email || '',
        log.ip,
        JSON.stringify(log.details)
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Limpa logs antigos
   */
  cleanup(olderThan: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan
    this.logs = this.logs.filter(log => log.timestamp >= cutoff)
  }

  // Métodos privados
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIp(): string {
    if (typeof window !== 'undefined') {
      return 'client-side'
    }
    return 'unknown'
  }

  private getUserAgent(): string {
    if (typeof window !== 'undefined') {
      return navigator.userAgent
    }
    return 'server-side'
  }

  private getSeverityForEvent(event: SecurityEventType): SecurityLogEntry['severity'] {
    const severityMap: Record<SecurityEventType, SecurityLogEntry['severity']> = {
      login_success: 'low',
      login_failed: 'medium',
      login_blocked: 'high',
      logout: 'low',
      password_reset_request: 'medium',
      password_reset_success: 'medium',
      account_created: 'low',
      account_locked: 'high',
      unauthorized_access: 'high',
      permission_denied: 'medium',
      session_expired: 'low',
      suspicious_activity: 'critical'
    }

    return severityMap[event] || 'medium'
  }

  private logToConsole(entry: SecurityLogEntry): void {
    const emoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }[entry.severity]

    console.log(
      `${emoji} [SECURITY] ${entry.event}`,
      {
        timestamp: new Date(entry.timestamp).toISOString(),
        user: entry.email || entry.userId,
        ip: entry.ip,
        details: entry.details
      }
    )
  }

  private async addLocationInfo(entry: SecurityLogEntry): Promise<void> {
    // Em um ambiente real, você usaria um serviço de geolocalização por IP
    // Por enquanto, apenas um placeholder
    try {
      // Placeholder para serviço de geolocalização
      entry.location = {
        country: 'BR',
        city: 'Unknown',
        region: 'Unknown'
      }
    } catch (error) {
      // Ignorar erros de geolocalização
    }
  }

  private async sendToLoggingService(entry: SecurityLogEntry): Promise<void> {
    try {
      // Em produção, enviar para serviço de logging como Sentry, LogRocket, etc.
      // await fetch('/api/security-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Erro ao enviar log de segurança:', error)
    }
  }
}

// Instância singleton
export const securityLogger = new SecurityLogger()

// Limpeza automática a cada hora
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    securityLogger.cleanup()
  }, 60 * 60 * 1000)
}
