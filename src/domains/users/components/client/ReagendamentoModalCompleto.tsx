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
  CheckCircle,
  CreditCard,
  MapPin,
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
import { Textarea } from '@/shared/components/ui/textarea'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'
import { useAvailableTimes } from '@/domains/appointments/hooks/use-available-times'
import { cn, formatarMoeda } from '@/shared/utils'
import type { ClientAppointment } from '@/types/appointments'

interface ReagendamentoModalCompletoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment: ClientAppointment | null
}

interface Barbeiro {
  id: string
  nome: string
  especialidades: string[]
  avaliacao?: number
}

type Step = 'info' | 'date' | 'time' | 'barber' | 'payment' | 'confirm'

export const ReagendamentoModalCompleto: React.FC<ReagendamentoModalCompletoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  // Estados
  const [currentStep, setCurrentStep] = useState<Step>('info')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'advance' | 'local'>('local')

  // Estados para horários disponíveis
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([])
  const [timesLoading, setTimesLoading] = useState(false)

  // Hooks
  const { rescheduleAppointment } = useClientAppointments()
  const { funcionarios, loading: funcionariosLoading } = useFuncionariosPublicos()

  console.log('🔄 ReagendamentoModalCompleto renderizado:', { 
    isOpen, 
    appointment: !!appointment,
    currentStep,
    selectedDate,
    selectedTime,
    selectedBarberId
  })

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('info')
      setSelectedDate(null)
      setSelectedTime(null)
      setSelectedBarberId(appointment?.barbeiro?.id || null)
      setObservacoes('')
      setIsProcessing(false)
    }
  }, [isOpen, appointment])

  // Buscar horários quando data/barbeiro mudam
  useEffect(() => {
    if (selectedDate && selectedBarberId && currentStep === 'time') {
      const fetchTimes = async () => {
        setTimesLoading(true)
        try {
          console.log('🔍 Buscando horários disponíveis:', {
            date: selectedDate.toISOString().split('T')[0],
            barberId: selectedBarberId,
            serviceId: appointment?.service?.id
          })
          
          // Simular horários disponíveis por enquanto
          const mockTimes: TimeSlot[] = [
            { time: '09:00', available: true },
            { time: '09:30', available: true },
            { time: '10:00', available: true },
            { time: '10:30', available: false },
            { time: '11:00', available: true },
            { time: '11:30', available: true },
            { time: '14:00', available: true },
            { time: '14:30', available: true },
            { time: '15:00', available: true },
            { time: '15:30', available: false },
            { time: '16:00', available: true },
            { time: '16:30', available: true },
          ]
          
          // Simular delay de rede
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          setAvailableTimes(mockTimes)
          console.log('✅ Horários carregados:', mockTimes.length)
        } catch (error) {
          console.error('❌ Erro ao buscar horários:', error)
          setAvailableTimes([])
        } finally {
          setTimesLoading(false)
        }
      }
      
      fetchTimes()
    }
  }, [selectedDate, selectedBarberId, currentStep, appointment])

  // Preparar lista de barbeiros
  const barbeiros: Barbeiro[] = useMemo(() => {
    const barbeirosList: Barbeiro[] = []

    // Adicionar funcionários ativos
    if (funcionarios && funcionarios.length > 0) {
      funcionarios.forEach((func) => {
        if (func.profiles?.nome) {
          barbeirosList.push({
            id: func.id,
            nome: func.profiles.nome,
            especialidades: func.especialidades || ['Corte Masculino'],
            avaliacao: 4.8, // Mock rating
          })
        }
      })
    }

    // Adicionar opção "mesmo barbeiro" se existir
    if (appointment?.barbeiro && !barbeirosList.find(b => b.id === appointment.barbeiro?.id)) {
      barbeirosList.unshift({
        id: appointment.barbeiro.id,
        nome: `${appointment.barbeiro.nome} (Mesmo barbeiro)`,
        especialidades: ['Corte Masculino'],
        avaliacao: 5.0,
      })
    }

    return barbeirosList
  }, [funcionarios, appointment])

  if (!appointment) return null

  const handleNext = () => {
    switch (currentStep) {
      case 'info':
        setCurrentStep('date')
        break
      case 'date':
        if (selectedDate) setCurrentStep('time')
        break
      case 'time':
        if (selectedTime) setCurrentStep('barber')
        break
      case 'barber':
        if (selectedBarberId) setCurrentStep('payment')
        break
      case 'payment':
        setCurrentStep('confirm')
        break
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('info')
        break
      case 'time':
        setCurrentStep('date')
        break
      case 'barber':
        setCurrentStep('time')
        break
      case 'payment':
        setCurrentStep('barber')
        break
      case 'confirm':
        setCurrentStep('payment')
        break
    }
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedBarberId) return

    setIsProcessing(true)
    try {
      // Criar data no fuso horário brasileiro (UTC-3)
      const dateStr = selectedDate.toISOString().split('T')[0]
      const [hours, minutes] = selectedTime.split(':')
      
      // Criar data local e converter para ISO mantendo o fuso horário
      const localDate = new Date(selectedDate)
      localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const newDateTime = localDate.toISOString()
      
      console.log('🕐 Conversão de horário:', {
        selectedTime,
        dateStr,
        localDate: localDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        isoString: newDateTime
      })
      
      console.log('🔄 Reagendando:', {
        appointmentId: appointment.id,
        newDateTime,
        barberId: selectedBarberId,
        observacoes
      })

      const result = await rescheduleAppointment(appointment.id, newDateTime, observacoes)
      
      if (result?.success) {
        console.log('✅ Reagendamento realizado com sucesso!')
        onSuccess()
        onClose()
      } else {
        console.error('❌ Erro no reagendamento:', result?.error)
        alert(`Erro ao reagendar: ${result?.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Erro ao reagendar:', error)
      alert('Erro ao reagendar agendamento. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'info':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Reagendar Agendamento</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vamos reagendar seu agendamento de <strong>{appointment.service?.nome}</strong>
              </p>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Data atual: {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Horário atual: {new Date(appointment.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Barbeiro: {appointment.barbeiro?.nome || 'Não definido'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Você pode escolher uma nova data, horário e até mesmo trocar de barbeiro.
              </p>
            </div>
          </div>
        )

      case 'date':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Escolha a Nova Data</h3>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              placeholder="Selecione uma data"
              className="w-full"
            />
            {selectedDate && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Data selecionada: {selectedDate.toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )

      case 'time':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Escolha o Horário</h3>
            {timesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Carregando horários...</p>
              </div>
            ) : (
              <TimePicker
                value={selectedTime}
                onChange={setSelectedTime}
                availableTimes={availableTimes}
                className="w-full"
              />
            )}
            {selectedTime && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Horário selecionado: {selectedTime}
                </p>
              </div>
            )}
          </div>
        )

      case 'barber':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Escolha o Barbeiro</h3>
            {funcionariosLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Carregando barbeiros...</p>
              </div>
            ) : barbeiros.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {barbeiros.map((barbeiro) => (
                  <Card
                    key={barbeiro.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedBarberId === barbeiro.id
                        ? 'ring-2 ring-primary-gold bg-primary-gold/5'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => setSelectedBarberId(barbeiro.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{barbeiro.nome}</h4>
                          <p className="text-sm text-gray-600">
                            {barbeiro.especialidades.join(', ')}
                          </p>
                        </div>
                        {selectedBarberId === barbeiro.id && (
                          <Check className="h-5 w-5 text-primary-gold" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum barbeiro disponível</p>
              </div>
            )}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Forma de Pagamento</h3>
              <p className="text-gray-600">Como você gostaria de pagar pelo serviço?</p>
            </div>

            <div className="space-y-3">
              {/* Pagar Agora */}
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  paymentMethod === 'advance'
                    ? 'ring-2 ring-primary-gold bg-primary-gold/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => setPaymentMethod('advance')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Pagar Agora</h4>
                        <p className="text-sm text-gray-600">
                          Pagamento antecipado com desconto
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatarMoeda((appointment.service?.preco || 0) * 0.9)}
                      </div>
                      <div className="text-xs text-gray-500 line-through">
                        {formatarMoeda(appointment.service?.preco || 0)}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        10% desconto
                      </div>
                    </div>
                    {paymentMethod === 'advance' && (
                      <Check className="h-5 w-5 text-primary-gold ml-2" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pagar no Local */}
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  paymentMethod === 'local'
                    ? 'ring-2 ring-primary-gold bg-primary-gold/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => setPaymentMethod('local')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Pagar no Local</h4>
                        <p className="text-sm text-gray-600">
                          Pagamento após o serviço
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {formatarMoeda(appointment.service?.preco || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Valor integral
                      </div>
                    </div>
                    {paymentMethod === 'local' && (
                      <Check className="h-5 w-5 text-primary-gold ml-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métodos de Pagamento Disponíveis */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Métodos Aceitos
              </h4>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded">💳 Cartão</span>
                <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded">💰 Dinheiro</span>
                <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded">📱 PIX</span>
                <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded">💸 Débito</span>
              </div>
            </div>
          </div>
        )

      case 'confirm':
        const selectedBarber = barbeiros.find(b => b.id === selectedBarberId)
        const dataFormatada = selectedDate?.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Confirmar Reagendamento</h3>
              <p className="text-gray-600">Revise os detalhes do seu novo agendamento</p>
            </div>
            
            {/* Informações do Agendamento Atual */}
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendamento Atual (será cancelado)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="line-through text-red-600">
                      {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="line-through text-red-600">
                      {new Date(appointment.data_agendamento).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Novo Agendamento */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Serviço:</span>
                    <div className="text-right">
                      <div className="font-medium">{appointment.service?.nome}</div>
                      <div className="text-sm text-gray-500">
                        Duração: {appointment.service?.duracao || 30} min
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data:</span>
                    <div className="text-right">
                      <div className="font-medium text-green-700 dark:text-green-300">
                        {selectedDate?.toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {dataFormatada?.split(',')[0]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Horário:</span>
                    <div className="text-right">
                      <div className="font-medium text-green-700 dark:text-green-300 text-lg">
                        {selectedTime}
                      </div>
                      <div className="text-sm text-gray-500">
                        Término previsto: {
                          (() => {
                            const [hours, minutes] = selectedTime.split(':').map(Number)
                            const endTime = new Date()
                            endTime.setHours(hours, minutes + (appointment.service?.duracao || 30))
                            return endTime.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          })()
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Barbeiro:</span>
                    <div className="text-right">
                      <div className="font-medium">{selectedBarber?.nome}</div>
                      <div className="text-sm text-gray-500">
                        {selectedBarber?.especialidades.slice(0, 2).join(', ')}
                        {selectedBarber?.especialidades.length > 2 && '...'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Forma de Pagamento:</span>
                      <div className="text-right">
                        <div className="font-medium flex items-center">
                          {paymentMethod === 'advance' ? (
                            <>
                              <CreditCard className="h-4 w-4 mr-1 text-green-600" />
                              Pagar Agora
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                              Pagar no Local
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paymentMethod === 'advance' ? 'Com 10% desconto' : 'Após o serviço'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor:</span>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary-gold">
                          {paymentMethod === 'advance' 
                            ? formatarMoeda((appointment.service?.preco || 0) * 0.9)
                            : formatarMoeda(appointment.service?.preco || 0)
                          }
                        </div>
                        {paymentMethod === 'advance' && (
                          <div className="text-sm text-green-600 font-medium">
                            Economia: {formatarMoeda((appointment.service?.preco || 0) * 0.1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="block text-sm font-medium mb-2">
                Observações (opcional)
              </label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Alguma observação sobre o reagendamento..."
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'info': return 'Informações'
      case 'date': return 'Data'
      case 'time': return 'Horário'
      case 'barber': return 'Barbeiro'
      case 'payment': return 'Pagamento'
      case 'confirm': return 'Confirmação'
      default: return ''
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'info': return true
      case 'date': return !!selectedDate
      case 'time': return !!selectedTime
      case 'barber': return !!selectedBarberId
      case 'payment': return true // Sempre pode prosseguir (tem valor padrão)
      case 'confirm': return true
      default: return false
    }
  }

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} size="lg">
      <SimpleModalContent>
        <SimpleModalHeader>
          <div className="flex items-center justify-between">
            <SimpleModalTitle>
              Reagendamento - {getStepTitle()}
            </SimpleModalTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {['info', 'date', 'time', 'barber', 'confirm'].map((step, index) => (
              <div
                key={step}
                className={cn(
                  'h-2 flex-1 rounded-full',
                  ['info', 'date', 'time', 'barber', 'confirm'].indexOf(currentStep) >= index
                    ? 'bg-primary-gold'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            ))}
          </div>
        </SimpleModalHeader>

        <div className="p-6">
          {renderStepContent()}
        </div>

        <SimpleModalFooter>
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={currentStep === 'info' ? onClose : handleBack}
              disabled={isProcessing}
            >
              {currentStep === 'info' ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {currentStep === 'confirm' ? (
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="bg-primary-gold hover:bg-primary-gold-dark text-black"
              >
                {isProcessing ? 'Reagendando...' : 'Confirmar Reagendamento'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isProcessing}
                className="bg-primary-gold hover:bg-primary-gold-dark text-black"
              >
                Próximo
              </Button>
            )}
          </div>
        </SimpleModalFooter>
      </SimpleModalContent>
    </SimpleModal>
  )
}

export default ReagendamentoModalCompleto