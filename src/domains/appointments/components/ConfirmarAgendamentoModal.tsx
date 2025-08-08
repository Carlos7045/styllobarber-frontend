'use client'

import React, { useState } from 'react'
import { Calendar, Clock, User, DollarSign, CheckCircle, X, AlertCircle } from 'lucide-react'
import {
  SimpleModal,
  SimpleModalContent,
  SimpleModalHeader,
  SimpleModalTitle,
  SimpleModalFooter,
} from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn, formatarMoeda } from '@/shared/utils'
import type { Appointment } from '@/types/appointments'

interface ConfirmarAgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onConfirm: (
    appointmentId: string,
    observacoes?: string
  ) => Promise<{ success: boolean; error?: string }>
  onCancel: (appointmentId: string, motivo: string) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
}

export const ConfirmarAgendamentoModal: React.FC<ConfirmarAgendamentoModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [action, setAction] = useState<'confirm' | 'cancel' | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!appointment) return null

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await onConfirm(appointment.id, observacoes || undefined)
      if (result.success) {
        onClose()
        setAction(null)
        setObservacoes('')
      } else {
        // Mostrar erro se necessário
        console.error('Erro ao confirmar:', result.error)
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!motivo.trim()) {
      alert('Por favor, informe o motivo do cancelamento')
      return
    }

    setSubmitting(true)
    try {
      const result = await onCancel(appointment.id, motivo)
      if (result.success) {
        onClose()
        setAction(null)
        setMotivo('')
      } else {
        console.error('Erro ao cancelar:', result.error)
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('pt-BR', {
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

  const dateTime = formatDateTime(appointment.data_agendamento)

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Confirmar Agendamento" size="lg">
      <SimpleModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-yellow-100 p-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <SimpleModalTitle>Agendamento Pendente</SimpleModalTitle>
            <p className="mt-1 text-sm text-text-muted">
              Este agendamento precisa ser confirmado ou cancelado
            </p>
          </div>
        </div>
      </SimpleModalHeader>

      <SimpleModalContent className="space-y-6">
        {/* Informações do Agendamento */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{appointment.service?.nome || 'Serviço'}</h3>
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Pendente
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <User className="h-4 w-4" />
                  <span>
                    <strong>Cliente:</strong> {appointment.cliente?.nome || 'Cliente'}
                  </span>
                </div>

                {appointment.cliente?.telefone && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className="ml-6">📱 {appointment.cliente.telefone}</span>
                  </div>
                )}

                {appointment.barbeiro && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <User className="h-4 w-4" />
                    <span>
                      <strong>Barbeiro:</strong> {appointment.barbeiro.nome}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <strong>Data:</strong> {dateTime.date}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-text-muted">
                  <Clock className="h-4 w-4" />
                  <span>
                    <strong>Horário:</strong> {dateTime.time}
                  </span>
                </div>

                {appointment.service && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      <strong>Valor:</strong>{' '}
                      {formatarMoeda(appointment.preco_final || appointment.service.preco)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {appointment.observacoes && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm">
                  <strong>Observações do cliente:</strong> {appointment.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        {!action && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setAction('cancel')}
              className="flex items-center gap-2 text-red-600 hover:border-red-300 hover:text-red-700"
              disabled={loading}
            >
              <X className="h-4 w-4" />
              Cancelar Agendamento
            </Button>

            <Button
              onClick={() => setAction('confirm')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar Agendamento
            </Button>
          </div>
        )}

        {/* Formulário de Confirmação */}
        {action === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Confirmar Agendamento</span>
              </div>
              <p className="text-sm text-green-700">
                O cliente será notificado sobre a confirmação do agendamento.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Observações adicionais (opcional)
              </label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações para o agendamento..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Formulário de Cancelamento */}
        {action === 'cancel' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-red-800">
                <X className="h-5 w-5" />
                <span className="font-semibold">Cancelar Agendamento</span>
              </div>
              <p className="text-sm text-red-700">
                O cliente será notificado sobre o cancelamento. Esta ação não pode ser desfeita.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Motivo do cancelamento *</label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                rows={3}
                required
              />
            </div>
          </div>
        )}
      </SimpleModalContent>

      <SimpleModalFooter>
        <div className="flex w-full justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (action) {
                setAction(null)
                setObservacoes('')
                setMotivo('')
              } else {
                onClose()
              }
            }}
            disabled={submitting}
          >
            {action ? 'Voltar' : 'Fechar'}
          </Button>

          {action === 'confirm' && (
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              loading={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Agendamento
            </Button>
          )}

          {action === 'cancel' && (
            <Button
              onClick={handleCancel}
              disabled={submitting || !motivo.trim()}
              loading={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar Agendamento
            </Button>
          )}
        </div>
      </SimpleModalFooter>
    </SimpleModal>
  )
}

export default ConfirmarAgendamentoModal
