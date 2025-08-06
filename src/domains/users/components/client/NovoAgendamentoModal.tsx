'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, DollarSign, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle, SimpleModalFooter } from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui/button'
import { DatePicker, type DateAvailability } from '@/shared/components/ui/date-picker'
import { TimePicker, type TimeSlot } from '@/shared/components/ui/time-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

import { Textarea } from '@/shared/components/ui/textarea'
import { useServices } from '@/shared/hooks/data/use-services'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
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

// Dados mock para barbeiros (em produção viria do banco)
const mockBarbeiros: Barbeiro[] = [
    {
        id: 'any',
        nome: 'Qualquer barbeiro disponível',
        avaliacao: 0,
    },
    {
        id: '1',
        nome: 'João Silva',
        foto: '/avatars/joao.jpg',
        avaliacao: 4.8,
        especialidades: ['Corte masculino', 'Barba'],
    },
    {
        id: '2',
        nome: 'Pedro Santos',
        foto: '/avatars/pedro.jpg',
        avaliacao: 4.9,
        especialidades: ['Corte moderno', 'Degradê'],
    },
    {
        id: '3',
        nome: 'Carlos Oliveira',
        foto: '/avatars/carlos.jpg',
        avaliacao: 4.7,
        especialidades: ['Barba', 'Bigode'],
    },
]

// Etapas do formulário
type FormStep = 'service' | 'barber' | 'datetime' | 'confirmation'

const stepTitles = {
    service: 'Escolha o Serviço',
    barber: 'Escolha o Barbeiro',
    datetime: 'Escolha Data e Horário',
    confirmation: 'Confirmar Agendamento',
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

    // Dados derivados
    const selectedService = services.find(s => s.id === formData.serviceId)
    const selectedBarber = mockBarbeiros.find(b => b.id === formData.barbeiroId)

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
        if (!selectedDate) return []

        const slots: TimeSlot[] = []
        const startHour = 8
        const endHour = 18
        const interval = 30

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

                // Simular disponibilidade (alguns horários ocupados)
                const isAvailable = Math.random() > 0.3

                slots.push({
                    time: timeString,
                    available: isAvailable,
                })
            }
        }

        return slots
    }

    // Navegação entre etapas
    const goToNextStep = () => {
        const steps: FormStep[] = ['service', 'barber', 'datetime', 'confirmation']
        const currentIndex = steps.indexOf(currentStep)
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
        setFormData(prev => ({ ...prev, serviceId }))
        goToNextStep()
    }

    const handleBarberSelect = (barbeiroId: string) => {
        setFormData(prev => ({ ...prev, barbeiroId }))
        goToNextStep()
    }

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setFormData(prev => ({
            ...prev,
            data: date.toISOString().split('T')[0]
        }))
    }

    const handleTimeSelect = (time: string) => {
        setFormData(prev => ({ ...prev, horario: time }))
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
            const isAvailable = await checkAvailability(
                formData.data,
                formData.horario,
                formData.barbeiroId === 'any' ? undefined : formData.barbeiroId
            )

            if (!isAvailable) {
                setError('Este horário não está mais disponível. Por favor, escolha outro.')
                setCurrentStep('datetime')
                return
            }

            // Criar agendamento
            const appointment = await createAppointment({
                service_id: formData.serviceId,
                barbeiro_id: formData.barbeiroId === 'any' ? null : formData.barbeiroId,
                data_agendamento: formData.data,
                horario_agendamento: formData.horario,
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
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-neutral-light-gray animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {services.map(service => (
                        <Card
                            key={service.id}
                            className={cn(
                                'cursor-pointer transition-all hover:shadow-md',
                                formData.serviceId === service.id && 'ring-2 ring-primary-gold'
                            )}
                            onClick={() => handleServiceSelect(service.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{service.nome}</h3>
                                        <p className="text-text-muted text-sm mt-1">
                                            {service.descricao}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{service.duracao_minutos} min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-primary-gold">
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

    // Renderizar etapa de seleção de barbeiro
    const renderBarberStep = () => (
        <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockBarbeiros.map(barbeiro => (
                    <Card
                        key={barbeiro.id}
                        className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            formData.barbeiroId === barbeiro.id && 'ring-2 ring-primary-gold'
                        )}
                        onClick={() => handleBarberSelect(barbeiro.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                {barbeiro.id !== 'any' && (
                                    <div className="w-12 h-12 rounded-full bg-neutral-light-gray flex items-center justify-center">
                                        {barbeiro.foto ? (
                                            <img
                                                src={barbeiro.foto}
                                                alt={barbeiro.nome}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-6 w-6 text-text-muted" />
                                        )}
                                    </div>
                                )}

                                <div className="flex-1">
                                    <h3 className="font-semibold">{barbeiro.nome}</h3>
                                    {barbeiro.avaliacao && barbeiro.avaliacao > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-yellow-500">★</span>
                                            <span className="text-sm text-text-muted">
                                                {barbeiro.avaliacao.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                    {barbeiro.especialidades && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {barbeiro.especialidades.map(esp => (
                                                <span
                                                    key={esp}
                                                    className="px-2 py-1 bg-primary-gold/10 text-primary-gold text-xs rounded-full"
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
        </div>
    )

    // Renderizar etapa de seleção de data e horário
    const renderDateTimeStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium mb-3">Selecione a Data</h3>
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
                    <h3 className="font-medium mb-3">Selecione o Horário</h3>
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

    // Renderizar etapa de confirmação
    const renderConfirmationStep = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Resumo do Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary-gold" />
                        <div>
                            <div className="font-medium">{selectedService?.nome}</div>
                            <div className="text-sm text-text-muted">
                                {formatarMoeda(selectedService?.preco || 0)} • {selectedService?.duracao_minutos} min
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary-gold" />
                        <div>
                            <div className="font-medium">{selectedBarber?.nome}</div>
                            {selectedBarber?.avaliacao && selectedBarber.avaliacao > 0 && (
                                <div className="text-sm text-text-muted">
                                    ★ {selectedBarber.avaliacao.toFixed(1)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary-gold" />
                        <div>
                            <div className="font-medium">
                                {selectedDate?.toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary-gold" />
                        <div>
                            <div className="font-medium">{formData.horario}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Observações (opcional)
                </label>
                <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Alguma observação especial para o barbeiro..."
                    rows={3}
                />
            </div>

            {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                    {error}
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
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title={stepTitles[currentStep]}
            size="lg"
        >
            <SimpleModalHeader>

                {/* Indicador de progresso */}
                <div className="flex items-center gap-2 mt-4">
                    {(['service', 'barber', 'datetime', 'confirmation'] as FormStep[]).map((step, index) => {
                        const isActive = step === currentStep
                        const isCompleted = ['service', 'barber', 'datetime', 'confirmation'].indexOf(currentStep) > index

                        return (
                            <div
                                key={step}
                                className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                                    isActive && 'bg-primary-gold text-primary-black',
                                    isCompleted && 'bg-success text-white',
                                    !isActive && !isCompleted && 'bg-neutral-light-gray text-text-muted'
                                )}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                            </div>
                        )
                    })}
                </div>
            </SimpleModalHeader>

            <SimpleModalContent className="flex-1 overflow-y-auto">
                {currentStep === 'service' && renderServiceStep()}
                {currentStep === 'barber' && renderBarberStep()}
                {currentStep === 'datetime' && renderDateTimeStep()}
                {currentStep === 'confirmation' && renderConfirmationStep()}
            </SimpleModalContent>

            <SimpleModalFooter>
                <div className="flex justify-between w-full">
                    <Button
                        variant="outline"
                        onClick={currentStep === 'service' ? onClose : goToPreviousStep}
                        disabled={loading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        {currentStep === 'service' ? 'Cancelar' : 'Voltar'}
                    </Button>

                    {currentStep === 'confirmation' ? (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!canProceed() || loading}
                            loading={loading}
                        >
                            Confirmar Agendamento
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={goToNextStep}
                            disabled={!canProceed()}
                        >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </SimpleModalFooter>
        </SimpleModal>
    )
}

export default NovoAgendamentoModal
