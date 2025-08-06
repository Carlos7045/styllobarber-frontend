'use client'

import React, { useState } from 'react'
import { Calendar, Clock, User, MapPin, Phone, Star, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { useClientAppointments } from '@/hooks/use-client-appointments'
import { cn, formatarMoeda, formatarData, formatarDataHora } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'

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
    label: 'Pendente'
  },
  confirmado: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    label: 'Confirmado'
  },
  concluido: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Concluído'
  },
  cancelado: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Cancelado'
  }
} as const

export const AgendamentoCard: React.FC<AgendamentoCardProps> = ({
  appointment,
  variant = 'default',
  showActions = true,
  onReschedule,
  onViewDetails,
  className
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { cancelAppointment } = useClientAppointments()
  
  const statusInfo = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pendente
  const StatusIcon = statusInfo.icon
  
  // Calcular se é um agendamento futuro
  const appointmentDate = new Date(appointment.data_agendamento)
  const now = new Date()
  const isFuture = appointmentDate > now && !['cancelado', 'concluido'].includes(appointment.status)
  
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
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-gold/10 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-gold" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{appointment.service?.nome || 'Serviço'}</h3>
                <p className="text-xs text-text-muted">
                  {formatarData(appointmentDate)} às {appointment.horario_agendamento}
                </p>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Renderizar versão detalhada
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header com serviço e status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-text-primary">
                  {appointment.service?.nome || 'Serviço'}
                </h3>
                {appointment.service?.descricao && (
                  <p className="text-sm text-text-muted">
                    {appointment.service.descricao}
                  </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data e horário */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary-gold" />
              <div>
                <div className="font-medium">
                  {appointmentDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-text-muted">
                  às {appointment.horario_agendamento}
                </div>
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
            <div className="p-3 bg-neutral-light-gray rounded-lg">
              <p className="text-sm text-text-muted">
                <strong>Observações:</strong> {appointment.observacoes}
              </p>
            </div>
          )}
          
          {/* Ações */}
          {showActions && isFuture && (
            <div className="flex items-center gap-2 pt-2 border-t border-border-default">
              {appointment.canReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReschedule?.(appointment.id)}
                >
                  Reagendar
                </Button>
              )}
              
              {appointment.canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-error hover:text-error hover:border-error"
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
            <div className="flex items-center gap-2 pt-2 border-t border-border-default">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(appointment.id)}
              >
                <Star className="h-4 w-4 mr-1" />
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
          <label className="block text-sm font-medium mb-2">
            Motivo do cancelamento (opcional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Informe o motivo do cancelamento..."
            className="w-full p-2 border border-border-default rounded-md text-sm"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </Card>
  )
}

export default AgendamentoCard
