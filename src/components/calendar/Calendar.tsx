'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@/components/ui'
import { cn } from '@/lib/utils'
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
} from '@/lib/date-utils'
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
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        {/* Navegação de período */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {getPeriodTitle()}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Seletor de visualização */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['day', 'week', 'month'] as CalendarView[]).map((viewOption) => (
            <Button
              key={viewOption}
              variant={currentView === viewOption ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange(viewOption)}
              className="text-xs"
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
              <div className="grid grid-cols-8 border-b">
                <div className="p-3 text-sm font-medium text-muted-foreground">
                  Horário
                </div>
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 text-center text-sm font-medium border-l',
                      isDateToday(date) && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div>{formatDate(date, 'EEE')}</div>
                    <div className="text-lg">{formatDate(date, 'dd')}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid de horários */}
            <div className="max-h-[600px] overflow-y-auto">
              {generateTimeSlots(dates[0], calendarConfig).map((baseSlot, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-8 border-b border-border/50">
                  {/* Coluna de horário */}
                  <div className="p-2 text-xs text-muted-foreground border-r bg-muted/30">
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
                          'p-1 min-h-[60px] border-l cursor-pointer hover:bg-muted/50 transition-colors',
                          slot?.available && 'hover:bg-primary/5',
                          !slot?.available && 'bg-muted/20'
                        )}
                        onClick={() => slot && onTimeSlotClick?.(slot)}
                      >
                        {slot?.appointment && (
                          <div
                            className={cn(
                              'p-2 rounded text-xs cursor-pointer transition-all hover:scale-105',
                              APPOINTMENT_STATUS_COLORS[slot.appointment.status]
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick?.(slot.appointment!)
                            }}
                          >
                            <div className="font-medium truncate">
                              {slot.appointment.cliente?.nome}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{slot.appointment.service?.nome}</span>
                            </div>
                            {slot.appointment.barbeiro && (
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                <span>{slot.appointment.barbeiro.nome}</span>
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
          <div className="grid grid-cols-7 gap-px bg-border">
            {/* Cabeçalho dos dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium bg-muted">
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
                    'min-h-[120px] p-2 bg-background cursor-pointer hover:bg-muted/50 transition-colors',
                    isDateToday(date) && 'bg-primary/5 ring-1 ring-primary',
                    isDatePast(date) && 'text-muted-foreground'
                  )}
                  onClick={() => onDateSelect?.(date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {formatDate(date, 'dd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className={cn(
                          'text-xs p-1 rounded truncate cursor-pointer',
                          APPOINTMENT_STATUS_COLORS[appointment.status]
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(appointment)
                        }}
                      >
                        {formatTime(new Date(appointment.data_agendamento))} - {appointment.cliente?.nome}
                      </div>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-muted-foreground">
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