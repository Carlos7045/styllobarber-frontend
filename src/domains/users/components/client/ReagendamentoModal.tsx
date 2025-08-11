'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  SimpleModal,
  SimpleModalContent,
  SimpleModalHeader,
  SimpleModalTitle,
  SimpleModalFooter,
} from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui/button'
import { DatePicker, type DateAvailability } from '@/shared/components/ui/date-picker'
import { TimePicker, type TimeSlot } from '@/shared/components/ui/time-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/shared/components/ui/textarea'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
// import { useHorariosFuncionamento } from '@/shared/hooks/use-horarios-funcionamento' // Hook não existe
import { useAvailableTimes } from '@/domains/appointments/hooks/use-available-times'
import { cn, formatarMoeda } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'

interface ReagendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (appointment: any) => void
  appointment: ClientAppointment | null
}

interface ReagendamentoFormData {
  data: string
  horario: string
  observacoes?: string
}

const steps = [
  { id: 'data', title: 'Nova Data', icon: Calendar },
  { id: 'horario', title: 'Novo Horário', icon: Clock },
  { id: 'confirmacao', title: 'Confirmação', icon: Check },
]

export const ReagendamentoModal: React.FC<ReagendamentoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ReagendamentoFormData>({
    data: '',
    horario: '',
    observacoes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { rescheduleAppointment, checkAvailability } = useClientAppointments()
  // const { horarios } = useHorariosFuncionamento() // Hook não existe
  const { timeSlots: availableTimes, loading: timesLoading } = useAvailableTimes({
    date: formData.data ? new Date(formData.data) : undefined,
    serviceId: appointment?.service_id,
    barbeiroId: appointment?.barbeiro_id,
  })

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 ReagendamentoModal aberto!', { appointment })
      setCurrentStep(0)
      setFormData({
        data: '',
        horario: '',
        observacoes: '',
      })
    } else {
      console.log('❌ ReagendamentoModal fechado')
    }
  }, [isOpen, appointment])

  // Verificar se pode prosseguir para próximo step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Data
        return !!formData.data
      case 1: // Horário
        return !!formData.horario
      case 2: // Confirmação
        return true
      default:
        return false
    }
  }, [currentStep, formData])

  // Navegar entre steps
  const goToNextStep = () => {
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Submeter reagendamento
  const handleSubmit = async () => {
    if (!appointment || !formData.data || !formData.horario) return

    setIsSubmitting(true)
    try {
      // Combinar data e horário
      const newDateTime = `${formData.data}T${formData.horario}:00`

      const result = await rescheduleAppointment(appointment.id, newDateTime)

      if (result.success) {
        onSuccess?.(result)
        onClose()
      } else {
        console.error('Erro ao reagendar:', result.error)
        // TODO: Mostrar toast de erro
      }
    } catch (error) {
      console.error('Erro ao reagendar agendamento:', error)
      // TODO: Mostrar toast de erro
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar conteúdo do step atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Seleção de Data
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Escolha a Nova Data
              </h3>
              <p className="text-gray-400">
                Selecione uma nova data para seu agendamento
              </p>
            </div>

            <DatePicker
              value={formData.data}
              onChange={(date) => setFormData(prev => ({ ...prev, data: date, horario: '' }))}
              minDate={new Date().toISOString().split('T')[0]}
              className="w-full"
            />

            {formData.data && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <p className="text-blue-300 font-medium">Data Selecionada</p>
                </div>
                <p className="text-blue-200/80 mt-1">
                  {new Date(formData.data).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        )

      case 1: // Seleção de Horário
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Escolha o Novo Horário
              </h3>
              <p className="text-gray-400">
                Selecione um horário disponível para {new Date(formData.data).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <TimePicker
              date={formData.data}
              value={formData.horario}
              onChange={(time) => setFormData(prev => ({ ...prev, horario: time }))}
              availableTimes={availableTimes}
              loading={timesLoading}
              className="w-full"
            />

            {formData.horario && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  <p className="text-green-300 font-medium">Horário Selecionado</p>
                </div>
                <p className="text-green-200/80 mt-1">
                  {formData.horario} - {
                    (() => {
                      const [hours, minutes] = formData.horario.split(':').map(Number)
                      const endTime = new Date()
                      endTime.setHours(hours, minutes + (appointment?.service?.duracao_minutos || 30))
                      return endTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    })()
                  }
                </p>
              </div>
            )}
          </div>
        )

      case 2: // Confirmação
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Confirmar Reagendamento
              </h3>
              <p className="text-gray-400">
                Revise as informações antes de confirmar
              </p>
            </div>

            {/* Resumo do agendamento atual */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <h4 className="font-medium text-white mb-3">Agendamento Atual</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Serviço:</span>
                  <span className="text-white">{appointment?.service?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Barbeiro:</span>
                  <span className="text-white">{appointment?.barbeiro?.nome || 'Qualquer barbeiro'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data/Hora Atual:</span>
                  <span className="text-white">
                    {appointment && new Date(appointment.data_agendamento).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo do novo agendamento */}
            <div className="bg-primary-gold/10 rounded-lg p-4 border border-primary-gold/30">
              <h4 className="font-medium text-primary-gold mb-3">Novo Agendamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nova Data:</span>
                  <span className="text-white">
                    {new Date(formData.data).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Novo Horário:</span>
                  <span className="text-white">
                    {formData.horario} - {
                      (() => {
                        const [hours, minutes] = formData.horario.split(':').map(Number)
                        const endTime = new Date()
                        endTime.setHours(hours, minutes + (appointment?.service?.duracao_minutos || 30))
                        return endTime.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      })()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração:</span>
                  <span className="text-white">{appointment?.service?.duracao_minutos} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Preço:</span>
                  <span className="text-primary-gold font-medium">
                    {formatarMoeda(appointment?.preco_final || appointment?.service?.preco || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo de observações */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Observações (opcional)
              </label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Alguma observação sobre o reagendamento..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                rows={3}
              />
            </div>

            {/* Aviso sobre política de reagendamento */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-medium">Política de Reagendamento</p>
                  <p className="text-yellow-200/80 text-sm mt-1">
                    Após confirmar, o barbeiro será notificado sobre a mudança. 
                    O reagendamento pode estar sujeito à disponibilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!appointment) return null

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} size="lg">
      <SimpleModalContent className="bg-gray-900 border-gray-700">
        <SimpleModalHeader className="border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <SimpleModalTitle className="text-white">
              Reagendar Agendamento
            </SimpleModalTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Indicador de progresso */}
          <div className="flex items-center justify-center mt-6 mb-4">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const StepIcon = step.icon

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        isActive
                          ? 'border-primary-gold bg-primary-gold text-gray-900'
                          : isCompleted
                          ? 'border-primary-gold bg-primary-gold/20 text-primary-gold'
                          : 'border-gray-600 bg-gray-800 text-gray-400'
                      )}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium',
                        isActive || isCompleted ? 'text-primary-gold' : 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-4 h-0.5 w-12 transition-colors',
                        isCompleted ? 'bg-primary-gold' : 'bg-gray-600'
                      )}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </SimpleModalHeader>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <SimpleModalFooter className="border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={currentStep === 0 ? onClose : goToPreviousStep}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {currentStep === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={goToNextStep}
                disabled={!canProceed}
                className="bg-primary-gold text-gray-900 hover:bg-primary-gold/90"
              >
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="bg-primary-gold text-gray-900 hover:bg-primary-gold/90"
              >
                {isSubmitting ? 'Reagendando...' : 'Confirmar Reagendamento'}
              </Button>
            )}
          </div>
        </SimpleModalFooter>
      </SimpleModalContent>
    </SimpleModal>
  )
}

export default ReagendamentoModal