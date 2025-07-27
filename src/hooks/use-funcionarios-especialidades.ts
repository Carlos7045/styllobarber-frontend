/**
 * Hook para gerenciamento de funcionários com especialidades
 * Fornece funcionalidades para relacionar funcionários com serviços
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { 
  FuncionarioComEspecialidades,
  UpdateFuncionarioEspecialidadesData,
  FuncionarioFilters,
  FuncionarioSearchOptions,
  FuncionarioCacheData,
  FuncionarioStats
} from '@/types/funcionarios'
import type { Service } from '@/types/services'
import { FUNCIONARIO_CACHE_TTL } from '@/types/funcionarios'

interface UseFuncionariosEspecialidadesOptions {
  enableCache?: boolean
  autoFetch?: boolean
  filters?: FuncionarioFilters
}

interface UseFuncionariosEspecialidadesReturn {
  // Dados
  funcionarios: FuncionarioComEspecialidades[]
  filteredFuncionarios: FuncionarioComEspecialidades[]
  loading: boolean
  error: string | null
  
  // Funcionalidades de busca e filtro
  searchFuncionarios: (options: FuncionarioSearchOptions) => FuncionarioComEspecialidades[]
  applyFilters: (filters: FuncionarioFilters) => void
  clearFilters: () => void
  
  // Ações de especialidades
  updateFuncionarioEspecialidades: (data: UpdateFuncionarioEspecialidadesData) => Promise<{ success: boolean; error?: string }>
  getFuncionariosByService: (serviceId: string) => FuncionarioComEspecialidades[]
  getServicesByFuncionario: (funcionarioId: string) => Service[]
  
  // Ações
  refetch: () => Promise<void>
  clearCache: () => void
  
  // Estado dos filtros
  currentFilters: FuncionarioFilters
  hasActiveFilters: boolean
  
  // Estatísticas
  stats: FuncionarioStats | null
}

// Cache global para funcionários
let funcionarioCache: FuncionarioCacheData | null = null

export function useFuncionariosEspecialidades(options: UseFuncionariosEspecialidadesOptions = {}): UseFuncionariosEspecialidadesReturn {
  const {
    enableCache = true,
    autoFetch = true,
    filters: initialFilters = {}
  } = options

  const { hasRole } = useAuth()
  const [funcionarios, setFuncionarios] = useState<FuncionarioComEspecialidades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FuncionarioFilters>(initialFilters)
  const [stats, setStats] = useState<FuncionarioStats | null>(null)

  // Verificar permissão
  const hasPermission = hasRole('admin') || hasRole('saas_owner')

  // Limpar cache
  const clearCache = useCallback(() => {
    funcionarioCache = null
    console.log('🧹 Cache de funcionários limpo')
  }, [])

  // Verificar se o cache é válido
  const isCacheValid = useCallback((): boolean => {
    if (!enableCache || !funcionarioCache) return false
    
    const now = Date.now()
    const isExpired = (now - funcionarioCache.timestamp) > FUNCIONARIO_CACHE_TTL
    
    return !isExpired
  }, [enableCache])

  // Buscar funcionários com especialidades do banco de dados
  const fetchFuncionarios = useCallback(async (): Promise<FuncionarioComEspecialidades[]> => {
    if (!hasPermission) {
      throw new Error('Acesso negado')
    }

    try {
      console.log('🔍 Buscando funcionários...')
      
      // Buscar apenas funcionários básicos por enquanto
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

      // Transformar para o formato esperado (sem serviços por enquanto)
      const funcionariosData: FuncionarioComEspecialidades[] = (data || []).map(funcionario => ({
        ...funcionario,
        servicos: [] // Vazio até a migração ser aplicada
      }))

      console.log(`✅ ${funcionariosData.length} funcionários carregados`)
      
      return funcionariosData
    } catch (err) {
      console.error('❌ Erro ao buscar funcionários:', err)
      throw err
    }
  }, [hasPermission])

  // Carregar funcionários (com cache)
  const loadFuncionarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache primeiro
      if (isCacheValid() && funcionarioCache) {
        console.log('📦 Usando funcionários do cache')
        setFuncionarios(funcionarioCache.funcionarios)
        setLoading(false)
        return
      }

      // Buscar do banco de dados
      const funcionariosData = await fetchFuncionarios()
      
      // Atualizar cache
      if (enableCache) {
        funcionarioCache = {
          funcionarios: funcionariosData,
          timestamp: Date.now()
        }
      }
      
      setFuncionarios(funcionariosData)
      
      // Calcular estatísticas
      const statsData: FuncionarioStats = {
        total_funcionarios: funcionariosData.length,
        total_admins: funcionariosData.filter(f => f.role === 'admin').length,
        total_barbeiros: funcionariosData.filter(f => f.role === 'barber').length,
        funcionarios_ativos: funcionariosData.filter(f => f.ativo).length,
        media_servicos_por_funcionario: funcionariosData.length > 0 
          ? funcionariosData.reduce((sum, f) => sum + f.servicos.length, 0) / funcionariosData.length 
          : 0
      }
      setStats(statsData)
      
    } catch (err) {
      console.error('❌ Erro ao carregar funcionários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários')
    } finally {
      setLoading(false)
    }
  }, [fetchFuncionarios, isCacheValid, enableCache])

  // Função para buscar funcionários com opções
  const searchFuncionarios = useCallback((options: FuncionarioSearchOptions): FuncionarioComEspecialidades[] => {
    const { query, role, service_id, ordenarPor = 'nome', ordem = 'asc' } = options
    
    let result = [...funcionarios]
    
    // Filtrar por role
    if (role) {
      result = result.filter(funcionario => funcionario.role === role)
    }
    
    // Filtrar por serviço
    if (service_id) {
      result = result.filter(funcionario => 
        funcionario.servicos.some(servico => servico.id === service_id)
      )
    }
    
    // Filtrar por busca textual
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      result = result.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(searchTerm) ||
        funcionario.email.toLowerCase().includes(searchTerm) ||
        funcionario.servicos.some(servico => 
          servico.nome.toLowerCase().includes(searchTerm) ||
          servico.categoria?.toLowerCase().includes(searchTerm)
        )
      )
    }
    
    // Ordenar resultados
    result.sort((a, b) => {
      let valueA: any
      let valueB: any
      
      switch (ordenarPor) {
        case 'role':
          valueA = a.role
          valueB = b.role
          break
        case 'created_at':
          valueA = new Date(a.created_at).getTime()
          valueB = new Date(b.created_at).getTime()
          break
        default:
          valueA = a.nome.toLowerCase()
          valueB = b.nome.toLowerCase()
      }
      
      if (ordem === 'desc') {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
      } else {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
      }
    })
    
    return result
  }, [funcionarios])

  // Aplicar filtros aos funcionários
  const applyFilters = useCallback((filters: FuncionarioFilters) => {
    setCurrentFilters(filters)
  }, [])

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setCurrentFilters({})
  }, [])

  // Atualizar especialidades de um funcionário
  const updateFuncionarioEspecialidades = useCallback(async (data: UpdateFuncionarioEspecialidadesData) => {
    if (!hasPermission) {
      return { success: false, error: 'Acesso negado' }
    }

    try {
      // Por enquanto, apenas simular sucesso até a migração ser aplicada
      console.log('Especialidades serão atualizadas após aplicar migração:', data)
      
      // Recarregar dados (simular por enquanto)
      console.log('Dados seriam recarregados aqui')

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar especialidades:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar especialidades'
      }
    }
  }, [hasPermission])

  // Obter funcionários que fazem um serviço específico
  const getFuncionariosByService = useCallback((serviceId: string): FuncionarioComEspecialidades[] => {
    return funcionarios.filter(funcionario => 
      funcionario.servicos.some(servico => servico.id === serviceId)
    )
  }, [funcionarios])

  // Obter serviços de um funcionário específico
  const getServicesByFuncionario = useCallback((funcionarioId: string): Service[] => {
    const funcionario = funcionarios.find(f => f.id === funcionarioId)
    return funcionario?.servicos || []
  }, [funcionarios])

  // Refetch manual
  const refetch = useCallback(async () => {
    clearCache()
    await loadFuncionarios()
  }, [])

  // Funcionários filtrados (memoizado)
  const filteredFuncionarios = useMemo(() => {
    let result = [...funcionarios]
    
    // Aplicar filtros de role
    if (currentFilters.role) {
      result = result.filter(funcionario => funcionario.role === currentFilters.role)
    }
    
    // Aplicar filtros de ativo
    if (currentFilters.ativo !== undefined) {
      result = result.filter(funcionario => funcionario.ativo === currentFilters.ativo)
    }
    
    // Aplicar filtros de serviço
    if (currentFilters.service_id) {
      result = result.filter(funcionario => 
        funcionario.servicos.some(servico => servico.id === currentFilters.service_id)
      )
    }
    
    // Aplicar filtro de busca textual
    if (currentFilters.busca && currentFilters.busca.trim()) {
      const searchTerm = currentFilters.busca.toLowerCase().trim()
      result = result.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(searchTerm) ||
        funcionario.email.toLowerCase().includes(searchTerm) ||
        funcionario.servicos.some(servico => 
          servico.nome.toLowerCase().includes(searchTerm) ||
          servico.categoria?.toLowerCase().includes(searchTerm)
        )
      )
    }
    
    return result
  }, [funcionarios, currentFilters])

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof FuncionarioFilters]
      return value !== undefined && value !== '' && value !== null
    })
  }, [currentFilters])

  // Carregar funcionários na inicialização
  useEffect(() => {
    if (autoFetch && hasPermission) {
      loadFuncionarios()
    }
  }, [autoFetch, hasPermission])

  return {
    funcionarios,
    filteredFuncionarios,
    loading,
    error,
    searchFuncionarios,
    applyFilters,
    clearFilters,
    updateFuncionarioEspecialidades,
    getFuncionariosByService,
    getServicesByFuncionario,
    refetch,
    clearCache,
    currentFilters,
    hasActiveFilters,
    stats
  }
}