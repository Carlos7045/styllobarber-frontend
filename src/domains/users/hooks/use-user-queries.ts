import { useSimpleQueryService } from '@/shared/hooks/data/use-query-service'
import { userService, type User, type CreateUserData, type UpdateUserData, type UserFilters } from '@/shared/services'

/**
 * Hook para queries e mutations de usuários usando React Query
 * 
 * @description
 * Hook que integra o UserService com React Query, fornecendo
 * cache inteligente, invalidação automática e otimizações.
 * 
 * @example
 * ```typescript
 * function UserList() {
 *   const { useList, useCreate, useUpdate, useDelete } = useUserQueries()
 *   
 *   const { data: users, isLoading } = useList({ is_active: true })
 *   const createUser = useCreate()
 *   const updateUser = useUpdate()
 *   const deleteUser = useDelete()
 *   
 *   const handleCreate = (userData: CreateUserData) => {
 *     createUser.mutate(userData)
 *   }
 *   
 *   return (
 *     <div>
 *       {users?.data?.map(user => (
 *         <div key={user.id}>{user.nome}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useUserQueries() {
  const queryService = useSimpleQueryService(userService, 'users')

  return {
    // Queries básicas
    useById: queryService.useById,
    useList: queryService.useList,

    // Mutations básicas
    useCreate: queryService.useCreate,
    useUpdate: queryService.useUpdate,
    useDelete: queryService.useDelete,

    // Queries específicas de usuário
    useByEmail: (email: string) =>
      queryService.useQuery({
        baseKey: 'users',
        queryKey: ['email', email],
        queryFn: () => userService.findByEmail(email),
        enabled: !!email,
      }),

    useActiveUsers: (role?: User['role']) =>
      queryService.useQuery({
        baseKey: 'users',
        queryKey: ['active', role],
        queryFn: () => userService.findActiveUsers(role),
      }),

    useWithFilters: (filters: UserFilters) =>
      queryService.useQuery({
        baseKey: 'users',
        queryKey: ['filtered', filters],
        queryFn: () => userService.findWithFilters(filters),
      }),

    useCountByRole: () =>
      queryService.useQuery({
        baseKey: 'users',
        queryKey: ['count-by-role'],
        queryFn: () => userService.countByRole(),
        staleTime: 10 * 60 * 1000, // 10 minutos
      }),

    useRecentUsers: (days = 7) =>
      queryService.useQuery({
        baseKey: 'users',
        queryKey: ['recent', days],
        queryFn: () => userService.findRecentUsers(days),
        staleTime: 5 * 60 * 1000, // 5 minutos
      }),

    // Mutations específicas
    useDeactivate: () =>
      queryService.useMutation({
        mutationFn: (id: string) => userService.deactivate(id),
        invalidateKeys: ['users'],
        showSuccessToast: true,
        successMessage: 'Usuário desativado com sucesso!',
      }),

    useActivate: () =>
      queryService.useMutation({
        mutationFn: (id: string) => userService.activate(id),
        invalidateKeys: ['users'],
        showSuccessToast: true,
        successMessage: 'Usuário ativado com sucesso!',
      }),

    // Utilitários
    invalidateUsers: () => queryService.invalidateQueries('users'),
    prefetchUser: (id: string) =>
      queryService.prefetchQuery(['users', id], () => userService.findById(id)),
  }
}

/**
 * Hook simplificado para casos básicos
 */
export function useUser(id?: string) {
  const { useById } = useUserQueries()
  return useById(id || '', { enabled: !!id })
}

/**
 * Hook para lista de usuários com filtros
 */
export function useUsers(filters?: UserFilters) {
  const { useWithFilters, useList } = useUserQueries()
  
  if (filters && Object.keys(filters).length > 0) {
    return useWithFilters(filters)
  }
  
  return useList()
}

/**
 * Hook para usuários ativos por role
 */
export function useActiveUsersByRole(role?: User['role']) {
  const { useActiveUsers } = useUserQueries()
  return useActiveUsers(role)
}