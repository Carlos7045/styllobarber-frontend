'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

// Não podemos usar metadata em client components, então vamos remover por enquanto
// export const metadata: Metadata = {
//   title: 'Configurações - StylloBarber',
//   description: 'Configure suas preferências e configurações do sistema',
// }

/**
 * Página de configurações do sistema
 * Permite ajustar preferências e configurações
 */
export default function ConfiguracoesPage() {
  const router = useRouter()

  const handleNotificacoesClick = () => {
    router.push('/dashboard/admin/notificacoes')
  }

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Moderno */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <Settings className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Gerencie suas preferências e configurações do sistema
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Cards de configurações */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Configurações de Conta */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-text-muted">Gerencie suas informações de conta e segurança</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Alterar senha</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Verificação em duas etapas</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Sessões ativas</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card 
            className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite cursor-pointer"
            onClick={handleNotificacoesClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-text-muted">Configure templates, logs e configurações de notificações</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Templates de Email</span>
                  <span className="text-xs font-medium text-green-600">✓ Disponível</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Logs de Envio</span>
                  <span className="text-xs font-medium text-green-600">✓ Disponível</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Agendamento & SMS</span>
                  <span className="text-xs font-medium text-green-600">✓ Disponível</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-green-600 font-medium">
                  👆 Clique para acessar o sistema completo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-text-muted">
                Controle suas configurações de privacidade e dados
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Visibilidade do perfil</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Dados de uso</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Compartilhamento</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-text-muted">Personalize a aparência da interface</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Tema</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Idioma</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Densidade & Fonte</span>
                  <span className="text-xs font-medium text-yellow-600">Em desenvolvimento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aviso sobre desenvolvimento */}
        <Card className="mt-8 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:border-yellow-800/30 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
              <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">
                  <strong>Sistema de Configurações</strong>
                </p>
                <p className="text-sm">
                  As funcionalidades de configuração estão sendo desenvolvidas. A estrutura base foi
                  criada e será implementada gradualmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
