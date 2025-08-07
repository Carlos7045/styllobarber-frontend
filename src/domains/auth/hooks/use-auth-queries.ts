import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService, type LoginData, type RegisterData, type PasswordResetData, type PasswordUpdateData, type AuthResult } from '@/shared/services'
import { logger } from '@/lib/monitoring/logger'

/**
 * Hook para queries e mutations de autenticação usando React Query
 * 
 * @description
 * Hook que integra o AuthService com React Query, fornecendo
 * cache inteligente para dados de autenticação e invalidação
 * automática quando necessário.
 * 
 * @example
 * ```typescript
 * function LoginForm() {
 *   const { useLogin, useCurrentUser } = useAuthQueries()
 *   
 *   const { data: currentUser } = useCurrentUser()
 *   const login = useLogin()
 *   
 *   const handleLogin = (loginData: LoginData) => {
 *     login.mutate(loginData)
 *   }
 *   
 *   return (
 *     <form onSubmit={handleSubmit(handleLogin)}>
 *       // form fields
 *     </form>
 *   )
 * }
 * ```
 */
export function useAuthQueries() {
  const queryClient = useQueryClient()

  return {
    // Queries de estado atual
    useCurrentSession: () =>
      useQuery({
        queryKey: ['auth', 'session'],
        queryFn: () => authService.getCurrentSession(),
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        retry: false, // Não retry para sessão
      }),

    useCurrentUser: () =>
      useQuery({
        queryKey: ['auth', 'user'],
        queryFn: () => authService.getCurrentUser(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false,
      }),

    useCurrentUserProfile: () =>
      useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: () => authService.getCurrentUserProfile(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false,
      }),

    useHasPermission: (permission: string) =>
      useQuery({
        queryKey: ['auth', 'permission', permission],
        queryFn: () => authService.hasPermission(permission),
        staleTime: 10 * 60 * 1000, // 10 minutos (permissões mudam raramente)
        gcTime: 15 * 60 * 1000,
        enabled: !!permission,
      }),

    useEmailExists: (email: string) =>
      useQuery({
        queryKey: ['auth', 'email-exists', email],
        queryFn: () => authService.emailExists(email),
        staleTime: 2 * 60 * 1000, // 2 minutos
        enabled: !!email && email.includes('@'),
      }),

    // Mutations de autenticação
    useLogin: () =>
      useMutation({
        mutationFn: (loginData: LoginData) => authService.login(loginData),
        onSuccess: (result) => {
          if (result.success) {
            // Invalidar todas as queries de auth
            queryClient.invalidateQueries({ queryKey: ['auth'] })

            // Definir dados do usuário no cache
            if (result.data) {
              queryClient.setQueryData(['auth', 'user'], {
                success: true,
                data: result.data.user,
              })

              queryClient.setQueryData(['auth', 'session'], {
                success: true,
                data: result.data.session,
              })

              if (result.data.profile) {
                queryClient.setQueryData(['auth', 'profile'], {
                  success: true,
                  data: result.data.profile,
                })
              }
            }

            logger.logUserAction('login_success', 'AuthService', {
              userId: result.data?.user.id,
            })
          }
        },
        onError: (error) => {
          logger.logUserAction('login_failed', 'AuthService', {
            error: (error as Error).message,
          })
        },
      }),

    useLogout: () =>
      useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
          // Limpar todo o cache de auth
          queryClient.removeQueries({ queryKey: ['auth'] })

          // Limpar outros caches relacionados ao usuário
          queryClient.removeQueries({ queryKey: ['users'] })
          queryClient.removeQueries({ queryKey: ['appointments'] })

          logger.logUserAction('logout_success', 'AuthService')
        },
        onError: (error) => {
          logger.error('Logout failed', error as Error, {
            component: 'AuthService',
          })
        },
      }),

    useRegister: () =>
      useMutation({
        mutationFn: (registerData: RegisterData) => authService.register(registerData),
        onSuccess: (result) => {
          if (result.success && result.data?.session) {
            // Invalidar queries de auth
            queryClient.invalidateQueries({ queryKey: ['auth'] })

            // Definir dados do usuário no cache
            queryClient.setQueryData(['auth', 'user'], {
              success: true,
              data: result.data.user,
            })

            queryClient.setQueryData(['auth', 'session'], {
              success: true,
              data: result.data.session,
            })

            logger.logUserAction('register_success', 'AuthService', {
              userId: result.data.user.id,
              email: result.data.user.email,
            })
          }
        },
        onError: (error) => {
          logger.logUserAction('register_failed', 'AuthService', {
            error: (error as Error).message,
          })
        },
      }),

    useRequestPasswordReset: () =>
      useMutation({
        mutationFn: (resetData: PasswordResetData) => authService.requestPasswordReset(resetData),
        onSuccess: () => {
          logger.logUserAction('password_reset_requested', 'AuthService')
        },
      }),

    useUpdatePassword: () =>
      useMutation({
        mutationFn: (passwordData: PasswordUpdateData) => authService.updatePassword(passwordData),
        onSuccess: () => {
          logger.logUserAction('password_updated', 'AuthService')
        },
      }),

    useUpdateProfile: () =>
      useMutation({
        mutationFn: (profileData: {
          nome?: string
          telefone?: string
          avatar_url?: string
        }) => authService.updateProfile(profileData),
        onSuccess: (result) => {
          if (result.success) {
            // Atualizar cache do perfil
            queryClient.setQueryData(['auth', 'profile'], result)

            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })

            logger.logUserAction('profile_updated', 'AuthService')
          }
        },
      }),

    // Utilitários
    invalidateAuth: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),

    clearAuthCache: () => {
      queryClient.removeQueries({ queryKey: ['auth'] })
    },

    setUserData: (userData: AuthResult) => {
      queryClient.setQueryData(['auth', 'user'], {
        success: true,
        data: userData.user,
      })

      queryClient.setQueryData(['auth', 'session'], {
        success: true,
        data: userData.session,
      })

      if (userData.profile) {
        queryClient.setQueryData(['auth', 'profile'], {
          success: true,
          data: userData.profile,
        })
      }
    },

    prefetchPermission: (permission: string) =>
      queryClient.prefetchQuery({
        queryKey: ['auth', 'permission', permission],
        queryFn: () => authService.hasPermission(permission),
        staleTime: 10 * 60 * 1000,
      }),
  }
}

/**
 * Hook simplificado para dados do usuário atual
 */
export function useCurrentUser() {
  const { useCurrentUser } = useAuthQueries()
  return useCurrentUser()
}

/**
 * Hook simplificado para perfil do usuário atual
 */
export function useCurrentUserProfile() {
  const { useCurrentUserProfile } = useAuthQueries()
  return useCurrentUserProfile()
}

/**
 * Hook simplificado para sessão atual
 */
export function useCurrentSession() {
  const { useCurrentSession } = useAuthQueries()
  return useCurrentSession()
}

/**
 * Hook para verificar permissão específica
 */
export function usePermission(permission: string) {
  const { useHasPermission } = useAuthQueries()
  return useHasPermission(permission)
}

/**
 * Hook para mutations de autenticação
 */
export function useAuthMutations() {
  const { useLogin, useLogout, useRegister, useRequestPasswordReset, useUpdatePassword, useUpdateProfile } = useAuthQueries()

  return {
    login: useLogin(),
    logout: useLogout(),
    register: useRegister(),
    requestPasswordReset: useRequestPasswordReset(),
    updatePassword: useUpdatePassword(),
    updateProfile: useUpdateProfile(),
  }
}

/**
 * Hook para verificar se email já existe (útil para validação)
 */
export function useEmailValidation(email: string) {
  const { useEmailExists } = useAuthQueries()
  return useEmailExists(email)
}