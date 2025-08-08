/**
 * Exemplo de hook CRUD com tipagem forte
 */

import { useState, useCallback, useEffect } from 'react'
import { UseCRUDOptions, UseCRUDReturn } from '@/shared/types/hooks'
import { UUID, BaseEntity, CreateInput, UpdateInput } from '@/shared/types/base'

/**
 * Hook CRUD genérico com tipagem forte
 */
export function useTypedCRUD<T extends BaseEntity>(
  options: UseCRUDOptions<T>
): UseCRUDReturn<T> {
  const {
    endpoint,
    queryKey,
    onSuccess,
    onError,
    transform
  } = options

  // Estados principais
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Estados de mutação
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Erros de mutação
  const [createError, setCreateError] = useState<Error | null>(null)
  const [updateError, setUpdateError] = useState<Error | null>(null)
  const [deleteError, setDeleteError] = useState<Error | null>(null)

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const transformedData = transform ? result.map(transform) : result
      
      setData(transformedData)
      onSuccess?.(transformedData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [endpoint, transform, onSuccess, onError])

  // Função para refetch
  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // Função para criar item
  const create = useCallback(async (itemData: CreateInput<T>): Promise<T | null> => {
    setCreating(true)
    setCreateError(null)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const transformedItem = transform ? transform(result) : result

      // Adicionar item à lista local
      setData(prev => [...prev, transformedItem])
      
      return transformedItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Create failed')
      setCreateError(error)
      onError?.(error)
      return null
    } finally {
      setCreating(false)
    }
  }, [endpoint, transform, onError])

  // Função para atualizar item
  const update = useCallback(async (id: UUID, updates: UpdateInput<T>): Promise<T | null> => {
    setUpdating(true)
    setUpdateError(null)

    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const transformedItem = transform ? transform(result) : result

      // Atualizar item na lista local
      setData(prev => prev.map(item => 
        item.id === id ? transformedItem : item
      ))
      
      return transformedItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed')
      setUpdateError(error)
      onError?.(error)
      return null
    } finally {
      setUpdating(false)
    }
  }, [endpoint, transform, onError])

  // Função para remover item
  const remove = useCallback(async (id: UUID): Promise<boolean> => {
    setDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Remover item da lista local
      setData(prev => prev.filter(item => item.id !== id))
      
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Delete failed')
      setDeleteError(error)
      onError?.(error)
      return false
    } finally {
      setDeleting(false)
    }
  }, [endpoint, onError])

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // Query state
    data,
    loading,
    error,
    refetch,

    // Mutations
    create,
    update,
    remove,

    // Mutation states
    creating,
    updating,
    deleting,

    // Mutation errors
    createError,
    updateError,
    deleteError,
  }
}

// Exemplo de uso específico para usuários
interface User extends BaseEntity {
  name: string
  email: string
  role: 'admin' | 'user'
  avatar_url?: string
}

export function useUsers() {
  return useTypedCRUD<User>({
    endpoint: '/api/users',
    queryKey: 'users',
    onSuccess: (users) => {
      console.log(`Loaded ${users.length} users`)
    },
    onError: (error) => {
      console.error('Users error:', error)
    },
    transform: (userData: any): User => ({
      id: userData.id,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      avatar_url: userData.avatar_url,
    })
  })
}

// Exemplo de uso específico para produtos
interface Product extends BaseEntity {
  name: string
  description: string
  price: number
  category_id: string
  in_stock: boolean
  images: string[]
}

export function useProducts() {
  return useTypedCRUD<Product>({
    endpoint: '/api/products',
    queryKey: 'products',
    transform: (productData: any): Product => ({
      id: productData.id,
      created_at: productData.created_at,
      updated_at: productData.updated_at,
      name: productData.name,
      description: productData.description || '',
      price: productData.price,
      category_id: productData.category_id,
      in_stock: productData.in_stock ?? true,
      images: productData.images || [],
    })
  })
}

// Hook especializado com funcionalidades extras
export function useUsersWithExtras() {
  const crud = useUsers()
  
  // Funcionalidades extras específicas para usuários
  const activateUser = useCallback(async (id: UUID) => {
    return crud.update(id, { role: 'user' } as UpdateInput<User>)
  }, [crud])

  const deactivateUser = useCallback(async (id: UUID) => {
    // Implementar lógica de desativação
    console.log('Deactivating user:', id)
  }, [])

  const getUsersByRole = useCallback((role: User['role']) => {
    return crud.data.filter(user => user.role === role)
  }, [crud.data])

  const searchUsers = useCallback((query: string) => {
    return crud.data.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    )
  }, [crud.data])

  return {
    ...crud,
    // Funcionalidades extras
    activateUser,
    deactivateUser,
    getUsersByRole,
    searchUsers,
    // Dados derivados
    adminUsers: getUsersByRole('admin'),
    regularUsers: getUsersByRole('user'),
    totalUsers: crud.data.length,
  }
}

// Hook com cache e otimizações
export function useOptimizedCRUD<T extends BaseEntity>(
  options: UseCRUDOptions<T> & {
    gcTime?: number
    staleTime?: number
  }
) {
  const { gcTime = 5 * 60 * 1000, staleTime = 1 * 60 * 1000, ...crudOptions } = options
  
  const crud = useTypedCRUD(crudOptions)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Override refetch para implementar cache
  const optimizedRefetch = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetch

    // Se os dados ainda estão "frescos", não refetch
    if (timeSinceLastFetch < staleTime && crud.data.length > 0) {
      return
    }

    await crud.refetch()
    setLastFetch(now)
  }, [crud, lastFetch, staleTime])

  // Auto-refetch baseado no staleTime
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetch

      if (timeSinceLastFetch >= staleTime) {
        optimizedRefetch()
      }
    }, staleTime)

    return () => clearInterval(interval)
  }, [lastFetch, staleTime, optimizedRefetch])

  return {
    ...crud,
    refetch: optimizedRefetch,
    isStale: Date.now() - lastFetch >= staleTime,
    lastFetch: new Date(lastFetch),
  }
}