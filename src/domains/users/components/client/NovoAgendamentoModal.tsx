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
  Scissors,
  MapPin,
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
import { useServices } from '@/shared/hooks/data/use-services'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'
import { useHorariosFuncionamento } from '@/shared/hooks/use-horarios-funcionamento'
import { useAvailableTimes } from '@/domains/appointments/hooks/use-available-times'
import { cn, formatarMoeda } from '@/shared/utils'

// Interfaces
interface NovoAgendamentoModalProps {
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

// Etapas do formulário
type FormStep = 'service' | 'barber' | 'datetime' | 'confirmation'

const stepTitles = {
  service: 'Escolha o Serviço',
  barber: 'Escolha o Barbeiro',
  datetime: 'Escolha Data e Horário',
  confirmation: 'Confirmar Agendamento',
}

const stepIcons = {
  service: Scissors,
  barber: User,
  datetime: Calendar,
  confirmation: Check,
}

// Animações
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
}

export const NovoAgendamentoModal: React.FC<NovoAgendamentoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedServiceId,
}) => {
  // Estados
  const [currentStep, setCurrentStep] = useState<FormStep>('service')
  const [formData, setFormData] = useState<AgendamentoFormData>({
    serviceId: preSelectedServiceId || '',
    barbeiroId: 'any',
    data: '',
    horario: '',
    observacoes: '',
  })
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

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

  // Hook para buscar horários disponíveis em tempo real
  const {
    timeSlots: availableTimeSlots,
    loading: timeSlotsLoading,
    error: timeSlotsError,
    refetch: refetchTimeSlots,
  } = useAvailableTimes({
    barbeiroId:
      formData.barbeiroId && formData.barbeiroId !== 'any' ? formData.barbeiroId : undefined,
    serviceId: formData.serviceId,
    date: selectedDate,
    enabled: !!(
      formData.barbeiroId &&
      formData.barbeiroId !== 'any' &&
      formData.serviceId &&
      selectedDate
    ),
  })

  // Debug detalhado
  console.log('🔍 Modal Debug Completo:', {
    funcionarios: funcionarios?.length || 0,
    funcionariosLoading,
    error: funcionariosError,
    funcionariosData: funcionarios?.map((f) => ({
      id: f.id,
      nome: f.profiles?.nome,
      ativo: f.ativo,
      profiles: f.profiles,
      especialidades: f.especialidades,
    })),
  })

  // Preparar lista de barbeiros (funcionários ativos + opção "qualquer")
  const barbeiros: Barbeiro[] = useMemo(() => {
    console.log('🔄 Processando barbeiros...', { funcionarios })

    const barbeirosList: Barbeiro[] = [
      {
        id: 'any',
        nome: `Qualquer barbeiro disponível${funcionarios?.length ? ` (${funcionarios.length})` : ' (0)'}`,
        avaliacao: undefined,
      },
    ]

    // Adicionar funcionários ativos (já filtrados no hook)
    if (funcionarios && funcionarios.length > 0) {
      console.log('✅ Adicionando funcionários à lista:', funcionarios.length)

      funcionarios.forEach((func, index) => {
        console.log(`👤 Funcionário ${index + 1}:`, {
          id: func.id,
          nome: func.profiles?.nome,
          ativo: func.ativo,
          especialidades: func.especialidades,
        })

        barbeirosList.push({
          id: func.id,
          nome: func.profiles?.nome || `Barbeiro ${index + 1}`,
          foto: func.profiles?.avatar_url || undefined,
          avaliacao: 4.8, // Avaliação mock para demonstração
          especialidades: func.especialidades || [],
        })
      })
    } else {
      console.log('⚠️ Nenhum funcionário encontrado para adicionar à lista')
    }

    console.log('📋 Lista final de barbeiros:', barbeirosList)
    return barbeirosList
  }, [funcionarios])

  // Dados derivados
  const selectedService = services.find((s) => s.id === formData.serviceId)
  const selectedBarber = barbeiros.find((b) => b.id === formData.barbeiroId)

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('service')
      setFormData({
        serviceId: preSelectedServiceId || '',
        barbeiroId: 'any',
        data: '',
        horario: '',
        observacoes: '',
      })
      setSelectedDate(undefined)
      setError(undefined)
    }
  }, [isOpen, preSelectedServiceId])

  // Ir para próxima etapa se serviço pré-selecionado
  useEffect(() => {
    if (preSelectedServiceId && currentStep === 'service') {
      setCurrentStep('barber')
    }
  }, [preSelectedServiceId, currentStep])

  // Gerar disponibilidade de datas (mock - em produção viria da API)
  const generateDateAvailability = (): DateAvailability[] => {
    const availability: DateAvailability[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      // Simular disponibilidade (fechado aos domingos)
      const isAvailable = date.getDay() !== 0

      availability.push({
        date: date.toISOString().split('T')[0],
        available: isAvailable,
        availableSlots: isAvailable ? Math.floor(Math.random() * 8) + 2 : 0,
      })
    }

    return availability
  }

  // Gerar slots de horário baseado na data selecionada
  const generateTimeSlots = (): TimeSlot[] => {
    // Se barbeiro específico foi selecionado, usar dados reais do banco
    if (formData.barbeiroId && formData.barbeiroId !== 'any' && availableTimeSlots.length > 0) {
      console.log('✅ Usando horários reais do banco:', availableTimeSlots.length)
      return availableTimeSlots
    }

    // Fallback para quando barbeiro não foi selecionado ou dados não carregaram
    if (!selectedDate || !formData.serviceId) return []

    console.log('⚠️ Usando horários de fallback (barbeiro não selecionado)')

    // Obter dia da semana (0 = domingo, 1 = segunda, etc.)
    const diaSemana = selectedDate.getDay()

    // Buscar horário específico para este dia
    const horarioEspecifico = getHorarioPorDia(diaSemana)

    // Se o dia está inativo, retornar array vazio
    if (horarioEspecifico && !horarioEspecifico.ativo) {
      return []
    }

    // Gerar slots básicos de fallback
    const slots: TimeSlot[] = []
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          available: true,
          label: 'Selecione um barbeiro para ver disponibilidade real',
        })
      }
    }

    return slots
  }

  // Navegação entre etapas
  const goToNextStep = () => {
    const steps: FormStep[] = ['service', 'barber', 'datetime', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    console.log('🔧 goToNextStep:', {
      currentStep,
      currentIndex,
      nextStep: steps[currentIndex + 1],
    })
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const steps: FormStep[] = ['service', 'barber', 'datetime', 'confirmation']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  // Handlers
  const handleServiceSelect = (serviceId: string) => {
    console.log('🔧 Serviço selecionado:', serviceId)
    setFormData((prev) => ({ ...prev, serviceId }))
    goToNextStep()
  }

  const handleBarberSelect = (barbeiroId: string) => {
    console.log('🔧 Barbeiro selecionado:', barbeiroId)
    setFormData((prev) => ({
      ...prev,
      barbeiroId,
      horario: '', // Limpar horário quando barbeiro mudar
    }))
    goToNextStep()
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setFormData((prev) => ({
      ...prev,
      horario: '', // Limpar horário quando data mudar
      data: date.toISOString().split('T')[0],
    }))
  }

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, horario: time }))
    goToNextStep()
  }

  const handleSubmit = async () => {
    if (!selectedService || !formData.data || !formData.horario) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      // Verificar disponibilidade antes de criar
      const selectedService = services.find((s) => s.id === formData.serviceId)
      const serviceDuration = selectedService?.duracao_minutos || 30

      const isAvailable = await checkAvailability(
        formData.data,
        formData.horario,
        formData.barbeiroId === 'any' ? undefined : formData.barbeiroId,
        formData.serviceId,
        serviceDuration
      )

      if (!isAvailable) {
        setError('Este horário não está mais disponível. Por favor, escolha outro.')
        setCurrentStep('datetime')
        return
      }

      // Validar se barbeiro foi selecionado
      if (!formData.barbeiroId || formData.barbeiroId === 'any') {
        setError('Por favor, selecione um barbeiro específico.')
        setCurrentStep('barber')
        return
      }

      // Criar agendamento
      const appointment = await createAppointment({
        service_id: formData.serviceId,
        barbeiro_id: formData.barbeiroId,
        data_agendamento: `${formData.data}T${formData.horario}:00-03:00`, // Especifica fuso brasileiro
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

  // Renderizar etapa de seleção de serviço
  const renderServiceStep = () => (
    <div className="space-y-4">
      {servicesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {services.map((service) => (
            <div
              key={service.id}
              className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary-gold ${
                formData.serviceId === service.id
                  ? 'border-primary-gold bg-primary-gold/5'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
              onClick={() => {
                console.log('🔥 Card clicado!', service.id)
                handleServiceSelect(service.id)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{service.nome}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{service.duracao_minutos} min</span>
                    </div>
                    <span className="text-xs">Profissional</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-gold">
                    {formatarMoeda(service.preco)}
                  </div>
                  <div className="text-xs text-gray-400">à vista</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Renderizar etapa de seleção de barbeiro
  const renderBarberStep = () => (
    <div className="space-y-4">
      {funcionariosLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {/* Verificar se há barbeiros além da opção "qualquer" */}
          {barbeiros.length <= 1 ? (
            <div className="py-8 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-white">
                {funcionariosError ? 'Erro ao carregar barbeiros' : 'Nenhum barbeiro disponível'}
              </h3>
              <p className="mb-4 text-gray-400">
                {funcionariosError
                  ? 'Houve um problema ao carregar a lista de barbeiros.'
                  : 'No momento não há barbeiros disponíveis para agendamento.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={refetchFuncionarios}
                  disabled={funcionariosLoading}
                  className="rounded-lg bg-primary-gold px-4 py-2 text-black transition-colors hover:bg-primary-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {funcionariosLoading ? 'Carregando...' : 'Tentar novamente'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {barbeiros.map((barbeiro) => (
                <div
                  key={barbeiro.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary-gold ${
                    formData.barbeiroId === barbeiro.id
                      ? 'border-primary-gold bg-primary-gold/5'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                  onClick={() => {
                    console.log('🔥 Barbeiro clicado!', barbeiro.id)
                    handleBarberSelect(barbeiro.id)
                  }}
                >
                  <div className="flex items-center gap-3">
                    {barbeiro.id !== 'any' && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700">
                        {barbeiro.foto ? (
                          <img
                            src={barbeiro.foto}
                            alt={barbeiro.nome}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{barbeiro.nome}</h3>
                      {barbeiro.avaliacao && barbeiro.avaliacao > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-sm text-yellow-500">★</span>
                          <span className="text-sm text-gray-400">
                            {barbeiro.avaliacao.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Renderizar etapa de seleção de data e horário
  const renderDateTimeStep = () => (
    <div className="space-y-6">
      {/* Resumo do agendamento até agora */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-gold/20">
            <Check className="h-4 w-4 text-primary-gold" />
          </div>
          <h3 className="font-semibold text-white">Resumo do Agendamento</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Serviço:</span>
            <p className="font-medium text-white">{selectedService?.nome}</p>
          </div>
          <div>
            <span className="text-gray-400">Barbeiro:</span>
            <p className="font-medium text-white">{selectedBarber?.nome}</p>
          </div>
          <div>
            <span className="text-gray-400">Duração:</span>
            <p className="font-medium text-white">{selectedService?.duracao_minutos} min</p>
          </div>
          <div>
            <span className="text-gray-400">Preço:</span>
            <p className="font-bold text-primary-gold">
              {selectedService ? formatarMoeda(selectedService.preco) : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Seleção de Data */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Escolha a Data</h3>
          {selectedDate && (
            <span className="text-sm text-primary-gold">
              {selectedDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          )}
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <DatePicker
            value={selectedDate}
            onChange={handleDateSelect}
            availability={generateDateAvailability()}
            showAvailabilityIndicator
            minDate={new Date()}
            placeholder="Escolha uma data"
          />
        </div>
      </div>

      {/* Seleção de Horário */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Escolha o Horário</h3>
            {formData.horario && (
              <span className="text-sm text-primary-gold">
                {formData.horario} -{' '}
                {(() => {
                  const [hours, minutes] = formData.horario.split(':').map(Number)
                  const endTime = new Date()
                  endTime.setHours(hours, minutes + (selectedService?.duracao_minutos || 30))
                  return endTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                })()}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            {/* Indicador de loading para horários */}
            {timeSlotsLoading && formData.barbeiroId && formData.barbeiroId !== 'any' && (
              <div className="mb-4 flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-gold"></div>
                <span className="ml-2 text-sm text-gray-400">
                  Carregando horários disponíveis...
                </span>
              </div>
            )}

            {/* Aviso quando barbeiro não foi selecionado */}
            {(!formData.barbeiroId || formData.barbeiroId === 'any') && (
              <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-3">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                  <div className="text-xs">
                    <p className="font-medium text-yellow-300">Selecione um Barbeiro</p>
                    <p className="text-yellow-200/80">
                      Para ver horários disponíveis em tempo real, selecione um barbeiro específico
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Erro ao carregar horários */}
            {timeSlotsError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3">
                <div className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <div className="text-xs">
                    <p className="font-medium text-red-300">Erro ao Carregar Horários</p>
                    <p className="text-red-200/80">
                      Usando horários padrão. Disponibilidade será verificada ao confirmar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <TimePicker
              value={formData.horario}
              onChange={handleTimeSelect}
              timeSlots={generateTimeSlots()}
              showAvailabilityCount
              placeholder="Escolha um horário"
              disabled={timeSlotsLoading}
            />
          </div>

          {/* Dicas e informações */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Dica de pontualidade */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-3">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <div className="text-xs">
                  <p className="font-medium text-blue-300">Pontualidade</p>
                  <p className="text-blue-200/80">Chegue 5 min antes</p>
                </div>
              </div>
            </div>

            {/* Informação sobre duração */}
            <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-3">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <div className="text-xs">
                  <p className="font-medium text-green-300">Duração</p>
                  <p className="text-green-200/80">{selectedService?.duracao_minutos} minutos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horários mais procurados */}
          {!formData.horario && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-3">
              <div className="flex items-start gap-2">
                <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-300">Horários Populares</p>
                  <p className="text-yellow-200/80">9h-11h e 14h-16h são os mais procurados</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Renderizar etapa de confirmação
  const renderConfirmationStep = () => (
    <div className="space-y-4">
      {/* Resumo do agendamento */}
      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50">
        <div className="border-b border-primary-gold/20 bg-primary-gold/10 p-3">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Scissors className="h-4 w-4 text-primary-gold" />
            Resumo do Agendamento
          </h3>
        </div>

        <div className="space-y-4 p-4">
          {/* Serviço */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
              <DollarSign className="h-5 w-5 text-primary-gold" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">{selectedService?.nome}</h4>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedService?.duracao_minutos} min
                </span>
                <span className="font-semibold text-primary-gold">
                  {formatarMoeda(selectedService?.preco || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Barbeiro */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
              <User className="h-5 w-5 text-primary-gold" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">{selectedBarber?.nome}</h4>
              {selectedBarber?.avaliacao && selectedBarber.avaliacao > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Star className="h-3 w-3 fill-current text-yellow-400" />
                  <span>{selectedBarber.avaliacao.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
                <Calendar className="h-4 w-4 text-primary-gold" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-white">Data</h5>
                <p className="text-xs text-gray-400">
                  {selectedDate?.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-gold/20">
                <Clock className="h-4 w-4 text-primary-gold" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-white">Horário</h5>
                <p className="text-xs text-gray-400">{formData.horario}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Observações (opcional)</label>
        <Textarea
          value={formData.observacoes}
          onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Alguma observação especial para o barbeiro..."
          rows={2}
          className="border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 focus:border-primary-gold focus:ring-primary-gold/20"
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-300">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-medium">Erro no agendamento</p>
            <p className="text-red-200/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  )

  // Verificar se pode avançar para próxima etapa
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

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="min-h-[600px] rounded-lg bg-gray-900">
        {/* Header com indicador de progresso */}
        <div className="border-b border-gray-700/50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-gold/20">
                <Scissors className="h-5 w-5 text-primary-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Novo Agendamento</h1>
                <p className="text-sm text-gray-400">StylloBarber</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Indicador de progresso moderno */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progresso</span>
              <span className="font-medium text-primary-gold">
                {(['service', 'barber', 'datetime', 'confirmation'] as FormStep[]).indexOf(
                  currentStep
                ) + 1}{' '}
                de 4
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(['service', 'barber', 'datetime', 'confirmation'] as FormStep[]).map(
                (step, index) => {
                  const isActive = step === currentStep
                  const isCompleted =
                    ['service', 'barber', 'datetime', 'confirmation'].indexOf(currentStep) > index
                  const StepIcon = stepIcons[step]

                  return (
                    <React.Fragment key={step}>
                      <motion.div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
                          isActive && 'bg-primary-gold text-black shadow-lg shadow-primary-gold/30',
                          isCompleted && 'bg-green-500 text-white',
                          !isActive && !isCompleted && 'bg-gray-700 text-gray-400'
                        )}
                        whileScale={isActive ? 1.1 : 1}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </motion.div>

                      {index < 3 && (
                        <div
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-500',
                            isCompleted ? 'bg-green-500' : 'bg-gray-700'
                          )}
                        />
                      )}
                    </React.Fragment>
                  )
                }
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 max-h-[500px] flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {currentStep === 'service' && renderServiceStep()}
              {currentStep === 'barber' && renderBarberStep()}
              {currentStep === 'datetime' && renderDateTimeStep()}
              {currentStep === 'confirmation' && renderConfirmationStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer com botões */}
        <div className="relative z-10 border-t border-gray-700/50 bg-gray-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 'service' ? onClose : goToPreviousStep}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 'service' ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep === 'confirmation' ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                loading={loading}
                className="bg-primary-gold px-8 font-semibold text-black hover:bg-primary-gold-dark"
              >
                Confirmar Agendamento
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={goToNextStep}
                disabled={!canProceed()}
                className="bg-primary-gold px-8 font-semibold text-black hover:bg-primary-gold-dark"
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </SimpleModal>
  )
}

export default NovoAgendamentoModal
