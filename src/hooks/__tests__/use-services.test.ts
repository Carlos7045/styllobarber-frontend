/**
 * Testes para o hook useServices
 */

import { renderHook, act } from '@testing-library/react'
import { useServices } from '../use-services'

// Mock do supabase
jest.mock('@/lib/supabase')
import { supabase } from '@/lib/supabase'
const mockSupabase = supabase

describe('useServices', () => {
  const mockServices = [
    {
      id: 'service-1',
      nome: 'Corte Masculino',
      descricao: 'Corte tradicional masculino',
      preco: 25,
      duracao_minutos: 30,
      categoria: 'Corte',
      ativo: true,
      ordem: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'service-2',
      nome: 'Barba Completa',
      descricao: 'Aparar e modelar barba',
      preco: 20,
      duracao_minutos: 20,
      categoria: 'Barba',
      ativo: true,
      ordem: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'service-3',
      nome: 'Combo Corte + Barba',
      descricao: 'Corte e barba juntos',
      preco: 40,
      duracao_minutos: 45,
      categoria: 'Combo',
      ativo: true,
      ordem: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Limpar cache global
    jest.resetModules()

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockServices,
              error: null,
            }),
          }),
        }),
      }),
    })
  })

  it('deve carregar serviços na inicialização', async () => {
    const { result } = renderHook(() => useServices())

    // Inicialmente deve estar carregando
    expect(result.current.loading).toBe(true)
    expect(result.current.services).toEqual([])

    // Aguardar carregamento
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.services).toEqual(mockServices)
    expect(result.current.error).toBeNull()
  })

  it('deve aplicar filtros corretamente', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Aplicar filtro por categoria
    act(() => {
      result.current.applyFilters({ categoria: 'Corte' })
    })

    expect(result.current.filteredServices).toHaveLength(1)
    expect(result.current.filteredServices[0].nome).toBe('Corte Masculino')
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('deve filtrar por preço mínimo e máximo', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Filtrar por faixa de preço
    act(() => {
      result.current.applyFilters({ precoMin: 20, precoMax: 30 })
    })

    expect(result.current.filteredServices).toHaveLength(2)
    expect(result.current.filteredServices.every((s) => s.preco >= 20 && s.preco <= 30)).toBe(true)
  })

  it('deve filtrar por duração', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Filtrar por duração mínima
    act(() => {
      result.current.applyFilters({ duracaoMin: 30 })
    })

    expect(result.current.filteredServices).toHaveLength(2)
    expect(result.current.filteredServices.every((s) => s.duracao_minutos >= 30)).toBe(true)
  })

  it('deve filtrar por busca textual', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Buscar por texto
    act(() => {
      result.current.applyFilters({ busca: 'barba' })
    })

    expect(result.current.filteredServices).toHaveLength(2) // "Barba Completa" e "Combo Corte + Barba"
  })

  it('deve limpar filtros corretamente', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Aplicar filtro
    act(() => {
      result.current.applyFilters({ categoria: 'Corte' })
    })

    expect(result.current.hasActiveFilters).toBe(true)
    expect(result.current.filteredServices).toHaveLength(1)

    // Limpar filtros
    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.hasActiveFilters).toBe(false)
    expect(result.current.filteredServices).toHaveLength(3)
  })

  it('deve buscar serviços com opções de ordenação', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Buscar ordenado por preço decrescente
    const resultadoBusca = result.current.searchServices({
      ordenarPor: 'preco',
      ordem: 'desc',
    })

    expect(resultadoBusca).toHaveLength(3)
    expect(resultadoBusca[0].preco).toBe(40) // Combo mais caro primeiro
    expect(resultadoBusca[1].preco).toBe(25)
    expect(resultadoBusca[2].preco).toBe(20)
  })

  it('deve buscar serviços por categoria e query', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Buscar por categoria e texto
    const resultadoBusca = result.current.searchServices({
      categoria: 'Combo',
      query: 'corte',
    })

    expect(resultadoBusca).toHaveLength(1)
    expect(resultadoBusca[0].nome).toBe('Combo Corte + Barba')
  })

  it('deve lidar com erro ao carregar serviços', async () => {
    const errorMessage = 'Erro de conexão'

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error(errorMessage),
            }),
          }),
        }),
      }),
    })

    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.services).toEqual([])
  })

  it('deve usar cache quando habilitado', async () => {
    // Primeiro hook - deve fazer chamada ao banco
    const { result: result1 } = renderHook(() => useServices({ enableCache: true }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    expect(result1.current.services).toEqual(mockServices)

    // Segundo hook - deve usar cache
    const { result: result2 } = renderHook(() => useServices({ enableCache: true }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Não deve fazer nova chamada ao banco
    expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    expect(result2.current.services).toEqual(mockServices)
  })

  it('deve refazer busca ao chamar refetch', async () => {
    const { result } = renderHook(() => useServices())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(1)

    // Chamar refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })

  it('deve limpar cache corretamente', async () => {
    const { result } = renderHook(() => useServices({ enableCache: true }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(1)

    // Limpar cache
    act(() => {
      result.current.clearCache()
    })

    // Novo hook deve fazer nova chamada
    const { result: result2 } = renderHook(() => useServices({ enableCache: true }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })

  it('não deve fazer fetch automático quando autoFetch é false', async () => {
    const { result } = renderHook(() => useServices({ autoFetch: false }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mockSupabase.from).not.toHaveBeenCalled()
    expect(result.current.services).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('deve aplicar filtros iniciais', async () => {
    const { result } = renderHook(() =>
      useServices({
        filters: { categoria: 'Barba' },
      })
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.currentFilters).toEqual({ categoria: 'Barba' })
    expect(result.current.filteredServices).toHaveLength(1)
    expect(result.current.filteredServices[0].categoria).toBe('Barba')
  })
})
