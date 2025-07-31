import * as React from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variantes do time picker
const timePickerVariants = cva(
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

// Interface para slots de horário
export interface TimeSlot {
  time: string // formato HH:MM
  available: boolean
  label?: string
}

// Interface das props do TimePicker
export interface TimePickerProps extends VariantProps<typeof timePickerVariants> {
  value?: string
  onChange: (time: string) => void
  timeSlots?: TimeSlot[]
  disabled?: boolean
  placeholder?: string
  className?: string
  showAvailabilityCount?: boolean
  startTime?: string // formato HH:MM
  endTime?: string // formato HH:MM
  interval?: number // minutos
  format24h?: boolean
}

// Utilitários para manipulação de horários
const formatTime = (time: string, format24h: boolean = true): string => {
  if (!format24h) {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }
  return time
}

const generateTimeSlots = (
  startTime: string = '08:00',
  endTime: string = '18:00',
  interval: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const currentTime = new Date()
  currentTime.setHours(startHour, startMinute, 0, 0)
  
  const endDateTime = new Date()
  endDateTime.setHours(endHour, endMinute, 0, 0)
  
  while (currentTime <= endDateTime) {
    const timeString = currentTime.toTimeString().slice(0, 5)
    slots.push({
      time: timeString,
      available: true,
    })
    
    currentTime.setMinutes(currentTime.getMinutes() + interval)
  }
  
  return slots
}

// Componente TimePicker
const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({
    value,
    onChange,
    timeSlots,
    disabled = false,
    placeholder = 'Selecione um horário',
    className,
    size,
    showAvailabilityCount = true,
    startTime = '08:00',
    endTime = '18:00',
    interval = 30,
    format24h = true,
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    
    // Gerar slots de horário se não fornecidos
    const slots = React.useMemo(() => {
      return timeSlots || generateTimeSlots(startTime, endTime, interval)
    }, [timeSlots, startTime, endTime, interval])

    // Filtrar slots disponíveis
    const availableSlots = React.useMemo(() => {
      return slots.filter(slot => slot.available)
    }, [slots])

    // Selecionar horário
    const handleTimeSelect = (time: string) => {
      if (disabled) return
      
      const slot = slots.find(s => s.time === time)
      if (slot && !slot.available) return
      
      onChange(time)
      setIsOpen(false)
    }

    // Renderizar slot de horário
    const renderTimeSlot = (slot: TimeSlot) => {
      const isSelected = value === slot.time
      
      return (
        <button
          key={slot.time}
          type="button"
          onClick={() => handleTimeSelect(slot.time)}
          disabled={disabled || !slot.available}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
            'hover:bg-primary-gold/10 hover:text-primary-gold',
            'focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'bg-primary-gold text-primary-black hover:bg-primary-gold hover:text-primary-black': isSelected,
              'bg-error/10 text-error': !slot.available,
            }
          )}
        >
          <span className="font-medium">
            {formatTime(slot.time, format24h)}
          </span>
          
          {slot.label && (
            <span className="text-xs text-text-muted">
              {slot.label}
            </span>
          )}
          
          {!slot.available && (
            <span className="text-xs text-error">
              Indisponível
            </span>
          )}
        </button>
      )
    }

    // Agrupar slots por período (manhã, tarde, noite)
    const groupedSlots = React.useMemo(() => {
      const groups = {
        manha: [] as TimeSlot[],
        tarde: [] as TimeSlot[],
        noite: [] as TimeSlot[],
      }

      slots.forEach(slot => {
        const hour = parseInt(slot.time.split(':')[0])
        if (hour < 12) {
          groups.manha.push(slot)
        } else if (hour < 18) {
          groups.tarde.push(slot)
        } else {
          groups.noite.push(slot)
        }
      })

      return groups
    }, [slots])

    return (
      <div className={cn(timePickerVariants({ size }), className)}>
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
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 opacity-50" />
            <span className={cn(!value && 'text-text-muted')}>
              {value ? formatTime(value, format24h) : placeholder}
            </span>
          </div>
          <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', {
            'rotate-180': isOpen,
          })} />
        </button>

        {/* Dropdown de horários */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-border-default bg-background-primary shadow-lg">
            <div className="max-h-60 overflow-y-auto p-2">
              {/* Contador de disponibilidade */}
              {showAvailabilityCount && (
                <div className="mb-2 px-2 py-1 text-xs text-text-muted">
                  {availableSlots.length} de {slots.length} horários disponíveis
                </div>
              )}

              {/* Slots agrupados por período */}
              {Object.entries(groupedSlots).map(([period, periodSlots]) => {
                if (periodSlots.length === 0) return null

                const periodLabels = {
                  manha: 'Manhã',
                  tarde: 'Tarde',
                  noite: 'Noite',
                }

                return (
                  <div key={period} className="mb-3">
                    <div className="mb-2 px-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                      {periodLabels[period as keyof typeof periodLabels]}
                    </div>
                    <div className="space-y-1">
                      {periodSlots.map(renderTimeSlot)}
                    </div>
                  </div>
                )
              })}

              {/* Estado vazio */}
              {slots.length === 0 && (
                <div className="py-6 text-center text-sm text-text-muted">
                  Nenhum horário disponível
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

TimePicker.displayName = 'TimePicker'

export { TimePicker, timePickerVariants, type TimeSlot }