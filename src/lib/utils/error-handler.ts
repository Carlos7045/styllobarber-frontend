/**
 * Utilitário para tratamento robusto de erros do Supabase
 */

export interface SupabaseErrorDetails {
  message: string
  code: string | null
  details: string | null
  hint: string | null
  status: number | null
  statusText: string | null
  originalError: any
}

/**
 * Extrai informações detalhadas de um erro do Supabase
 */
export function parseSupabaseError(error: any): SupabaseErrorDetails {
  if (!error) {
    return {
      message: 'Erro desconhecido',
      code: null,
      details: null,
      hint: null,
      status: null,
      statusText: null,
      originalError: null
    }
  }

  // Se o erro é uma string
  if (typeof error === 'string') {
    return {
      message: error,
      code: null,
      details: null,
      hint: null,
      status: null,
      statusText: null,
      originalError: error
    }
  }

  // Se o erro é um objeto
  return {
    message: error?.message || error?.msg || 'Erro desconhecido',
    code: error?.code || error?.error_code || null,
    details: error?.details || error?.error_details || null,
    hint: error?.hint || error?.error_hint || null,
    status: error?.status || error?.statusCode || null,
    statusText: error?.statusText || null,
    originalError: error
  }
}

/**
 * Formata um erro do Supabase para logging
 */
export function formatSupabaseErrorForLog(error: any, context?: string): Record<string, any> {
  const parsed = parseSupabaseError(error)
  
  return {
    context: context || 'Unknown',
    message: parsed.message,
    code: parsed.code,
    details: parsed.details,
    hint: parsed.hint,
    status: parsed.status,
    statusText: parsed.statusText,
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
    errorKeys: error ? Object.keys(error) : [],
    timestamp: new Date().toISOString(),
    serializedError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
  }
}

/**
 * Verifica se é um erro específico do Supabase
 */
export function isSupabaseError(error: any, code?: string): boolean {
  if (!error) return false
  
  const parsed = parseSupabaseError(error)
  
  if (code) {
    return parsed.code === code
  }
  
  return !!(parsed.code || parsed.details || parsed.hint)
}

/**
 * Verifica se é um erro de "não encontrado"
 */
export function isNotFoundError(error: any): boolean {
  return isSupabaseError(error, 'PGRST116')
}

/**
 * Verifica se é um erro de autenticação
 */
export function isAuthError(error: any): boolean {
  const parsed = parseSupabaseError(error)
  return parsed.status === 401 || parsed.code === 'UNAUTHORIZED'
}

/**
 * Verifica se é um erro de permissão
 */
export function isPermissionError(error: any): boolean {
  const parsed = parseSupabaseError(error)
  return parsed.status === 403 || parsed.code === 'FORBIDDEN' || 
         parsed.message?.includes('permission') ||
         parsed.message?.includes('policy')
}

/**
 * Cria uma mensagem de erro amigável para o usuário
 */
export function createUserFriendlyMessage(error: any): string {
  const parsed = parseSupabaseError(error)
  
  // Mensagens específicas para códigos conhecidos
  switch (parsed.code) {
    case 'PGRST116':
      return 'Dados não encontrados'
    case 'PGRST301':
      return 'Acesso negado'
    case '23505':
      return 'Este registro já existe'
    case '23503':
      return 'Não é possível excluir este registro pois está sendo usado'
    case '42501':
      return 'Você não tem permissão para esta operação'
    default:
      // Mensagens baseadas no status HTTP
      if (parsed.status === 401) {
        return 'Você precisa estar logado para realizar esta operação'
      }
      if (parsed.status === 403) {
        return 'Você não tem permissão para realizar esta operação'
      }
      if (parsed.status === 404) {
        return 'Dados não encontrados'
      }
      if (parsed.status === 409) {
        return 'Conflito: este registro já existe'
      }
      if (parsed.status === 422) {
        return 'Dados inválidos fornecidos'
      }
      if (parsed.status === 500) {
        return 'Erro interno do servidor. Tente novamente em alguns minutos'
      }
      
      // Fallback para mensagem genérica
      return parsed.message || 'Ocorreu um erro inesperado'
  }
}