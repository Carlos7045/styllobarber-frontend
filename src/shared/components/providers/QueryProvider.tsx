
'use client'
/**
 * Provider para React Query
 * Configura o cliente do React Query com otimizações específicas para a aplicação
 */


import React, { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { logger } from '@/lib/monitoring/logger'
import { errorHandler } from '@/shared/services/base/ErrorHandler'

interface QueryProviderProps {
  children: ReactNode
  /** Se deve mostrar as devtools (padrão: apenas em desenvolvimento) */
  showDevtools?: boolean
  /** Configurações customizadas do QueryClient */
  clientConfig?: {
    /** Tempo padrão para considerar dados como stale (padrão: 5 minutos) */
    defaultStaleTime?: number
    /** Tempo padrão para manter dados no cache (padrão: 10 minutos) */
    defaultCacheTime?: number
    /** Número padrão de tentativas de retry (padrão: 3) */
    defaultRetry?: number
    /** Se deve refetch quando a janela ganha foco (padrão: false) */
    refetchOnWindowFocus?: boolean
    /** Se deve refetch quando reconecta (padrão: true) */
    refetchOnReconnect?: boolean
  }
}

/**
 * Cria um cliente do React Query com configurações otimizadas
 */
function createQueryClient(config?: QueryProviderProps['clientConfig']) {
  const {
    defaultStaleTime = 5 * 60 * 1000, // 5 minutos
    defaultCacheTime = 10 * 60 * 1000, // 10 minutos
    defaultRetry = 3,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
  } = config || {}

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: defaultStaleTime,
        gcTime: defaultCacheTime,
        retry: (failureCount, error) => {
          // Não retry para erros de autenticação
          const errorMessage = (error as Error)?.message?.toLowerCase() || ''
          if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
            return false
          }
          
          // Retry apenas para erros de rede até o limite
          if (failureCount < defaultRetry) {
            return errorMessage.includes('network') || errorMessage.includes('fetch')
          }
          
          return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus,
        refetchOnReconnect,
        // Configurar timeout global
        networkMode: 'online',
      },
      mutations: {
        retry: (failureCount, error) => {
          // Não retry mutations por padrão, exceto erros de rede
          if (failureCount < 2) {
            const errorMessage = (error as Error)?.message?.toLowerCase() || ''
            return errorMessage.includes('network') || errorMessage.includes('timeout')
          }
          return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'online',
      },
    },
    
    // Cache global para queries
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log de erro de query
        logger.error('Query error', error as Error, {
          component: 'QueryCache',
          queryKey: query.queryKey,
          queryHash: query.queryHash,
        })

        // Tratar erro com o sistema global
        errorHandler.handle(error as Error, {
          service: 'ReactQuery',
          method: 'query',
          additionalData: {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
          },
        })
      },
      
      onSuccess: (data, query) => {
        // Log de sucesso apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Query success', {
            component: 'QueryCache',
            queryKey: query.queryKey,
            dataLength: Array.isArray(data) ? data.length : undefined,
          })
        }
      },
    }),
    
    // Cache global para mutations
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        // Log de erro de mutation
        logger.error('Mutation error', error as Error, {
          component: 'MutationCache',
          mutationKey: mutation.options.mutationKey,
          variables,
        })

        // Tratar erro com o sistema global
        errorHandler.handle(error as Error, {
          service: 'ReactQuery',
          method: 'mutation',
          additionalData: {
            mutationKey: mutation.options.mutationKey,
            variables,
          },
        })
      },
      
      onSuccess: (data, variables, context, mutation) => {
        // Log de sucesso de mutation
        logger.info('Mutation success', {
          component: 'MutationCache',
          mutationKey: mutation.options.mutationKey,
        })
      },
    }),
  })
}

/**
 * Provider do React Query
 * 
 * @description
 * Configura o React Query com otimizações específicas para a aplicação,
 * incluindo tratamento de erros, logging e configurações de cache.
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <QueryProvider
 *       showDevtools={process.env.NODE_ENV === 'development'}
 *       clientConfig={{
 *         defaultStaleTime: 10 * 60 * 1000, // 10 minutos
 *         defaultRetry: 2,
 *       }}
 *     >
 *       <MyApp />
 *     </QueryProvider>
 *   )
 * }
 * ```
 */
export function QueryProvider({ 
  children, 
  showDevtools = process.env.NODE_ENV === 'development',
  clientConfig 
}: QueryProviderProps) {
  // Criar cliente apenas uma vez
  const [queryClient] = useState(() => createQueryClient(clientConfig))

  // Log de inicialização
  React.useEffect(() => {
    logger.info('React Query initialized', {
      component: 'QueryProvider',
      config: {
        defaultStaleTime: clientConfig?.defaultStaleTime || 5 * 60 * 1000,
        defaultCacheTime: clientConfig?.defaultCacheTime || 10 * 60 * 1000,
        defaultRetry: clientConfig?.defaultRetry || 3,
        refetchOnWindowFocus: clientConfig?.refetchOnWindowFocus || false,
        refetchOnReconnect: clientConfig?.refetchOnReconnect || true,
      },
    })

    // Cleanup ao desmontar
    return () => {
      logger.debug('React Query cleanup', {
        component: 'QueryProvider',
      })
    }
  }, [clientConfig])

  // Monitorar mudanças de conectividade
  React.useEffect(() => {
    const handleOnline = () => {
      logger.info('Network online - resuming queries', {
        component: 'QueryProvider',
      })
      queryClient.resumePausedMutations()
    }

    const handleOffline = () => {
      logger.warn('Network offline - pausing queries', {
        component: 'QueryProvider',
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Devtools apenas em desenvolvimento */}
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right',
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook para acessar o QueryClient
 */
export function useQueryClient() {
  const { useQueryClient } = require('@tanstack/react-query')
  return useQueryClient()
}

/**
 * Hook para estatísticas do cache
 */
export function useQueryStats() {
  const queryClient = useQueryClient()
  
  const [stats, setStats] = React.useState({
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    cachedQueries: 0,
  })

  React.useEffect(() => {
    const updateStats = () => {
      const cache = queryClient.getQueryCache()
      const queries = cache.getAll()
      
      setStats({
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      })
    }

    // Atualizar stats inicialmente
    updateStats()

    // Atualizar stats periodicamente
    const interval = setInterval(updateStats, 5000)

    return () => clearInterval(interval)
  }, [queryClient])

  return stats
}

/**
 * Hook para limpar cache seletivamente
 */
export function useCacheManager() {
  const queryClient = useQueryClient()

  return {
    // Limpar todo o cache
    clearAll: () => {
      queryClient.clear()
      logger.info('All cache cleared', { component: 'CacheManager' })
    },

    // Limpar cache por padrão de chave
    clearByPattern: (pattern: string) => {
      queryClient.removeQueries({
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          )
      })
      logger.info(`Cache cleared for pattern: ${pattern}`, { component: 'CacheManager' })
    },

    // Invalidar queries por padrão
    invalidateByPattern: (pattern: string) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          )
      })
      logger.info(`Queries invalidated for pattern: ${pattern}`, { component: 'CacheManager' })
    },

    // Obter estatísticas do cache
    getStats: () => {
      const cache = queryClient.getQueryCache()
      const queries = cache.getAll()
      
      return {
        totalQueries: queries.length,
        totalSize: queries.reduce((size, query) => {
          const data = query.state.data
          return size + (data ? JSON.stringify(data).length : 0)
        }, 0),
        oldestQuery: queries.reduce((oldest, query) => {
          return !oldest || query.state.dataUpdatedAt < oldest.state.dataUpdatedAt 
            ? query 
            : oldest
        }, null as any)?.queryKey,
      }
    },
  }
}