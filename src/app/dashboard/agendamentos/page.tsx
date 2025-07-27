'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useClientAppointments } from '@/hooks/use-client-appointments'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { NovoAgendamentoModal } from '@/components/client/NovoAgendamentoModal'
import { Calendar, Clock, User, Plus, Scissors, MapPin } from 'lucide-react'

export default function AgendamentosPage() {
  const { profile } = useAuth()
  const { upcomingAppointments, pastAppointments, loading } = useClientAppointments()
  
  // Estados para controlar modais
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = useState(false)
  const [isServicosOpen, setIsServicosOpen] = useState(false)
  const [isLocalizacaoOpen, setIsLocalizacaoOpen] = useState(false)

  const handleAgendamentoSuccess = (appointment: any) => {
    console.log('Novo agendamento criado:', appointment)
    // Aqui você pode adicionar uma notificação de sucesso
  }

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header personalizado para cliente */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Olá, {profile?.nome?.split(' ')[0] || 'Cliente'}! 👋
          </h1>
          <p className="text-text-muted">
            Gerencie seus agendamentos e mantenha-se sempre em dia com seu visual
          </p>
        </div>

        {/* Ações rápidas para clientes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsNovoAgendamentoOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <Plus className="h-5 w-5 text-primary-gold" />
                </div>
                <div>
                  <h3 className="font-medium">Novo Agendamento</h3>
                  <p className="text-sm text-text-muted">Agende seu próximo corte</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsServicosOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Scissors className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Serviços</h3>
                  <p className="text-sm text-text-muted">Veja nossos serviços</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsLocalizacaoOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Localização</h3>
                  <p className="text-sm text-text-muted">Como chegar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos agendamentos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-gold" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-neutral-light-gray animate-pulse rounded-lg" />
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map(appointment => (
                  <div key={appointment.id} className="p-4 border border-border-default rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-gold/10 rounded-full flex items-center justify-center">
                          <Scissors className="h-6 w-6 text-primary-gold" />
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">
                            {appointment.service?.nome || 'Serviço'}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')} às {appointment.horario_agendamento}
                          </p>
                          {appointment.barbeiro && (
                            <p className="text-sm text-text-muted">
                              Com {appointment.barbeiro.nome}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-primary-gold/10 text-primary-gold">
                          {appointment.status}
                        </span>
                        {appointment.timeUntilAppointment && (
                          <span className="text-sm text-text-muted">
                            em {appointment.timeUntilAppointment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-primary-gold mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-text-muted mb-4">
                  Que tal agendar seu próximo corte?
                </p>
                <Button 
                  className="bg-primary-gold hover:bg-primary-gold-dark"
                  onClick={() => setIsNovoAgendamentoOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastAppointments.length > 0 ? (
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border border-border-default rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-light-gray rounded-full flex items-center justify-center">
                        <Scissors className="h-4 w-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{appointment.service?.nome || 'Serviço'}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'concluido' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-error/10 text-error'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">
                  Seu histórico de agendamentos aparecerá aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modais */}
        <NovoAgendamentoModal
          isOpen={isNovoAgendamentoOpen}
          onClose={() => setIsNovoAgendamentoOpen(false)}
          onSuccess={handleAgendamentoSuccess}
        />

        {/* TODO: Implementar ServicosModal */}
        {isServicosOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Serviços</h2>
              <p className="text-text-muted mb-4">Modal de serviços será implementado na próxima tarefa.</p>
              <Button onClick={() => setIsServicosOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}

        {/* TODO: Implementar LocalizacaoModal */}
        {isLocalizacaoOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Localização</h2>
              <p className="text-text-muted mb-4">Modal de localização será implementado na próxima tarefa.</p>
              <Button onClick={() => setIsLocalizacaoOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}