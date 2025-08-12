/**
 * Hook para buscar funcionários públicos (para clientes)
 * Versão simplificada e robusta
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

      console.log('🔍 Iniciando busca de funcionários (versão simplificada)...')

      // Buscar profiles com role de barbeiro/admin
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url, role')
        .in('role', ['admin', 'barber'])
        .not('nome', 'is', null)
        .order('nome', { ascending: true })

      console.log('📋 Resultado busca profiles:', {
        profilesData,
        profilesError,
        count: profilesData?.length || 0,
      })

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError)
        throw new Error(`Erro na consulta: ${profilesError.message}`)
      }

      if (profilesData && profilesData.length > 0) {
        // Converter profiles para formato de funcionários
        const funcionariosFromProfiles = profilesData.map((profile) => ({
          id: `profile-${profile.id}`,
          especialidades: ['Corte Masculino', 'Barba'], // Especialidades padrão
          ativo: true,
          profiles: {
            id: profile.id,
            nome: profile.nome,
            avatar_url: profile.avatar_url,
          },
        }))

        console.log('✅ Funcionários criados a partir de profiles:', funcionariosFromProfiles.length)
        setFuncionarios(funcionariosFromProfiles)
        return
      }

      // Fallback: Criar dados mock se nada funcionar
      console.log('📋 Fallback: Criando dados mock para desenvolvimento')

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
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar barbeiros')
      setFuncionarios([])
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