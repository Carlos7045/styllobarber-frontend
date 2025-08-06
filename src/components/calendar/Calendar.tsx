'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import { 
  formatDate, 
  formatTime, 
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
  getMonthRange
} from '@/shared/utils/date-utils'
import { 
  APPOINTMENT_STATUS_COLORS,
  DEFAULT_CALENDAR_CONFIG
} from '@/types/appointments'
import type { 
  CalendarView, 
  Appointment, 
  TimeSlot, 
  CalendarConfig 
} from '@/types/appointments'

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
  className
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [currentView, setCurrentView] = useState<CalendarView>(view)
  
  const calendarConfig = { ...DEFAULT_CALENDAR_CONFIG, ...config }

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
      return formatDate(currentDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy')
    } else if (currentView === 'week') {
      const { start, end } = getWeekRange(currentDate)
      return `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM/yyyy')}`
    } else {
      return formatDate(currentDate, 'MMMM \'de\' yyyy')
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
    const dateString = formatDate(date, 'yyyy-MM-dd')
    return appointments.filter(apt => 
      apt.data_agendamento.startsWith(dateString)
    )
  }

  // Gerar slots de horário para uma data
  const getTimeSlotsForDate = (date: Date) => {
    const slots = generateTimeSlots(date, calendarConfig)
    const dateAppointments = getAppointmentsForDate(date)
    
    // Marcar slots ocupados
    return slots.map(slot => {
      const appointment = dateAppointments.find(apt => {
        const aptTime = new Date(apt.data_agendamento)
        return formatTime(aptTime) === slot.time
      })
      
      return {
        ...slot,
        available: !appointment,
        appointment
      }
    })
  }

  const dates = getDatesForView()

  return (
    <Card className={cn('w-full bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite-card/50 shadow-lg', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 bg-gradient-to-r from-primary-gold/5 to-primary-gold/10 dark:from-primary-gold/10 dark:to-primary-gold/20 border-b border-gray-200 dark:border-secondary-graphite-card/30">
        {/* Navegação de período */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 transition-all duration-300 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-bold min-w-[250px] text-center text-gray-900 dark:text-white">
            {getPeriodTitle()}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 transition-all duration-300 shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Seletor de visualização */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-secondary-graphite-card dark:to-secondary-graphite-light rounded-xl p-1 shadow-inner">
          {(['day', 'week', 'month'] as CalendarView[]).map((viewOption) => (
            <Button
              key={viewOption}
              variant={currentView === viewOption ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange(viewOption)}
              className={cn(
                'text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300',
                currentView === viewOption 
                  ? 'bg-gradient-to-r from-primary-gold to-primary-gold-dark text-primary-black shadow-lg transform scale-105' 
                  : 'hover:bg-white/50 dark:hover:bg-secondary-graphite-light/50 text-gray-700 dark:text-gray-300'
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
              <div className="grid grid-cols-8 border-b-2 border-gray-200 dark:border-secondary-graphite-card/50 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                <div className="p-4 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gradient-to-br from-primary-gold/10 to-primary-gold/20">
                  Horário
                </div>
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-4 text-center text-sm font-bold border-l-2 border-gray-200 dark:border-secondary-graphite-card/50 transition-all duration-300',
                      isDateToday(date) 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20'
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
              {generateTimeSlots(dates[0], calendarConfig).map((baseSlot, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-200 dark:border-secondary-graphite-card/50 hover:bg-gray-100 dark:hover:bg-secondary-graphite-light/30 transition-colors">
                  {/* Coluna de horário */}
                  <div className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-r-2 border-gray-200 dark:border-secondary-graphite-card/50 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                    {baseSlot.time}
                  </div>
                  
                  {/* Colunas de dias */}
                  {dates.map((date, dateIndex) => {
                    const daySlots = getTimeSlotsForDate(date)
                    const slot = daySlots.find(s => s.time === baseSlot.time)
                    
                    return (
                      <div
                        key={dateIndex}
                        className={cn(
                          'p-2 min-h-[70px] border-l-2 border-gray-200 dark:border-secondary-graphite-card/50 cursor-pointer transition-all duration-300',
                          slot?.available 
                            ? 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700' 
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                        )}
                        onClick={() => slot && onTimeSlotClick?.(slot)}
                      >
                        {slot?.appointment && (
                          <div
                            className={cn(
                              'p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105 shadow-sm border',
                              APPOINTMENT_STATUS_COLORS[slot.appointment.status]
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick?.(slot.appointment!)
                            }}
                          >
                            <div className="font-bold truncate mb-1">
                              {slot.appointment.cliente?.nome}
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{slot.appointment.service?.nome}</span>
                            </div>
                            {slot.appointment.barbeiro && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="font-medium">{slot.appointment.barbeiro.nome}</span>
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
          <div className="grid grid-cols-7 gap-1 bg-gray-100 dark:bg-secondary-graphite-card p-2 rounded-lg">
            {/* Cabeçalho dos dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-4 text-center text-sm font-bold bg-gradient-to-br from-primary-gold to-primary-gold-dark text-primary-black rounded-lg shadow-sm">
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
                    'min-h-[120px] p-3 bg-white dark:bg-secondary-graphite-light cursor-pointer hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 transition-all duration-300 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-graphite-card/50 hover:shadow-md hover:scale-105',
                    isDateToday(date) && 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 ring-2 ring-blue-500 dark:ring-blue-400',
                    isDatePast(date) && 'opacity-60'
                  )}
                  onClick={() => onDateSelect?.(date)}
                >
                  <div className={cn(
                    'text-sm font-bold mb-2',
                    isDateToday(date) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white',
                    isDatePast(date) && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {formatDate(date, 'dd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className={cn(
                          'text-xs p-2 rounded-md truncate cursor-pointer font-medium shadow-sm transition-all duration-200 hover:scale-105',
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
                        <div className="truncate">
                          {appointment.cliente?.nome}
                        </div>
                      </div>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-secondary-graphite-card px-2 py-1 rounded-md">
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
