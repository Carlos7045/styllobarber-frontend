/**
 * Componente Switch (Toggle) reutilizável baseado em Radix UI
 */

'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  return (
    <SwitchPrimitives.Root
      className={cn(
        'focus-visible:ring-offset-background peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
      ref={ref}
      style={{
        backgroundColor: props.checked ? '#10b981' : '#9ca3af', // Verde quando checked (ativo/personalizado)
        transition: 'background-color 0.2s ease-in-out',
        ...props.style,
      }}
    >
      <SwitchPrimitives.Thumb
        className={cn('pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0')}
        style={{
          transform: props.checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.2s ease-in-out',
        }}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
