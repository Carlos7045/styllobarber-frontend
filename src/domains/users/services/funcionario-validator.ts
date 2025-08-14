/**
 * Serviço de validação para funcionários
 * Implementa validações robustas para criação e atualização de funcionários
 */

import { supabase } from '@/lib/supabase'

// Interfaces para validação
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export interface CreateFuncionarioValidationData {
  nome: string
  email: string
  telefone?: string
  role: 'admin' | 'barber'
  especialidades?: string[]
}

export interface UpdateFuncionarioValidationData {
  id: string
  nome?: string
  email?: string
  telefone?: string
  role?: 'admin' | 'barber'
  ativo?: boolean
}

export interface DeleteFuncionarioValidationData {
  id: string
  nome: string
  role: 'admin' | 'barber'
}

// Regex patterns para validação
const VALIDATION_PATTERNS = {
  // Email brasileiro mais flexível
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Telefone brasileiro (com ou sem formatação)
  telefone: /^(?:\+55\s?)?(?:\(?(?:11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|68|69|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99)\)?\s?)?(?:9\s?)?[0-9]{4}[\s-]?[0-9]{4}$/,
  
  // Nome (pelo menos 2 palavras, mínimo 3 caracteres cada)
  nome: /^[a-zA-ZÀ-ÿ\s]{2,}(\s+[a-zA-ZÀ-ÿ\s]{2,})+$/,
  
  // Caracteres especiais perigosos
  xss: /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i,
} as const

export class FuncionarioValidator {
  /**
   * Valida dados para criação de funcionário
   */
  static async validateCreate(data: CreateFuncionarioValidationData): Promise<ValidationResult> {
    console.log('🔍 Validando dados para criação de funcionário:', data.email)
    
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Sanitizar dados
    const sanitizedData = this.sanitizeData(data)

    // Validações básicas
    this.validateBasicFields(sanitizedData, errors)

    // Validações específicas para criação
    await this.validateEmailUniqueness(sanitizedData.email, errors)
    
    // Validar especialidades se fornecidas
    if (sanitizedData.especialidades && sanitizedData.especialidades.length > 0) {
      await this.validateEspecialidades(sanitizedData.especialidades, errors, warnings)
    }

    // Validações de negócio
    this.validateBusinessRules(sanitizedData, errors, warnings)

    const isValid = errors.length === 0
    console.log(`${isValid ? '✅' : '❌'} Validação de criação: ${errors.length} erros, ${warnings.length} avisos`)

    return {
      isValid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Valida dados para atualização de funcionário
   */
  static async validateUpdate(data: UpdateFuncionarioValidationData): Promise<ValidationResult> {
    console.log('🔍 Validando dados para atualização de funcionário:', data.id)
    
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Verificar se funcionário existe
    const funcionarioExists = await this.checkFuncionarioExists(data.id)
    if (!funcionarioExists) {
      errors.push({
        field: 'id',
        message: 'Funcionário não encontrado',
        code: 'FUNCIONARIO_NOT_FOUND'
      })
      return { isValid: false, errors }
    }

    // Sanitizar dados
    const sanitizedData = this.sanitizeUpdateData(data)

    // Validar campos fornecidos
    if (sanitizedData.nome !== undefined) {
      this.validateNome(sanitizedData.nome, errors)
    }

    if (sanitizedData.email !== undefined) {
      this.validateEmail(sanitizedData.email, errors)
      await this.validateEmailUniqueness(sanitizedData.email, errors, data.id)
    }

    if (sanitizedData.telefone !== undefined) {
      this.validateTelefone(sanitizedData.telefone, errors)
    }

    if (sanitizedData.role !== undefined) {
      await this.validateRoleChange(data.id, sanitizedData.role, errors, warnings)
    }

    // Validar desativação
    if (sanitizedData.ativo === false) {
      await this.validateDeactivation(data.id, errors, warnings)
    }

    const isValid = errors.length === 0
    console.log(`${isValid ? '✅' : '❌'} Validação de atualização: ${errors.length} erros, ${warnings.length} avisos`)

    return {
      isValid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Valida se funcionário pode ser deletado
   */
  static async validateDelete(data: DeleteFuncionarioValidationData): Promise<ValidationResult> {
    console.log('🔍 Validando deleção de funcionário:', data.id)
    
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Verificar se funcionário existe
    const funcionarioExists = await this.checkFuncionarioExists(data.id)
    if (!funcionarioExists) {
      errors.push({
        field: 'id',
        message: 'Funcionário não encontrado',
        code: 'FUNCIONARIO_NOT_FOUND'
      })
      return { isValid: false, errors }
    }

    // Verificar agendamentos futuros
    await this.validateNoFutureAppointments(data.id, errors)

    // Verificar se é o último admin
    if (data.role === 'admin') {
      await this.validateNotLastAdmin(data.id, errors)
    }

    // Verificar dependências
    await this.validateNoDependencies(data.id, warnings)

    const isValid = errors.length === 0
    console.log(`${isValid ? '✅' : '❌'} Validação de deleção: ${errors.length} erros, ${warnings.length} avisos`)

    return {
      isValid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Sanitiza dados de entrada
   */
  private static sanitizeData(data: CreateFuncionarioValidationData): CreateFuncionarioValidationData {
    return {
      nome: data.nome?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      telefone: data.telefone?.trim() || undefined,
      role: data.role,
      especialidades: data.especialidades
    }
  }

  /**
   * Sanitiza dados de atualização
   */
  private static sanitizeUpdateData(data: UpdateFuncionarioValidationData): UpdateFuncionarioValidationData {
    return {
      ...data,
      nome: data.nome?.trim() || undefined,
      email: data.email?.trim().toLowerCase() || undefined,
      telefone: data.telefone?.trim() || undefined,
    }
  }

  /**
   * Valida campos básicos obrigatórios
   */
  private static validateBasicFields(data: CreateFuncionarioValidationData, errors: ValidationError[]): void {
    // Validar nome
    this.validateNome(data.nome, errors)

    // Validar email
    this.validateEmail(data.email, errors)

    // Validar telefone (se fornecido)
    if (data.telefone) {
      this.validateTelefone(data.telefone, errors)
    }

    // Validar role
    if (!data.role || !['admin', 'barber'].includes(data.role)) {
      errors.push({
        field: 'role',
        message: 'Cargo deve ser "admin" ou "barber"',
        code: 'INVALID_ROLE'
      })
    }
  }

  /**
   * Valida nome
   */
  private static validateNome(nome: string, errors: ValidationError[]): void {
    if (!nome || nome.length < 2) {
      errors.push({
        field: 'nome',
        message: 'Nome é obrigatório e deve ter pelo menos 2 caracteres',
        code: 'NOME_REQUIRED'
      })
      return
    }

    if (nome.length > 100) {
      errors.push({
        field: 'nome',
        message: 'Nome deve ter no máximo 100 caracteres',
        code: 'NOME_TOO_LONG'
      })
    }

    // Verificar se tem pelo menos nome e sobrenome
    const palavras = nome.trim().split(/\s+/)
    if (palavras.length < 2) {
      errors.push({
        field: 'nome',
        message: 'Digite nome e sobrenome completos',
        code: 'NOME_INCOMPLETE'
      })
    }

    // Verificar caracteres especiais perigosos
    if (VALIDATION_PATTERNS.xss.test(nome)) {
      errors.push({
        field: 'nome',
        message: 'Nome contém caracteres não permitidos',
        code: 'NOME_INVALID_CHARS'
      })
    }
  }

  /**
   * Valida email
   */
  private static validateEmail(email: string, errors: ValidationError[]): void {
    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'EMAIL_REQUIRED'
      })
      return
    }

    if (!VALIDATION_PATTERNS.email.test(email)) {
      errors.push({
        field: 'email',
        message: 'Digite um email válido',
        code: 'EMAIL_INVALID'
      })
    }

    if (email.length > 255) {
      errors.push({
        field: 'email',
        message: 'Email deve ter no máximo 255 caracteres',
        code: 'EMAIL_TOO_LONG'
      })
    }

    // Verificar caracteres especiais perigosos
    if (VALIDATION_PATTERNS.xss.test(email)) {
      errors.push({
        field: 'email',
        message: 'Email contém caracteres não permitidos',
        code: 'EMAIL_INVALID_CHARS'
      })
    }
  }

  /**
   * Valida telefone brasileiro
   */
  private static validateTelefone(telefone: string, errors: ValidationError[]): void {
    if (!telefone) return // Telefone é opcional

    // Remover formatação para validação
    const telefoneNumeros = telefone.replace(/\D/g, '')

    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 13) {
      errors.push({
        field: 'telefone',
        message: 'Telefone deve ter entre 10 e 13 dígitos',
        code: 'TELEFONE_INVALID_LENGTH'
      })
      return
    }

    if (!VALIDATION_PATTERNS.telefone.test(telefone)) {
      errors.push({
        field: 'telefone',
        message: 'Digite um telefone brasileiro válido (ex: (11) 99999-9999)',
        code: 'TELEFONE_INVALID_FORMAT'
      })
    }
  }

  /**
   * Verifica se email já está em uso
   */
  private static async validateEmailUniqueness(email: string, errors: ValidationError[], excludeId?: string): Promise<void> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('email', email)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao verificar unicidade do email:', error)
        return
      }

      if (data) {
        errors.push({
          field: 'email',
          message: 'Este email já está sendo usado por outro funcionário',
          code: 'EMAIL_ALREADY_EXISTS'
        })
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar unicidade do email:', err)
    }
  }

  /**
   * Valida especialidades fornecidas
   */
  private static async validateEspecialidades(especialidades: string[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    try {
      // Verificar se os serviços existem e estão ativos
      const { data: services, error } = await supabase
        .from('services')
        .select('id, nome, ativo')
        .in('id', especialidades)

      if (error) {
        console.warn('⚠️ Erro ao validar especialidades:', error)
        return
      }

      const foundIds = services?.map(s => s.id) || []
      const missingIds = especialidades.filter(id => !foundIds.includes(id))

      if (missingIds.length > 0) {
        errors.push({
          field: 'especialidades',
          message: `Serviços não encontrados: ${missingIds.join(', ')}`,
          code: 'ESPECIALIDADES_NOT_FOUND'
        })
      }

      // Avisar sobre serviços inativos
      const inactiveServices = services?.filter(s => !s.ativo) || []
      if (inactiveServices.length > 0) {
        warnings.push({
          field: 'especialidades',
          message: `Alguns serviços estão inativos: ${inactiveServices.map(s => s.nome).join(', ')}`,
          code: 'ESPECIALIDADES_INACTIVE'
        })
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar especialidades:', err)
    }
  }

  /**
   * Valida regras de negócio
   */
  private static validateBusinessRules(data: CreateFuncionarioValidationData, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Barbeiros devem ter pelo menos uma especialidade
    if (data.role === 'barber' && (!data.especialidades || data.especialidades.length === 0)) {
      warnings.push({
        field: 'especialidades',
        message: 'Barbeiros geralmente precisam de pelo menos uma especialidade',
        code: 'BARBER_NO_ESPECIALIDADES'
      })
    }

    // Admins não precisam de especialidades
    if (data.role === 'admin' && data.especialidades && data.especialidades.length > 0) {
      warnings.push({
        field: 'especialidades',
        message: 'Administradores geralmente não precisam de especialidades',
        code: 'ADMIN_WITH_ESPECIALIDADES'
      })
    }
  }

  /**
   * Verifica se funcionário existe
   */
  private static async checkFuncionarioExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  /**
   * Valida mudança de cargo
   */
  private static async validateRoleChange(id: string, newRole: 'admin' | 'barber', errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    try {
      // Buscar role atual
      const { data: currentProfile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()

      if (error || !currentProfile) return

      const currentRole = currentProfile.role

      // Se está mudando de admin para barber, verificar se não é o último admin
      if (currentRole === 'admin' && newRole === 'barber') {
        await this.validateNotLastAdmin(id, errors)
      }

      // Se está mudando para barber, avisar sobre especialidades
      if (newRole === 'barber') {
        warnings.push({
          field: 'role',
          message: 'Lembre-se de configurar as especialidades do barbeiro',
          code: 'BARBER_NEEDS_ESPECIALIDADES'
        })
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar mudança de cargo:', err)
    }
  }

  /**
   * Valida desativação de funcionário
   */
  private static async validateDeactivation(id: string, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    // Verificar agendamentos futuros
    await this.validateNoFutureAppointments(id, errors)

    // Verificar se é admin e se não é o último
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()

      if (!error && profile?.role === 'admin') {
        await this.validateNotLastAdmin(id, warnings) // Warning ao invés de erro para desativação
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar desativação:', err)
    }
  }

  /**
   * Verifica se não há agendamentos futuros
   */
  private static async validateNoFutureAppointments(funcionarioId: string, errors: ValidationError[]): Promise<void> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, data_agendamento')
        .eq('barbeiro_id', funcionarioId)
        .gte('data_agendamento', new Date().toISOString())
        .neq('status', 'cancelado')

      if (error) {
        console.warn('⚠️ Erro ao verificar agendamentos futuros:', error)
        return
      }

      if (appointments && appointments.length > 0) {
        errors.push({
          field: 'agendamentos',
          message: `Funcionário possui ${appointments.length} agendamento(s) futuro(s). Cancele-os primeiro.`,
          code: 'HAS_FUTURE_APPOINTMENTS'
        })
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar agendamentos futuros:', err)
    }
  }

  /**
   * Verifica se não é o último admin
   */
  private static async validateNotLastAdmin(excludeId: string, errors: ValidationError[]): Promise<void>
  private static async validateNotLastAdmin(excludeId: string, warnings: ValidationWarning[]): Promise<void>
  private static async validateNotLastAdmin(excludeId: string, errorsOrWarnings: ValidationError[] | ValidationWarning[]): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('ativo', true)
        .neq('id', excludeId)

      if (error) {
        console.warn('⚠️ Erro ao verificar outros admins:', error)
        return
      }

      if (!admins || admins.length === 0) {
        const message = {
          field: 'role',
          message: 'Não é possível remover o último administrador do sistema',
          code: 'LAST_ADMIN'
        }

        // Type guard para determinar se é array de errors ou warnings
        if (errorsOrWarnings.length === 0 || 'message' in errorsOrWarnings[0]) {
          (errorsOrWarnings as ValidationError[]).push(message as ValidationError)
        } else {
          (errorsOrWarnings as ValidationWarning[]).push(message as ValidationWarning)
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar último admin:', err)
    }
  }

  /**
   * Verifica dependências do funcionário
   */
  private static async validateNoDependencies(funcionarioId: string, warnings: ValidationWarning[]): Promise<void> {
    try {
      // Verificar histórico de agendamentos
      const { data: pastAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barbeiro_id', funcionarioId)
        .lt('data_agendamento', new Date().toISOString())

      if (!appointmentsError && pastAppointments && pastAppointments.length > 0) {
        warnings.push({
          field: 'historico',
          message: `Funcionário possui ${pastAppointments.length} agendamento(s) no histórico`,
          code: 'HAS_APPOINTMENT_HISTORY'
        })
      }

      // Verificar especialidades
      const { data: especialidades, error: especialidadesError } = await supabase
        .from('funcionario_servicos')
        .select('id')
        .eq('funcionario_id', funcionarioId)

      if (!especialidadesError && especialidades && especialidades.length > 0) {
        warnings.push({
          field: 'especialidades',
          message: `Funcionário possui ${especialidades.length} especialidade(s) configurada(s)`,
          code: 'HAS_ESPECIALIDADES'
        })
      }
    } catch (err) {
      console.warn('⚠️ Erro ao validar dependências:', err)
    }
  }
}