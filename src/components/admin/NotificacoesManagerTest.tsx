'use client'

import { useState } from 'react'
import { 
  Bell, 
  AlertTriangle,
  FileText,
  Plus
} from 'lucide-react'

import { useAdminNotificacoesSimple } from '@/hooks/use-admin-notificacoes-simple'
import { Button, Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface NotificacoesManagerTestProps {
  className?: string
}

export function NotificacoesManagerTest({ className }: NotificacoesManagerTestProps) {
  const {
    templates,
    templatesLoading,
    error,
    canManageNotifications
  } = useAdminNotificacoesSimple()

  // Verificar permissões
  if (!canManageNotifications) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Você não tem permissão para gerenciar notificações.
        </p>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Notificações (Teste)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Versão de teste do sistema de notificações
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="min-h-[400px]">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 dark:text-red-400">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Templates de Notificação</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
          
          {templatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sistema funcionando! Templates serão carregados do banco de dados.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </Card>
          ) : (
            <div>Templates carregados: {templates.length}</div>
          )}
        </div>
      </div>
    </div>
  )
}