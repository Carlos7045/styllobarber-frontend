'use client'

import type { Metadata } from 'next'
import { useAuth } from '@/contexts/AuthContext'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Calendar, Clock, User, Plus, Scissors, MapPin } from 'lucide-react'

export default function AgendamentosPage() {
  const { profile } = useAuth()

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
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-primary-gold mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-text-muted mb-4">
                Que tal agendar seu próximo corte?
              </p>
              <Button className="bg-primary-gold hover:bg-primary-gold-dark">
                <Plus className="h-4 w-4 mr-2" />
                Agendar Agora
              </Button>
            </div>
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
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">
                Seu histórico de agendamentos aparecerá aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}