'use client'

import { Metadata } from 'next'
import { Settings, Users, Shield, Database, Bell, Palette } from 'lucide-react'

import { Container, Grid, Stack } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { RouteGuard, PermissionGate } from '@/components/auth'

// Página de Configurações (apenas para admins)
export default function ConfiguracoesPage() {
  return (
    <RouteGuard requiredRole="admin">
      <Container className="py-6">
        <Stack spacing="lg">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-primary-gold" />
              <h1 className="text-3xl font-heading font-bold text-text-primary">
                Configurações
              </h1>
              <Badge variant="warning">Apenas Admins</Badge>
            </div>
            <p className="text-text-muted">
              Gerencie as configurações do sistema e da barbearia
            </p>
          </div>

          {/* Configurações do Sistema */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-info" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={2} gap="md">
                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">
                    Backup Automático
                  </h4>
                  <p className="text-sm text-text-muted mb-3">
                    Configurar backup automático dos dados
                  </p>
                  <Badge variant="success">Ativo</Badge>
                </div>

                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">
                    Logs do Sistema
                  </h4>
                  <p className="text-sm text-text-muted mb-3">
                    Visualizar e gerenciar logs de atividade
                  </p>
                  <Badge variant="info">Monitorando</Badge>
                </div>
              </Grid>
            </CardContent>
          </Card>

          {/* Configurações de Usuários */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-warning" />
                Gerenciamento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Roles e Permissões
                    </h4>
                    <p className="text-sm text-text-muted">
                      Configurar permissões por tipo de usuário
                    </p>
                  </div>
                  <Badge variant="outline">3 Roles</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Usuários Ativos
                    </h4>
                    <p className="text-sm text-text-muted">
                      Gerenciar usuários do sistema
                    </p>
                  </div>
                  <Badge variant="success">24 Usuários</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Segurança */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-error" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={3} gap="md">
                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                  <h4 className="font-medium text-text-primary mb-1">
                    2FA
                  </h4>
                  <Badge variant="success">Ativo</Badge>
                </div>

                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <Bell className="h-8 w-8 text-warning mx-auto mb-2" />
                  <h4 className="font-medium text-text-primary mb-1">
                    Alertas
                  </h4>
                  <Badge variant="warning">Configurar</Badge>
                </div>

                <div className="p-4 bg-background-secondary rounded-lg text-center">
                  <Database className="h-8 w-8 text-info mx-auto mb-2" />
                  <h4 className="font-medium text-text-primary mb-1">
                    Auditoria
                  </h4>
                  <Badge variant="info">Ativo</Badge>
                </div>
              </Grid>
            </CardContent>
          </Card>

          {/* Demonstração de PermissionGate */}
          <PermissionGate 
            requiredRole="admin"
            fallback={
              <Card className="animate-fade-in-up">
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">
                    Conteúdo restrito para administradores
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card className="animate-fade-in-up border-primary-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary-gold" />
                  Configurações Avançadas
                  <Badge variant="outline-primary">Admin Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-gold/10 border border-primary-gold/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary-gold mb-2">
                    Área Restrita
                  </h4>
                  <p className="text-sm text-text-muted">
                    Este conteúdo só é visível para administradores. 
                    Aqui você pode configurar aspectos críticos do sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>
        </Stack>
      </Container>
    </RouteGuard>
  )
}