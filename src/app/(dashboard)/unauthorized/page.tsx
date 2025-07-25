'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, AlertTriangle, ArrowLeft, Home } from 'lucide-react'

import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'

// Metadados movidos para layout ou removidos pois é client component

// Página de acesso não autorizado
export default function UnauthorizedPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Card className="animate-fade-in-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-error" />
            </div>
            <CardTitle className="text-2xl text-error">
              Acesso Negado
            </CardTitle>
            <p className="text-text-muted">
              Você não tem permissão para acessar esta página
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informações sobre o erro */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h4 className="font-medium text-warning">
                  Permissão Insuficiente
                </h4>
              </div>
              <p className="text-sm text-text-muted">
                Sua conta não possui as permissões necessárias para acessar esta funcionalidade. 
                Entre em contato com o administrador se acredita que isso é um erro.
              </p>
            </div>

            {/* Possíveis causas */}
            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">
                Possíveis causas:
              </h4>
              <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                <li>Você não tem o nível de acesso necessário</li>
                <li>Sua conta pode estar com permissões limitadas</li>
                <li>A funcionalidade pode estar restrita ao seu perfil</li>
                <li>Pode haver um erro temporário no sistema</li>
              </ul>
            </div>

            {/* Ações disponíveis */}
            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">
                O que você pode fazer:
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <Link href="/dashboard">
                  <Button className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Página Anterior
                </Button>
              </div>
            </div>

            {/* Informações de contato */}
            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <h4 className="font-medium text-info mb-2">
                Precisa de ajuda?
              </h4>
              <p className="text-sm text-text-muted">
                Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador do sistema ou com o suporte técnico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}