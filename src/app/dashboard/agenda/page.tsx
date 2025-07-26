'use client'

import { useState } from 'react'
import { Plus, Filter } from 'lucide-react'

import { Container, Stack } from '@/components/layout'
import { Button } from '@/components/ui'
import { Calendar, CalendarStats, CalendarFilters } from '@/components/calendar'
import { RouteGuard } from '@/components/auth'
import { useAppointments } from '@/hooks/use-appointments'
import { formatDateForDB } from '@/lib/date-utils'
import type { CalendarView, CalendarFilters as CalendarFiltersType } from '@/types/appointments'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [filters, setFilters] = useState<CalendarFiltersType>({
    date_start: formatDateForDB(selectedDate),
    date_end: formatDateForDB(selectedDate)
  })

  // Hook para gerenciar agendamentos
  const { 
    appointments, 
    loading, 
    error, 
    stats
  } = useAppointments({ 
    filters,
    realtime: true 
  })

  // Mock de barbeiros (implementar busca real depois)
  const barbeiros = [
    { id: '1', nome: 'Carlos Santos' },
    { id: '2', nome: 'Ricardo Lima' },
    { id: '3', nome: 'João Silva' }
  ]

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Atualizar filtros para mostrar agendamentos da data selecionada
    setFilters(prev => ({
      ...prev,
      date_start: formatDateForDB(date),
      date_end: formatDateForDB(date)
    }))
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

  if (error) {
    return (
      <RouteGuard requiredRoles={['admin', 'barber']}>
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-2">Erro ao carregar agendamentos</p>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
                Agenda
              </h1>
              <p className="text-text-muted">
                Gerencie seus agendamentos e visualize a agenda do dia
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <CalendarStats 
            stats={stats} 
            loading={loading}
          />

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
            onViewChange={setCalendarView}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </Stack>
      </Container>
    </RouteGuard>
  )
}