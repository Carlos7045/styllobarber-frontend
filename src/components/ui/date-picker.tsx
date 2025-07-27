import * as React from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { formatarData } from '@/lib/utils'

// Variantes do date picker
const datePickerVariants = cva(
  'relative w-full',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

// Interface para disponibilidade de horários
export interface DateAvailability {
  date: string // formato YYYY-MM-DD
  available: boolean
  availableSlots?: number
}

// Interface das props do DatePicker
export interface DatePickerProps extends VariantProps<typeof datePickerVariants> {
  value?: Date
  onChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  availability?: DateAvailability[]
  disabled?: boolean
  placeholder?: string
  className?: string
  showAvailabilityIndicator?: boolean
  disabledDates?: Date[]
  locale?: string
}

// Utilitários para manipulação de datas
const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToString(date1) === formatDateToString(date2)
}

const isDateDisabled = (
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[]
): boolean => {
  if (minDate && date < minDate) return true
  if (maxDate && date > maxDate) return true
  if (disabledDates?.some(disabledDate => isSameDay(date, disabledDate))) return true
  return false
}

const getDateAvailability = (
  date: Date,
  availability?: DateAvailability[]
): DateAvailability | undefined => {
  if (!availability) return undefined
  return availability.find(item => item.date === formatDateToString(date))
}

// Componente DatePicker
const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({
    value,
    onChange,
    minDate,
    maxDate,
    availability,
    disabled = false,
    placeholder = 'Selecione uma data',
    className,
    size,
    showAvailabilityIndicator = true,
    disabledDates,
    locale = 'pt-BR',
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [currentMonth, setCurrentMonth] = React.useState(
      value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date()
    )

    // Gerar dias do calendário
    const generateCalendarDays = React.useMemo(() => {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      const firstDayOfMonth = new Date(year, month, 1)
      const lastDayOfMonth = new Date(year, month + 1, 0)
      const firstDayOfWeek = firstDayOfMonth.getDay()
      
      const days: Date[] = []
      
      // Dias do mês anterior
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i))
      }
      
      // Dias do mês atual
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        days.push(new Date(year, month, day))
      }
      
      // Dias do próximo mês para completar a grade
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        days.push(new Date(year, month + 1, day))
      }
      
      return days
    }, [currentMonth])

    // Navegar entre meses
    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev)
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1)
        } else {
          newMonth.setMonth(prev.getMonth() + 1)
        }
        return newMonth
      })
    }

    // Selecionar data
    const handleDateSelect = (date: Date) => {
      if (disabled) return
      
      const dateAvailability = getDateAvailability(date, availability)
      const isDisabled = isDateDisabled(date, minDate, maxDate, disabledDates)
      
      if (isDisabled || (dateAvailability && !dateAvailability.available)) {
        return
      }
      
      onChange(date)
      setIsOpen(false)
    }

    // Renderizar dia do calendário
    const renderCalendarDay = (date: Date, index: number) => {
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
      const isSelected = value && isSameDay(date, value)
      const isToday = isSameDay(date, new Date())
      const dateAvailability = getDateAvailability(date, availability)
      const isDisabled = isDateDisabled(date, minDate, maxDate, disabledDates)
      const isUnavailable = dateAvailability && !dateAvailability.available

      return (
        <button
          key={index}
          type="button"
          onClick={() => handleDateSelect(date)}
          disabled={disabled || isDisabled || isUnavailable}
          className={cn(
            'relative h-9 w-9 p-0 font-normal transition-colors',
            'hover:bg-primary-gold/10 hover:text-primary-gold',
            'focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              // Mês atual
              'text-text-primary': isCurrentMonth,
              'text-text-muted': !isCurrentMonth,
              
              // Data selecionada
              'bg-primary-gold text-primary-black hover:bg-primary-gold hover:text-primary-black': isSelected,
              
              // Hoje
              'bg-primary-gold/20 text-primary-gold font-semibold': isToday && !isSelected,
              
              // Indisponível
              'bg-error/10 text-error cursor-not-allowed': isUnavailable,
            }
          )}
        >
          {date.getDate()}
          
          {/* Indicador de disponibilidade */}
          {showAvailabilityIndicator && dateAvailability && isCurrentMonth && (
            <div
              className={cn(
                'absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
                {
                  'bg-success': dateAvailability.available,
                  'bg-error': !dateAvailability.available,
                }
              )}
            />
          )}
        </button>
      )
    }

    return (
      <div className={cn(datePickerVariants({ size }), className)}>
        {/* Input trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'ring-2 ring-primary-gold': isOpen,
            }
          )}
        >
          <span className={cn(!value && 'text-text-muted')}>
            {value ? formatarData(value) : placeholder}
          </span>
          <Calendar className="h-4 w-4 opacity-50" />
        </button>

        {/* Calendário dropdown */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border-default bg-background-primary p-3 shadow-lg">
            {/* Header do calendário */}
            <div className="flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border-default bg-transparent p-0 opacity-50 hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="text-sm font-medium">
                {currentMonth.toLocaleDateString(locale, {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border-default bg-transparent p-0 opacity-50 hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 pb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div
                  key={day}
                  className="flex h-9 w-9 items-center justify-center text-xs font-medium text-text-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays.map((date, index) => renderCalendarDay(date, index))}
            </div>

            {/* Legenda de disponibilidade */}
            {showAvailabilityIndicator && availability && (
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-error" />
                  <span>Indisponível</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

export { DatePicker, datePickerVariants }