'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useClientAppointments } from '@/hooks/use-client-appointments'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { NovoAgendamentoModal } from '@/components/client/NovoAgendamentoModal'
import { Calendar, Clock, Plus, Scissors, MapPin } from 'lucide-react'

export default function AgendamentosPage() {
  const { profile } = useAuth()
  const { upcomingAppointments, pastAppointments, loading } = useClientAppointments()

  // Estados para controlar modais
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = useState(false)
  const [isServicosOpen, setIsServicosOpen] = useState(false)
  const [isLocalizacaoOpen, setIsLocalizacaoOpen] = useState(false)

  const handleAgendamentoSuccess = (appointment: Record<string, unknown>) => {
    // console.log('Novo agendamento criado:', appointment)
    // Aqui você pode adicionar uma notificação de sucesso
  }

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Moderno */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <Calendar className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Olá, {profile?.nome?.split(' ')[0] || 'Cliente'}! 👋
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Gerencie seus agendamentos e mantenha-se sempre em dia com seu visual
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Ações rápidas para clientes */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setIsNovoAgendamentoOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-gold/10 p-2">
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
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setIsServicosOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
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
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setIsLocalizacaoOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-light-gray" />
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border-border-default rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-gold/10">
                          <Scissors className="h-6 w-6 text-primary-gold" />
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">
                            {appointment.service?.nome || 'Serviço'}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')} às{' '}
                            {appointment.horario_agendamento}
                          </p>
                          {appointment.barbeiro && (
                            <p className="text-sm text-text-muted">
                              Com {appointment.barbeiro.nome}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary-gold/10 px-2 py-1 text-xs text-primary-gold">
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
              <div className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-primary-gold" />
                <h3 className="mb-2 text-lg font-medium text-text-primary">
                  Nenhum agendamento encontrado
                </h3>
                <p className="mb-4 text-text-muted">Que tal agendar seu próximo corte?</p>
                <Button
                  className="bg-primary-gold hover:bg-primary-gold-dark"
                  onClick={() => setIsNovoAgendamentoOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
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
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border-border-default flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-light-gray">
                        <Scissors className="h-4 w-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.service?.nome || 'Serviço'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        appointment.status === 'concluido'
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-3 h-10 w-10 text-text-muted" />
                <p className="text-text-muted">Seu histórico de agendamentos aparecerá aqui</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Serviços</h2>
              <p className="mb-4 text-text-muted">
                Modal de serviços será implementado na próxima tarefa.
              </p>
              <Button onClick={() => setIsServicosOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}

        {/* TODO: Implementar LocalizacaoModal */}
        {isLocalizacaoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Localização</h2>
              <p className="mb-4 text-text-muted">
                Modal de localização será implementado na próxima tarefa.
              </p>
              <Button onClick={() => setIsLocalizacaoOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
