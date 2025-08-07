import { BaseService, ServiceResult, ServiceListResult } from '@/shared/services/base/BaseService'
import { serviceInterceptors } from '@/shared/services/base/ServiceInterceptors'
import { ServiceError, ErrorType, ErrorSeverity } from '@/shared/services/base/ErrorHandler'

/**
 * Interface do cliente
 */
export interface Client {
  id: string
  email: string
  nome: string
  telefone?: string
  avatar_url?: string
  data_nascimento?: string
  endereco?: string
  observacoes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Estatísticas
  total_agendamentos?: number
  ultimo_agendamento?: string
  valor_total_gasto?: number
}

/**
 * Dados para criação de cliente
 */
export interface CreateClientData {
  email: string
  nome: string
  telefone?: string
  data_nascimento?: string
  endereco?: string
  observacoes?: string
}

/**
 * Dados para atualização de cliente
 */
export interface UpdateClientData {
  nome?: string
  telefone?: string
  data_nascimento?: string
  endereco?: string
  observacoes?: string
  avatar_url?: string
  is_active?: boolean
}

/**
 * Filtros para busca de clientes
 */
export interface ClientFilters {
  is_active?: boolean
  search?: string
  data_inicio?: string
  data_fim?: string
  tem_agendamentos?: boolean
}

/**
 * Service para gerenciamento de clientes
 * 
 * @description
 * Service especializado para operações com clientes, estendendo
 * a funcionalidade base com métodos específicos do domínio.
 * 
 * @example
 * ```typescript
 * const clientService = new ClientService()
 * 
 * // Buscar cliente por email
 * const client = await clientService.findByEmail('client@example.com')
 * 
 * // Criar novo cliente
 * const newClient = await clientService.create({
 *   email: 'new@example.com',
 *   nome: 'Novo Cliente',
 *   telefone: '(11) 99999-9999'
 * })
 * 
 * // Buscar clientes ativos
 * const activeClients = await clientService.findActiveClients()
 * ```
 */
export class ClientService extends BaseService<Client> {
  constructor() {
    super({
      tableName: 'profiles',
      enableCache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutos
      maxRetries: 3,
      retryDelay: 1000,
    })
  }

  /**
   * Busca cliente por email
   */
  async findByEmail(email: string): Promise<ServiceResult<Client>> {
    const cacheKey = `client:email:${email}`
    const cached = this.getFromCache<Client>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findByEmail',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { email },
      },
      async () => {
        const { data, error } = await this.query()
          .select('*')
          .eq('email', email)
          .eq('role', 'client')
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new ServiceError(
              'Cliente não encontrado',
              ErrorType.NOT_FOUND,
              ErrorSeverity.LOW,
              'CLIENT_NOT_FOUND',
              { email },
              error,
              false,
              'Cliente não encontrado com este email.'
            )
          }
          throw error
        }

        this.setCache(cacheKey, data)
        return { success: true, data }
      }
    )
  }

  /**
   * Busca clientes ativos
   */
  async findActiveClients(): Promise<ServiceListResult<Client>> {
    const cacheKey = 'clients:active'
    const cached = this.getFromCache<Client[]>(cacheKey)

    if (cached) {
      return { success: true, data: cached }
    }

    return serviceInterceptors.execute(
      {
        method: 'findActiveClients',
        table: this.config.tableName,
        operation: 'SELECT',
      },
      async () => {
        const { data, error } = await this.query()
          .select('*')
          .eq('role', 'client')
          .eq('is_active', true)
          .order('nome')

        if (error) {
          throw error
        }

        this.setCache(cacheKey, data)
        return { 
          success: true, 
          data: data || [],
          count: data?.length || 0 
        }
      }
    )
  }

  /**
   * Busca clientes com filtros avançados
   */
  async findWithFilters(filters: ClientFilters): Promise<ServiceListResult<Client>> {
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
            agendamentos:agendamentos(count)
          `, { count: 'exact' })
          .eq('role', 'client')

        // Aplicar filtros
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active)
        }

        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
        }

        if (filters.data_inicio) {
          query = query.gte('created_at', filters.data_inicio)
        }

        if (filters.data_fim) {
          query = query.lte('created_at', filters.data_fim)
        }

        query = query.order('nome')

        const { data, error, count } = await query

        if (error) {
          throw error
        }

        // Processar dados com estatísticas
        const clients = (data || []).map(client => ({
          ...client,
          total_agendamentos: client.agendamentos?.[0]?.count || 0,
        }))

        // Filtrar por agendamentos se necessário
        let filteredClients = clients
        if (filters.tem_agendamentos !== undefined) {
          filteredClients = clients.filter(client => 
            filters.tem_agendamentos ? client.total_agendamentos > 0 : client.total_agendamentos === 0
          )
        }

        return {
          success: true,
          data: filteredClients,
          count: count || 0,
        }
      }
    )
  }

  /**
   * Cria um novo cliente
   */
  async create(clientData: CreateClientData): Promise<ServiceResult<Client>> {
    return serviceInterceptors.execute(
      {
        method: 'create',
        table: this.config.tableName,
        operation: 'INSERT',
        metadata: { email: clientData.email },
      },
      async () => {
        // Validar se email já existe
        const existingClient = await this.findByEmail(clientData.email).catch(() => null)
        if (existingClient?.success && existingClient.data) {
          throw new ServiceError(
            'Email já está em uso',
            ErrorType.CONFLICT,
            ErrorSeverity.MEDIUM,
            'EMAIL_ALREADY_EXISTS',
            { email: clientData.email },
            undefined,
            false,
            'Este email já está sendo usado por outro cliente.'
          )
        }

        // Criar cliente
        const { data, error } = await this.query()
          .insert({
            ...clientData,
            role: 'client',
            is_active: true,
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') { // unique_violation
            throw new ServiceError(
              'Email já está em uso',
              ErrorType.CONFLICT,
              ErrorSeverity.MEDIUM,
              'EMAIL_ALREADY_EXISTS',
              { email: clientData.email },
              error,
              false,
              'Este email já está sendo usado por outro cliente.'
            )
          }
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('clients:active')
        this.invalidateCache(`client:email:${clientData.email}`)

        return { success: true, data }
      }
    )
  }

  /**
   * Atualiza um cliente existente
   */
  async update(id: string, clientData: UpdateClientData): Promise<ServiceResult<Client>> {
    return serviceInterceptors.execute(
      {
        method: 'update',
        table: this.config.tableName,
        operation: 'UPDATE',
        metadata: { clientId: id },
      },
      async () => {
        const { data, error } = await this.query()
          .eq('id', id)
          .eq('role', 'client')
          .update({
            ...clientData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new ServiceError(
              'Cliente não encontrado',
              ErrorType.NOT_FOUND,
              ErrorSeverity.LOW,
              'CLIENT_NOT_FOUND',
              { clientId: id },
              error,
              false,
              'Cliente não encontrado.'
            )
          }
          throw error
        }

        // Invalidar caches relacionados
        this.invalidateCache('clients:active')
        this.invalidateCache(`client:email:${data.email}`)
        this.invalidateCache(id)

        return { success: true, data }
      }
    )
  }

  /**
   * Desativa um cliente (soft delete)
   */
  async deactivate(id: string): Promise<ServiceResult<Client>> {
    return this.update(id, { is_active: false })
  }

  /**
   * Reativa um cliente
   */
  async activate(id: string): Promise<ServiceResult<Client>> {
    return this.update(id, { is_active: true })
  }

  /**
   * Busca clientes recentemente cadastrados
   */
  async findRecentClients(days = 7): Promise<ServiceListResult<Client>> {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    return serviceInterceptors.execute(
      {
        method: 'findRecentClients',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { days },
      },
      async () => {
        const { data, error } = await this.query()
          .select('*')
          .eq('role', 'client')
          .gte('created_at', dateThreshold.toISOString())
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        return {
          success: true,
          data: data || [],
          count: data?.length || 0,
        }
      }
    )
  }

  /**
   * Busca estatísticas detalhadas do cliente
   */
  async getClientStats(clientId: string): Promise<ServiceResult<{
    total_agendamentos: number
    agendamentos_concluidos: number
    agendamentos_cancelados: number
    valor_total_gasto: number
    ultimo_agendamento?: string
    servico_favorito?: string
    funcionario_favorito?: string
  }>> {
    return serviceInterceptors.execute(
      {
        method: 'getClientStats',
        table: 'agendamentos',
        operation: 'SELECT',
        metadata: { clientId },
      },
      async () => {
        // Buscar agendamentos do cliente
        const { data: agendamentos, error } = await this.query()
          .from('agendamentos')
          .select(`
            *,
            servico:servicos(nome),
            funcionario:profiles!funcionario_id(nome)
          `)
          .eq('cliente_id', clientId)
          .order('data_agendamento', { ascending: false })

        if (error) {
          throw error
        }

        const appointments = agendamentos || []

        // Calcular estatísticas
        const stats = {
          total_agendamentos: appointments.length,
          agendamentos_concluidos: appointments.filter(a => a.status === 'concluido').length,
          agendamentos_cancelados: appointments.filter(a => a.status === 'cancelado').length,
          valor_total_gasto: appointments
            .filter(a => a.status === 'concluido')
            .reduce((sum, a) => sum + (a.valor_total || 0), 0),
          ultimo_agendamento: appointments[0]?.data_agendamento,
        }

        // Encontrar serviço favorito
        const serviceCounts = new Map()
        appointments.forEach(a => {
          if (a.servico?.nome) {
            const count = serviceCounts.get(a.servico.nome) || 0
            serviceCounts.set(a.servico.nome, count + 1)
          }
        })

        if (serviceCounts.size > 0) {
          const favoriteService = Array.from(serviceCounts.entries())
            .sort(([,a], [,b]) => b - a)[0]
          stats.servico_favorito = favoriteService[0]
        }

        // Encontrar funcionário favorito
        const barberCounts = new Map()
        appointments.forEach(a => {
          if (a.funcionario?.nome) {
            const count = barberCounts.get(a.funcionario.nome) || 0
            barberCounts.set(a.funcionario.nome, count + 1)
          }
        })

        if (barberCounts.size > 0) {
          const favoriteBarber = Array.from(barberCounts.entries())
            .sort(([,a], [,b]) => b - a)[0]
          stats.funcionario_favorito = favoriteBarber[0]
        }

        return { success: true, data: stats }
      }
    )
  }

  /**
   * Busca clientes por aniversário
   */
  async findBirthdayClients(month?: number): Promise<ServiceListResult<Client>> {
    return serviceInterceptors.execute(
      {
        method: 'findBirthdayClients',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { month },
      },
      async () => {
        let query = this.query()
          .select('*')
          .eq('role', 'client')
          .eq('is_active', true)
          .not('data_nascimento', 'is', null)

        if (month) {
          // Filtrar por mês específico
          query = query.eq('EXTRACT(MONTH FROM data_nascimento)', month)
        } else {
          // Aniversariantes do mês atual
          const currentMonth = new Date().getMonth() + 1
          query = query.eq('EXTRACT(MONTH FROM data_nascimento)', currentMonth)
        }

        query = query.order('EXTRACT(DAY FROM data_nascimento)')

        const { data, error } = await query

        if (error) {
          throw error
        }

        return {
          success: true,
          data: data || [],
          count: data?.length || 0,
        }
      }
    )
  }

  /**
   * Busca clientes inativos (sem agendamentos recentes)
   */
  async findInactiveClients(days = 90): Promise<ServiceListResult<Client>> {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    return serviceInterceptors.execute(
      {
        method: 'findInactiveClients',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { days },
      },
      async () => {
        // Buscar clientes que não têm agendamentos recentes
        const { data, error } = await this.query()
          .select(`
            *,
            ultimo_agendamento:agendamentos(data_agendamento)
          `)
          .eq('role', 'client')
          .eq('is_active', true)
          .or(`agendamentos.data_agendamento.lt.${dateThreshold.toISOString()},agendamentos.is.null`)
          .order('nome')

        if (error) {
          throw error
        }

        return {
          success: true,
          data: data || [],
          count: data?.length || 0,
        }
      }
    )
  }

  /**
   * Exporta dados dos clientes para CSV
   */
  async exportToCSV(filters?: ClientFilters): Promise<ServiceResult<string>> {
    return serviceInterceptors.execute(
      {
        method: 'exportToCSV',
        table: this.config.tableName,
        operation: 'SELECT',
        metadata: { filters },
      },
      async () => {
        const clientsResult = await this.findWithFilters(filters || {})
        
        if (!clientsResult.success || !clientsResult.data) {
          throw new ServiceError(
            'Erro ao buscar clientes para exportação',
            ErrorType.UNKNOWN,
            ErrorSeverity.MEDIUM,
            'EXPORT_ERROR',
            {},
            undefined,
            false,
            'Não foi possível exportar os dados dos clientes.'
          )
        }

        const clients = clientsResult.data

        // Gerar CSV
        const headers = [
          'Nome',
          'Email',
          'Telefone',
          'Data de Nascimento',
          'Endereço',
          'Total de Agendamentos',
          'Data de Cadastro',
          'Status'
        ]

        const csvRows = [
          headers.join(','),
          ...clients.map(client => [
            `"${client.nome}"`,
            `"${client.email}"`,
            `"${client.telefone || ''}"`,
            `"${client.data_nascimento || ''}"`,
            `"${client.endereco || ''}"`,
            client.total_agendamentos || 0,
            `"${new Date(client.created_at).toLocaleDateString('pt-BR')}"`,
            client.is_active ? 'Ativo' : 'Inativo'
          ].join(','))
        ]

        const csvContent = csvRows.join('\n')

        return { success: true, data: csvContent }
      }
    )
  }
}

// Instância singleton do service
export const clientService = new ClientService()