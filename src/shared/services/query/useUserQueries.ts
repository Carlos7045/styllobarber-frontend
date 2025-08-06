import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../UserService'
import { queryKeys, cacheUtils } from './QueryClient'
import type { User, CreateUserData, UpdateUserData, UserFilters } from '../UserService'

/**
 * Hook para buscar usuário por ID
 */
export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const result = await userService.findById(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos para dados de usuário
  })
}

/**
 * Hook para buscar usuário por email
 */
export function useUserByEmail(email: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.byEmail(email),
    queryFn: async () => {
      const result = await userService.findByEmail(email)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    enabled: enabled && !!email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar usuários com filtros
 */
export function useUsers(filters?: UserFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const result = await userService.findWithFilters(filters || {})
      if (!result.success) {
        throw new Error(result.error)
      }
      return {
        users: result.data!,
        count: result.count!,
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutos para listas
  })
}

/**
 * Hook para buscar usuários ativos
 */
export function useActiveUsers(role?: User['role'], enabled = true) {
  return useQuery({
    queryKey: role ? queryKeys.users.byRole(role) : queryKeys.users.lists(),
    queryFn: async () => {
      const result = await userService.findActiveUsers(role)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos para usuários ativos
  })
}

/**
 * Hook para estatísticas de usuários por role
 */
export function useUserStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: async () => {
      const result = await userService.countByRole()
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos para estatísticas
  })
}

/**
 * Hook para buscar usuários recentes
 */
export function useRecentUsers(days = 7, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.users.all, 'recent', days],
    queryFn: async () => {
      const result = await userService.findRecentUsers(days)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para criar usuário
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const result = await userService.create(userData)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (newUser) => {
      // Atualizar cache com o novo usuário
      queryClient.setQueryData(queryKeys.users.detail(newUser.id), newUser)
      
      // Invalidar listas para incluir o novo usuário
      cacheUtils.invalidateUsers()
      
      // Atualizar estatísticas
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error)
    },
  })
}

/**
 * Hook para atualizar usuário
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const result = await userService.update(id, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (updatedUser) => {
      // Atualizar cache com dados atualizados
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser)
      
      // Invalidar listas que podem conter este usuário
      cacheUtils.invalidateUsers()
      
      // Se o email mudou, invalidar cache por email
      if (updatedUser.email) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.users.byEmail(updatedUser.email) 
        })
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar usuário:', error)
    },
  })
}

/**
 * Hook para desativar usuário
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await userService.deactivate(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (deactivatedUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.users.detail(deactivatedUser.id), deactivatedUser)
      
      // Invalidar listas de usuários ativos
      cacheUtils.invalidateUsers()
      
      // Atualizar estatísticas
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
    },
    onError: (error) => {
      console.error('Erro ao desativar usuário:', error)
    },
  })
}

/**
 * Hook para reativar usuário
 */
export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await userService.activate(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (activatedUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.users.detail(activatedUser.id), activatedUser)
      
      // Invalidar listas
      cacheUtils.invalidateUsers()
      
      // Atualizar estatísticas
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
    },
    onError: (error) => {
      console.error('Erro ao reativar usuário:', error)
    },
  })
}

/**
 * Hook combinado para operações de usuário
 */
export function useUserOperations() {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()
  const activateUser = useActivateUser()

  return {
    // Mutations
    createUser: createUser.mutate,
    updateUser: updateUser.mutate,
    deactivateUser: deactivateUser.mutate,
    activateUser: activateUser.mutate,

    // Async versions
    createUserAsync: createUser.mutateAsync,
    updateUserAsync: updateUser.mutateAsync,
    deactivateUserAsync: deactivateUser.mutateAsync,
    activateUserAsync: activateUser.mutateAsync,

    // States
    isCreating: createUser.isPending,
    isUpdating: updateUser.isPending,
    isDeactivating: deactivateUser.isPending,
    isActivating: activateUser.isPending,

    // Errors
    createError: createUser.error,
    updateError: updateUser.error,
    deactivateError: deactivateUser.error,
    activateError: activateUser.error,

    // Success states
    createSuccess: createUser.isSuccess,
    updateSuccess: updateUser.isSuccess,
    deactivateSuccess: deactivateUser.isSuccess,
    activateSuccess: activateUser.isSuccess,

    // Reset functions
    resetCreate: createUser.reset,
    resetUpdate: updateUser.reset,
    resetDeactivate: deactivateUser.reset,
    resetActivate: activateUser.reset,
  }
}

/**
 * Hook para prefetch de dados de usuário
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient()

  return {
    prefetchUser: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.users.detail(id),
        queryFn: async () => {
          const result = await userService.findById(id)
          if (!result.success) {
            throw new Error(result.error)
          }
          return result.data!
        },
        staleTime: 10 * 60 * 1000,
      })
    },

    prefetchUsers: async (filters?: UserFilters) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.users.list(filters),
        queryFn: async () => {
          const result = await userService.findWithFilters(filters || {})
          if (!result.success) {
            throw new Error(result.error)
          }
          return {
            users: result.data!,
            count: result.count!,
          }
        },
        staleTime: 2 * 60 * 1000,
      })
    },

    prefetchUserStats: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.users.stats(),
        queryFn: async () => {
          const result = await userService.countByRole()
          if (!result.success) {
            throw new Error(result.error)
          }
          return result.data!
        },
        staleTime: 10 * 60 * 1000,
      })
    },
  }
}
