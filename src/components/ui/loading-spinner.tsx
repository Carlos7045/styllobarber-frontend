'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const loadingSpinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary-gold',
        muted: 'text-gray-400',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  label?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, label, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-center', className)} {...props}>
        <div
          className={cn(loadingSpinnerVariants({ size, variant }))}
          role="status"
          aria-label={label || 'Carregando...'}
        />
        {label && <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{label}</span>}
      </div>
    )
  }
)
LoadingSpinner.displayName = 'LoadingSpinner'

export { LoadingSpinner, loadingSpinnerVariants }
