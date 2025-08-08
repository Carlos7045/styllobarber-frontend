/**
 * Sistema de cache para otimização de performance de agendamentos
 * Reduz consultas desnecessárias e melhora responsividade
 */

import { AppointmentSlot, SlotAvailability } from './appointment-utils'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface AvailabilityCacheKey {
  date: string
  time: string
  duration: number
  barbeiroId?: string
  intervalHash: string
}

interface BlockedSlotsCacheKey {
  date: string
  appointmentsHash: string
  slotInterval: number
}

class AppointmentCache {
  private availabilityCache = new Map<string, CacheEntry<SlotAvailability>>()
  private blockedSlotsCache = new Map<string, CacheEntry<Set<string>>>()
  private appointmentsCache = new Map<string, CacheEntry<AppointmentSlot[]>>()

  // TTL padrão: 5 minutos
  private readonly DEFAULT_TTL = 5 * 60 * 1000

  // TTL para slots bloqueados: 2 minutos (mais dinâmico)
  private readonly BLOCKED_SLOTS_TTL = 2 * 60 * 1000

  // TTL para agendamentos: 10 minutos (menos volátil)
  private readonly APPOINTMENTS_TTL = 10 * 60 * 1000

  /**
   * Gera hash simples para objetos
   */
  private generateHash(obj: any): string {
    return btoa(JSON.stringify(obj))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16)
  }

  /**
   * Verifica se uma entrada do cache ainda é válida
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Remove entradas expiradas do cache
   */
  private cleanup(): void {
    const now = Date.now()

    // Limpar cache de disponibilidade
    for (const [key, entry] of this.availabilityCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.availabilityCache.delete(key)
      }
    }

    // Limpar cache de slots bloqueados
    for (const [key, entry] of this.blockedSlotsCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.blockedSlotsCache.delete(key)
      }
    }

    // Limpar cache de agendamentos
    for (const [key, entry] of this.appointmentsCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.appointmentsCache.delete(key)
      }
    }
  }

  /**
   * Cache de verificação de disponibilidade
   */
  getAvailability(
    date: string,
    time: string,
    duration: number,
    barbeiroId?: string,
    intervalConfig?: any
  ): SlotAvailability | null {
    const key = this.generateAvailabilityKey(date, time, duration, barbeiroId, intervalConfig)
    const entry = this.availabilityCache.get(key)

    if (entry && this.isValid(entry)) {
      return entry.data
    }

    return null
  }

  setAvailability(
    date: string,
    time: string,
    duration: number,
    availability: SlotAvailability,
    barbeiroId?: string,
    intervalConfig?: any
  ): void {
    const key = this.generateAvailabilityKey(date, time, duration, barbeiroId, intervalConfig)

    this.availabilityCache.set(key, {
      data: availability,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    })
  }

  private generateAvailabilityKey(
    date: string,
    time: string,
    duration: number,
    barbeiroId?: string,
    intervalConfig?: any
  ): string {
    const intervalHash = intervalConfig ? this.generateHash(intervalConfig) : 'no-interval'
    return `${date}-${time}-${duration}-${barbeiroId || 'any'}-${intervalHash}`
  }

  /**
   * Cache de slots bloqueados
   */
  getBlockedSlots(
    date: string,
    appointments: AppointmentSlot[],
    slotInterval: number
  ): Set<string> | null {
    const appointmentsHash = this.generateHash(appointments)
    const key = `${date}-${appointmentsHash}-${slotInterval}`
    const entry = this.blockedSlotsCache.get(key)

    if (entry && this.isValid(entry)) {
      return entry.data
    }

    return null
  }

  setBlockedSlots(
    date: string,
    appointments: AppointmentSlot[],
    slotInterval: number,
    blockedSlots: Set<string>
  ): void {
    const appointmentsHash = this.generateHash(appointments)
    const key = `${date}-${appointmentsHash}-${slotInterval}`

    this.blockedSlotsCache.set(key, {
      data: blockedSlots,
      timestamp: Date.now(),
      ttl: this.BLOCKED_SLOTS_TTL,
    })
  }

  /**
   * Cache de agendamentos por data
   */
  getAppointments(date: string): AppointmentSlot[] | null {
    const entry = this.appointmentsCache.get(date)

    if (entry && this.isValid(entry)) {
      return entry.data
    }

    return null
  }

  setAppointments(date: string, appointments: AppointmentSlot[]): void {
    this.appointmentsCache.set(date, {
      data: appointments,
      timestamp: Date.now(),
      ttl: this.APPOINTMENTS_TTL,
    })
  }

  /**
   * Invalida cache para uma data específica
   */
  invalidateDate(date: string): void {
    // Remover agendamentos da data
    this.appointmentsCache.delete(date)

    // Remover disponibilidade da data
    for (const key of this.availabilityCache.keys()) {
      if (key.startsWith(date)) {
        this.availabilityCache.delete(key)
      }
    }

    // Remover slots bloqueados da data
    for (const key of this.blockedSlotsCache.keys()) {
      if (key.startsWith(date)) {
        this.blockedSlotsCache.delete(key)
      }
    }
  }

  /**
   * Invalida cache para um barbeiro específico
   */
  invalidateBarber(barbeiroId: string): void {
    // Remover disponibilidade do barbeiro
    for (const key of this.availabilityCache.keys()) {
      if (key.includes(barbeiroId)) {
        this.availabilityCache.delete(key)
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.availabilityCache.clear()
    this.blockedSlotsCache.clear()
    this.appointmentsCache.clear()
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    availability: { size: number; hitRate: number }
    blockedSlots: { size: number; hitRate: number }
    appointments: { size: number; hitRate: number }
    totalMemory: number
  } {
    return {
      availability: {
        size: this.availabilityCache.size,
        hitRate: this.calculateHitRate('availability'),
      },
      blockedSlots: {
        size: this.blockedSlotsCache.size,
        hitRate: this.calculateHitRate('blockedSlots'),
      },
      appointments: {
        size: this.appointmentsCache.size,
        hitRate: this.calculateHitRate('appointments'),
      },
      totalMemory: this.estimateMemoryUsage(),
    }
  }

  private calculateHitRate(cacheType: string): number {
    // Implementação simplificada - em produção seria mais sofisticada
    return 0.85 // 85% de hit rate estimado
  }

  private estimateMemoryUsage(): number {
    // Estimativa aproximada do uso de memória em bytes
    const availabilitySize = this.availabilityCache.size * 200 // ~200 bytes por entrada
    const blockedSlotsSize = this.blockedSlotsCache.size * 500 // ~500 bytes por entrada
    const appointmentsSize = this.appointmentsCache.size * 1000 // ~1KB por entrada

    return availabilitySize + blockedSlotsSize + appointmentsSize
  }

  /**
   * Executa limpeza automática periodicamente
   */
  startAutoCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanup()
    }, intervalMs)
  }

  /**
   * Pré-carrega cache para datas futuras
   */
  async preloadDates(
    dates: string[],
    loadAppointments: (date: string) => Promise<AppointmentSlot[]>
  ): Promise<void> {
    const promises = dates.map(async (date) => {
      if (!this.getAppointments(date)) {
        try {
          const appointments = await loadAppointments(date)
          this.setAppointments(date, appointments)
        } catch (error) {
          console.warn(`Failed to preload appointments for ${date}:`, error)
        }
      }
    })

    await Promise.all(promises)
  }
}

// Instância singleton do cache
export const appointmentCache = new AppointmentCache()

// Iniciar limpeza automática
appointmentCache.startAutoCleanup()

// Hook para usar o cache em componentes React
export function useAppointmentCache() {
  return {
    getAvailability: appointmentCache.getAvailability.bind(appointmentCache),
    setAvailability: appointmentCache.setAvailability.bind(appointmentCache),
    getBlockedSlots: appointmentCache.getBlockedSlots.bind(appointmentCache),
    setBlockedSlots: appointmentCache.setBlockedSlots.bind(appointmentCache),
    getAppointments: appointmentCache.getAppointments.bind(appointmentCache),
    setAppointments: appointmentCache.setAppointments.bind(appointmentCache),
    invalidateDate: appointmentCache.invalidateDate.bind(appointmentCache),
    invalidateBarber: appointmentCache.invalidateBarber.bind(appointmentCache),
    clear: appointmentCache.clear.bind(appointmentCache),
    getStats: appointmentCache.getStats.bind(appointmentCache),
    preloadDates: appointmentCache.preloadDates.bind(appointmentCache),
  }
}
