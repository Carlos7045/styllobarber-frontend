/**
 * Página de Configurações da Agenda para Barbeiros
 */

'use client'

import { Container } from '@/shared/components/layout'
import { RouteGuard } from '@/domains/auth/components'
import { BarberAutoConfirmSettings } from '@/domains/appointments/components/BarberAutoConfirmSettings'
import { BarberWorkingHoursSettings } from '@/domains/appointments/components/BarberWorkingHoursSettings'
import { Calendar, Settings, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

export default function AgendaConfiguracoes() {
  return (
    <RouteGuard requiredRoles={['barber', 'admin']}>
      <Container className="py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center space-x-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
                <Settings className="h-10 w-10 text-primary-black" />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  Configurações da Agenda
                </h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Personalize como sua agenda funciona
                </p>
              </div>
            </div>
            <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
          </div>

          {/* Grid de Configurações */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Configurações de Confirmação Automática */}
            <div className="lg:col-span-2">
              <BarberAutoConfirmSettings />
            </div>

            {/* Configurações de Horários de Funcionamento */}
            <div className="lg:col-span-2">
              <BarberWorkingHoursSettings />
            </div>

            {/* Card de Informações sobre Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Gestão de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gerencie como você interage com seus clientes e agendamentos.
                  </p>
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>Disponível:</strong> Visualize apenas clientes que agendaram com você
                      na seção "Meus Clientes".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Adicionais */}
          <Card className="border-primary-gold/20 bg-gradient-to-r from-primary-gold/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-gold" />
                Dicas para Otimizar sua Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Confirmação Automática
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Reduz tempo de gestão manual</li>
                    <li>• Melhora experiência do cliente</li>
                    <li>• Evita perda de agendamentos</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Confirmação Manual</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Maior controle sobre agenda</li>
                    <li>• Possibilidade de negociar horários</li>
                    <li>• Flexibilidade para casos especiais</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </RouteGuard>
  )
}
