'use client'

import React, { useState } from 'react'
import { Calendar, Clock, User, MapPin, Phone, Star, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import { cn, formatarMoeda } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'
import { useBrazilianDate } from '@/shared/hooks/utils/use-brazilian-date'

interface AgendamentoCardProps {
  appointment: ClientAppointment
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onReschedule?: (appointmentId: string) => void
  onViewDetails?: (appointmentId: string) => void
  className?: string
}

// Mapeamento de status para cores e ícones
const statusConfig = {
  pendente: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
    label: 'Pendente',
  },
  confirmado: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    label: 'Confirmado',
  },
  concluido: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Concluído',
  },
  cancelado: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Cancelado',
  },
} as const

export const AgendamentoCard: React.FC<AgendamentoCardProps> = ({
  appointment,
  variant = 'default',
  showActions = true,
  onReschedule,
  onViewDetails,
  className,
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { cancelAppointment } = useClientAppointments()

  const statusInfo =
    statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pendente
  const StatusIcon = statusInfo.icon

  // Usar hook para formatação de data brasileira
  const brazilianDate = useBrazilianDate(appointment.data_agendamento)
  const isFuture = !brazilianDate.isPast && !['cancelado', 'concluido'].includes(appointment.status)

  // Função para cancelar agendamento
  const handleCancel = async () => {
    if (!appointment.canCancel) return

    setIsProcessing(true)
    try {
      const result = await cancelAppointment(appointment.id, cancelReason)
      if (result.success) {
        setShowCancelDialog(false)
        setCancelReason('')
      } else {
        console.error('Erro ao cancelar:', result.error)
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Renderizar versão compacta
  if (variant === 'compact') {
    return (
      <Card className={cn('transition-shadow hover:shadow-md', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-gold/10">
                <Calendar className="h-5 w-5 text-primary-gold" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{appointment.service?.nome || 'Serviço'}</h3>
                <p className="text-xs text-text-muted">
                  {brazilianDate.date} às {brazilianDate.time}
                </p>
              </div>
            </div>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar versão detalhada
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header com serviço e status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-gold/10">
                <Calendar className="h-6 w-6 text-primary-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {appointment.service?.nome || 'Serviço'}
                </h3>
                {appointment.service?.descricao && (
                  <p className="text-sm text-text-muted">{appointment.service.descricao}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={cn('flex items-center gap-1', statusInfo.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Informações do agendamento */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Data e horário */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary-gold" />
              <div>
                <div className="font-medium">{brazilianDate.fullDateTime}</div>
                <div className="text-text-muted">{brazilianDate.time}</div>
              </div>
            </div>

            {/* Barbeiro */}
            {appointment.barbeiro && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary-gold" />
                <div>
                  <div className="font-medium">{appointment.barbeiro.nome}</div>
                  <div className="text-text-muted">Barbeiro</div>
                </div>
              </div>
            )}

            {/* Preço e duração */}
            {appointment.service && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <div className="font-medium text-primary-gold">
                    {formatarMoeda(appointment.preco_final || appointment.service.preco)}
                  </div>
                  <div className="text-text-muted">Preço</div>
                </div>
                <div>
                  <div className="font-medium">{appointment.service.duracao_minutos} min</div>
                  <div className="text-text-muted">Duração</div>
                </div>
              </div>
            )}

            {/* Tempo até o agendamento (se futuro) */}
            {isFuture && appointment.timeUntilAppointment && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Em {appointment.timeUntilAppointment}</div>
                  <div className="text-text-muted">Tempo restante</div>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          {appointment.observacoes && (
            <div className="rounded-lg bg-neutral-light-gray p-3">
              <p className="text-sm text-text-muted">
                <strong>Observações:</strong> {appointment.observacoes}
              </p>
            </div>
          )}

          {/* Ações */}
          {showActions && isFuture && (
            <div className="border-border-default flex items-center gap-2 border-t pt-2">
              {appointment.canReschedule && (
                <Button variant="outline" size="sm" onClick={() => onReschedule?.(appointment.id)}>
                  Reagendar
                </Button>
              )}

              {appointment.canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-error hover:border-error hover:text-error"
                >
                  Cancelar
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails?.(appointment.id)}
                className="ml-auto"
              >
                Ver Detalhes
              </Button>
            </div>
          )}

          {/* Ações para agendamentos passados */}
          {!isFuture && appointment.status === 'concluido' && showActions && (
            <div className="border-border-default flex items-center gap-2 border-t pt-2">
              <Button variant="outline" size="sm" onClick={() => onViewDetails?.(appointment.id)}>
                <Star className="mr-1 h-4 w-4" />
                Avaliar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails?.(appointment.id)}
                className="ml-auto"
              >
                Ver Detalhes
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog de confirmação de cancelamento */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancelar Agendamento"
        description="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmText="Sim, Cancelar"
        cancelText="Não, Manter"
        variant="destructive"
        loading={isProcessing}
      >
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Motivo do cancelamento (opcional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Informe o motivo do cancelamento..."
            className="border-border-default w-full rounded-md border p-2 text-sm"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </Card>
  )
}

export default AgendamentoCard
