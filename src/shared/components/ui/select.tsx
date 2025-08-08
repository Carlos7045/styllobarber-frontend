'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import { ChevronDown } from '@/shared/utils/optimized-imports'

// Variantes do select usando CVA
const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'hover:border-primary-gold',
        error: 'error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Context para o Select
interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select')
  }
  return context
}

// Componente Select principal
interface SelectProps extends VariantProps<typeof selectVariants> {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, onValueChange, children, variant }: SelectProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// Componente SelectTrigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'error'
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, variant, ...props }, ref) => {
    const { open, setOpen } = useSelectContext()

    return (
      <button
        ref={ref}
        type="button"
        className={cn(selectVariants({ variant }), className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)

// Componente SelectValue
interface SelectValueProps {
  placeholder?: string
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = useSelectContext()
  
  return (
    <span className="block truncate">
      {value || placeholder}
    </span>
  )
}

// Componente SelectContent
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top' | 'bottom' | 'auto'
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext()

    if (!open) return null

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            'absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)

// Componente SelectItem
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = useSelectContext()
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        className={cn(
          'relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-secondary-graphite-card',
          isSelected && 'bg-primary-gold/10 text-primary-gold',
          className
        )}
        onClick={() => {
          onValueChange?.(value)
          setOpen(false)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// Display names
Select.displayName = 'Select'
SelectTrigger.displayName = 'SelectTrigger'
SelectValue.displayName = 'SelectValue'
SelectContent.displayName = 'SelectContent'
SelectItem.displayName = 'SelectItem'

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
