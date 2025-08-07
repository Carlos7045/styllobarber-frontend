import { BaseService, ServiceResult, ServiceListResult } from '@/shared/services/base/BaseService'
import { serviceInterceptors } from '@/shared/services/base/ServiceInterceptors'
import { ServiceError, ErrorType, ErrorSeverity } from '@/shared/services/base/ErrorHandler'

/**
 * Interface do agendamento
 */
export interface Appointment {
  id: string
  cliente_id: string
  funcionario_id: string
  servico_id: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'
  observacoes?: string
  valor_total: number
  created_at: string
  updated_at: string
  // Dados relacionados
  cliente_nome?: string
  funcionario_nome?: string
  servico_nome?: string
}

/**
 * Dados para criação de agendamento
 */
export interface CreateAppointmentData {
  cliente_id: string
  funcionario_id: string
  servico_id: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  observacoes?: string
  valor_total: number
}

/**
 * Dados para atualização de agendamento
 */
export interface UpdateAppointmentData {
  data_agendamento?: string
  hora_inicio?: string
  hora_fim?: string
  status?: Appointment['status']
  observacoes?: string
  valor_total?: number
}

/**
 * Filtros para busca de agendamentos
 */
export interface AppointmentFilters {
  cliente_id?: string
  funcionario_id?: string
  servico_id?: string
  status?: Appointment['status']
  data_inicio?: string
  data_fim?: string
  search?: string
}

/**
 * Service para gerenciamento de agendamentos
 * 
 * @description
 * Service especializado para operações com agendamentos, estendendo
 * a funcionalidade base com métodos específicos do domínio.
 * 
 * @example
 * ```typescript
 * const appointmentService = new AppointmentService()
 * 
 * // Criar agendamento
 * const appointment = await appointmentService.create({
 *   cliente_id: 'client-1',
 *   funcionario_id: 'barber-1',
 *   servico_id: 'service-1',
 *   data_agendamento: '2024-01-15',
 *   hora_inicio: '10:00',
 *   hora_fim: '11:00',
 *   valor_total: 50.00
 * })
 * 
 * // Buscar agendamentos do dia
 * const todayAppointments = await appointmentService.findByDate('2024-01-15')
 * ```
 */
export class AppointmentService extends BaseService<Appointment> {
  constructor() {
    super({
      tableName: 'agendamentos',
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutos
      maxRetries: 3,
      retryDelay: 1000,
    })
  }

  /**
   * Busca agendamentos por data
   */
  async findByDate(date: string): Promise<ServiceListResult<Appointment>> {
    const cacheKey = `appointments:date:${date}`
    const cached = this.getFromCache<Appointment[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findByDate',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { date },
      },
      async () => {
        const { data, error } = await this.query()
          .select(`
            *,
            cliente:profiles!cliente_id(nome),
            funcionario:profiles!funcionario_id(nome),
            servico:servicos(nome, duracao, preco)
          `)
          .eq('data_agendamento', date)
          .order('hora_inicio')

        if (error) {
          throw error
        }

        // Transformar dados relacionados
        const appointments = (data || []).map(appointment => ({
          ...appointment,
          cliente_nome: appointment.cliente?.nome,
          funcionario_nome: appointment.funcionario?.nome,
          servico_nome: appointment.servico?.nome,
        }))

        this.setCache(cacheKey, appointments)
        return { 
          success: true, 
          data: appointments,
          count: appointments.length 
        }
      }
    )
  }

  /**
   * Busca agendamentos por funcionário
   */
  async findByBarber(funcionario_id: string, date?: string): Promise<ServiceListResult<Appointment>> {
    const cacheKey = `appointments:barber:${funcionario_id}:${date || 'all'}`
    const cached = this.getFromCache<Appointment[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findByBarber',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { funcionario_id, date },
      },
      async () => {
        let query = this.query()
          .select(`
            *,
            cliente:profiles!cliente_id(nome, telefone),
            servico:servicos(nome, duracao, preco)
          `)
          .eq('funcionario_id', funcionario_id)

        if (date) {
          query = query.eq('data_agendamento', date)
        }

        query = query.order('data_agendamento', { ascending: false })
          .order('hora_inicio')

        const { data, error } = await query

        if (error) {
          throw error
        }

        const appointments = (data || []).map(appointment => ({
          ...appointment,
          cliente_nome: appointment.cliente?.nome,
          servico_nome: appointment.servico?.nome,
        }))

        this.setCache(cacheKey, appointments)
        return { 
          success: true, 
          data: appointments,
          count: appointments.length 
        }
      }
    )
  }

  /**
   * Busca agendamentos por cliente
   */
  async findByClient(cliente_id: string): Promise<ServiceListResult<Appointment>> {
    const cacheKey = `appointments:client:${cliente_id}`
    const cached = this.getFromCache<Appointment[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findByClient',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { cliente_id },
      },
      async () => {
        const { data, error } = await this.query()
          .select(`
            *,
            funcionario:profiles!funcionario_id(nome),
            servico:servicos(nome, duracao, preco)
          `)
          .eq('cliente_id', cliente_id)
          .order('data_agendamento', { ascending: false })
          .order('hora_inicio', { ascending: false })

        if (error) {
          throw error
        }

        const appointments = (data || []).map(appointment => ({
          ...appointment,
          funcionario_nome: appointment.funcionario?.nome,
          servico_nome: appointment.servico?.nome,
        }))

        this.setCache(cacheKey, appointments)
        return { 
          success: true, 
          data: appointments,
          count: appointments.length 
        }
      }
    )
  }

  /**
   * Busca agendamentos com filtros avançados
   */
  async findWithFilters(filters: AppointmentFilters): Promise<ServiceListResult<Appointment>> {
    return serviceInterceptors.execute(
      {
        method: 'findWithFilters',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { filters },
      },
      async () => {
        let query = this.query()
          .select(`
            *,
            cliente:profiles!cliente_id(nome, telefone),
            funcionario:profiles!funcionario_id(nome),
            servico:servicos(nome, duracao, preco)
          `, { count: 'exact' })

        // Aplicar filtros
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id)
        }

        if (filters.funcionario_id) {
          query = query.eq('funcionario_id', filters.funcionario_id)
        }

        if (filters.servico_id) {
          query = query.eq('servico_id', filters.servico_id)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        if (filters.data_inicio) {
          query = query.gte('data_agendamento', filters.data_inicio)
        }

        if (filters.data_fim) {
          query = query.lte('data_agendamento', filters.data_fim)
        }

        // Busca por texto (nome do cliente)
        if (filters.search) {
          query = query.or(`cliente.nome.ilike.%${filters.search}%`)
        }

        query = query.order('data_agendamento', { ascending: false })
          .order('hora_inicio')

        const { data, error, count } = await query

        if (error) {
          throw error
        }

        const appointments = (data || []).map(appointment => ({
          ...appointment,
          cliente_nome: appointment.cliente?.nome,
          funcionario_nome: appointment.funcionario?.nome,
          servico_nome: appointment.servico?.nome,
        }))

        return {
          success: true,
          data: appointments,
          count: count || 0,
        }
      }
    )
  }

  /**
   * Cria um novo agendamento
   */
  async create(appointmentData: CreateAppointmentData): Promise<ServiceResult<Appointment>> {
    return serviceInterceptors.execute(
      {
        method: 'create',
        table: this.config.tableName,
        operation: 'INSERT',
        metadata: { 
          cliente_id: appointmentData.cliente_id,
          funcionario_id: appointmentData.funcionario_id,
          data_agendamento: appointmentData.data_agendamento 
        },
      },
      async () => {
        // Validar conflitos de horário
        await this.validateTimeSlot(
          appointmentData.funcionario_id,
          appointmentData.data_agendamento,
          appointmentData.hora_inicio,
          appointmentData.hora_fim
        )

        // Criar agendamento
        const { data, error } = await this.query()
          .insert({
            ...appointmentData,
            status: 'agendado',
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('appointments:date')
        this.invalidateCache('appointments:barber')
        this.invalidateCache('appointments:client')

        return { success: true, data }
      }
    )
  }

  /**
   * Atualiza status do agendamento
   */
  async updateStatus(id: string, status: Appointment['status']): Promise<ServiceResult<Appointment>> {
    return serviceInterceptors.execute(
      {
        method: 'updateStatus',
        table: this.config.tableName,
        operation: 'UPDATE',
        metadata: { appointmentId: id, status },
      },
      async () => {
        const { data, error } = await this.query()
          .eq('id', id)
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new ServiceError(
              'Agendamento não encontrado',
              ErrorType.NOT_FOUND,
              ErrorSeverity.LOW,
              'APPOINTMENT_NOT_FOUND',
              { appointmentId: id },
              error,
              false,
              'Agendamento não encontrado.'
            )
          }
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('appointments:date')
        this.invalidateCache('appointments:barber')
        this.invalidateCache('appointments:client')
        this.invalidateCache(id)

        return { success: true, data }
      }
    )
  }

  /**
   * Cancela um agendamento
   */
  async cancel(id: string, reason?: string): Promise<ServiceResult<Appointment>> {
    return this.update(id, { 
      status: 'cancelado',
      observacoes: reason ? `Cancelado: ${reason}` : 'Cancelado'
    })
  }

  /**
   * Confirma um agendamento
   */
  async confirm(id: string): Promise<ServiceResult<Appointment>> {
    return this.updateStatus(id, 'confirmado')
  }

  /**
   * Inicia um agendamento
   */
  async start(id: string): Promise<ServiceResult<Appointment>> {
    return this.updateStatus(id, 'em_andamento')
  }

  /**
   * Finaliza um agendamento
   */
  async complete(id: string): Promise<ServiceResult<Appointment>> {
    return this.updateStatus(id, 'concluido')
  }

  /**
   * Valida conflito de horário
   */
  private async validateTimeSlot(
    funcionario_id: string,
    data_agendamento: string,
    hora_inicio: string,
    hora_fim: string,
    excludeId?: string
  ): Promise<void> {
    let query = this.query()
      .select('id, hora_inicio, hora_fim')
      .eq('funcionario_id', funcionario_id)
      .eq('data_agendamento', data_agendamento)
      .in('status', ['agendado', 'confirmado', 'em_andamento'])

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingAppointments, error } = await query

    if (error) {
      throw error
    }

    // Verificar conflitos
    const hasConflict = existingAppointments?.some(appointment => {
      const existingStart = appointment.hora_inicio
      const existingEnd = appointment.hora_fim
      
      // Verificar sobreposição de horários
      return (
        (hora_inicio >= existingStart && hora_inicio < existingEnd) ||
        (hora_fim > existingStart && hora_fim <= existingEnd) ||
        (hora_inicio <= existingStart && hora_fim >= existingEnd)
      )
    })

    if (hasConflict) {
      throw new ServiceError(
        'Conflito de horário detectado',
        ErrorType.CONFLICT,
        ErrorSeverity.MEDIUM,
        'TIME_SLOT_CONFLICT',
        { funcionario_id, data_agendamento, hora_inicio, hora_fim },
        undefined,
        false,
        'Este horário já está ocupado. Escolha outro horário.'
      )
    }
  }

  /**
   * Busca horários disponíveis para um funcionário
   */
  async getAvailableSlots(
    funcionario_id: string,
    date: string,
    duration: number = 60 // duração em minutos
  ): Promise<ServiceResult<string[]>> {
    return serviceInterceptors.execute(
      {
        method: 'getAvailableSlots',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { funcionario_id, date, duration },
      },
      async () => {
        // Buscar agendamentos existentes
        const { data: appointments, error } = await this.query()
          .select('hora_inicio, hora_fim')
          .eq('funcionario_id', funcionario_id)
          .eq('data_agendamento', date)
          .in('status', ['agendado', 'confirmado', 'em_andamento'])
          .order('hora_inicio')

        if (error) {
          throw error
        }

        // Gerar slots disponíveis (exemplo: 8h às 18h)
        const workStart = '08:00'
        const workEnd = '18:00'
        const slotDuration = duration
        
        const availableSlots = this.generateTimeSlots(
          workStart,
          workEnd,
          slotDuration,
          appointments || []
        )

        return { success: true, data: availableSlots }
      }
    )
  }

  /**
   * Gera slots de tempo disponíveis
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    bookedSlots: { hora_inicio: string; hora_fim: string }[]
  ): string[] {
    const slots: string[] = []
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)

    for (let time = start; time + duration <= end; time += duration) {
      const slotStart = this.minutesToTime(time)
      const slotEnd = this.minutesToTime(time + duration)

      // Verificar se o slot não conflita com agendamentos existentes
      const hasConflict = bookedSlots.some(booking => {
        const bookingStart = this.timeToMinutes(booking.hora_inicio)
        const bookingEnd = this.timeToMinutes(booking.hora_fim)
        
        return (
          (time >= bookingStart && time < bookingEnd) ||
          (time + duration > bookingStart && time + duration <= bookingEnd) ||
          (time <= bookingStart && time + duration >= bookingEnd)
        )
      })

      if (!hasConflict) {
        slots.push(slotStart)
      }
    }

    return slots
  }

  /**
   * Converte horário para minutos
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Converte minutos para horário
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  /**
   * Busca estatísticas de agendamentos
   */
  async getStats(startDate: string, endDate: string): Promise<ServiceResult<{
    total: number
    byStatus: Record<string, number>
    byBarber: Record<string, number>
    revenue: number
  }>> {
    return serviceInterceptors.execute(
      {
        method: 'getStats',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { startDate, endDate },
      },
      async () => {
        const { data, error } = await this.query()
          .select(`
            status,
            funcionario_id,
            valor_total,
            funcionario:profiles!funcionario_id(nome)
          `)
          .gte('data_agendamento', startDate)
          .lte('data_agendamento', endDate)

        if (error) {
          throw error
        }

        const appointments = data || []
        
        const stats = {
          total: appointments.length,
          byStatus: {} as Record<string, number>,
          byBarber: {} as Record<string, number>,
          revenue: 0,
        }

        appointments.forEach(appointment => {
          // Contar por status
          stats.byStatus[appointment.status] = (stats.byStatus[appointment.status] || 0) + 1
          
          // Contar por barbeiro
          const barberName = appointment.funcionario?.nome || 'Desconhecido'
          stats.byBarber[barberName] = (stats.byBarber[barberName] || 0) + 1
          
          // Somar receita (apenas agendamentos concluídos)
          if (appointment.status === 'concluido') {
            stats.revenue += appointment.valor_total || 0
          }
        })

        return { success: true, data: stats }
      }
    )
  }
}

// Instância singleton do service
export const appointmentService = new AppointmentService()