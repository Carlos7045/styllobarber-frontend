import * as React from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

// Variantes do time picker
const timePickerVariants = cva('relative w-full', {
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
})

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
  (
    {
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
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)

    // Gerar slots de horário se não fornecidos
    const slots = React.useMemo(() => {
      return timeSlots || generateTimeSlots(startTime, endTime, interval)
    }, [timeSlots, startTime, endTime, interval])

    // Filtrar slots disponíveis
    const availableSlots = React.useMemo(() => {
      return slots.filter((slot) => slot.available)
    }, [slots])

    // Selecionar horário
    const handleTimeSelect = (time: string) => {
      if (disabled) return

      const slot = slots.find((s) => s.time === time)
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
            // Cores base para tema claro e escuro
            'text-gray-900 dark:text-white',
            'bg-white dark:bg-gray-800',
            // Hover states
            'hover:bg-primary-gold/10 hover:text-primary-gold dark:hover:bg-primary-gold/20 dark:hover:text-primary-gold',
            // Focus states
            'focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 dark:focus:ring-offset-gray-800',
            // Disabled states
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              // Selected state
              'bg-primary-gold text-black hover:bg-primary-gold hover:text-black dark:bg-primary-gold dark:text-black':
                isSelected,
              // Unavailable state
              'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400': !slot.available,
            }
          )}
        >
          <span className="font-medium">{formatTime(slot.time, format24h)}</span>

          {slot.label && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{slot.label}</span>
          )}

          {!slot.available && (
            <span className="text-xs text-red-600 dark:text-red-400">Indisponível</span>
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

      slots.forEach((slot) => {
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
            'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
            // Cores base
            'border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            // Placeholder colors
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            // Focus states
            'focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 dark:focus:ring-offset-gray-800',
            // Disabled states
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-primary-gold ring-2 ring-primary-gold': isOpen,
            }
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span
              className={cn(
                value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {value ? formatTime(value, format24h) : placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 text-gray-500 transition-transform dark:text-gray-400', {
              'rotate-180': isOpen,
            })}
          />
        </button>

        {/* Dropdown de horários */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="max-h-60 overflow-y-auto p-2">
              {/* Contador de disponibilidade */}
              {showAvailabilityCount && (
                <div className="mb-2 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                  {availableSlots.length} de {slots.length} horários disponíveis
                </div>
              )}

              {/* Slots agrupados por período */}
              {Object.entries(groupedSlots).map(([period, periodSlots]) => {
                if (periodSlots.length === 0) return null

                const periodLabels = {
                  manha: 'MANHÃ',
                  tarde: 'TARDE',
                  noite: 'NOITE',
                }

                return (
                  <div key={period} className="mb-3">
                    <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {periodLabels[period as keyof typeof periodLabels]}
                    </div>
                    <div className="space-y-1">{periodSlots.map(renderTimeSlot)}</div>
                  </div>
                )
              })}

              {/* Estado vazio */}
              {slots.length === 0 && (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
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

export { TimePicker, timePickerVariants }
export type { TimeSlot }
