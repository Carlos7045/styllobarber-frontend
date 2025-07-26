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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Configurações
          </h1>
          <p className="text-text-muted">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configurações de Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
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
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Settings className="h-5 w-5" />
              <p className="text-sm">
                <strong>Em desenvolvimento:</strong> Estas configurações estão sendo implementadas e estarão disponíveis em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}