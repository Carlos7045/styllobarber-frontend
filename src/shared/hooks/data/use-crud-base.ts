import { useState, useCallback } from 'react'
// import { supabase } from '@/lib/api/supabase' // TODO: Configurar supabase client
const supabase: any = null // Placeholder temporário

/**
 * Interface base para entidades
 */
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

/**
 * Configuração para operações CRUD
 */
export interface CrudConfig<T extends BaseEntity> {
  /** Nome da tabela no Supabase */
  tableName: string
  /** Campos a serem selecionados */
  selectFields?: string
  /** Ordenação padrão */
  defaultOrder?: {
    column: keyof T
    ascending?: boolean
  }
  /** Cache TTL em milissegundos */
  cacheTTL?: number
  /** Transformação de dados após busca */
  transform?: (data: any) => T
  /** Validação antes de salvar */
  validate?: (data: Partial<T>) => string | null
}

/**
 * Estado do hook CRUD
 */
export interface CrudState<T extends BaseEntity> {
  /** Lista de itens */
  data: T[]
  /** Se está carregando */
  loading: boolean
  /** Erro atual */
  error: string | null
  /** Se está criando */
  creating: boolean
  /** Se está atualizando */
  updating: boolean
  /** Se está deletando */
  deleting: boolean
  /** Erros específicos de operação */
  createError: string | null
  updateError: string | null
  deleteError: string | null
}

/**
 * Ações do hook CRUD
 */
export interface CrudActions<T extends BaseEntity> {
  /** Buscar todos os itens */
  refetch: () => Promise<void>
  /** Invalidar cache */
  invalidate: () => void
  /** Criar novo item */
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T | null>
  /** Atualizar item existente */
  update: (id: string, data: Partial<T>) => Promise<T | null>
  /** Deletar item */
  delete: (id: string) => Promise<boolean>
  /** Buscar item por ID */
  findById: (id: string) => T | undefined
  /** Adicionar item ao estado local */
  addItem: (item: T) => void
  /** Atualizar item no estado local */
  updateItem: (id: string, updates: Partial<T>) => void
  /** Remover item do estado local */
  removeItem: (id: string) => void
  /** Definir dados diretamente */
  setData: (data: T[]) => void
  /** Limpar erro */
  clearError: () => void
  /** Limpar estado */
  clear: () => void
}

/**
 * Resultado completo do hook CRUD
 */
export interface UseCrudResult<T extends BaseEntity> extends CrudState<T>, CrudActions<T> {}

/**
 * Cache global para dados
 */
interface CacheEntry<T> {
  data: T[]
  timestamp: number
}

const globalCache = new Map<string, CacheEntry<any>>()

/**
 * Hook base para operações CRUD reutilizáveis
 * 
 * @description
 * Hook genérico que fornece operações CRUD completas para qualquer entidade.
 * Inclui cache, estados de loading, tratamento de erros e otimizações.
 * 
 * @example
 * ```tsx
 * const users = useCrudBase<User>({
 *   tableName: 'users',
 *   selectFields: '*, profile(*)',
 *   defaultOrder: { column: 'created_at', ascending: false },
 *   cacheTTL: 5 * 60 * 1000, // 5 minutos
 *   transform: (data) => ({ ...data, fullName: `${data.first_name} ${data.last_name}` }),
 *   validate: (data) => data.email ? null : 'Email é obrigatório'
 * })
 * ```
 */
export function useCrudBase<T extends BaseEntity>(
  config: CrudConfig<T>
): UseCrudResult<T> {
  const {
    tableName,
    selectFields = '*',
    defaultOrder,
    cacheTTL = 5 * 60 * 1000, // 5 minutos padrão
    transform,
    validate,
  } = config

  // Estado
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Chave do cache
  const cacheKey = `${tableName}_${selectFields}_${JSON.stringify(defaultOrder)}`

  // Verificar se cache é válido
  const isCacheValid = useCallback((): boolean => {
    const cached = globalCache.get(cacheKey)
    if (!cached) return false
    
    const now = Date.now()
    return (now - cached.timestamp) < cacheTTL
  }, [cacheKey, cacheTTL])

  // Buscar dados
  const fetchData = useCallback(async (): Promise<T[]> => {
    let query = supabase.from(tableName).select(selectFields)

    // Aplicar ordenação padrão
    if (defaultOrder) {
      query = query.order(
        defaultOrder.column as string, 
        { ascending: defaultOrder.ascending ?? true }
      )
    }

    const { data: result, error: fetchError } = await query

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // Transformar dados se necessário
    const transformedData = result?.map((item: any) => 
      transform ? transform(item) : item
    ) || []

    return transformedData as T[]
  }, [tableName, selectFields, defaultOrder, transform])

  // Refetch com cache
  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache primeiro
      if (isCacheValid()) {
        const cached = globalCache.get(cacheKey)
        if (cached) {
          setData(cached.data)
          setLoading(false)
          return
        }
      }

      // Buscar dados frescos
      const freshData = await fetchData()
      
      // Atualizar cache
      globalCache.set(cacheKey, {
        data: freshData,
        timestamp: Date.now()
      })
      
      setData(freshData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados'
      setError(errorMessage)
      console.error(`Erro ao buscar ${tableName}:`, err)
    } finally {
      setLoading(false)
    }
  }, [fetchData, isCacheValid, cacheKey, tableName])

  // Invalidar cache
  const invalidate = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  // Criar item
  const create = useCallback(async (
    itemData: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<T | null> => {
    try {
      setCreating(true)
      setCreateError(null)

      // Validar dados se necessário
      if (validate) {
        const validationError = validate(itemData as Partial<T>)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      const { data: result, error: createErr } = await supabase
        .from(tableName)
        .insert([itemData])
        .select(selectFields)
        .single()

      if (createErr) {
        throw new Error(createErr.message)
      }

      const newItem = transform ? transform(result) : result as T

      // Atualizar estado local
      setData(prev => [newItem, ...prev])
      
      // Invalidar cache
      invalidate()

      return newItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar item'
      setCreateError(errorMessage)
      console.error(`Erro ao criar ${tableName}:`, err)
      return null
    } finally {
      setCreating(false)
    }
  }, [tableName, selectFields, validate, transform, invalidate])

  // Atualizar item
  const update = useCallback(async (
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> => {
    try {
      setUpdating(true)
      setUpdateError(null)

      // Validar dados se necessário
      if (validate) {
        const validationError = validate(updates)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      const { data: result, error: updateErr } = await supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(selectFields)
        .single()

      if (updateErr) {
        throw new Error(updateErr.message)
      }

      const updatedItem = transform ? transform(result) : result as T

      // Atualizar estado local
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ))
      
      // Invalidar cache
      invalidate()

      return updatedItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item'
      setUpdateError(errorMessage)
      console.error(`Erro ao atualizar ${tableName}:`, err)
      return null
    } finally {
      setUpdating(false)
    }
  }, [tableName, selectFields, validate, transform, invalidate])

  // Deletar item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true)
      setDeleteError(null)

      const { error: deleteErr } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (deleteErr) {
        throw new Error(deleteErr.message)
      }

      // Atualizar estado local
      setData(prev => prev.filter(item => item.id !== id))
      
      // Invalidar cache
      invalidate()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar item'
      setDeleteError(errorMessage)
      console.error(`Erro ao deletar ${tableName}:`, err)
      return false
    } finally {
      setDeleting(false)
    }
  }, [tableName, invalidate])

  // Buscar por ID
  const findById = useCallback((id: string): T | undefined => {
    return data.find(item => item.id === id)
  }, [data])

  // Adicionar item ao estado local
  const addItem = useCallback((item: T) => {
    setData(prev => [item, ...prev])
  }, [])

  // Atualizar item no estado local
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [])

  // Remover item do estado local
  const removeItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
  }, [])

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null)
    setCreateError(null)
    setUpdateError(null)
    setDeleteError(null)
  }, [])

  // Limpar estado
  const clear = useCallback(() => {
    setData([])
    setError(null)
    setCreateError(null)
    setUpdateError(null)
    setDeleteError(null)
  }, [])

  return {
    // Estado
    data,
    loading,
    error,
    creating,
    updating,
    deleting,
    createError,
    updateError,
    deleteError,
    
    // Ações
    refetch,
    invalidate,
    create,
    update,
    delete: deleteItem,
    findById,
    addItem,
    updateItem,
    removeItem,
    setData,
    clearError,
    clear,
  }
}
