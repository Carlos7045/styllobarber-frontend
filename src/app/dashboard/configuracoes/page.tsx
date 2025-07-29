import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Configurações - StylloBarber',
  description: 'Configure suas preferências e configurações do sistema',
}

/**
 * Página de configurações do sistema
 * Permite ajustar preferências e configurações
 */
export default function ConfiguracoesPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Moderno */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
              <Settings className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Configurações
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Gerencie suas preferências e configurações do sistema
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configurações de Conta */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Gerencie suas informações de conta e preferências pessoais
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Alterar senha</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Verificação em duas etapas</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Sessões ativas</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Configure como e quando receber notificações
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Email</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Push</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">SMS</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-red-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Controle suas configurações de privacidade e dados
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Visibilidade do perfil</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Dados de uso</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Exportar dados</span>
                  <span className="text-xs text-text-muted">Em breve</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-muted mb-4">
                Personalize a aparência da interface
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Tema</span>
                  <span className="text-xs text-text-muted">Claro</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Idioma</span>
                  <span className="text-xs text-text-muted">Português (BR)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Densidade</span>
                  <span className="text-xs text-text-muted">Padrão</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aviso */}
        <Card className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">
                <strong>Em desenvolvimento:</strong> Estas configurações estão sendo implementadas e estarão disponíveis em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}