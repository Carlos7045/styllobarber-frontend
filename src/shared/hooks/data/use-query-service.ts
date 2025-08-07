import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { BaseService, ServiceResult, ServiceListResult, QueryFilters, SortOptions, PaginationOptions } from '@/shared/services/base/BaseService'
import { logger } from '@/lib/monitoring/logger'

/**
 * Configuração para queries de service
 */
export interface UseServiceQueryConfig<T> extends Omit<UseQueryOptions<ServiceResult<T>>, 'queryKey' | 'queryFn'> {
  /** Chave base para a query */
  baseKey: string
  /** Se deve usar cache (padrão: true) */
  enableCache?: boolean
  /** TTL do cache em ms (padrão: 5 minutos) */
  cacheTTL?: number
  /** Se deve revalidar quando a janela ganha foco */
  refetchOnWindowFocus?: boolean
  /** Se deve revalidar quando reconecta */
  refetchOnReconnect?: boolean
}

/**
 * Configuração para queries de lista
 */
export interface UseServiceListQueryConfig<T> extends Omit<UseQueryOptions<ServiceListResult<T>>, 'queryKey' | 'queryFn'> {
  /** Chave base para a query */
  baseKey: string
  /** Filtros para a query */
  filters?: QueryFilters
  /** Opções de ordenação */
  sort?: SortOptions
  /** Opções de paginação */
  pagination?: PaginationOptions
  /** Se deve usar cache (padrão: true) */
  enableCache?: boolean
  /** TTL do cache em ms (padrão: 5 minutos) */
  cacheTTL?: number
}

/**
 * Configuração para mutations
 */
export interface UseServiceMutationConfig<TData, TVariables> extends UseMutationOptions<ServiceResult<TData>, Error, TVariables> {
  /** Chaves de query para invalidar após sucesso */
  invalidateKeys?: string[]
  /** Se deve mostrar toast de sucesso */
  showSuccessToast?: boolean
  /** Se deve mostrar toast de erro */
  showErrorToast?: boolean
  /** Mensagem de sucesso customizada */
  successMessage?: string
  /** Callback após sucesso */
  onSuccessCallback?: (data: ServiceResult<TData>) => void
}

/**
 * Hook para integrar services com React Query
 * 
 * @description
 * Hook que facilita a integração entre os services baseados em BaseService
 * e o React Query, fornecendo cache inteligente, invalidação automática
 * e otimizações de performance.
 * 
 * @example
 * ```typescript
 * const userService = new UserService()
 * const queryService = useQueryService(userService)
 * 
 * // Query para buscar usuário por ID
 * const { data: user, isLoading } = queryService.useQuery({
 *   baseKey: 'user',
 *   queryFn: () => userService.findById('123'),
 *   enabled: !!userId
 * })
 * 
 * // Query para lista de usuários
 * const { data: users } = queryService.useListQuery({
 *   baseKey: 'users',
 *   queryFn: () => userService.findMany(),
 *   filters: { is_active: true }
 * })
 * 
 * // Mutation para criar usuário
 * const createUser = queryService.useMutation({
 *   mutationFn: userService.create,
 *   invalidateKeys: ['users'],
 *   showSuccessToast: true,
 *   successMessage: 'Usuário criado com sucesso!'
 * })
 * ```
 */
export function useQueryService<T>(service: BaseService<T>) {
  const queryClient = useQueryClient()

  /**
   * Hook para queries individuais
   */
  const useServiceQuery = useCallback(
    <TData = T>(
      config: UseServiceQueryConfig<TData> & {
        queryFn: () => Promise<ServiceResult<TData>>
        queryKey?: (string | number | boolean | null | undefined)[]
      }
    ) => {
      const {
        baseKey,
        queryFn,
        queryKey = [],
        enableCache = true,
        cacheTTL = 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus = false,
        refetchOnReconnect = true,
        ...queryOptions
      } = config

      const fullQueryKey = [baseKey, ...queryKey]

      return useQuery({
        queryKey: fullQueryKey,
        queryFn: async () => {
          const startTime = performance.now()
          
          try {
            logger.debug(`Query started: ${baseKey}`, {
              component: 'useQueryService',
              queryKey: fullQueryKey,
            })

            const result = await queryFn()
            
            const duration = performance.now() - startTime
            
            if (result.success) {
              logger.debug(`Query completed: ${baseKey}`, {
                component: 'useQueryService',
                queryKey: fullQueryKey,
                duration,
              })
            } else {
              logger.warn(`Query failed: ${baseKey}`, {
                component: 'useQueryService',
                queryKey: fullQueryKey,
                duration,
                error: result.error,
              })
            }

            return result
          } catch (error) {
            const duration = performance.now() - startTime
            
            logger.error(`Query error: ${baseKey}`, error as Error, {
              component: 'useQueryService',
              queryKey: fullQueryKey,
              duration,
            })
            
            throw error
          }
        },
        staleTime: enableCache ? cacheTTL : 0,
        gcTime: enableCache ? cacheTTL * 2 : 0,
        refetchOnWindowFocus,
        refetchOnReconnect,
        retry: (failureCount, error) => {
          // Retry apenas para erros de rede
          if (failureCount < 3) {
            const errorMessage = (error as Error)?.message?.toLowerCase() || ''
            return errorMessage.includes('network') || errorMessage.includes('fetch')
          }
          return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        ...queryOptions,
      })
    },
    [queryClient]
  )

  /**
   * Hook para queries de lista
   */
  const useServiceListQuery = useCallback(
    <TData = T>(
      config: UseServiceListQueryConfig<TData> & {
        queryFn: (filters?: QueryFilters, sort?: SortOptions, pagination?: PaginationOptions) => Promise<ServiceListResult<TData>>
      }
    ) => {
      const {
        baseKey,
        queryFn,
        filters,
        sort,
        pagination,
        enableCache = true,
        cacheTTL = 5 * 60 * 1000,
        ...queryOptions
      } = config

      const queryKey = [
        baseKey,
        'list',
        filters && Object.keys(filters).length > 0 ? filters : null,
        sort,
        pagination,
      ].filter(Boolean)

      return useQuery({
        queryKey,
        queryFn: async () => {
          const startTime = performance.now()
          
          try {
            logger.debug(`List query started: ${baseKey}`, {
              component: 'useQueryService',
              queryKey,
              filters,
              sort,
              pagination,
            })

            const result = await queryFn(filters, sort, pagination)
            
            const duration = performance.now() - startTime
            
            if (result.success) {
              logger.debug(`List query completed: ${baseKey}`, {
                component: 'useQueryService',
                queryKey,
                duration,
                count: result.count,
              })
            } else {
              logger.warn(`List query failed: ${baseKey}`, {
                component: 'useQueryService',
                queryKey,
                duration,
                error: result.error,
              })
            }

            return result
          } catch (error) {
            const duration = performance.now() - startTime
            
            logger.error(`List query error: ${baseKey}`, error as Error, {
              component: 'useQueryService',
              queryKey,
              duration,
            })
            
            throw error
          }
        },
        staleTime: enableCache ? cacheTTL : 0,
        gcTime: enableCache ? cacheTTL * 2 : 0,
        ...queryOptions,
      })
    },
    [queryClient]
  )

  /**
   * Hook para mutations
   */
  const useServiceMutation = useCallback(
    <TData, TVariables>(
      config: UseServiceMutationConfig<TData, TVariables> & {
        mutationFn: (variables: TVariables) => Promise<ServiceResult<TData>>
      }
    ) => {
      const {
        mutationFn,
        invalidateKeys = [],
        showSuccessToast = false,
        showErrorToast = true,
        successMessage,
        onSuccessCallback,
        ...mutationOptions
      } = config

      return useMutation({
        mutationFn: async (variables: TVariables) => {
          const startTime = performance.now()
          
          try {
            logger.debug('Mutation started', {
              component: 'useQueryService',
              variables,
            })

            const result = await mutationFn(variables)
            
            const duration = performance.now() - startTime
            
            if (result.success) {
              logger.info('Mutation completed successfully', {
                component: 'useQueryService',
                duration,
              })
            } else {
              logger.warn('Mutation failed', {
                component: 'useQueryService',
                duration,
                error: result.error,
              })
            }

            return result
          } catch (error) {
            const duration = performance.now() - startTime
            
            logger.error('Mutation error', error as Error, {
              component: 'useQueryService',
              duration,
            })
            
            throw error
          }
        },
        onSuccess: (data, variables, context) => {
          // Invalidar queries relacionadas
          if (invalidateKeys.length > 0) {
            invalidateKeys.forEach(key => {
              queryClient.invalidateQueries({ queryKey: [key] })
            })
          }

          // Mostrar toast de sucesso
          if (showSuccessToast && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('show-error-toast', {
                detail: {
                  type: 'success',
                  title: 'Sucesso',
                  description: successMessage || 'Operação realizada com sucesso!',
                },
              })
            )
          }

          // Callback customizado
          if (onSuccessCallback) {
            onSuccessCallback(data)
          }

          // Callback original
          if (mutationOptions.onSuccess) {
            mutationOptions.onSuccess(data, variables, context)
          }
        },
        onError: (error, variables, context) => {
          // Mostrar toast de erro
          if (showErrorToast && typeof window !== 'undefined') {
            const errorMessage = (error as any)?.userMessage || (error as Error)?.message || 'Erro inesperado'
            
            window.dispatchEvent(
              new CustomEvent('show-error-toast', {
                detail: {
                  type: 'error',
                  title: 'Erro',
                  description: errorMessage,
                },
              })
            )
          }

          // Callback original
          if (mutationOptions.onError) {
            mutationOptions.onError(error, variables, context)
          }
        },
        ...mutationOptions,
      })
    },
    [queryClient]
  )

  /**
   * Utilitários para invalidação de cache
   */
  const invalidateQueries = useCallback(
    (queryKey: string | string[]) => {
      const keys = Array.isArray(queryKey) ? queryKey : [queryKey]
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    },
    [queryClient]
  )

  const removeQueries = useCallback(
    (queryKey: string | string[]) => {
      const keys = Array.isArray(queryKey) ? queryKey : [queryKey]
      keys.forEach(key => {
        queryClient.removeQueries({ queryKey: [key] })
      })
    },
    [queryClient]
  )

  const setQueryData = useCallback(
    <TData>(queryKey: (string | number | boolean | null | undefined)[], data: ServiceResult<TData>) => {
      queryClient.setQueryData(queryKey, data)
    },
    [queryClient]
  )

  const getQueryData = useCallback(
    <TData>(queryKey: (string | number | boolean | null | undefined)[]): ServiceResult<TData> | undefined => {
      return queryClient.getQueryData(queryKey)
    },
    [queryClient]
  )

  /**
   * Prefetch de queries
   */
  const prefetchQuery = useCallback(
    async <TData>(
      queryKey: (string | number | boolean | null | undefined)[],
      queryFn: () => Promise<ServiceResult<TData>>,
      options?: { staleTime?: number }
    ) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: options?.staleTime || 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  return {
    // Hooks principais
    useQuery: useServiceQuery,
    useListQuery: useServiceListQuery,
    useMutation: useServiceMutation,
    
    // Utilitários de cache
    invalidateQueries,
    removeQueries,
    setQueryData,
    getQueryData,
    prefetchQuery,
    
    // Acesso ao query client
    queryClient,
  }
}

/**
 * Hook simplificado para casos básicos
 */
export function useSimpleQueryService<T>(service: BaseService<T>, baseKey: string) {
  const queryService = useQueryService(service)

  return {
    // Query por ID
    useById: (id: string, options?: Partial<UseServiceQueryConfig<T>>) =>
      queryService.useQuery({
        baseKey,
        queryKey: [id],
        queryFn: () => service.findById(id),
        enabled: !!id,
        ...options,
      }),

    // Query de lista
    useList: (
      filters?: QueryFilters,
      sort?: SortOptions,
      pagination?: PaginationOptions,
      options?: Partial<UseServiceListQueryConfig<T>>
    ) =>
      queryService.useListQuery({
        baseKey,
        queryFn: (f, s, p) => service.findMany(f, s, p),
        filters,
        sort,
        pagination,
        ...options,
      }),

    // Mutation de criação
    useCreate: (options?: Partial<UseServiceMutationConfig<T, Omit<T, 'id' | 'created_at' | 'updated_at'>>>) =>
      queryService.useMutation({
        mutationFn: (data) => service.create(data),
        invalidateKeys: [baseKey],
        showSuccessToast: true,
        successMessage: 'Item criado com sucesso!',
        ...options,
      }),

    // Mutation de atualização
    useUpdate: (options?: Partial<UseServiceMutationConfig<T, { id: string; data: Partial<T> }>>) =>
      queryService.useMutation({
        mutationFn: ({ id, data }) => service.update(id, data),
        invalidateKeys: [baseKey],
        showSuccessToast: true,
        successMessage: 'Item atualizado com sucesso!',
        ...options,
      }),

    // Mutation de exclusão
    useDelete: (options?: Partial<UseServiceMutationConfig<void, string>>) =>
      queryService.useMutation({
        mutationFn: (id) => service.delete(id),
        invalidateKeys: [baseKey],
        showSuccessToast: true,
        successMessage: 'Item excluído com sucesso!',
        ...options,
      }),

    // Utilitários
    ...queryService,
  }
}