import { useSimpleQueryService } from '@/shared/hooks/data/use-query-service'
import { appointmentService, type Appointment, type CreateAppointmentData, type UpdateAppointmentData, type AppointmentFilters } from '@/shared/services'

/**
 * Hook para queries e mutations de agendamentos usando React Query
 * 
 * @description
 * Hook que integra o AppointmentService com React Query, fornecendo
 * cache inteligente, invalidação automática e otimizações específicas
 * para agendamentos.
 * 
 * @example
 * ```typescript
 * function AppointmentList() {
 *   const { useByDate, useCreate, useUpdateStatus } = useAppointmentQueries()
 *   
 *   const { data: appointments, isLoading } = useByDate('2024-01-15')
 *   const createAppointment = useCreate()
 *   const updateStatus = useUpdateStatus()
 *   
 *   const handleCreate = (appointmentData: CreateAppointmentData) => {
 *     createAppointment.mutate(appointmentData)
 *   }
 *   
 *   return (
 *     <div>
 *       {appointments?.data?.map(appointment => (
 *         <div key={appointment.id}>{appointment.cliente_nome}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAppointmentQueries() {
  const queryService = useSimpleQueryService(appointmentService, 'appointments')

  return {
    // Queries básicas
    useById: queryService.useById,
    useList: queryService.useList,

    // Mutations básicas
    useCreate: queryService.useCreate,
    useUpdate: queryService.useUpdate,
    useDelete: queryService.useDelete,

    // Queries específicas de agendamento
    useByDate: (date: string) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['date', date],
        queryFn: () => appointmentService.findByDate(date),
        enabled: !!date,
        staleTime: 2 * 60 * 1000, // 2 minutos (dados mais dinâmicos)
      }),

    useByBarber: (funcionario_id: string, date?: string) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['barber', funcionario_id, date],
        queryFn: () => appointmentService.findByBarber(funcionario_id, date),
        enabled: !!funcionario_id,
        staleTime: 2 * 60 * 1000,
      }),

    useByClient: (cliente_id: string) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['client', cliente_id],
        queryFn: () => appointmentService.findByClient(cliente_id),
        enabled: !!cliente_id,
        staleTime: 5 * 60 * 1000, // 5 minutos
      }),

    useWithFilters: (filters: AppointmentFilters) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['filtered', filters],
        queryFn: () => appointmentService.findWithFilters(filters),
        staleTime: 2 * 60 * 1000,
      }),

    useAvailableSlots: (funcionario_id: string, date: string, duration = 60) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['available-slots', funcionario_id, date, duration],
        queryFn: () => appointmentService.getAvailableSlots(funcionario_id, date, duration),
        enabled: !!funcionario_id && !!date,
        staleTime: 1 * 60 * 1000, // 1 minuto (dados muito dinâmicos)
      }),

    useStats: (startDate: string, endDate: string) =>
      queryService.useQuery({
        baseKey: 'appointments',
        queryKey: ['stats', startDate, endDate],
        queryFn: () => appointmentService.getStats(startDate, endDate),
        enabled: !!startDate && !!endDate,
        staleTime: 10 * 60 * 1000, // 10 minutos
      }),

    // Mutations específicas
    useUpdateStatus: () =>
      queryService.useMutation({
        mutationFn: ({ id, status }: { id: string; status: Appointment['status'] }) =>
          appointmentService.updateStatus(id, status),
        invalidateKeys: ['appointments'],
        showSuccessToast: true,
        successMessage: 'Status do agendamento atualizado!',
      }),

    useCancel: () =>
      queryService.useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
          appointmentService.cancel(id, reason),
        invalidateKeys: ['appointments'],
        showSuccessToast: true,
        successMessage: 'Agendamento cancelado!',
      }),

    useConfirm: () =>
      queryService.useMutation({
        mutationFn: (id: string) => appointmentService.confirm(id),
        invalidateKeys: ['appointments'],
        showSuccessToast: true,
        successMessage: 'Agendamento confirmado!',
      }),

    useStart: () =>
      queryService.useMutation({
        mutationFn: (id: string) => appointmentService.start(id),
        invalidateKeys: ['appointments'],
        showSuccessToast: true,
        successMessage: 'Agendamento iniciado!',
      }),

    useComplete: () =>
      queryService.useMutation({
        mutationFn: (id: string) => appointmentService.complete(id),
        invalidateKeys: ['appointments'],
        showSuccessToast: true,
        successMessage: 'Agendamento concluído!',
      }),

    // Utilitários
    invalidateAppointments: () => queryService.invalidateQueries('appointments'),
    invalidateByDate: (date: string) => 
      queryService.invalidateQueries(['appointments', 'date', date]),
    invalidateByBarber: (funcionario_id: string) =>
      queryService.invalidateQueries(['appointments', 'barber', funcionario_id]),
    
    prefetchAppointment: (id: string) =>
      queryService.prefetchQuery(['appointments', id], () => appointmentService.findById(id)),
    
    prefetchByDate: (date: string) =>
      queryService.prefetchQuery(['appointments', 'date', date], () => appointmentService.findByDate(date)),
  }
}

/**
 * Hook simplificado para um agendamento específico
 */
export function useAppointment(id?: string) {
  const { useById } = useAppointmentQueries()
  return useById(id || '', { enabled: !!id })
}

/**
 * Hook para agendamentos de uma data específica
 */
export function useAppointmentsByDate(date: string) {
  const { useByDate } = useAppointmentQueries()
  return useByDate(date)
}

/**
 * Hook para agendamentos de um barbeiro
 */
export function useAppointmentsByBarber(funcionario_id: string, date?: string) {
  const { useByBarber } = useAppointmentQueries()
  return useByBarber(funcionario_id, date)
}

/**
 * Hook para agendamentos de um cliente
 */
export function useAppointmentsByClient(cliente_id: string) {
  const { useByClient } = useAppointmentQueries()
  return useByClient(cliente_id)
}

/**
 * Hook para horários disponíveis
 */
export function useAvailableSlots(funcionario_id: string, date: string, duration = 60) {
  const { useAvailableSlots } = useAppointmentQueries()
  return useAvailableSlots(funcionario_id, date, duration)
}

/**
 * Hook para estatísticas de agendamentos
 */
export function useAppointmentStats(startDate: string, endDate: string) {
  const { useStats } = useAppointmentQueries()
  return useStats(startDate, endDate)
}

/**
 * Hook para mutations de status de agendamento
 */
export function useAppointmentStatusMutations() {
  const { useUpdateStatus, useCancel, useConfirm, useStart, useComplete } = useAppointmentQueries()
  
  return {
    updateStatus: useUpdateStatus(),
    cancel: useCancel(),
    confirm: useConfirm(),
    start: useStart(),
    complete: useComplete(),
  }
}