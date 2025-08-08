'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  MapPin,
} from 'lucide-react'
import { SimpleModal, SimpleModalContent } from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui/button'
import { DatePicker, type DateAvailability } from '@/shared/components/ui/date-picker'
import { TimePicker, type TimeSlot } from '@/shared/components/ui/time-picker'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
import { useServices } from '@/shared/hooks/data/use-services'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'
import { useHorariosFuncionamento } from '@/shared/hooks/use-horarios-funcionamento'
import { cn, formatarMoeda } from '@/shared/utils'

// Interfaces
interface NovoAgendamentoModalMelhoradoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (appointment: any) => void
  preSelectedServiceId?: string
}

interface AgendamentoFormData {
  serviceId: string
  barbeiroId?: string
  data: string
  horario: string
  observacoes?: string
}

interface Barbeiro {
  id: string
  nome: string
  foto?: string
  avaliacao?: number
  especialidades?: string[]
}

type Step = 'service' | 'barber' | 'datetime' | 'confirmation'

const steps: { key: Step; title: string; description: string }[] = [
  { key: 'service', title: 'Serviço', description: 'Escolha o serviço desejado' },
  { key: 'barber', title: 'Barbeiro', description: 'Selecione seu barbeiro' },
  { key: 'datetime', title: 'Data & Hora', description: 'Escolha quando agendar' },
  { key: 'confirmation', title: 'Confirmação', description: 'Revise e confirme' },
]

export function NovoAgendamentoModalMelhorado({
  isOpen,
  onClose,
  onSuccess,
  preSelectedServiceId,
}: NovoAgendamentoModalMelhoradoProps) {
  // Estados
  const [currentStep, setCurrentStep] = useState<Step>('service')
  const [formData, setFormData] = useState<AgendamentoFormData>({
    serviceId: preSelectedServiceId || '',
    barbeiroId: '',
    data: '',
    horario: '',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Hooks
  const { services, loading: servicesLoading } = useServices()
  const { createAppointment, checkAvailability } = useClientAppointments()
  const {
    funcionarios,
    loading: funcionariosLoading,
    error: funcionariosError,
    refetch: refetchFuncionarios,
  } = useFuncionariosPublicos()
  const { getHorarioPorDia } = useHorariosFuncionamento()

  // Preparar lista de barbeiros
  const barbeiros: Barbeiro[] = useMemo(() => {
    const barbeirosList: Barbeiro[] = [
      {
        id: 'any',
        nome: `Qualquer barbeiro disponível${funcionarios?.length ? ` (${funcionarios.length})` : ''}`,
        avaliacao: undefined,
      },
    ]

    if (funcionarios && funcionarios.length > 0) {
      funcionarios.forEach((func, index) => {
        barbeirosList.push({
          id: func.id,
          nome: func.profiles?.nome || `Barbeiro ${index + 1}`,
          foto: func.profiles?.avatar_url || undefined,
          avaliacao: 4.8, // Mock para demonstração
          especialidades: func.especialidades || [],
        })
      })
    }

    return barbeirosList
  }, [funcionarios])

  // Dados derivados
  const selectedService = services.find((s) => s.id === formData.serviceId)
  const selectedBarber = barbeiros.find((b) => b.id === formData.barbeiroId)
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep)

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('service')
      setFormData({
        serviceId: preSelectedServiceId || '',
        barbeiroId: '',
        data: '',
        horario: '',
        observacoes: '',
      })
      setSelectedDate(null)
      setError(null)
    }
  }, [isOpen, preSelectedServiceId])

  // Handlers
  const handleServiceSelect = (serviceId: string) => {
    setFormData((prev) => ({ ...prev, serviceId }))
    setCurrentStep('barber')
  }

  const handleBarberSelect = (barbeiroId: string) => {
    setFormData((prev) => ({ ...prev, barbeiroId }))
    setCurrentStep('datetime')
  }

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
      setFormData((prev) => ({ ...prev, data: date.toISOString().split('T')[0] }))
    }
  }

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, horario: time }))
    setCurrentStep('confirmation')
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key)
    }
  }

  const handleNext = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return !!formData.serviceId
      case 'barber':
        return !!formData.barbeiroId
      case 'datetime':
        return !!formData.data && !!formData.horario
      case 'confirmation':
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setLoading(true)
    setError(null)

    try {
      const appointment = await createAppointment({
        service_id: formData.serviceId,
        barbeiro_id: formData.barbeiroId === 'any' ? null : formData.barbeiroId,
        data_agendamento: `${formData.data}T${formData.horario}:00-03:00`,
        observacoes: formData.observacoes || null,
      })

      onSuccess?.(appointment)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  // Funções de geração de dados
  const generateDateAvailability = (): DateAvailability[] => {
    // Implementação simplificada - em produção, buscar da API
    const dates: DateAvailability[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      dates.push({
        date,
        available: true,
        slots: Math.floor(Math.random() * 8) + 2, // 2-10 slots disponíveis
      })
    }

    return dates
  }

  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedDate) return []

    const slots: TimeSlot[] = []
    const startHour = 8
    const endHour = 18

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          available: Math.random() > 0.3, // 70% de chance de estar disponível
          price: selectedService?.preco,
        })
      }
    }

    return slots
  }

  // Componentes de renderização
  const renderProgressIndicator = () => (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex
        const isCurrent = index === currentStepIndex

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                isCompleted && 'bg-primary-gold text-gray-900',
                isCurrent && 'bg-primary-gold text-gray-900 ring-4 ring-primary-gold/20',
                !isCompleted && !isCurrent && 'bg-gray-700 text-gray-400'
              )}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-12 transition-colors duration-300',
                  isCompleted ? 'bg-primary-gold' : 'bg-gray-700'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderStepHeader = () => {
    const step = steps[currentStepIndex]
    return (
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">{step.title}</h2>
        <p className="text-gray-400">{step.description}</p>
      </div>
    )
  }

  const renderServiceStep = () => (
    <div className="space-y-4">
      {servicesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid max-h-96 gap-4 overflow-y-auto">
          {services.map((service) => (
            <Card
              key={service.id}
              className={cn(
                'cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                formData.serviceId === service.id
                  ? 'border-primary-gold bg-primary-gold/10 shadow-lg'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              )}
              onClick={() => handleServiceSelect(service.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold text-white">{service.nome}</h3>
                    <p className="mb-3 text-sm text-gray-400">{service.descricao}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duracao_minutos} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-gold">
                      {formatarMoeda(service.preco)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderBarberStep = () => (
    <div className="space-y-4">
      {funcionariosLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {/* Debug info em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-4 text-sm">
              <strong>🔍 Debug Info:</strong>
              <br />
              Funcionários: {funcionarios?.length || 0} | Barbeiros: {barbeiros?.length || 0} |
              Loading: {funcionariosLoading ? 'Sim' : 'Não'}
              {funcionariosError && (
                <>
                  <br />
                  <span className="text-red-400">Erro: {funcionariosError}</span>
                </>
              )}
            </div>
          )}

          {barbeiros.length <= 1 ? (
            <div className="py-12 text-center">
              <User className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="mb-2 text-xl font-medium text-white">
                {funcionariosError ? 'Erro ao carregar barbeiros' : 'Nenhum barbeiro disponível'}
              </h3>
              <p className="mb-6 text-gray-400">
                {funcionariosError
                  ? 'Houve um problema ao carregar a lista de barbeiros.'
                  : 'No momento não há barbeiros disponíveis para agendamento.'}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={refetchFuncionarios}
                  disabled={funcionariosLoading}
                  className="bg-primary-gold text-gray-900 hover:bg-primary-gold-dark"
                >
                  {funcionariosLoading ? 'Carregando...' : 'Tentar novamente'}
                </Button>
                {barbeiros.length === 1 && (
                  <p className="text-sm text-gray-500">
                    Você ainda pode continuar com "Qualquer barbeiro disponível"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {barbeiros.map((barbeiro) => (
                <Card
                  key={barbeiro.id}
                  className={cn(
                    'cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                    formData.barbeiroId === barbeiro.id
                      ? 'border-primary-gold bg-primary-gold/10 shadow-lg'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  )}
                  onClick={() => handleBarberSelect(barbeiro.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {barbeiro.id !== 'any' && (
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700">
                          {barbeiro.foto ? (
                            <img
                              src={barbeiro.foto}
                              alt={barbeiro.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-white">{barbeiro.nome}</h3>
                        {barbeiro.avaliacao && barbeiro.avaliacao > 0 && (
                          <div className="mb-2 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span className="text-sm text-gray-400">
                              {barbeiro.avaliacao.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {barbeiro.especialidades && barbeiro.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {barbeiro.especialidades.map((esp) => (
                              <span
                                key={esp}
                                className="rounded-full bg-primary-gold/20 px-3 py-1 text-xs text-primary-gold"
                              >
                                {esp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderDateTimeStep = () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
          <Calendar className="h-5 w-5 text-primary-gold" />
          Selecione a Data
        </h3>
        <DatePicker
          value={selectedDate}
          onChange={handleDateSelect}
          availability={generateDateAvailability()}
          showAvailabilityIndicator
          minDate={new Date()}
          placeholder="Escolha uma data"
        />
      </div>

      {selectedDate && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Clock className="h-5 w-5 text-primary-gold" />
            Selecione o Horário
          </h3>
          <TimePicker
            value={formData.horario}
            onChange={handleTimeSelect}
            timeSlots={generateTimeSlots()}
            showAvailabilityCount
            placeholder="Escolha um horário"
          />
        </div>
      )}
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-8">
      <Card className="border-gray-700 bg-gray-800/50">
        <CardContent className="p-6">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <Check className="h-6 w-6 text-primary-gold" />
            Resumo do Agendamento
          </h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <DollarSign className="mt-1 h-6 w-6 text-primary-gold" />
              <div>
                <div className="text-lg font-medium text-white">{selectedService?.nome}</div>
                <div className="text-sm text-gray-400">
                  {formatarMoeda(selectedService?.preco || 0)} • {selectedService?.duracao_minutos}{' '}
                  min
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <User className="mt-1 h-6 w-6 text-primary-gold" />
              <div>
                <div className="text-lg font-medium text-white">{selectedBarber?.nome}</div>
                {selectedBarber?.avaliacao && (
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-sm text-gray-400">
                      {selectedBarber.avaliacao.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Calendar className="mt-1 h-6 w-6 text-primary-gold" />
              <div>
                <div className="text-lg font-medium text-white">
                  {selectedDate?.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="mt-1 h-6 w-6 text-primary-gold" />
              <div>
                <div className="text-lg font-medium text-white">{formData.horario}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <label className="mb-3 block text-sm font-medium text-white">Observações (opcional)</label>
        <Textarea
          value={formData.observacoes}
          onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Alguma observação especial para o barbeiro..."
          className="border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          rows={3}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  )

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} className="max-w-4xl" size="lg">
      <div className="relative min-h-[600px] overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          {renderProgressIndicator()}
          {renderStepHeader()}

          <div className="mb-8">
            {currentStep === 'service' && renderServiceStep()}
            {currentStep === 'barber' && renderBarberStep()}
            {currentStep === 'datetime' && renderDateTimeStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-700/50 pt-6">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onClose : handlePrevious}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStepIndex === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            <div className="flex gap-3">
              {currentStep === 'confirmation' ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  loading={loading}
                  className="bg-primary-gold px-8 text-gray-900 hover:bg-primary-gold-dark"
                >
                  Confirmar Agendamento
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-primary-gold px-8 text-gray-900 hover:bg-primary-gold-dark"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SimpleModal>
  )
}

export default NovoAgendamentoModalMelhorado
