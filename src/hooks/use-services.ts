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
  const fetchServices = useCallback(async (): Promise<Service[]> => {
    try {
      console.log('🔍 Buscando serviços do banco de dados...')
      
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const servicesData = data || []
      console.log(`✅ ${servicesData.length} serviços carregados`)
      
      return servicesData
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
        setLoading(false)
        return
      }

      // Buscar do banco de dados
      const servicesData = await fetchServices()
      
      // Atualizar cache
      if (enableCache) {
        serviceCache = {
          services: servicesData,
          timestamp: Date.now()
        }
      }
      
      setServices(servicesData)
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
    filteredServices,
    loading,
    error,
    searchServices,
    applyFilters,
    clearFilters,
    refetch,
    clearCache,
    currentFilters,
    hasActiveFilters
  }
}