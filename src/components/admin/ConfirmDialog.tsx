'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-error',
          button: 'bg-error hover:bg-error/90 text-white',
        }
      case 'warning':
        return {
          icon: 'text-warning',
          button: 'bg-warning hover:bg-warning/90 text-primary-black',
        }
      case 'info':
        return {
          icon: 'text-info',
          button: 'bg-info hover:bg-info/90 text-white',
        }
      default:
        return {
          icon: 'text-warning',
          button: 'bg-warning hover:bg-warning/90 text-primary-black',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 text-text-primary" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-text-secondary mb-6">{message}</p>

          <div className="flex gap-3">
            <Button
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
              className={`flex-1 ${styles.button}`}
            >
              {loading ? 'Processando...' : confirmText}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              {cancelText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}