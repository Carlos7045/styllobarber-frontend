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
          {/* Header Moderno */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
                <svg className="h-10 w-10 text-primary-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Agenda
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  Gerencie seus agendamentos e visualize a agenda do dia
                </p>
              </div>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-gradient-to-r hover:from-primary-gold/10 hover:to-primary-gold/20 dark:hover:bg-primary-gold/20 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary-gold to-primary-gold-dark hover:from-primary-gold-dark hover:to-primary-gold text-primary-black font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
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