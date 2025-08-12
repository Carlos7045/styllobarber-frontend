'use client'

import React from 'react'
import { Badge } from './badge'
import { cn } from '@/shared/utils'
import { 
  PAYMENT_STATUS_COLORS, 
  PAYMENT_STATUS_LABELS, 
  type PaymentStatus 
} from '@/types/appointments'

interface PaymentStatusBadgeProps {
  status?: PaymentStatus
  needsPayment?: boolean
  paymentMethod?: string
  appointmentStatus?: string
  className?: string
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  needsPayment = false,
  paymentMethod,
  appointmentStatus,
  className,
}) => {
  // Determinar status e cor baseado na lógica correta
  let displayLabel: string
  let colorClass: string
  let icon: string

  // 1. Se precisa de pagamento (serviço concluído mas não pago) - PRIORIDADE MÁXIMA
  if (needsPayment) {
    displayLabel = 'Não Pago'
    colorClass = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    icon = '❌'
  }
  // 2. Se foi pago antecipadamente
  else if (paymentMethod === 'advance') {
    displayLabel = 'Pago Antecipado'
    colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
    icon = '✨'
  }
  // 3. Se tem status de pagamento definido como pago
  else if (status === 'paid') {
    displayLabel = 'Pago'
    colorClass = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    icon = '✅'
  }
  // 4. Se tem outros status de pagamento
  else if (status === 'pending') {
    displayLabel = 'Pendente'
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    icon = '⏳'
  }
  else if (status === 'failed') {
    displayLabel = 'Falhou'
    colorClass = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    icon = '❌'
  }
  else if (status === 'refunded') {
    displayLabel = 'Estornado'
    colorClass = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
    icon = '↩️'
  }
  // 5. Se é agendamento futuro
  else if (appointmentStatus && ['pendente', 'confirmado'].includes(appointmentStatus)) {
    displayLabel = 'Pagar no Local'
    colorClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
    icon = '💰'
  }
  // 6. Se é agendamento concluído sem status específico (assumir pago no local)
  else if (appointmentStatus === 'concluido') {
    displayLabel = 'Pago no Local'
    colorClass = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    icon = '✅'
  }
  // 7. Se é agendamento cancelado
  else if (appointmentStatus === 'cancelado') {
    displayLabel = 'Cancelado'
    colorClass = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
    icon = '🚫'
  }
  // 8. Fallback
  else {
    displayLabel = 'Pagar no Local'
    colorClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
    icon = '💰'
  }

  return (
    <Badge className={cn('text-xs font-medium flex items-center gap-1', colorClass, className)}>
      <span>{icon}</span>
      <span>{displayLabel}</span>
    </Badge>
  )
}

export default PaymentStatusBadge