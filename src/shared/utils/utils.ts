import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS usando clsx e tailwind-merge
 * Útil para componentes com variantes condicionais
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata data para o padrão brasileiro
 */
export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(data)
}

/**
 * Formata data e hora para o padrão brasileiro
 */
export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

/**
 * Formata valor monetário para Real brasileiro
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata telefone brasileiro
 */
export function formatarTelefone(telefone: string): string {
  const apenasNumeros = telefone.replace(/\D/g, '').substring(0, 11)
  
  if (apenasNumeros.length === 0) return ''
  if (apenasNumeros.length === 1) return `(${apenasNumeros}`
  if (apenasNumeros.length <= 2) return `(${apenasNumeros}`
  if (apenasNumeros.length <= 6) return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`
  if (apenasNumeros.length <= 10) return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`
  
  return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`
}

/**
 * Gera ID único simples
 */
export function gerarId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}
