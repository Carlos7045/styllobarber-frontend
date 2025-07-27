/**
 * Hook de debug para especialidades (versão mínima para testar)
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export function useFuncionariosEspecialidades() {
  const { hasRole } = useAuth()
  const [funcionarios] = useState([])
  const [loading] = useState(false)
  const [error] = useState(null)

  // Verificar permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Função de teste mínima
  const updateFuncionarioEspecialidades = useCallback(async (data: { funcionario_id: string; service_ids: string[] }) => {
    console.log('🧪 TESTE - Dados recebidos:', data)
    
    if (!hasPermission) {
      console.log('❌ TESTE - Sem permissão')
      return { success: false, error: 'Acesso negado' }
    }

    try {
      console.log('🧪 TESTE - Iniciando operação...')
      
      // Teste 1: Verificar se consegue acessar a tabela
      console.log('🧪 TESTE 1 - Verificando tabela...')
      const { data: testData, error: testError } = await supabase
        .from('funcionario_servicos')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.log('❌ TESTE 1 - Erro ao acessar tabela:', testError)
        return { 
          success: false, 
          error: `Tabela não existe: ${testError.message}` 
        }
      }
      
      console.log('✅ TESTE 1 - Tabela acessível, dados:', testData)
      
      // Teste 2: Tentar deletar
      console.log('🧪 TESTE 2 - Tentando deletar...')
      const { error: deleteError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('funcionario_id', data.funcionario_id)
      
      if (deleteError) {
        console.log('❌ TESTE 2 - Erro ao deletar:', deleteError)
        return { 
          success: false, 
          error: `Erro ao deletar: ${deleteError.message}` 
        }
      }
      
      console.log('✅ TESTE 2 - Delete executado')
      
      // Teste 3: Tentar inserir (se houver dados)
      if (data.service_ids.length > 0) {
        console.log('🧪 TESTE 3 - Tentando inserir...')
        const insertData = data.service_ids.map(service_id => ({
          funcionario_id: data.funcionario_id,
          service_id
        }))
        
        console.log('🧪 TESTE 3 - Dados para inserir:', insertData)
        
        const { error: insertError } = await supabase
          .from('funcionario_servicos')
          .insert(insertData)
        
        if (insertError) {
          console.log('❌ TESTE 3 - Erro ao inserir:', insertError)
          return { 
            success: false, 
            error: `Erro ao inserir: ${insertError.message}` 
          }
        }
        
        console.log('✅ TESTE 3 - Insert executado')
      } else {
        console.log('ℹ️ TESTE 3 - Nada para inserir (sem especialidades)')
      }
      
      console.log('🎉 TESTE - Operação concluída com sucesso!')
      return { success: true }
      
    } catch (err) {
      console.log('💥 TESTE - Erro capturado:', err)
      console.log('💥 TESTE - Tipo:', typeof err)
      console.log('💥 TESTE - JSON:', JSON.stringify(err))
      
      return {
        success: false,
        error: `Erro de teste: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  }, [hasPermission])

  // Funções placeholder
  const refetch = useCallback(() => {}, [])
  const getFuncionariosByService = useCallback(() => [], [])
  const getServicesByFuncionario = useCallback(() => [], [])
  const searchFuncionarios = useCallback(() => [], [])
  const applyFilters = useCallback(() => {}, [])
  const clearFilters = useCallback(() => {}, [])
  const clearCache = useCallback(() => {}, [])

  return {
    funcionarios,
    filteredFuncionarios: funcionarios,
    loading,
    error,
    refetch,
    updateFuncionarioEspecialidades,
    getFuncionariosByService,
    getServicesByFuncionario,
    searchFuncionarios,
    applyFilters,
    clearFilters,
    clearCache,
    currentFilters: {},
    hasActiveFilters: false,
    stats: {
      total_funcionarios: 0,
      total_admins: 0,
      total_barbeiros: 0,
      funcionarios_ativos: 0,
      media_servicos_por_funcionario: 0
    }
  }
}