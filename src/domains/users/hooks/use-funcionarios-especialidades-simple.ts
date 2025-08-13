/**
 * Hook simplificado para funcionários (versão temporária)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import type {
  FuncionarioComEspecialidades,
  UpdateFuncionarioEspecialidadesData,
} from '@/types/funcionarios'
import type { Service } from '@/types/services'

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
    initialized: useAuth().initialized,
  })

  // Carregar funcionários
  const loadFuncionarios = useCallback(async () => {
    console.log('🔍 Iniciando carregamento de funcionários...', { hasPermission })

    try {
      setLoading(true)
      setError(null)

      console.log('📊 Buscando funcionários com especialidades...')

      // Buscar funcionários com suas especialidades
      const { data, error: fetchError } = await supabase
        .from('funcionarios')
        .select(
          `
          id,
          profile_id,
          ativo,
          created_at,
          updated_at,
          profile:profiles!funcionarios_profile_id_fkey(
            id,
            nome,
            email,
            telefone,
            avatar_url,
            role
          ),
          funcionario_servicos(
            id,
            service_id,
            services(
              id,
              nome,
              preco,
              duracao_minutos,
              descricao
            )
          )
        `
        )
        .eq('ativo', true)
        .order('created_at', { ascending: true })

      console.log('📋 Resultado da busca:', {
        hasData: !!data,
        hasError: !!fetchError,
        count: data?.length || 0,
        error: fetchError,
      })

      if (fetchError) {
        console.error('❌ Erro na consulta:', fetchError)

        // Se for erro de permissão, tentar abordagem alternativa
        if (fetchError.code === 'PGRST116' || fetchError.message?.includes('permission')) {
          console.log('⚠️ Erro de permissão, tentando abordagem alternativa...')

          // Fallback: usar dados mock em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            const mockData: FuncionarioComEspecialidades[] = [
              {
                id: 'mock-1',
                nome: 'João Silva (Demo)',
                email: 'joao@demo.com',
                role: 'barber',
                ativo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                servicos: [],
              },
              {
                id: 'mock-2',
                nome: 'Pedro Santos (Demo)',
                email: 'pedro@demo.com',
                role: 'barber',
                ativo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                servicos: [],
              },
            ]

            console.log('🔧 Usando dados mock para desenvolvimento')
            setFuncionarios(mockData)
            return
          }
        }

        throw fetchError
      }

      // Processar funcionários encontrados
      console.log('✅ Funcionários encontrados:', data?.length || 0)

      const funcionariosData: FuncionarioComEspecialidades[] = (data || []).map(
        (funcionario: any) => {
          // Extrair dados do profile (é um objeto, não array)
          const profile = funcionario.profile

          // Processar especialidades corretamente
          const servicos: Service[] = (funcionario.funcionario_servicos || [])
            .map((fs) => fs.services)
            .filter(Boolean)
            .map((service: any) => ({
              id: service.id,
              nome: service.nome,
              descricao: service.descricao || '',
              preco: Number(service.preco) || 0,
              duracao_minutos: service.duracao_minutos || 0,
              categoria: service.categoria || '',
              ativo: true,
              ordem: service.ordem || 0,
              created_at: service.created_at || new Date().toISOString(),
              updated_at: service.updated_at || new Date().toISOString(),
            }))

          console.log(`📋 Funcionário ${profile?.nome}:`, {
            id: funcionario.id,
            profile_id: funcionario.profile_id,
            especialidades: servicos.length,
            servicos: servicos.map((s) => s.nome).join(', '),
          })

          return {
            id: funcionario.id, // ID da tabela funcionarios
            profile_id: funcionario.profile_id, // ID do profile
            nome: profile?.nome || 'Nome não encontrado',
            email: profile?.email || '',
            telefone: profile?.telefone || '',
            avatar_url: profile?.avatar_url || '',
            role: profile?.role || 'barber',
            ativo: funcionario.ativo,
            created_at: funcionario.created_at,
            updated_at: funcionario.updated_at,
            servicos: servicos,
          }
        }
      )

      console.log(
        '📋 Funcionários processados:',
        funcionariosData.map((f) => ({
          id: f.id,
          nome: f.nome,
          role: f.role,
          ativo: f.ativo,
          especialidades: f.servicos.length,
        }))
      )

      setFuncionarios(funcionariosData)
      console.log('🎯 Estado atualizado com', funcionariosData.length, 'funcionários')
    } catch (err) {
      console.error('❌ Erro ao carregar funcionários:', err)

      // Tratamento de erro mais específico
      let errorMessage = 'Erro ao carregar funcionários'

      if (err instanceof Error) {
        if (err.message.includes('permission') || err.message.includes('policy')) {
          errorMessage = 'Sem permissão para visualizar funcionários'
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  // Refetch
  const refetch = useCallback(() => {
    loadFuncionarios()
  }, [loadFuncionarios])

  // Atualizar especialidades de um funcionário
  const updateFuncionarioEspecialidades = useCallback(
    async (data: UpdateFuncionarioEspecialidadesData) => {
      if (!hasPermission) {
        return { success: false, error: 'Acesso negado' }
      }

      try {
        console.log('🔄 Atualizando especialidades:', data)

        // Usar uma transação para garantir consistência
        const { error: transactionError } = await supabase.rpc(
          'update_funcionario_especialidades',
          {
            p_funcionario_id: data.funcionario_id,
            p_service_ids: data.service_ids,
          }
        )

        if (transactionError) {
          // Se a função RPC não existir, usar método manual
          if (
            transactionError.message?.includes('function') &&
            transactionError.message?.includes('does not exist')
          ) {
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
    },
    [hasPermission, loadFuncionarios]
  )

  // Método manual para atualizar especialidades
  const updateEspecialidadesManual = useCallback(
    async (data: UpdateFuncionarioEspecialidadesData) => {
      try {
        console.log('🔄 Atualizando especialidades manualmente:', data)

        // Primeiro, verificar se o funcionário existe na tabela funcionarios
        const { data: funcionarioExists, error: checkError } = await supabase
          .from('funcionarios')
          .select('id, profile_id')
          .eq('id', data.funcionario_id)
          .single()

        if (checkError || !funcionarioExists) {
          console.error('❌ Funcionário não encontrado:', checkError)
          throw new Error('Funcionário não encontrado')
        }

        console.log('✅ Funcionário encontrado:', funcionarioExists)

        // Remover especialidades existentes
        console.log('🗑️ Removendo especialidades existentes...')
        const { error: deleteError } = await supabase
          .from('funcionario_servicos')
          .delete()
          .eq('funcionario_id', data.funcionario_id)

        if (deleteError) {
          console.error('⚠️ Erro ao deletar especialidades:', deleteError)
          // Continuar mesmo com erro de delete (pode não existir registros)
        } else {
          console.log('✅ Especialidades existentes removidas')
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
            console.error('❌ Erro ao verificar serviços:', servicesError)
            throw new Error(`Erro ao verificar serviços: ${servicesError.message}`)
          }

          if (!servicesExist || servicesExist.length !== data.service_ids.length) {
            console.error('❌ Serviços não encontrados:', {
              requested: data.service_ids,
              found: servicesExist?.map((s) => s.id) || [],
            })
            throw new Error('Alguns serviços selecionados não existem')
          }

          console.log(
            '✅ Serviços validados:',
            servicesExist.map((s) => s.id)
          )

          // Inserir as especialidades (sem colunas de timestamp, deixar o banco gerenciar)
          const insertData = data.service_ids.map((service_id) => ({
            funcionario_id: data.funcionario_id,
            service_id,
          }))

          console.log('📝 Dados para inserção:', insertData)

          const { data: insertResult, error: insertError } = await supabase
            .from('funcionario_servicos')
            .insert(insertData)
            .select()

          if (insertError) {
            console.error('❌ Erro ao inserir especialidades:', insertError)
            throw new Error(`Erro ao salvar especialidades: ${insertError.message}`)
          }

          console.log('✅ Especialidades inseridas com sucesso:', insertResult)
        } else {
          console.log(
            'ℹ️ Nenhuma especialidade selecionada (funcionário ficará sem especialidades)'
          )
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
          error: errorMessage,
        }
      }
    },
    [loadFuncionarios]
  )

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
    total_admins: funcionarios.filter((f) => f.role === 'admin').length,
    total_barbeiros: funcionarios.filter((f) => f.role === 'barber').length,
    funcionarios_ativos: funcionarios.filter((f) => f.ativo).length,
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
    stats,
  }
}
