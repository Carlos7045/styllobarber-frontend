/**
 * Hook para buscar funcionários públicos (para clientes)
 * Não requer permissões administrativas
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'

export interface FuncionarioPublico {
  id: string
  especialidades: string[]
  ativo: boolean
  // Dados do perfil relacionado
  profiles?: {
    id: string
    nome: string
    avatar_url?: string
  }
}

interface UseFuncionariosPublicosReturn {
  funcionarios: FuncionarioPublico[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFuncionariosPublicos(): UseFuncionariosPublicosReturn {
  const [funcionarios, setFuncionarios] = useState<FuncionarioPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar funcionários ativos (dados públicos)
  const fetchFuncionarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Iniciando busca de funcionários...')

      // Estratégia 1: Tentar buscar funcionários com join (mais robusta)
      console.log('📋 Estratégia 1: Buscar funcionários com join')
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(
          `
          id,
          especialidades,
          ativo,
          profile_id,
          profiles!funcionarios_profile_id_fkey(
            id,
            nome,
            avatar_url,
            role
          )
        `
        )
        .eq('ativo', true)
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false })

      console.log('📋 Resultado estratégia 1:', {
        funcionariosData,
        funcionariosError,
        count: funcionariosData?.length || 0,
      })

      if (!funcionariosError && funcionariosData && funcionariosData.length > 0) {
        // Filtrar apenas funcionários com profiles válidos
        const funcionariosValidos = funcionariosData.filter(
          (func) => func.profiles && func.profiles.nome && func.profiles.nome.trim() !== ''
        )

        console.log('✅ Estratégia 1 funcionou! Funcionários válidos:', funcionariosValidos.length)

        if (funcionariosValidos.length > 0) {
          setFuncionarios(funcionariosValidos)
          return
        }
      }

      // Estratégia 2: Buscar todos os funcionários primeiro e combinar manualmente
      console.log('📋 Estratégia 2: Buscar funcionários e profiles separadamente')
      const { data: allFuncionarios, error: allError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('ativo', true)
        .not('profile_id', 'is', null)

      console.log('📋 Funcionários ativos:', {
        allFuncionarios,
        allError,
        count: allFuncionarios?.length || 0,
      })

      if (!allError && allFuncionarios && allFuncionarios.length > 0) {
        // Buscar profiles separadamente
        const profileIds = allFuncionarios.map((f) => f.profile_id).filter(Boolean)

        if (profileIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, nome, avatar_url, role')
            .in('id', profileIds)
            .in('role', ['admin', 'barber']) // Apenas roles válidos

          console.log('📋 Profiles de barbeiros:', {
            profilesData,
            profilesError,
            count: profilesData?.length || 0,
          })

          if (!profilesError && profilesData && profilesData.length > 0) {
            // Combinar dados manualmente
            const combinedData = allFuncionarios
              .map((func) => {
                const profile = profilesData.find((p) => p.id === func.profile_id)
                return {
                  id: func.id,
                  especialidades: func.especialidades || [],
                  ativo: func.ativo,
                  profiles: profile
                    ? {
                        id: profile.id,
                        nome: profile.nome,
                        avatar_url: profile.avatar_url,
                      }
                    : undefined,
                }
              })
              .filter((func) => func.profiles && func.profiles.nome) // Só incluir se tem profile válido

            console.log('✅ Estratégia 2 funcionou! Dados combinados:', combinedData.length)

            if (combinedData.length > 0) {
              setFuncionarios(combinedData)
              return
            }
          }
        }
      }

      // Estratégia 3: Buscar através dos profiles (reverse join)
      console.log('📋 Estratégia 3: Buscar através dos profiles')
      const { data: profilesWithRole, error: profilesRoleError } = await supabase
        .from('profiles')
        .select(
          `
          id,
          nome,
          avatar_url,
          role,
          funcionarios!funcionarios_profile_id_fkey(
            id,
            especialidades,
            ativo
          )
        `
        )
        .in('role', ['admin', 'barber'])
        .not('nome', 'is', null)

      console.log('📋 Profiles com role barbeiro:', {
        profilesWithRole,
        profilesRoleError,
        count: profilesWithRole?.length || 0,
      })

      if (!profilesRoleError && profilesWithRole && profilesWithRole.length > 0) {
        const convertedData = profilesWithRole
          .filter(
            (profile) =>
              profile.funcionarios &&
              profile.funcionarios.length > 0 &&
              profile.funcionarios[0].ativo === true &&
              profile.nome &&
              profile.nome.trim() !== ''
          )
          .map((profile) => ({
            id: profile.funcionarios[0].id,
            especialidades: profile.funcionarios[0].especialidades || [],
            ativo: profile.funcionarios[0].ativo,
            profiles: {
              id: profile.id,
              nome: profile.nome,
              avatar_url: profile.avatar_url,
            },
          }))

        console.log('✅ Estratégia 3 funcionou! Dados convertidos:', convertedData.length)

        if (convertedData.length > 0) {
          setFuncionarios(convertedData)
          return
        }
      }

      // Estratégia 4: Buscar apenas profiles com role de barbeiro (fallback)
      console.log('📋 Estratégia 4: Buscar apenas profiles de barbeiros')
      const { data: onlyProfiles, error: onlyProfilesError } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url, role')
        .in('role', ['admin', 'barber'])
        .not('nome', 'is', null)

      console.log('📋 Apenas profiles:', {
        onlyProfiles,
        onlyProfilesError,
        count: onlyProfiles?.length || 0,
      })

      if (!onlyProfilesError && onlyProfiles && onlyProfiles.length > 0) {
        // Criar funcionários mock baseados nos profiles
        const mockFuncionarios = onlyProfiles.map((profile, index) => ({
          id: `profile-${profile.id}`,
          especialidades: ['Corte', 'Barba'], // Especialidades padrão
          ativo: true,
          profiles: {
            id: profile.id,
            nome: profile.nome,
            avatar_url: profile.avatar_url,
          },
        }))

        console.log(
          '✅ Estratégia 4 funcionou! Funcionários mock criados:',
          mockFuncionarios.length
        )
        setFuncionarios(mockFuncionarios)
        return
      }

      // Estratégia 5: Criar dados mock se nada funcionar (para desenvolvimento)
      console.log('📋 Estratégia 5: Dados mock para desenvolvimento')

      // Só usar mock em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const mockData: FuncionarioPublico[] = [
          {
            id: 'mock-1',
            especialidades: ['Corte Masculino', 'Barba', 'Bigode'],
            ativo: true,
            profiles: {
              id: 'mock-profile-1',
              nome: 'João Silva (Demo)',
              avatar_url: undefined,
            },
          },
          {
            id: 'mock-2',
            especialidades: ['Corte Masculino', 'Sobrancelha'],
            ativo: true,
            profiles: {
              id: 'mock-profile-2',
              nome: 'Pedro Santos (Demo)',
              avatar_url: undefined,
            },
          },
          {
            id: 'mock-3',
            especialidades: ['Corte Masculino', 'Barba', 'Tratamentos'],
            ativo: true,
            profiles: {
              id: 'mock-profile-3',
              nome: 'Carlos Oliveira (Demo)',
              avatar_url: undefined,
            },
          },
        ]

        console.log('⚠️ Usando dados mock para desenvolvimento:', mockData.length)
        setFuncionarios(mockData)
      } else {
        // Em produção, definir erro
        setError('Não foi possível carregar os barbeiros. Tente novamente.')
        setFuncionarios([])
      }
    } catch (err) {
      console.error('❌ Erro geral ao buscar funcionários:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar funcionários'
      setError(errorMessage)

      // Em caso de erro, fornecer dados mock apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const errorMockData: FuncionarioPublico[] = [
          {
            id: 'error-mock-1',
            especialidades: ['Corte Masculino'],
            ativo: true,
            profiles: {
              id: 'error-mock-profile-1',
              nome: 'Barbeiro Disponível (Erro)',
              avatar_url: undefined,
            },
          },
        ]
        console.log('⚠️ Erro capturado - usando dados mock:', errorMockData)
        setFuncionarios(errorMockData)
      } else {
        setFuncionarios([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar funcionários na inicialização
  useEffect(() => {
    fetchFuncionarios()
  }, [fetchFuncionarios])

  return {
    funcionarios,
    loading,
    error,
    refetch: fetchFuncionarios,
  }
}
