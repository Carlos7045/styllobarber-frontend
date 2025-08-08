'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import {
  formatDate,
  formatTime,
  formatDateForDB,
  getWeekDays,
  getMonthDays,
  isDateToday,
  isDatePast,
  addDays,
  subDays,
  addMonths,
  subMonths,
  generateTimeSlots,
  getWeekRange,
  getMonthRange,
} from '@/shared/utils/date-utils'
import { useHorariosFuncionamento } from '@/shared/hooks/use-horarios-funcionamento'
import { APPOINTMENT_STATUS_COLORS, DEFAULT_CALENDAR_CONFIG } from '@/types/appointments'
import type { CalendarView, Appointment, TimeSlot, CalendarConfig } from '@/types/appointments'

interface CalendarProps {
  appointments?: Appointment[]
  view?: CalendarView
  selectedDate?: Date
  config?: Partial<CalendarConfig>
  onDateSelect?: (date: Date) => void
  onViewChange?: (view: CalendarView) => void
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (slot: TimeSlot) => void
  className?: string
}

export function Calendar({
  appointments = [],
  view = 'week',
  selectedDate = new Date(),
  config = {},
  onDateSelect,
  onViewChange,
  onAppointmentClick,
  onTimeSlotClick,
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [currentView, setCurrentView] = useState<CalendarView>(view)

  // Debug dos appointments recebidos
  console.log('📅 Calendar recebeu appointments:', {
    total: appointments.length,
    view: currentView,
    selectedDate: selectedDate.toISOString(),
    sample: appointments.slice(0, 3).map((apt) => ({
      id: apt.id,
      data_agendamento: apt.data_agendamento,
      cliente: apt.cliente?.nome,
      barbeiro: apt.barbeiro?.nome,
      service: apt.service?.nome,
    })),
  })

  const calendarConfig = { ...DEFAULT_CALENDAR_CONFIG, ...config }

  // Hook para buscar horários de funcionamento
  const { getHorarioPorDia, loading: loadingHorarios } = useHorariosFuncionamento()

  // Navegação de datas
  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date

    if (currentView === 'day') {
      newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1)
    } else if (currentView === 'week') {
      newDate = direction === 'next' ? addDays(currentDate, 7) : subDays(currentDate, 7)
    } else {
      newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1)
    }

    setCurrentDate(newDate)
    onDateSelect?.(newDate)
  }

  // Mudar visualização
  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView)
    onViewChange?.(newView)
  }

  // Obter título do período atual
  const getPeriodTitle = () => {
    if (currentView === 'day') {
      return formatDate(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy")
    } else if (currentView === 'week') {
      const { start, end } = getWeekRange(currentDate)
      return `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM/yyyy')}`
    } else {
      return formatDate(currentDate, "MMMM 'de' yyyy")
    }
  }

  // Obter datas para exibição
  const getDatesForView = () => {
    if (currentView === 'day') {
      return [currentDate]
    } else if (currentView === 'week') {
      return getWeekDays(currentDate)
    } else {
      return getMonthDays(currentDate)
    }
  }

  // Obter agendamentos para uma data específica
  const getAppointmentsForDate = (date: Date) => {
    const dateString = formatDateForDB(date)
    console.log('🔍 Buscando agendamentos para data:', {
      date: dateString,
      totalAppointments: appointments.length,
      appointmentDates: appointments.map((apt) => apt.data_agendamento.substring(0, 10)),
    })

    const filtered = appointments.filter((apt) => {
      const aptDate = apt.data_agendamento.substring(0, 10)
      return aptDate === dateString
    })

    console.log(
      '📅 Agendamentos encontrados para',
      dateString,
      ':',
      filtered.length,
      filtered.map((apt) => ({
        id: apt.id,
        data: apt.data_agendamento,
        cliente: apt.cliente?.nome,
      }))
    )
    return filtered
  }

  // Gerar slots de horário para uma data
  const getTimeSlotsForDate = (date: Date) => {
    // Obter dia da semana (0 = domingo, 1 = segunda, etc.)
    const diaSemana = date.getDay()

    // Buscar horário específico para este dia
    const horarioEspecifico = getHorarioPorDia(diaSemana)

    // Obter agendamentos do dia
    const dateAppointments = getAppointmentsForDate(date)

    // Converter agendamentos para formato esperado
    const existingAppointments = dateAppointments.map((apt) => ({
      data_agendamento: apt.data_agendamento,
      barbeiro_id: apt.barbeiro_id,
      service: {
        duracao_minutos: apt.service?.duracao_minutos || 30,
      },
    }))

    // Gerar slots com horário específico e agendamentos existentes
    const slots = generateTimeSlots(date, calendarConfig, horarioEspecifico, existingAppointments)

    // Adicionar informações de agendamento aos slots
    return slots.map((slot) => {
      const appointment = dateAppointments.find((apt) => {
        const aptTime = new Date(apt.data_agendamento)
        return formatTime(aptTime) === slot.time
      })

      return {
        ...slot,
        appointment,
      }
    })
  }

  const dates = getDatesForView()

  return (
    <Card
      className={cn(
        'w-full border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-light dark:to-secondary-graphite',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-primary-gold/10 pb-6 dark:border-secondary-graphite-card/30 dark:from-primary-gold/10 dark:to-primary-gold/20">
        {/* Navegação de período */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="border-2 border-gray-300 bg-white shadow-sm transition-all duration-300 hover:border-primary-gold hover:bg-primary-gold/10 dark:border-secondary-graphite-card dark:bg-secondary-graphite-light dark:hover:bg-primary-gold/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="min-w-[250px] text-center text-xl font-bold text-gray-900 dark:text-white">
            {getPeriodTitle()}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="border-2 border-gray-300 bg-white shadow-sm transition-all duration-300 hover:border-primary-gold hover:bg-primary-gold/10 dark:border-secondary-graphite-card dark:bg-secondary-graphite-light dark:hover:bg-primary-gold/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Seletor de visualização */}
        <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 p-1 shadow-inner dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
          {(['day', 'week', 'month'] as CalendarView[]).map((viewOption) => (
            <Button
              key={viewOption}
              variant={currentView === viewOption ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange(viewOption)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300',
                currentView === viewOption
                  ? 'scale-105 transform bg-gradient-to-r from-primary-gold to-primary-gold-dark text-primary-black shadow-lg'
                  : 'text-gray-700 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-secondary-graphite-light/50'
              )}
            >
              {viewOption === 'day' && 'Dia'}
              {viewOption === 'week' && 'Semana'}
              {viewOption === 'month' && 'Mês'}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Visualização por dia ou semana */}
        {(currentView === 'day' || currentView === 'week') && (
          <div className="flex flex-col">
            {/* Cabeçalho com dias */}
            {currentView === 'week' && (
              <div className="grid grid-cols-8 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                <div className="bg-gradient-to-br from-primary-gold/10 to-primary-gold/20 p-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Horário
                </div>
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      'border-l-2 border-gray-200 p-4 text-center text-sm font-bold transition-all duration-300 dark:border-secondary-graphite-card/50',
                      isDateToday(date)
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-primary-gold/10 dark:text-gray-300 dark:hover:bg-primary-gold/20'
                    )}
                  >
                    <div className="text-xs">{formatDate(date, 'EEE')}</div>
                    <div className="text-xl font-bold">{formatDate(date, 'dd')}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid de horários */}
            <div className="max-h-[600px] overflow-y-auto bg-gray-50 dark:bg-secondary-graphite-card/30">
              {getTimeSlotsForDate(dates[0]).map((baseSlot, timeIndex) => (
                <div
                  key={timeIndex}
                  className="grid grid-cols-8 border-b border-gray-200 transition-colors hover:bg-gray-100 dark:border-secondary-graphite-card/50 dark:hover:bg-secondary-graphite-light/30"
                >
                  {/* Coluna de horário */}
                  <div className="border-r-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-200 p-3 text-sm font-semibold text-gray-600 dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-card dark:to-secondary-graphite-light dark:text-gray-300">
                    {baseSlot.time}
                  </div>

                  {/* Colunas de dias */}
                  {dates.map((date, dateIndex) => {
                    const daySlots = getTimeSlotsForDate(date)
                    const slot = daySlots.find((s) => s.time === baseSlot.time)

                    return (
                      <div
                        key={dateIndex}
                        className={cn(
                          'min-h-[70px] cursor-pointer border-l-2 border-gray-200 p-2 transition-all duration-300 dark:border-secondary-graphite-card/50',
                          slot?.available
                            ? 'hover:border-green-300 hover:bg-green-50 dark:hover:border-green-700 dark:hover:bg-green-900/20'
                            : 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20'
                        )}
                        onClick={() => slot && onTimeSlotClick?.(slot)}
                      >
                        {slot?.appointment && (
                          <div
                            className={cn(
                              'cursor-pointer rounded-lg border p-2 text-xs shadow-sm transition-all hover:scale-105',
                              APPOINTMENT_STATUS_COLORS[slot.appointment.status]
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick?.(slot.appointment!)
                            }}
                          >
                            <div className="mb-1 truncate font-bold">
                              {slot.appointment.cliente?.nome}
                            </div>
                            <div className="mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{slot.appointment.service?.nome}</span>
                            </div>
                            {slot.appointment.barbeiro && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="font-medium">
                                  {slot.appointment.barbeiro.nome}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visualização mensal */}
        {currentView === 'month' && (
          <div className="grid grid-cols-7 gap-1 rounded-lg bg-gray-100 p-2 dark:bg-secondary-graphite-card">
            {/* Cabeçalho dos dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className="rounded-lg bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 text-center text-sm font-bold text-primary-black shadow-sm"
              >
                {day}
              </div>
            ))}

            {/* Dias do mês */}
            {dates.map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date)

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[120px] cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-primary-gold/10 hover:shadow-md dark:border-secondary-graphite-card/50 dark:bg-secondary-graphite-light dark:hover:bg-primary-gold/20',
                    isDateToday(date) &&
                      'bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-500 dark:from-blue-900/30 dark:to-blue-800/30 dark:ring-blue-400',
                    isDatePast(date) && 'opacity-60'
                  )}
                  onClick={() => onDateSelect?.(date)}
                >
                  <div
                    className={cn(
                      'mb-2 text-sm font-bold',
                      isDateToday(date)
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white',
                      isDatePast(date) && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {formatDate(date, 'dd')}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className={cn(
                          'cursor-pointer truncate rounded-md p-2 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105',
                          APPOINTMENT_STATUS_COLORS[appointment.status]
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(appointment)
                        }}
                      >
                        <div className="font-semibold">
                          {formatTime(new Date(appointment.data_agendamento))}
                        </div>
                        <div className="truncate">{appointment.cliente?.nome}</div>
                      </div>
                    ))}

                    {dayAppointments.length > 3 && (
                      <div className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-secondary-graphite-card dark:text-gray-300">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
