'use client'

import { Container } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui'
import { Bell, CheckCircle, XCircle, BarChart3, FileText } from 'lucide-react'
import { NotificacoesManager } from '@/domains/users/components/admin/NotificacoesManager'

/**
 * Página de gestão do sistema de notificações
 * Permite gerenciar templates, logs, configurações e estatísticas
 */
export default function NotificacoesPage() {

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <Bell className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Sistema de Notificações
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Gerencie templates, logs e configurações de notificações
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Enviadas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Falharam</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">0</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Templates</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Componente principal */}
        <NotificacoesManager />
      </div>
    </Container>
  )
}
