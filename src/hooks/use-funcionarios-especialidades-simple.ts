/**
 * Hook simplificado para funcionários (versão temporária)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { FuncionarioComEspecialidades, UpdateFuncionarioEspecialidadesData } from '@/types/funcionarios'

export function useFuncionariosEspecialidades() {
  const { hasRole } = useAuth()
  const [funcionarios, setFuncionarios] = useState<FuncionarioComEspecialidades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Carregar funcionários
  const loadFuncionarios = useCallback(async () => {
    if (!hasPermission) {
      setError('Acesso negado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar funcionários
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          telefone,
          avatar_url,
          role,
          ativo,
          created_at,
          updated_at
        `)
        .in('role', ['admin', 'barber'])
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Para cada funcionário, buscar seus serviços
      const funcionariosData: FuncionarioComEspecialidades[] = []
      
      for (const funcionario of data || []) {
        let servicos: any[] = []
        
        try {
          // Buscar serviços do funcionário
          const { data: servicosData, error: servicosError } = await supabase
            .from('funcionario_servicos')
            .select(`
              service_id,
              services!funcionario_servicos_service_id_fkey(
                id,
                nome,
                descricao,
                preco,
                duracao_minutos,
                categoria
              )
            `)
            .eq('funcionario_id', funcionario.id)
          
          if (!servicosError && servicosData) {
            servicos = servicosData.map(item => item.services).filter(Boolean)
            console.log(`Serviços encontrados para ${funcionario.nome}:`, servicos.length)
          } else if (servicosError) {
            console.log(`Erro ao buscar serviços para ${funcionario.nome}:`, servicosError)
          }
        } catch (err) {
          console.log('Erro ao buscar especialidades:', err)
        }
        
        funcionariosData.push({
          ...funcionario,
          servicos
        })
      }

      console.log('Funcionários carregados com especialidades:', funcionariosData.map(f => ({
        nome: f.nome,
        especialidades: f.servicos?.length || 0
      })))

      setFuncionarios(funcionariosData)
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários')
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  // Refetch
  const refetch = useCallback(() => {
    loadFuncionarios()
  }, [loadFuncionarios])

  // Atualizar especialidades de um funcionário
  const updateFuncionarioEspecialidades = useCallback(async (data: UpdateFuncionarioEspecialidadesData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      console.log('🔄 Atualizando especialidades:', data)

      // Verificar se a tabela existe tentando uma operação simples
      try {
        console.log('🔍 Verificando se tabela funcionario_servicos existe...')
        await supabase.from('funcionario_servicos').select('id').limit(1)
        console.log('✅ Tabela funcionario_servicos existe')
      } catch (tableError) {
        console.log('⚠️ Tabela funcionario_servicos não existe ainda:', tableError)
        return { 
          success: false, 
          error: 'Tabela de especialidades não existe. Aplique a migração do banco de dados primeiro.' 
        }
      }

      // Remover especialidades existentes
      console.log('🗑️ Removendo especialidades existentes para funcionário:', data.funcionario_id)
      const { error: deleteError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('funcionario_id', data.funcionario_id)

      if (deleteError) {
        console.log('⚠️ Erro ao deletar especialidades existentes:', deleteError)
        if (!deleteError.message?.includes('does not exist')) {
          throw deleteError
        }
      } else {
        console.log('✅ Especialidades existentes removidas')
      }

      // Inserir novas especialidades
      if (data.service_ids.length > 0) {
        console.log('➕ Inserindo novas especialidades:', data.service_ids)
        const insertData = data.service_ids.map(service_id => ({
          funcionario_id: data.funcionario_id,
          service_id
        }))

        const { error: insertError } = await supabase
          .from('funcionario_servicos')
          .insert(insertData)

        if (insertError) {
          console.log('⚠️ Erro ao inserir especialidades:', insertError)
          if (!insertError.message?.includes('does not exist')) {
            throw insertError
          }
        } else {
          console.log('✅ Novas especialidades inseridas')
        }
      } else {
        console.log('ℹ️ Nenhuma especialidade para inserir (funcionário ficará sem especialidades)')
      }

      // Recarregar dados
      console.log('🔄 Recarregando lista de funcionários...')
      try {
        await loadFuncionarios()
      } catch (reloadError) {
        console.log('⚠️ Erro ao recarregar funcionários (mas especialidades foram salvas):', reloadError)
        // Não falhar a operação por causa do reload
      }

      console.log('✅ Especialidades atualizadas com sucesso!')
      return { success: true }
    } catch (err) {
      console.error('❌ Erro ao atualizar especialidades:', err)
      console.error('❌ Tipo do erro:', typeof err)
      console.error('❌ Erro stringificado:', JSON.stringify(err))
      
      let errorMessage = 'Erro ao atualizar especialidades'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMessage = String(err.message)
        } else if ('error' in err) {
          errorMessage = String(err.error)
        } else {
          errorMessage = `Erro desconhecido: ${JSON.stringify(err)}`
        }
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [hasPermission, loadFuncionarios])

  const getFuncionariosByService = useCallback(() => {
    return funcionarios
  }, [funcionarios])

  const getServicesByFuncionario = useCallback(() => {
    return []
  }, [])

  const searchFuncionarios = useCallback(() => {
    return funcionarios
  }, [funcionarios])

  const applyFilters = useCallback(() => {}, [])
  const clearFilters = useCallback(() => {}, [])
  const clearCache = useCallback(() => {}, [])

  // Carregar na inicialização
  useEffect(() => {
    if (hasPermission) {
      loadFuncionarios()
    }
  }, [hasPermission, loadFuncionarios])

  // Calcular estatísticas
  const stats = {
    total_funcionarios: funcionarios.length,
    total_admins: funcionarios.filter(f => f.role === 'admin').length,
    total_barbeiros: funcionarios.filter(f => f.role === 'barber').length,
    funcionarios_ativos: funcionarios.filter(f => f.ativo).length
  }

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
    stats
  }
}