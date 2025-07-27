/**
 * Utilitário para aplicar migração de especialidades
 */

import { supabase } from '@/lib/supabase'

export async function applyEspecialidadesMigration() {
  try {
    console.log('🚀 Aplicando migração de especialidades...')

    // Criar tabela funcionario_servicos
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        -- Criar tabela de relacionamento funcionário-serviços
        CREATE TABLE IF NOT EXISTS public.funcionario_servicos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(funcionario_id, service_id)
        );

        -- Habilitar RLS
        ALTER TABLE public.funcionario_servicos ENABLE ROW LEVEL SECURITY;

        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_funcionario_servicos_funcionario_id ON public.funcionario_servicos(funcionario_id);
        CREATE INDEX IF NOT EXISTS idx_funcionario_servicos_service_id ON public.funcionario_servicos(service_id);
      `
    })

    if (createTableError) {
      throw createTableError
    }

    // Criar políticas RLS
    const { error: policiesError } = await supabase.rpc('exec', {
      sql: `
        -- Política para admins
        DROP POLICY IF EXISTS "Admins podem gerenciar funcionario_servicos" ON public.funcionario_servicos;
        CREATE POLICY "Admins podem gerenciar funcionario_servicos" ON public.funcionario_servicos
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role IN ('admin', 'saas_owner')
            )
          );

        -- Política para funcionários verem seus serviços
        DROP POLICY IF EXISTS "Funcionários podem ver seus serviços" ON public.funcionario_servicos;
        CREATE POLICY "Funcionários podem ver seus serviços" ON public.funcionario_servicos
          FOR SELECT USING (funcionario_id = auth.uid());

        -- Política para clientes verem para agendamento
        DROP POLICY IF EXISTS "Clientes podem ver para agendamento" ON public.funcionario_servicos;
        CREATE POLICY "Clientes podem ver para agendamento" ON public.funcionario_servicos
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'client'
            )
          );
      `
    })

    if (policiesError) {
      throw policiesError
    }

    console.log('✅ Migração aplicada com sucesso!')
    return { success: true }

  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}