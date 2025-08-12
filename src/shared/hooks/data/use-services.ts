/**
 * Hook para gerenciamento de serviços
 * Fornece funcionalidades de busca, filtros e cache para serviços
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Service, 
  ServiceFilters, 
  ServiceSearchOptions,
  ServiceCacheData
} from '@/types/services'
import { SERVICE_CACHE_TTL } from '@/types/services'

interface UseServicesOptions {
  enableCache?: boolean
  autoFetch?: boolean
  filters?: ServiceFilters
}

interface UseServicesReturn {
  // Dados
  services: Service[]
  disabledServices: Service[]
  filteredServices: Service[]
  loading: boolean
  error: string | null
  
  // Funcionalidades de busca e filtro
  searchServices: (options: ServiceSearchOptions) => Service[]
  applyFilters: (filters: ServiceFilters) => void
  clearFilters: () => void
  
  // Ações
  refetch: () => Promise<void>
  clearCache: () => void
  deleteService: (serviceId: string) => Promise<{ success: boolean; error?: string }>
  reactivateService: (serviceId: string) => Promise<{ success: boolean; error?: string }>
  
  // Estado dos filtros
  currentFilters: ServiceFilters
  hasActiveFilters: boolean
}

// Cache global para serviços
let serviceCache: ServiceCacheData | null = null

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const {
    enableCache = true,
    autoFetch = true,
    filters: initialFilters = {}
  } = options

  const [services, setServices] = useState<Service[]>([])
  const [disabledServices, setDisabledServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ServiceFilters>(initialFilters)

  // Verificar se o cache é válido
  const isCacheValid = useCallback((): boolean => {
    if (!enableCache || !serviceCache) return false
    
    const now = Date.now()
    const isExpired = (now - serviceCache.timestamp) > SERVICE_CACHE_TTL
    
    return !isExpired
  }, [enableCache])

  // Buscar serviços do banco de dados
  const fetchServices = useCallback(async (): Promise<{ active: Service[]; disabled: Service[] }> => {
    try {
      console.log('🔍 Buscando serviços do banco de dados...')
      
      // Buscar serviços ativos
      const { data: activeData, error: activeError } = await supabase
        .from('services')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })

      if (activeError) {
        throw activeError
      }

      // Buscar serviços desativados
      const { data: disabledData, error: disabledError } = await supabase
        .from('services')
        .select('*')
        .eq('ativo', false)
        .order('nome', { ascending: true })

      if (disabledError) {
        throw disabledError
      }

      const activeServices = activeData || []
      const disabledServicesData = disabledData || []
      
      console.log(`✅ ${activeServices.length} serviços ativos e ${disabledServicesData.length} serviços desativados carregados`)
      
      return { active: activeServices, disabled: disabledServicesData }
    } catch (err) {
      console.error('❌ Erro ao buscar serviços:', err)
      throw err
    }
  }, [])

  // Carregar serviços (com cache)
  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache primeiro
      if (isCacheValid() && serviceCache) {
        console.log('📦 Usando serviços do cache')
        setServices(serviceCache.services)
        // Para serviços desativados, sempre buscar do banco (não cachear)
        const { disabled } = await fetchServices()
        setDisabledServices(disabled)
        setLoading(false)
        return
      }

      // Buscar do banco de dados
      const { active, disabled } = await fetchServices()
      
      // Atualizar cache apenas para serviços ativos
      if (enableCache) {
        serviceCache = {
          services: active,
          timestamp: Date.now()
        }
      }
      
      setServices(active)
      setDisabledServices(disabled)
    } catch (err) {
      console.error('❌ Erro ao carregar serviços:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }, [fetchServices, isCacheValid, enableCache])

  // Função para buscar serviços com opções
  const searchServices = useCallback((options: ServiceSearchOptions): Service[] => {
    const { query, categoria, ordenarPor = 'nome', ordem = 'asc' } = options
    
    let result = [...services]
    
    // Filtrar por categoria
    if (categoria) {
      result = result.filter(service => 
        service.categoria?.toLowerCase() === categoria.toLowerCase()
      )
    }
    
    // Filtrar por busca textual
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      result = result.filter(service =>
        service.nome.toLowerCase().includes(searchTerm) ||
        service.descricao?.toLowerCase().includes(searchTerm) ||
        service.categoria?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Ordenar resultados
    result.sort((a, b) => {
      let valueA: any
      let valueB: any
      
      switch (ordenarPor) {
        case 'preco':
          valueA = a.preco
          valueB = b.preco
          break
        case 'duracao':
          valueA = a.duracao_minutos
          valueB = b.duracao_minutos
          break
        case 'ordem':
          valueA = a.ordem || 999
          valueB = b.ordem || 999
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
  }, [services])

  // Aplicar filtros aos serviços
  const applyFilters = useCallback((filters: ServiceFilters) => {
    setCurrentFilters(filters)
  }, [])

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setCurrentFilters({})
  }, [])

  // Limpar cache
  const clearCache = useCallback(() => {
    serviceCache = null
    console.log('🧹 Cache de serviços limpo')
  }, [])

  // Refetch manual
  const refetch = useCallback(async () => {
    clearCache()
    await loadServices()
  }, [clearCache, loadServices])

  // Deletar serviço permanentemente
  const deleteService = useCallback(async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Deletando serviço

      // Primeiro, remover associações com funcionários
      const { error: associationError } = await supabase
        .from('funcionario_servicos')
        .delete()
        .eq('servico_id', serviceId)

      if (associationError) {
        console.error('❌ Erro ao remover associações:', associationError)
        return { success: false, error: 'Erro ao remover associações do serviço' }
      }

      // Depois, deletar o serviço
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (deleteError) {
        console.error('❌ Erro ao deletar serviço:', deleteError)
        return { success: false, error: 'Erro ao deletar serviço' }
      }

      // Atualizar estado local
      setDisabledServices(prev => prev.filter(service => service.id !== serviceId))
      
      // Limpar cache
      clearCache()
      
      console.log('✅ Serviço deletado com sucesso')
      return { success: true }
    } catch (err) {
      console.error('❌ Erro inesperado ao deletar serviço:', err)
      return { success: false, error: 'Erro inesperado ao deletar serviço' }
    }
  }, [clearCache])

  // Reativar serviço
  const reactivateService = useCallback(async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔄 Reativando serviço ${serviceId}...`)

      const { error: updateError } = await supabase
        .from('services')
        .update({ 
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)

      if (updateError) {
        console.error('❌ Erro ao reativar serviço:', updateError)
        return { success: false, error: 'Erro ao reativar serviço' }
      }

      // Encontrar o serviço nos desativados
      const serviceToReactivate = disabledServices.find(service => service.id === serviceId)
      
      if (serviceToReactivate) {
        // Mover para serviços ativos
        const reactivatedService = { ...serviceToReactivate, ativo: true }
        setServices(prev => [...prev, reactivatedService])
        setDisabledServices(prev => prev.filter(service => service.id !== serviceId))
      }
      
      // Limpar cache
      clearCache()
      
      console.log('✅ Serviço reativado com sucesso')
      return { success: true }
    } catch (err) {
      console.error('❌ Erro inesperado ao reativar serviço:', err)
      return { success: false, error: 'Erro inesperado ao reativar serviço' }
    }
  }, [disabledServices, clearCache])

  // Serviços filtrados (memoizado)
  const filteredServices = useMemo(() => {
    let result = [...services]
    
    // Aplicar filtros de categoria
    if (currentFilters.categoria) {
      result = result.filter(service => 
        service.categoria?.toLowerCase() === currentFilters.categoria?.toLowerCase()
      )
    }
    
    // Aplicar filtros de preço
    if (currentFilters.precoMin !== undefined) {
      result = result.filter(service => service.preco >= currentFilters.precoMin!)
    }
    
    if (currentFilters.precoMax !== undefined) {
      result = result.filter(service => service.preco <= currentFilters.precoMax!)
    }
    
    // Aplicar filtros de duração
    if (currentFilters.duracaoMin !== undefined) {
      result = result.filter(service => service.duracao_minutos >= currentFilters.duracaoMin!)
    }
    
    if (currentFilters.duracaoMax !== undefined) {
      result = result.filter(service => service.duracao_minutos <= currentFilters.duracaoMax!)
    }
    
    // Aplicar filtro de busca textual
    if (currentFilters.busca && currentFilters.busca.trim()) {
      const searchTerm = currentFilters.busca.toLowerCase().trim()
      result = result.filter(service =>
        service.nome.toLowerCase().includes(searchTerm) ||
        service.descricao?.toLowerCase().includes(searchTerm) ||
        service.categoria?.toLowerCase().includes(searchTerm)
      )
    }
    
    return result
  }, [services, currentFilters])

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof ServiceFilters]
      return value !== undefined && value !== '' && value !== null
    })
  }, [currentFilters])

  // Carregar serviços na inicialização
  useEffect(() => {
    if (autoFetch) {
      loadServices()
    }
  }, [autoFetch, loadServices])

  return {
    services,
    disabledServices,
    filteredServices,
    loading,
    error,
    searchServices,
    applyFilters,
    clearFilters,
    refetch,
    clearCache,
    deleteService,
    reactivateService,
    currentFilters,
    hasActiveFilters
  }
}
