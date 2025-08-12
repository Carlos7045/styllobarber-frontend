/**
 * Hook simplificado para funcionários (versão temporária)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import type { FuncionarioComEspecialidades, UpdateFuncionarioEspecialidadesData } from '@/types/funcionarios'

export function useFuncionariosEspecialidades() {
  const { hasRole } = useAuth()
  const [funcionarios, setFuncionarios] = useState<FuncionarioComEspecialidades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')
  
  console.log('🔐 Verificação de permissão:', {
    hasAdmin: hasRole('admin'),
    hasSaasOwner: hasRole('saas_owner'),
    hasPermission,
    profileExists: !!useAuth().profile,
    profileRole: useAuth().profile?.role,
    userExists: !!useAuth().user,
    initialized: useAuth().initialized
  })

  // Carregar funcionários
  const loadFuncionarios = useCallback(async () => {
    console.log('🔍 Iniciando carregamento de funcionários...', { hasPermission })
    
    // TEMPORÁRIO: Remover verificação de permissão para testar
    // if (!hasPermission) {
    //   console.log('❌ Acesso negado - sem permissão')
    //   setError('Acesso negado')
    //   setLoading(false)
    //   return
    // }

    try {
      setLoading(true)
      setError(null)

      console.log('📊 Buscando funcionários na tabela profiles...')

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

      console.log('📋 Resultado da busca:', {
        hasData: !!data,
        hasError: !!fetchError,
        count: data?.length || 0,
        error: fetchError
      })

      if (fetchError) {
        throw fetchError
      }

      // TEMPORÁRIO: Carregar funcionários sem especialidades para debug
      console.log('✅ Funcionários encontrados:', data?.length || 0)
      
      const funcionariosData: FuncionarioComEspecialidades[] = (data || []).map(funcionario => ({
        ...funcionario,
        servicos: [] // Temporariamente sem especialidades
      }))

      console.log('📋 Funcionários processados:', funcionariosData.map(f => ({
        id: f.id,
        nome: f.nome,
        role: f.role,
        ativo: f.ativo
      })))

      setFuncionarios(funcionariosData)
      console.log('🎯 Estado atualizado com', funcionariosData.length, 'funcionários')
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

      // Usar uma transação para garantir consistência
      const { error: transactionError } = await supabase.rpc('update_funcionario_especialidades', {
        p_funcionario_id: data.funcionario_id,
        p_service_ids: data.service_ids
      })

      if (transactionError) {
        // Se a função RPC não existir, usar método manual
        if (transactionError.message?.includes('function') && transactionError.message?.includes('does not exist')) {
          console.log('⚠️ Função RPC não existe, usando método manual...')
          return await updateEspecialidadesManual(data)
        }
        throw transactionError
      }

      // Recarregar dados
      await loadFuncionarios()
      console.log('✅ Especialidades atualizadas com sucesso via RPC!')
      return { success: true }

    } catch (err) {
      console.error('❌ Erro ao atualizar especialidades via RPC, tentando método manual:', err)
      return await updateEspecialidadesManual(data)
    }
  }, [hasPermission, loadFuncionarios])

  // Método manual para atualizar especialidades
  const updateEspecialidadesManual = useCallback(async (data: UpdateFuncionarioEspecialidadesData) => {
    try {
      console.log('🔄 Atualizando especialidades manualmente:', data)

      // Primeiro, verificar se o funcionário existe
      const { data: funcionarioExists, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.funcionario_id)
        .single()

      if (checkError || !funcionarioExists) {
        throw new Error('Funcionário não encontrado')
      }

      // Remover especialidades existentes
      console.log('🗑️ Removendo especialidades existentes...')
      const { error: deleteError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('funcionario_id', data.funcionario_id)

      if (deleteError) {
        console.error('⚠️ Erro ao deletar especialidades:', deleteError)
        // Continuar mesmo com erro de delete (pode não existir registros)
      }

      // Inserir novas especialidades se houver
      if (data.service_ids && data.service_ids.length > 0) {
        console.log('➕ Inserindo novas especialidades:', data.service_ids)
        
        // Verificar se os serviços existem
        const { data: servicesExist, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .in('id', data.service_ids)

        if (servicesError) {
          throw new Error(`Erro ao verificar serviços: ${servicesError.message}`)
        }

        if (!servicesExist || servicesExist.length !== data.service_ids.length) {
          throw new Error('Alguns serviços selecionados não existem')
        }

        // Inserir as especialidades
        const insertData = data.service_ids.map(service_id => ({
          funcionario_id: data.funcionario_id,
          service_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('funcionario_servicos')
          .insert(insertData)

        if (insertError) {
          console.error('❌ Erro ao inserir especialidades:', insertError)
          throw new Error(`Erro ao salvar especialidades: ${insertError.message}`)
        }

        console.log('✅ Especialidades inseridas com sucesso')
      } else {
        console.log('ℹ️ Nenhuma especialidade selecionada (funcionário ficará sem especialidades)')
      }

      // Recarregar dados
      await loadFuncionarios()
      console.log('✅ Especialidades atualizadas com sucesso!')
      return { success: true }

    } catch (err) {
      console.error('❌ Erro no método manual:', err)
      
      let errorMessage = 'Erro ao atualizar especialidades'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message)
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [loadFuncionarios])

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
    // TEMPORÁRIO: Carregar sempre para debug
    loadFuncionarios()
  }, [loadFuncionarios])

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
