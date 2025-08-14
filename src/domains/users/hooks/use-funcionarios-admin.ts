/**
 * Hook unificado para gerenciamento administrativo de funcionários
 * Implementa padrão CRUD padronizado com cache inteligente e especialidades
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { FuncionarioValidator } from '@/domains/users/services/funcionario-validator'
import type { FuncionarioComEspecialidades, UpdateFuncionarioEspecialidadesData } from '@/types/funcionarios'
import type { Service } from '@/types/services'

// Interface padronizada para operações
interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Interface para dados de criação de funcionário
interface CreateFuncionarioData {
  nome: string
  email: string
  telefone?: string
  role: 'admin' | 'barber'
  especialidades?: string[]
}

// Interface para dados de atualização de funcionário
interface UpdateFuncionarioData {
  nome?: string
  email?: string
  telefone?: string
  role?: 'admin' | 'barber'
  ativo?: boolean
}

// Interface padronizada de retorno do hook
interface UseFuncionariosAdminReturn {
  // Dados
  funcionarios: FuncionarioComEspecialidades[]
  loading: boolean
  error: string | null

  // Operações CRUD
  create: (data: CreateFuncionarioData) => Promise<OperationResult<FuncionarioComEspecialidades>>
  update: (id: string, data: UpdateFuncionarioData) => Promise<OperationResult<FuncionarioComEspecialidades>>
  delete: (id: string) => Promise<OperationResult<boolean>>
  toggleStatus: (id: string, ativo: boolean) => Promise<OperationResult<boolean>>

  // Operações de especialidades
  updateEspecialidades: (data: UpdateFuncionarioEspecialidadesData) => Promise<OperationResult<boolean>>

  // Utilitários
  refetch: () => Promise<void>
  invalidate: () => void
  getFuncionarioById: (id: string) => FuncionarioComEspecialidades | undefined

  // Estatísticas
  stats: {
    total_funcionarios: number
    total_admins: number
    total_barbeiros: number
    funcionarios_ativos: number
  }
}

// Chaves de cache
const CACHE_KEYS = {
  funcionarios: ['funcionarios', 'admin'],
  especialidades: (id: string) => ['funcionarios', 'especialidades', id],
} as const

export function useFuncionariosAdmin(): UseFuncionariosAdminReturn {
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()

  // Verificar permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Query principal para buscar funcionários
  const {
    data: funcionarios = [],
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch
  } = useQuery({
    queryKey: CACHE_KEYS.funcionarios,
    queryFn: fetchFuncionarios,
    enabled: hasPermission,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (garbage collection time)
    refetchOnWindowFocus: false,
  })

  // Função para buscar funcionários com especialidades
  async function fetchFuncionarios(): Promise<FuncionarioComEspecialidades[]> {
    console.log('🔍 Buscando funcionários com especialidades...')

    try {
      // Buscar funcionários com JOIN correto: profiles -> funcionarios -> funcionario_servicos
      const { data: funcionariosData, error: funcionariosError } = await supabase
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
          updated_at,
          funcionarios!inner (
            id,
            profile_id
          )
        `)
        .in('role', ['admin', 'barber'])
        .order('nome', { ascending: true })

      if (funcionariosError) {
        console.error('❌ Erro ao buscar funcionários:', funcionariosError)
        throw new Error(`Erro ao buscar funcionários: ${funcionariosError.message}`)
      }

      if (!funcionariosData || funcionariosData.length === 0) {
        console.log('⚠️ Nenhum funcionário encontrado')
        return []
      }

      console.log('✅ Funcionários encontrados:', funcionariosData.length)

      // Buscar especialidades para cada funcionário usando o funcionario.id correto
      const funcionariosComEspecialidades = await Promise.all(
        funcionariosData.map(async (profileData) => {
          try {
            // Pegar o ID correto da tabela funcionarios
            const funcionarioId = profileData.funcionarios[0]?.id

            if (!funcionarioId) {
              console.warn(`⚠️ Funcionário ${profileData.nome} não tem registro na tabela funcionarios`)
              // Criar registro na tabela funcionarios se não existir
              const { data: novoFuncionario, error: createError } = await supabase
                .from('funcionarios')
                .insert({
                  profile_id: profileData.id,
                  ativo: true
                })
                .select('id')
                .single()

              if (createError) {
                console.error(`❌ Erro ao criar registro funcionario para ${profileData.nome}:`, createError)
                // Continuar sem especialidades
                return {
                  id: profileData.id,
                  nome: profileData.nome,
                  email: profileData.email,
                  telefone: profileData.telefone,
                  avatar_url: profileData.avatar_url,
                  role: profileData.role as 'admin' | 'barber',
                  ativo: profileData.ativo ?? true,
                  created_at: profileData.created_at,
                  updated_at: profileData.updated_at,
                  servicos: [],
                  funcionario_id: null, // Adicionar para referência
                } as FuncionarioComEspecialidades & { funcionario_id: string | null }
              }

              // Usar o ID do funcionário recém-criado
              const funcionarioIdNovo = novoFuncionario.id
              console.log(`✅ Criado registro funcionario para ${profileData.nome}: ${funcionarioIdNovo}`)

              return {
                id: profileData.id,
                nome: profileData.nome,
                email: profileData.email,
                telefone: profileData.telefone,
                avatar_url: profileData.avatar_url,
                role: profileData.role as 'admin' | 'barber',
                ativo: profileData.ativo ?? true,
                created_at: profileData.created_at,
                updated_at: profileData.updated_at,
                servicos: [],
                funcionario_id: funcionarioIdNovo,
              } as FuncionarioComEspecialidades & { funcionario_id: string }
            }

            // Buscar especialidades usando o funcionario_id correto
            const { data: especialidades, error: especialidadesError } = await supabase
              .from('funcionario_servicos')
              .select(`
                service_id,
                services (
                  id,
                  nome,
                  descricao,
                  preco,
                  duracao_minutos,
                  categoria,
                  ativo,
                  ordem,
                  created_at,
                  updated_at
                )
              `)
              .eq('funcionario_id', funcionarioId)

            if (especialidadesError) {
              console.warn(`⚠️ Erro ao buscar especialidades para ${profileData.nome}:`, especialidadesError)
            }

            // Processar especialidades
            const servicos: Service[] = (especialidades || [])
              .filter(esp => esp.services) // Filtrar especialidades que têm serviços
              .flatMap(esp => {
                // esp.services pode ser um array ou um objeto único
                const services = Array.isArray(esp.services) ? esp.services : [esp.services]
                return services.map(service => ({
                  id: service.id,
                  nome: service.nome,
                  descricao: service.descricao || '',
                  preco: Number(service.preco) || 0,
                  duracao_minutos: service.duracao_minutos || 0,
                  categoria: service.categoria || '',
                  ativo: service.ativo ?? true,
                  ordem: service.ordem || 0,
                  created_at: service.created_at || new Date().toISOString(),
                  updated_at: service.updated_at || new Date().toISOString(),
                }))
              })

            console.log(`📋 ${profileData.nome}: ${servicos.length} especialidades`)

            return {
              id: profileData.id,
              nome: profileData.nome,
              email: profileData.email,
              telefone: profileData.telefone,
              avatar_url: profileData.avatar_url,
              role: profileData.role as 'admin' | 'barber',
              ativo: profileData.ativo ?? true,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
              servicos,
              funcionario_id: funcionarioId,
            } as FuncionarioComEspecialidades & { funcionario_id: string }
          } catch (err) {
            console.error(`❌ Erro ao processar funcionário ${profileData.nome}:`, err)
            // Retornar funcionário sem especialidades em caso de erro
            return {
              id: profileData.id,
              nome: profileData.nome,
              email: profileData.email,
              telefone: profileData.telefone,
              avatar_url: profileData.avatar_url,
              role: profileData.role as 'admin' | 'barber',
              ativo: profileData.ativo ?? true,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
              servicos: [],
              funcionario_id: null,
            } as FuncionarioComEspecialidades & { funcionario_id: string | null }
          }
        })
      )

      console.log('✅ Funcionários processados:', funcionariosComEspecialidades.length)
      return funcionariosComEspecialidades

    } catch (err) {
      console.error('❌ Erro geral ao buscar funcionários:', err)
      throw err
    }
  }

  // Mutation para criar funcionário
  const createMutation = useMutation({
    mutationFn: async (data: CreateFuncionarioData): Promise<FuncionarioComEspecialidades> => {
      console.log('➕ Criando funcionário:', data)

      // Validação robusta usando o validador
      const validation = await FuncionarioValidator.validateCreate(data)

      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ')
        throw new Error(errorMessages)
      }

      // Mostrar warnings se houver
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(w => w.message).join('; ')
        console.warn('⚠️ Avisos na criação do funcionário:', warningMessages)
      }

      // Criar usuário no auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: data.email.trim(),
        password: 'temp123456', // Senha temporária
        email_confirm: true,
        user_metadata: {
          nome: data.nome.trim(),
          role: data.role,
        }
      })

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      // Criar/atualizar profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          nome: data.nome.trim(),
          email: data.email.trim(),
          telefone: data.telefone?.trim() || null,
          role: data.role,
          ativo: true,
        })
        .select()
        .single()

      if (profileError) {
        throw new Error(`Erro ao criar profile: ${profileError.message}`)
      }

      // Adicionar especialidades se fornecidas
      if (data.especialidades && data.especialidades.length > 0) {
        const especialidadesData = data.especialidades.map(serviceId => ({
          funcionario_id: profile.id,
          service_id: serviceId,
        }))

        const { error: especialidadesError } = await supabase
          .from('funcionario_servicos')
          .insert(especialidadesData)

        if (especialidadesError) {
          console.warn('⚠️ Erro ao adicionar especialidades:', especialidadesError)
          // Não falhar por causa das especialidades
        }
      }

      console.log('✅ Funcionário criado com sucesso:', profile.id)

      return {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        telefone: profile.telefone,
        avatar_url: profile.avatar_url,
        role: profile.role as 'admin' | 'barber',
        ativo: profile.ativo ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        servicos: [], // Será carregado no refetch
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
    },
  })

  // Mutation para atualizar funcionário
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateFuncionarioData }): Promise<FuncionarioComEspecialidades> => {
      console.log('✏️ Atualizando funcionário:', id, data)

      // Validação robusta usando o validador
      const validation = await FuncionarioValidator.validateUpdate({ id, ...data })

      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ')
        throw new Error(errorMessages)
      }

      // Mostrar warnings se houver
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(w => w.message).join('; ')
        console.warn('⚠️ Avisos na atualização do funcionário:', warningMessages)
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          nome: data.nome?.trim(),
          email: data.email?.trim(),
          telefone: data.telefone?.trim() || null,
          role: data.role,
          ativo: data.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao atualizar funcionário: ${error.message}`)
      }

      console.log('✅ Funcionário atualizado:', updatedProfile.id)

      return {
        id: updatedProfile.id,
        nome: updatedProfile.nome,
        email: updatedProfile.email,
        telefone: updatedProfile.telefone,
        avatar_url: updatedProfile.avatar_url,
        role: updatedProfile.role as 'admin' | 'barber',
        ativo: updatedProfile.ativo ?? true,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
        servicos: [], // Será carregado no refetch
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
    },
  })

  // Mutation para deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      console.log('🗑️ Deletando funcionário:', id)

      // Buscar dados do funcionário para validação
      const { data: funcionario, error: funcionarioError } = await supabase
        .from('profiles')
        .select('nome, role')
        .eq('id', id)
        .single()

      if (funcionarioError || !funcionario) {
        throw new Error('Funcionário não encontrado')
      }

      // Validação robusta usando o validador
      const validation = await FuncionarioValidator.validateDelete({
        id,
        nome: funcionario.nome,
        role: funcionario.role as 'admin' | 'barber'
      })

      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ')
        throw new Error(errorMessages)
      }

      // Mostrar warnings se houver
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(w => w.message).join('; ')
        console.warn('⚠️ Avisos na deleção do funcionário:', warningMessages)
      }

      // Remover especialidades primeiro
      const { error: especialidadesError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('funcionario_id', id)

      if (especialidadesError) {
        console.warn('⚠️ Erro ao remover especialidades:', especialidadesError)
      }

      // Deletar profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(`Erro ao deletar funcionário: ${deleteError.message}`)
      }

      console.log('✅ Funcionário deletado:', id)
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
    },
  })

  // Mutation para toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string, ativo: boolean }): Promise<boolean> => {
      console.log('🔄 Alterando status do funcionário:', id, ativo)

      // Se está desativando, usar validação robusta
      if (!ativo) {
        // Buscar dados do funcionário para validação
        const { data: funcionario, error: funcionarioError } = await supabase
          .from('profiles')
          .select('nome, role')
          .eq('id', id)
          .single()

        if (funcionarioError || !funcionario) {
          throw new Error('Funcionário não encontrado')
        }

        // Validar desativação usando o validador
        const validation = await FuncionarioValidator.validateUpdate({
          id,
          ativo: false
        })

        if (!validation.isValid) {
          const errorMessages = validation.errors.map(e => e.message).join('; ')
          throw new Error(errorMessages)
        }

        // Mostrar warnings se houver
        if (validation.warnings && validation.warnings.length > 0) {
          const warningMessages = validation.warnings.map(w => w.message).join('; ')
          console.warn('⚠️ Avisos na desativação do funcionário:', warningMessages)
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Erro ao alterar status: ${error.message}`)
      }

      console.log('✅ Status alterado:', id, ativo)
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
    },
  })

  // Mutation para atualizar especialidades
  const updateEspecialidadesMutation = useMutation({
    mutationFn: async (data: UpdateFuncionarioEspecialidadesData): Promise<boolean> => {
      console.log('🔄 Atualizando especialidades:', data)

      // Validações básicas
      if (!data.funcionario_id) {
        throw new Error('ID do funcionário é obrigatório')
      }

      // Primeiro, buscar o funcionario_id correto da tabela funcionarios
      // O data.funcionario_id é o profile_id, precisamos do funcionarios.id
      const { data: funcionarioData, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select('id, profile_id')
        .eq('profile_id', data.funcionario_id)
        .single()

      if (funcionarioError || !funcionarioData) {
        console.error('❌ Funcionário não encontrado na tabela funcionarios:', funcionarioError)

        // Tentar criar o registro na tabela funcionarios se não existir
        console.log('🔄 Criando registro na tabela funcionarios...')
        const { data: novoFuncionario, error: createError } = await supabase
          .from('funcionarios')
          .insert({
            profile_id: data.funcionario_id,
            ativo: true
          })
          .select('id')
          .single()

        if (createError || !novoFuncionario) {
          throw new Error(`Erro ao criar registro funcionario: ${createError?.message}`)
        }

        console.log('✅ Registro funcionario criado:', novoFuncionario.id)
        funcionarioData.id = novoFuncionario.id
      }

      const funcionarioId = funcionarioData.id
      console.log('✅ Usando funcionario_id:', funcionarioId)

      // Verificar se os serviços existem (se fornecidos)
      if (data.service_ids && data.service_ids.length > 0) {
        const { data: servicesExist, error: servicesError } = await supabase
          .from('services')
          .select('id, nome')
          .in('id', data.service_ids)

        if (servicesError) {
          throw new Error(`Erro ao verificar serviços: ${servicesError.message}`)
        }

        if (!servicesExist || servicesExist.length !== data.service_ids.length) {
          const servicosEncontrados = servicesExist?.map(s => s.id) || []
          const servicosNaoEncontrados = data.service_ids.filter(id => !servicosEncontrados.includes(id))
          throw new Error(`Serviços não encontrados: ${servicosNaoEncontrados.join(', ')}`)
        }

        console.log('✅ Serviços validados:', servicesExist.length)
      }

      // Remover especialidades existentes
      const { error: deleteError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('funcionario_id', funcionarioId)

      if (deleteError) {
        console.warn('⚠️ Erro ao remover especialidades existentes:', deleteError)
      }

      // Adicionar novas especialidades
      if (data.service_ids && data.service_ids.length > 0) {
        const especialidadesData = data.service_ids.map(serviceId => ({
          funcionario_id: funcionarioId, // Usar o ID correto da tabela funcionarios
          service_id: serviceId,
        }))

        const { error: insertError } = await supabase
          .from('funcionario_servicos')
          .insert(especialidadesData)

        if (insertError) {
          console.error('❌ Erro ao inserir especialidades:', insertError)
          throw new Error(`Erro ao salvar especialidades: ${insertError.message}`)
        }

        console.log('✅ Especialidades inseridas:', especialidadesData.length)
      }

      console.log('✅ Especialidades atualizadas com sucesso')
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
    },
  })

  // Funções de conveniência
  const create = useCallback(async (data: CreateFuncionarioData): Promise<OperationResult<FuncionarioComEspecialidades>> => {
    try {
      const result = await createMutation.mutateAsync(data)
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar funcionário'
      return { success: false, error: message }
    }
  }, [createMutation])

  const update = useCallback(async (id: string, data: UpdateFuncionarioData): Promise<OperationResult<FuncionarioComEspecialidades>> => {
    try {
      const result = await updateMutation.mutateAsync({ id, data })
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar funcionário'
      return { success: false, error: message }
    }
  }, [updateMutation])

  const deleteFuncionario = useCallback(async (id: string): Promise<OperationResult<boolean>> => {
    try {
      const result = await deleteMutation.mutateAsync(id)
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar funcionário'
      return { success: false, error: message }
    }
  }, [deleteMutation])

  const toggleStatus = useCallback(async (id: string, ativo: boolean): Promise<OperationResult<boolean>> => {
    try {
      const result = await toggleStatusMutation.mutateAsync({ id, ativo })
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao alterar status'
      return { success: false, error: message }
    }
  }, [toggleStatusMutation])

  const updateEspecialidades = useCallback(async (data: UpdateFuncionarioEspecialidadesData): Promise<OperationResult<boolean>> => {
    try {
      const result = await updateEspecialidadesMutation.mutateAsync(data)
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar especialidades'
      return { success: false, error: message }
    }
  }, [updateEspecialidadesMutation])

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.funcionarios })
  }, [queryClient])

  const getFuncionarioById = useCallback((id: string) => {
    return funcionarios.find(f => f.id === id)
  }, [funcionarios])

  // Calcular estatísticas
  const stats = {
    total_funcionarios: funcionarios.length,
    total_admins: funcionarios.filter(f => f.role === 'admin').length,
    total_barbeiros: funcionarios.filter(f => f.role === 'barber').length,
    funcionarios_ativos: funcionarios.filter(f => f.ativo).length,
  }

  // Error handling
  const error = queryError instanceof Error ? queryError.message : null

  return {
    funcionarios,
    loading,
    error,
    create,
    update,
    delete: deleteFuncionario,
    toggleStatus,
    updateEspecialidades,
    refetch,
    invalidate,
    getFuncionarioById,
    stats,
  }
}