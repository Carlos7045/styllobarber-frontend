'use client'

import React from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Phone,
  DollarSign,
  FileText,
} from 'lucide-react'
import {
  SimpleModal,
  SimpleModalContent,
  SimpleModalHeader,
  SimpleModalTitle,
} from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn, formatarMoeda } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'

interface DetalhesAgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: ClientAppointment | null
  onReschedule?: (appointmentId: string) => void
  onCancel?: (appointmentId: string) => void
}

export const DetalhesAgendamentoModal: React.FC<DetalhesAgendamentoModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onReschedule,
  onCancel,
}) => {
  if (!appointment) return null

  // Formatação de data brasileira
  const formatBrazilianDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      fullDate: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }),
    }
  }

  const { fullDate, time } = formatBrazilianDate(appointment.data_agendamento)

  const getStatusConfig = () => {
    const statusMap = {
      pendente: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pendente',
      },
      confirmado: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Confirmado',
      },
      concluido: {
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Concluído',
      },
      cancelado: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Cancelado',
      },
    }

    return statusMap[appointment.status as keyof typeof statusMap] || statusMap.pendente
  }

  const statusConfig = getStatusConfig()

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} size="lg">
      <SimpleModalContent className="bg-gray-900 text-white">
        <SimpleModalHeader>
          <div className="flex items-center justify-between">
            <SimpleModalTitle className="text-xl font-bold text-white">
              Detalhes do Agendamento
            </SimpleModalTitle>
            <Badge className={cn('flex items-center gap-1', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </SimpleModalHeader>

        <div className="space-y-6 p-6">
          {/* Informações do Serviço */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
                <Scissors className="h-6 w-6 text-primary-gold" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {appointment.service?.nome || 'Serviço'}
                </h3>
                {appointment.service?.descricao && (
                  <p className="mb-3 text-sm text-gray-400">{appointment.service.descricao}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      {appointment.service?.duracao_minutos || 30} minutos
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-primary-gold" />
                    <span className="font-semibold text-primary-gold">
                      {formatarMoeda(appointment.preco_final || appointment.service?.preco || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Barbeiro */}
          {appointment.barbeiro && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
                  {appointment.barbeiro.avatar_url ? (
                    <img
                      src={appointment.barbeiro.avatar_url}
                      alt={appointment.barbeiro.nome}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary-gold" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{appointment.barbeiro.nome}</h4>
                  {appointment.barbeiro.especialidades &&
                    appointment.barbeiro.especialidades.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {appointment.barbeiro.especialidades.slice(0, 3).map((esp) => (
                          <span
                            key={esp}
                            className="rounded-full bg-primary-gold/20 px-2 py-1 text-xs text-primary-gold"
                          >
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Data e Horário */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-gold/20">
                  <Calendar className="h-5 w-5 text-primary-gold" />
                </div>
                <div>
                  <h5 className="font-medium text-white">Data</h5>
                  <p className="text-sm capitalize text-gray-400">{fullDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-gold/20">
                  <Clock className="h-5 w-5 text-primary-gold" />
                </div>
                <div>
                  <h5 className="font-medium text-white">Horário</h5>
                  <p className="text-sm text-gray-400">{time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {appointment.observacoes && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
                  <FileText className="h-5 w-5 text-primary-gold" />
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-white">Observações</h5>
                  <p className="text-sm text-gray-400">{appointment.observacoes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <h5 className="mb-3 font-medium text-white">Informações da Barbearia</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Rua das Flores, 123 - Centro, São Paulo - SP</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">(11) 99999-9999</span>
              </div>
            </div>
          </div>

          {/* Tempo até o agendamento */}
          {appointment.timeUntilAppointment && (
            <div className="rounded-lg border border-primary-gold/20 bg-primary-gold/10 p-4">
              <div className="text-center">
                <p className="font-semibold text-primary-gold">
                  ⏰ Faltam {appointment.timeUntilAppointment} para seu agendamento
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-gray-700 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {appointment.canReschedule && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onReschedule?.(appointment.id)
                    onClose()
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Reagendar
                </Button>
              )}

              {appointment.canCancel && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onCancel?.(appointment.id)
                    onClose()
                  }}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Cancelar
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      </SimpleModalContent>
    </SimpleModal>
  )
}

export default DetalhesAgendamentoModal
