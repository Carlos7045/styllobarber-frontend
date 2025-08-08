/**
 * Testes para o hook useClientAppointments
 */

import { renderHook, act } from '@testing-library/react'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'

// Mock dos hooks e dependências
jest.mock('../use-auth')
jest.mock('../use-appointments')
jest.mock('@/lib/api/supabase')

import { useAuth } from '../use-auth'
import { useAppointments } from '../use-appointments'
import { supabase } from '@/lib/api/supabase'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseAppointments = useAppointments as jest.MockedFunction<typeof useAppointments>
const mockSupabase = supabase

describe('useClientAppointments', () => {
  const mockUser = {
    id: 'user-123',
    email: 'cliente@test.com',
  }

  const mockProfile = {
    id: 'user-123',
    nome: 'Cliente Teste',
    email: 'cliente@test.com',
    role: 'client',
  }

  const mockAppointments = [
    {
      id: 'apt-1',
      cliente_id: 'user-123',
      barbeiro_id: 'barber-1',
      service_id: 'service-1',
      data_agendamento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      status: 'confirmado',
      observacoes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cliente: { id: 'user-123', nome: 'Cliente Teste', email: 'cliente@test.com' },
      barbeiro: { id: 'barber-1', nome: 'Barbeiro Teste' },
      service: { id: 'service-1', nome: 'Corte', preco: 30, duracao_minutos: 30 },
    },
    {
      id: 'apt-2',
      cliente_id: 'user-123',
      barbeiro_id: 'barber-1',
      service_id: 'service-1',
      data_agendamento: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
      status: 'concluido',
      observacoes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cliente: { id: 'user-123', nome: 'Cliente Teste', email: 'cliente@test.com' },
      barbeiro: { id: 'barber-1', nome: 'Barbeiro Teste' },
      service: { id: 'service-1', nome: 'Corte', preco: 30, duracao_minutos: 30 },
    },
    {
      id: 'apt-3',
      cliente_id: 'other-user',
      barbeiro_id: 'barber-1',
      service_id: 'service-1',
      data_agendamento: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Depois de amanhã
      status: 'confirmado',
      observacoes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cliente: { id: 'other-user', nome: 'Outro Cliente', email: 'outro@test.com' },
      barbeiro: { id: 'barber-1', nome: 'Barbeiro Teste' },
      service: { id: 'service-1', nome: 'Corte', preco: 30, duracao_minutos: 30 },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    })

    mockUseAppointments.mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      updateAppointment: jest.fn().mockResolvedValue({ success: true }),
      refetch: jest.fn(),
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })
  })

  it('deve filtrar apenas agendamentos do cliente logado', () => {
    const { result } = renderHook(() => useClientAppointments())

    expect(result.current.appointments).toHaveLength(2) // Apenas apt-1 e apt-2
    expect(result.current.appointments.every((apt) => apt.cliente_id === 'user-123')).toBe(true)
  })

  it('deve separar agendamentos futuros e passados corretamente', () => {
    const { result } = renderHook(() => useClientAppointments())

    expect(result.current.upcomingAppointments).toHaveLength(1)
    expect(result.current.upcomingAppointments[0].id).toBe('apt-1')
    expect(result.current.upcomingAppointments[0].isUpcoming).toBe(true)

    expect(result.current.pastAppointments).toHaveLength(1)
    expect(result.current.pastAppointments[0].id).toBe('apt-2')
    expect(result.current.pastAppointments[0].isPast).toBe(true)
  })

  it('deve calcular corretamente se agendamento pode ser cancelado', () => {
    const { result } = renderHook(() => useClientAppointments())

    // Agendamento futuro deve poder ser cancelado (mais de 24h)
    expect(result.current.canCancelAppointment('apt-1')).toBe(true)

    // Agendamento passado não deve poder ser cancelado
    expect(result.current.canCancelAppointment('apt-2')).toBe(false)
  })

  it('deve calcular corretamente se agendamento pode ser reagendado', () => {
    const { result } = renderHook(() => useClientAppointments())

    // Agendamento futuro deve poder ser reagendado (mais de 12h)
    expect(result.current.canRescheduleAppointment('apt-1')).toBe(true)

    // Agendamento passado não deve poder ser reagendado
    expect(result.current.canRescheduleAppointment('apt-2')).toBe(false)
  })

  it('deve adicionar propriedades específicas do cliente aos agendamentos', () => {
    const { result } = renderHook(() => useClientAppointments())

    const appointment = result.current.appointments[0]

    expect(appointment).toHaveProperty('canCancel')
    expect(appointment).toHaveProperty('canReschedule')
    expect(appointment).toHaveProperty('isUpcoming')
    expect(appointment).toHaveProperty('isPast')
    expect(appointment).toHaveProperty('timeUntilAppointment')
  })

  it('deve cancelar agendamento com sucesso', async () => {
    const mockUpdateAppointment = jest.fn().mockResolvedValue({ success: true })
    mockUseAppointments.mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      updateAppointment: mockUpdateAppointment,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useClientAppointments())

    await act(async () => {
      const response = await result.current.cancelAppointment('apt-1', 'Mudança de planos')
      expect(response.success).toBe(true)
    })

    expect(mockUpdateAppointment).toHaveBeenCalledWith('apt-1', {
      status: 'cancelado',
      observacoes: 'Cancelado: Mudança de planos',
    })
  })

  it('deve reagendar agendamento com sucesso', async () => {
    const mockUpdateAppointment = jest.fn().mockResolvedValue({ success: true })
    mockUseAppointments.mockReturnValue({
      appointments: mockAppointments,
      loading: false,
      error: null,
      updateAppointment: mockUpdateAppointment,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useClientAppointments())
    const newDateTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    await act(async () => {
      const response = await result.current.rescheduleAppointment('apt-1', newDateTime)
      expect(response.success).toBe(true)
    })

    expect(mockUpdateAppointment).toHaveBeenCalledWith('apt-1', {
      data_agendamento: newDateTime,
      status: 'pendente',
    })
  })

  it('deve retornar erro ao tentar cancelar agendamento que não pode ser cancelado', async () => {
    const { result } = renderHook(() => useClientAppointments())

    await act(async () => {
      const response = await result.current.cancelAppointment('apt-2') // Agendamento passado
      expect(response.success).toBe(false)
      expect(response.error).toContain('não pode ser cancelado')
    })
  })

  it('deve calcular tempo até agendamento corretamente', () => {
    const { result } = renderHook(() => useClientAppointments())

    const upcomingAppointment = result.current.upcomingAppointments[0]
    expect(upcomingAppointment.timeUntilAppointment).toBeDefined()
    expect(upcomingAppointment.timeUntilAppointment).toContain('dia')
  })

  it('deve ordenar agendamentos futuros por data crescente', () => {
    // Adicionar mais um agendamento futuro para testar ordenação
    const appointmentsWithMultipleFuture = [
      ...mockAppointments,
      {
        id: 'apt-4',
        cliente_id: 'user-123',
        barbeiro_id: 'barber-1',
        service_id: 'service-1',
        data_agendamento: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 horas
        status: 'confirmado',
        observacoes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cliente: { id: 'user-123', nome: 'Cliente Teste', email: 'cliente@test.com' },
        barbeiro: { id: 'barber-1', nome: 'Barbeiro Teste' },
        service: { id: 'service-1', nome: 'Corte', preco: 30, duracao_minutos: 30 },
      },
    ]

    mockUseAppointments.mockReturnValue({
      appointments: appointmentsWithMultipleFuture,
      loading: false,
      error: null,
      updateAppointment: jest.fn(),
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useClientAppointments())

    expect(result.current.upcomingAppointments).toHaveLength(2)
    // O primeiro deve ser o mais próximo (apt-4 com 12h)
    expect(result.current.upcomingAppointments[0].id).toBe('apt-4')
    // O segundo deve ser o mais distante (apt-1 com 24h)
    expect(result.current.upcomingAppointments[1].id).toBe('apt-1')
  })

  it('deve ordenar histórico por data decrescente', () => {
    // Adicionar mais um agendamento passado para testar ordenação
    const appointmentsWithMultiplePast = [
      ...mockAppointments,
      {
        id: 'apt-5',
        cliente_id: 'user-123',
        barbeiro_id: 'barber-1',
        service_id: 'service-1',
        data_agendamento: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
        status: 'concluido',
        observacoes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cliente: { id: 'user-123', nome: 'Cliente Teste', email: 'cliente@test.com' },
        barbeiro: { id: 'barber-1', nome: 'Barbeiro Teste' },
        service: { id: 'service-1', nome: 'Corte', preco: 30, duracao_minutos: 30 },
      },
    ]

    mockUseAppointments.mockReturnValue({
      appointments: appointmentsWithMultiplePast,
      loading: false,
      error: null,
      updateAppointment: jest.fn(),
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useClientAppointments())

    expect(result.current.pastAppointments).toHaveLength(2)
    // O primeiro deve ser o mais recente (apt-2 com 1 dia atrás)
    expect(result.current.pastAppointments[0].id).toBe('apt-2')
    // O segundo deve ser o mais antigo (apt-5 com 2 dias atrás)
    expect(result.current.pastAppointments[1].id).toBe('apt-5')
  })
})
