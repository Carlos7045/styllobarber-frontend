/**
 * Sistema de alertas para problemas críticos de autenticação
 * Monitora métricas e dispara alertas quando necessário
 */

import { authLogger } from './logger'
import { performanceMonitor } from './performance-monitor'

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  HIGH_ERROR_RATE = 'high_error_rate',
  CIRCUIT_BREAKER_OPEN = 'circuit_breaker_open',
  SESSION_VALIDATION_FAILURE = 'session_validation_failure',
  PROFILE_SYNC_FAILURE = 'profile_sync_failure',
  SECURITY_INCIDENT = 'security_incident',
  SYSTEM_OVERLOAD = 'system_overload'
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata?: Record<string, any>
  actions?: AlertAction[]
}

export interface AlertAction {
  id: string
  label: string
  action: () => Promise<void>
  destructive?: boolean
}

export interface AlertRule {
  id: string
  type: AlertType
  severity: AlertSeverity
  condition: (metrics: any) => boolean
  title: string
  messageTemplate: string
  cooldownMinutes: number
  actions?: AlertAction[]
}

export interface AlertSystemConfig {
  enabled: boolean
  checkIntervalMs: number
  maxActiveAlerts: number
  enableNotifications: boolean
  enableAutoResolve: boolean
}

/**
 * Classe principal do sistema de alertas
 */
export class AlertSystem {
  private static instance: AlertSystem
  private config: AlertSystemConfig
  private alerts: Map<string, Alert> = new Map()
  private rules: Map<string, AlertRule> = new Map()
  private lastAlertTime: Map<string, Date> = new Map()
  private listeners: ((alert: Alert) => void)[] = []
  private checkInterval?: NodeJS.Timeout

  private constructor(config?: Partial<AlertSystemConfig>) {
    this.config = {
      enabled: true,
      checkIntervalMs: 30000, // 30 segundos
      maxActiveAlerts: 50,
      enableNotifications: true,
      enableAutoResolve: true,
      ...config
    }

    this.setupDefaultRules()
    this.startMonitoring()
  }

  public static getInstance(config?: Partial<AlertSystemConfig>): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem(config)
    }
    return AlertSystem.instance
  }

  /**
   * Configurar regras padrão de alertas
   */
  private setupDefaultRules(): void {
    // Alerta de degradação de performance
    this.addRule({
      id: 'performance_degradation',
      type: AlertType.PERFORMANCE_DEGRADATION,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => {
        const overview = performanceMonitor.getSystemOverview()
        return overview.averageResponseTime > 5000 || overview.overallSuccessRate < 90
      },
      title: 'Degradação de Performance',
      messageTemplate: 'Sistema apresentando lentidão ou alta taxa de falhas',
      cooldownMinutes: 10,
      actions: [
        {
          id: 'clear_cache',
          label: 'Limpar Cache',
          action: async () => {
            // Implementar limpeza de cache
            console.log('Cache limpo via alerta')
          }
        }
      ]
    })

    // Alerta de alta taxa de erro
    this.addRule({
      id: 'high_error_rate',
      type: AlertType.HIGH_ERROR_RATE,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => {
        const overview = performanceMonitor.getSystemOverview()
        return overview.overallSuccessRate < 80
      },
      title: 'Alta Taxa de Erro',
      messageTemplate: 'Taxa de sucesso abaixo de 80%',
      cooldownMinutes: 5
    })

    // Alerta de circuit breaker aberto
    this.addRule({
      id: 'circuit_breaker_open',
      type: AlertType.CIRCUIT_BREAKER_OPEN,
      severity: AlertSeverity.CRITICAL,
      condition: (metrics) => {
        return metrics.circuitState === 'open'
      },
      title: 'Circuit Breaker Aberto',
      messageTemplate: 'Sistema em modo de proteção devido a falhas excessivas',
      cooldownMinutes: 2,
      actions: [
        {
          id: 'reset_circuit',
          label: 'Reset Circuit Breaker',
          action: async () => {
            // Implementar reset do circuit breaker
            console.log('Circuit breaker resetado via alerta')
          },
          destructive: true
        }
      ]
    })

    // Alerta de falha na validação de sessão
    this.addRule({
      id: 'session_validation_failure',
      type: AlertType.SESSION_VALIDATION_FAILURE,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => {
        return !metrics.sessionValidity && metrics.consecutiveFailures > 3
      },
      title: 'Falha na Validação de Sessão',
      messageTemplate: 'Múltiplas falhas consecutivas na validação de sessão',
      cooldownMinutes: 5
    })

    // Alerta de sobrecarga do sistema
    this.addRule({
      id: 'system_overload',
      type: AlertType.SYSTEM_OVERLOAD,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => {
        const overview = performanceMonitor.getSystemOverview()
        return overview.totalOperations > 1000 && overview.averageResponseTime > 10000
      },
      title: 'Sobrecarga do Sistema',
      messageTemplate: 'Sistema sobrecarregado com alto volume de operações',
      cooldownMinutes: 15
    })
  }

  /**
   * Adicionar regra de alerta
   */
  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remover regra de alerta
   */
  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }

  /**
   * Iniciar monitoramento
   */
  private startMonitoring(): void {
    if (!this.config.enabled) return

    this.checkInterval = setInterval(() => {
      this.checkAlerts()
    }, this.config.checkIntervalMs)
  }

  /**
   * Parar monitoramento
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  /**
   * Verificar alertas baseado nas regras
   */
  private async checkAlerts(): Promise<void> {
    try {
      // Obter métricas atuais
      const performanceOverview = performanceMonitor.getSystemOverview()
      const metrics = {
        ...performanceOverview,
        circuitState: 'closed', // Seria obtido do error recovery
        sessionValidity: true,  // Seria obtido do auth health
        consecutiveFailures: 0  // Seria obtido do auth health
      }

      // Verificar cada regra
      for (const [ruleId, rule] of this.rules.entries()) {
        const shouldAlert = rule.condition(metrics)
        
        if (shouldAlert) {
          await this.triggerAlert(rule, metrics)
        } else if (this.config.enableAutoResolve) {
          await this.resolveAlert(ruleId)
        }
      }

      // Limpar alertas antigos
      this.cleanupOldAlerts()
    } catch (error) {
      console.error('Erro durante verificação de alertas:', error)
    }
  }

  /**
   * Disparar alerta
   */
  private async triggerAlert(rule: AlertRule, metrics: any): Promise<void> {
    const now = new Date()
    const lastAlert = this.lastAlertTime.get(rule.id)
    
    // Verificar cooldown
    if (lastAlert) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000
      if (now.getTime() - lastAlert.getTime() < cooldownMs) {
        return // Ainda em cooldown
      }
    }

    // Verificar se já existe alerta ativo para esta regra
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.type === rule.type && !alert.resolved)

    if (existingAlert) {
      return // Já existe alerta ativo
    }

    // Criar novo alerta
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.title,
      message: this.formatMessage(rule.messageTemplate, metrics),
      timestamp: now,
      resolved: false,
      metadata: { metrics, ruleId: rule.id },
      actions: rule.actions
    }

    // Armazenar alerta
    this.alerts.set(alert.id, alert)
    this.lastAlertTime.set(rule.id, now)

    // Log do alerta
    authLogger.securityEvent('ALERT_TRIGGERED', undefined, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title
    })

    // Notificar listeners
    this.notifyListeners(alert)

    // Enviar notificação se habilitado
    if (this.config.enableNotifications) {
      await this.sendNotification(alert)
    }
  }

  /**
   * Resolver alerta
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = Array.from(this.alerts.values())
      .find(alert => alert.metadata?.ruleId === ruleId && !alert.resolved)

    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()

      authLogger.securityEvent('ALERT_RESOLVED', undefined, {
        alertId: alert.id,
        type: alert.type,
        resolvedAt: alert.resolvedAt
      })

      this.notifyListeners(alert)
    }
  }

  /**
   * Formatar mensagem do alerta
   */
  private formatMessage(template: string, metrics: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return metrics[key]?.toString() || match
    })
  }

  /**
   * Enviar notificação
   */
  private async sendNotification(alert: Alert): Promise<void> {
    // Implementar notificações (browser notification, toast, etc.)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${alert.title}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.type
      })
    }
  }

  /**
   * Notificar listeners
   */
  private notifyListeners(alert: Alert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('Erro em listener de alerta:', error)
      }
    })
  }

  /**
   * Limpar alertas antigos
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)) // 24 horas
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffTime && alert.resolved) {
        this.alerts.delete(alertId)
      }
    }

    // Limitar número máximo de alertas
    if (this.alerts.size > this.config.maxActiveAlerts) {
      const sortedAlerts = Array.from(this.alerts.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
      
      const toRemove = sortedAlerts.slice(0, this.alerts.size - this.config.maxActiveAlerts)
      toRemove.forEach(([alertId]) => this.alerts.delete(alertId))
    }
  }

  // Métodos públicos
  public addListener(listener: (alert: Alert) => void): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: (alert: Alert) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public resolveAlertById(alertId: string): void {
    const alert = this.alerts.get(alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      this.notifyListeners(alert)
    }
  }

  public executeAlertAction(alertId: string, actionId: string): Promise<void> {
    const alert = this.alerts.get(alertId)
    if (!alert || !alert.actions) {
      throw new Error('Alerta ou ação não encontrada')
    }

    const action = alert.actions.find(a => a.id === actionId)
    if (!action) {
      throw new Error('Ação não encontrada')
    }

    return action.action()
  }

  public getAlertStats(): {
    total: number
    active: number
    resolved: number
    bySeverity: Record<AlertSeverity, number>
    byType: Record<AlertType, number>
  } {
    const alerts = Array.from(this.alerts.values())
    
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: {} as Record<AlertSeverity, number>,
      byType: {} as Record<AlertType, number>
    }

    alerts.forEach(alert => {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1
    })

    return stats
  }

  public clearAllAlerts(): void {
    this.alerts.clear()
    this.lastAlertTime.clear()
  }
}

// Instância singleton
export const alertSystem = AlertSystem.getInstance()

// Hook para usar o sistema de alertas em React
export function useAlertSystem() {
  return {
    getActiveAlerts: () => alertSystem.getActiveAlerts(),
    getAllAlerts: () => alertSystem.getAllAlerts(),
    resolveAlert: (alertId: string) => alertSystem.resolveAlertById(alertId),
    executeAction: (alertId: string, actionId: string) => alertSystem.executeAlertAction(alertId, actionId),
    getStats: () => alertSystem.getAlertStats(),
    addListener: (listener: (alert: Alert) => void) => alertSystem.addListener(listener),
    removeListener: (listener: (alert: Alert) => void) => alertSystem.removeListener(listener)
  }
}