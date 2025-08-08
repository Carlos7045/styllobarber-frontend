'use client'

import { useState } from 'react'
import { Plus, Filter, Settings } from 'lucide-react'
import Link from 'next/link'

import { Container, Stack } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui'
import { Calendar, CalendarStats, CalendarFilters } from '@/components/calendar'
import { RouteGuard } from '@/domains/auth/components'
import { useAppointments } from '@/domains/appointments/hooks/use-appointments'
import { useAdminAgendamentos } from '@/domains/users/hooks/use-admin-agendamentos'
import { ConfirmarAgendamentoModal } from '@/domains/appointments/components/ConfirmarAgendamentoModal'
import { formatDateForDB } from '@/shared/utils/date-utils'
import type {
  CalendarView,
  CalendarFilters as CalendarFiltersType,
  Appointment,
} from '@/types/appointments'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<CalendarView>('week')

  // Calcular range de datas baseado na visualização
  const getDateRange = (date: Date, view: CalendarView) => {
    if (view === 'day') {
      return {
        date_start: formatDateForDB(date),
        date_end: formatDateForDB(date),
      }
    } else if (view === 'week') {
      // Semana completa (domingo a sábado)
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      return {
        date_start: formatDateForDB(startOfWeek),
        date_end: formatDateForDB(endOfWeek),
      }
    } else {
      // Mês completo
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      return {
        date_start: formatDateForDB(startOfMonth),
        date_end: formatDateForDB(endOfMonth),
      }
    }
  }

  const [filters, setFilters] = useState<CalendarFiltersType>(
    getDateRange(selectedDate, calendarView)
  )
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Hook para gerenciar agendamentos
  const { appointments, loading, error, stats, refetch } = useAppointments({
    filters,
    realtime: true,
  })

  // Hook para ações administrativas
  const { confirmarAgendamento, cancelAgendamento } = useAdminAgendamentos()

  // Mock de barbeiros (implementar busca real depois)
  const barbeiros = [
    { id: '1', nome: 'Carlos Santos' },
    { id: '2', nome: 'Ricardo Lima' },
    { id: '3', nome: 'João Silva' },
  ]

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Atualizar filtros baseado na visualização atual
    setFilters(getDateRange(date, calendarView))
  }

  const handleViewChange = (newView: CalendarView) => {
    setCalendarView(newView)
    // Atualizar filtros baseado na nova visualização
    setFilters(getDateRange(selectedDate, newView))
  }

  const handleAppointmentClick = (appointment: unknown) => {
    // console.log('Clicou no agendamento:', appointment)
    // Implementar modal de detalhes do agendamento
  }

  const handleTimeSlotClick = (slot: unknown) => {
    // console.log('Clicou no slot:', slot)
    // Implementar modal de criação de agendamento
  }

  const handleFiltersChange = (newFilters: CalendarFiltersType) => {
    setFilters(newFilters)
  }

  const handlePendentesClick = () => {
    // Buscar primeiro agendamento pendente
    const pendente = appointments.find((apt) => apt.status === 'pendente')
    if (pendente) {
      setSelectedAppointment(pendente)
      setIsConfirmModalOpen(true)
    }
  }

  const handleConfirmAppointment = async (appointmentId: string, observacoes?: string) => {
    const result = await confirmarAgendamento(appointmentId)
    if (result.success) {
      setIsConfirmModalOpen(false)
      setSelectedAppointment(null)
      // Refetch para atualizar dados e estatísticas
      await refetch()
    }
    return result
  }

  const handleCancelAppointment = async (appointmentId: string, motivo: string) => {
    const result = await cancelAgendamento(appointmentId, motivo)
    if (result.success) {
      setIsConfirmModalOpen(false)
      setSelectedAppointment(null)
      // Refetch para atualizar dados e estatísticas
      await refetch()
    }
    return result
  }

  if (error) {
    return (
      <RouteGuard requiredRoles={['admin', 'barber']}>
        <Container>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-red-600">Erro ao carregar agendamentos</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Container>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['admin', 'barber']}>
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header Moderno */}
          <div className="mb-8 text-center">
            <div className="mb-6 flex items-center justify-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <svg
                  className="h-10 w-10 text-primary-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Agenda</h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Gerencie seus agendamentos e visualize a agenda do dia
                </p>
              </div>
            </div>
            <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>

            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard/agenda/configuracoes">
                <Button
                  variant="outline"
                  size="sm"
                  className="transform rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary-gold hover:bg-gradient-to-r hover:from-primary-gold/10 hover:to-primary-gold/20 hover:shadow-md dark:border-secondary-graphite-card dark:bg-secondary-graphite-light dark:text-gray-300 dark:hover:bg-primary-gold/20"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="transform rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary-gold hover:bg-gradient-to-r hover:from-primary-gold/10 hover:to-primary-gold/20 hover:shadow-md dark:border-secondary-graphite-card dark:bg-secondary-graphite-light dark:text-gray-300 dark:hover:bg-primary-gold/20"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button
                size="sm"
                className="transform rounded-xl bg-gradient-to-r from-primary-gold to-primary-gold-dark px-6 py-3 font-bold text-primary-black shadow-lg transition-all duration-300 hover:scale-105 hover:from-primary-gold-dark hover:to-primary-gold hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <CalendarStats stats={stats} loading={loading} onPendentesClick={handlePendentesClick} />

          {/* Filtros */}
          <CalendarFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            barbeiros={barbeiros}
          />

          {/* Calendário */}
          <Calendar
            appointments={appointments}
            view={calendarView}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onViewChange={handleViewChange}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
          />

          {/* Modal de Confirmação */}
          <ConfirmarAgendamentoModal
            isOpen={isConfirmModalOpen}
            onClose={() => {
              setIsConfirmModalOpen(false)
              setSelectedAppointment(null)
            }}
            appointment={selectedAppointment}
            onConfirm={handleConfirmAppointment}
            onCancel={handleCancelAppointment}
            loading={loading}
          />
        </Stack>
      </Container>
    </RouteGuard>
  )
}
