/**
 * Constantes para validação
 */

export const VALIDACAO = {
  // Nome
  NOME_MIN_LENGTH: 2,
  NOME_MAX_LENGTH: 100,
  
  // Senha
  SENHA_MIN_LENGTH: 6,
  
  // Email
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Telefone brasileiro
  TELEFONE_REGEX: /^\(?(\d{2})\)?[\s-]?9?\d{4}[\s-]?\d{4}$/,
  
  // Idade
  IDADE_MIN: 13,
  IDADE_MAX: 120,
} as const
