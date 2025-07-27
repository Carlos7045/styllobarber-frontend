'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovoAgendamentoModal } from '../NovoAgendamentoModal'
import { Calendar, Clock, User, DollarSign } from 'lucide-react'

/**
 * Componente de demonstração do NovoAgendamentoModal
 * Mostra como usar o modal de agendamento em diferentes cenários
 */
export const NovoAgendamentoDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preSelectedService, setPreSelectedService] = useState<string>()
  const [lastAppointment, setLastAppointment] = useState<any>(null)

  const handleSuccess = (appointment: any) => {
    setLastAppointment(appointment)
    console.log('Agendamento criado:', appointment)
  }

  const openModalWithService = (serviceId: string) => {
    setPreSelectedService(serviceId)
    setIsModalOpen(true)
  }

  const openModalNormal = () => {
    setPreSelectedService(undefined)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        Demonstração do NovoAgendamentoModal
      </h1>

      {/* Seção de botões para abrir o modal */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Formas de Abrir o Modal</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agendamento Normal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Abre o modal começando pela seleção de serviço
              </p>
              <Button onClick={openModalNormal} className="w-full">
                Novo Agendamento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Com Serviço Pré-selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Abre o modal com um serviço já selecionado
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => openModalWithService('corte-masculino')} 
                  variant="outline"
                  className="w-full"
                >
                  Agendar Corte Masculino
                </Button>
                <Button 
                  onClick={() => openModalWithService('barba-completa')} 
                  variant="outline"
                  className="w-full"
                >
                  Agendar Barba Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funcionalidades do modal */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Funcionalidades Implementadas</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Fluxo Multi-etapas</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-gold text-primary-black flex items-center justify-center text-xs font-medium">1</div>
                Seleção de Serviço
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-gold text-primary-black flex items-center justify-center text-xs font-medium">2</div>
                Escolha do Barbeiro
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-gold text-primary-black flex items-center justify-center text-xs font-medium">3</div>
                Data e Horário
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-gold text-primary-black flex items-center justify-center text-xs font-medium">4</div>
                Confirmação
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Recursos Avançados</h3>
            <ul className="space-y-1 text-sm text-text-muted">
              <li>• Verificação de disponibilidade em tempo real</li>
              <li>• Indicadores visuais de progresso</li>
              <li>• Validação de formulário</li>
              <li>• Prevenção de conflitos de horário</li>
              <li>• Seleção opcional de barbeiro</li>
              <li>• Campo de observações</li>
              <li>• Navegação entre etapas</li>
              <li>• Estados de loading e erro</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Último agendamento criado */}
      {lastAppointment && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Último Agendamento Criado</h2>
          
          <Card className="bg-success/5 border-success/20">
            <CardHeader>
              <CardTitle className="text-lg text-success">
                Agendamento Confirmado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-success" />
                <span>Serviço: {lastAppointment.service_id}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-success" />
                <span>Barbeiro: {lastAppointment.barbeiro_id || 'Qualquer disponível'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-success" />
                <span>Data: {new Date(lastAppointment.data_agendamento).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-success" />
                <span>Horário: {lastAppointment.horario_agendamento}</span>
              </div>
              
              {lastAppointment.observacoes && (
                <div className="mt-3 p-3 bg-neutral-light-gray rounded-lg">
                  <p className="text-sm">
                    <strong>Observações:</strong> {lastAppointment.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações técnicas */}
      <div className="mt-12 p-6 bg-background-dark-secondary rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Detalhes Técnicos</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Componentes Utilizados</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Modal (componente base reutilizável)</li>
              <li>• DatePicker (com indicadores de disponibilidade)</li>
              <li>• TimePicker (com slots agrupados)</li>
              <li>• Cards responsivos para seleções</li>
              <li>• Formulário com validação</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Hooks Integrados</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• useServices (busca de serviços)</li>
              <li>• useClientAppointments (criação e validação)</li>
              <li>• useState (gerenciamento de estado local)</li>
              <li>• useEffect (efeitos colaterais)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <NovoAgendamentoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        preSelectedServiceId={preSelectedService}
      />
    </div>
  )
}

export default NovoAgendamentoDemo