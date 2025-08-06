import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// URL e chave anônima do Supabase (devem ser configuradas no .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

/**
 * Cliente Supabase para uso no lado do cliente (browser)
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Cliente Supabase tradicional (compatibilidade)
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Tipos de banco de dados gerados pelo Supabase CLI
 * Execute: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */
export type Database = {
  // Tipos serão gerados automaticamente pelo Supabase CLI
  public: {
    Tables: Record<string, unknown>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
  }
}
