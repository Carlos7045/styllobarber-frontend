'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Edit,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn, formatarMoeda } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'
// Removido import do hook que não existe

interface NextAppointmentHighlightProps {
  appointment: ClientAppointment | null
  loading?: boolean
  onReschedule?: (appointmentId: string) => void
  onCancel?: (appointmentId: string) => void
  onViewDetails?: (appointmentId: string) => void
  onNewAppointment?: () => void
  className?: string
}

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  isToday: boolean
  isNow: boolean
  isPast: boolean
}

const calculateCountdown = (targetDate: string): CountdownTime => {
  const now = new Date()
  const target = new Date(targetDate)
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isToday: false,
      isNow: false,
      isPast: true,
    }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  const isToday = days === 0
  const isNow = days === 0 && hours === 0 && minutes <= 30

  return {
    days,
    hours,
    minutes,
    seconds,
    isToday,
    isNow,
    isPast: false,
  }
}

const CountdownDisplay: React.FC<{ countdown: CountdownTime }> = ({ countdown }) => {
  if (countdown.isPast) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <div className="font-semibold text-red-600">⏰ Agendamento passou do horário</div>
      </div>
    )
  }

  if (countdown.isNow) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <div className="animate-pulse text-lg font-bold text-green-600">🎯 É AGORA!</div>
        <div className="mt-1 text-sm text-green-600">Seu horário chegou</div>
      </div>
    )
  }

  // Mensagem simples baseada no tempo restante
  const getTimeMessage = () => {
    if (countdown.days > 1) {
      return `📅 Em ${countdown.days} dias`
    } else if (countdown.days === 1) {
      return `📅 Amanhã às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (countdown.hours > 1) {
      return `⏰ Em ${countdown.hours} horas`
    } else if (countdown.hours === 1) {
      return `⏰ Em 1 hora`
    } else {
      return `⏰ Em ${countdown.minutes} minutos`
    }
  }

  return (
    <div className="rounded-lg border border-primary-gold/20 bg-primary-gold/10 p-4 text-center">
      <div className="text-lg font-semibold text-primary-gold">{getTimeMessage()}</div>
    </div>
  )
}

export const NextAppointmentHighlight: React.FC<NextAppointmentHighlightProps> = ({
  appointment,
  loading = false,
  onReschedule,
  onCancel,
  onViewDetails,
  onNewAppointment,
  className,
}) => {
  const [countdown, setCountdown] = useState<CountdownTime | null>(null)

  // Atualizar countdown a cada segundo
  useEffect(() => {
    if (!appointment) return

    const updateCountdown = () => {
      const newCountdown = calculateCountdown(appointment.data_agendamento)
      setCountdown(newCountdown)
    }

    // Atualizar imediatamente
    updateCountdown()

    // Atualizar a cada segundo
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [appointment])

  // Formatação de data brasileira
  const formatBrazilianDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      fullDateTime: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }),
    }
  }

  const brazilianDate = appointment ? formatBrazilianDate(appointment.data_agendamento) : null

  // Estado de loading
  if (loading) {
    return (
      <Card className={cn('border-2 border-dashed border-gray-300', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-3/4 rounded bg-gray-200"></div>
            <div className="h-20 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sem agendamento
  if (!appointment) {
    return (
      <Card className={cn('border-2 border-dashed border-gray-300 bg-gray-50', className)}>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-600">Nenhum agendamento próximo</h3>
          <p className="mb-4 text-gray-500">Que tal agendar seu próximo corte?</p>
          <Button className="bg-primary-gold hover:bg-primary-gold-dark" onClick={onNewAppointment}>
            Agendar Agora
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Determinar estilo baseado na proximidade
  const getCardStyle = () => {
    if (!countdown) return ''

    if (countdown.isPast) {
      return 'border-red-500 bg-red-50'
    }

    if (countdown.isNow) {
      return 'border-green-500 bg-green-50 shadow-lg shadow-green-200 animate-pulse'
    }

    if (countdown.isToday) {
      return 'border-primary-gold bg-primary-gold/5 shadow-lg shadow-primary-gold/20'
    }

    return 'border-blue-500 bg-blue-50'
  }

  const getStatusConfig = () => {
    const statusMap = {
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
    }

    return statusMap[appointment.status as keyof typeof statusMap] || statusMap.pendente
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card
      className={cn(
        'border-2 transition-all duration-300 hover:shadow-xl',
        getCardStyle(),
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="rounded-full bg-primary-gold/10 p-2">
              <Calendar className="h-6 w-6 text-primary-gold" />
            </div>
            Próximo Agendamento
          </CardTitle>

          <Badge className={cn('flex items-center gap-1', statusConfig.color)}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações do agendamento */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              {appointment.service?.nome || 'Serviço'}
            </h3>
            {appointment.service?.descricao && (
              <p className="text-text-muted">{appointment.service.descricao}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-text-muted">
            <Clock className="h-4 w-4" />
            <span>{brazilianDate?.fullDateTime}</span>
          </div>

          {appointment.barbeiro && (
            <div className="flex items-center gap-2 text-text-muted">
              <User className="h-4 w-4" />
              <span>Com {appointment.barbeiro.nome}</span>
            </div>
          )}

          {appointment.service && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium text-primary-gold">
                  {formatarMoeda(appointment.preco_final || appointment.service.preco)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{appointment.service.duracao_minutos} min</span>
              </div>
            </div>
          )}

          {/* Countdown simplificado */}
          {countdown && <CountdownDisplay countdown={countdown} />}
        </div>

        {/* Observações */}
        {appointment.observacoes && (
          <div className="rounded-lg bg-neutral-light-gray p-3">
            <p className="text-sm">
              <strong>Observações:</strong> {appointment.observacoes}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 border-t pt-4">
          {appointment.canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule?.(appointment.id)}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Reagendar
            </Button>
          )}

          {appointment.canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel?.(appointment.id)}
              className="flex items-center gap-1 text-red-600 hover:border-red-300 hover:text-red-700"
            >
              <X className="h-4 w-4" />
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

          {/* Botão de localização */}
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Como Chegar
          </Button>
        </div>

        {/* Dica baseada no countdown */}
        {countdown && !countdown.isPast && (
          <div
            className={cn(
              'rounded-lg p-3 text-sm',
              countdown.isNow
                ? 'bg-green-100 text-green-800'
                : countdown.isToday
                  ? 'bg-primary-gold/10 text-primary-gold'
                  : 'bg-blue-100 text-blue-800'
            )}
          >
            {countdown.isNow
              ? '🎯 Seu horário chegou! Dirija-se à barbearia.'
              : countdown.isToday
                ? '⏰ Agendamento hoje! Não se esqueça.'
                : countdown.days === 1
                  ? '📅 Agendamento amanhã. Prepare-se!'
                  : `📆 Faltam ${countdown.days} dias para seu agendamento.`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default NextAppointmentHighlight
