'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, Mail, MessageSquare, Bell, RefreshCw, AlertTriangle } from 'lucide-react'

import { useAdminNotificacoes } from '@/hooks/use-admin-notificacoes'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

import type { NotificationSystemConfig } from '@/types/notifications'

export function NotificationSettings() {
  const {
    settings,
    loading,
    updateSetting,
    getSystemConfig,
    loadSettings
  } = useAdminNotificacoes()

  // Estados locais
  const [config, setConfig] = useState<NotificationSystemConfig>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    retry_attempts: 3,
    retry_delay_minutes: 5,
    lembrete_horas_antes: 24,
    email_from: 'StylloBarber <noreply@styllobarber.com>',
    telefone_barbearia: '+55 11 99999-9999'
  })

  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar configurações
  useEffect(() => {
    const systemConfig = getSystemConfig()
    setConfig(systemConfig)
  }, [settings, getSystemConfig])

  // Detectar mudanças
  useEffect(() => {
    const originalConfig = getSystemConfig()
    const hasChanged = JSON.stringify(config) !== JSON.stringify(originalConfig)
    setHasChanges(hasChanged)
  }, [config, getSystemConfig])

  // Atualizar configuração local
  const updateConfig = (key: keyof NotificationSystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // Salvar todas as configurações
  const handleSaveAll = async () => {
    try {
      setSaving(true)
      
      // Salvar cada configuração
      const promises = Object.entries(config).map(([key, value]) => 
        updateSetting(key, value)
      )
      
      await Promise.all(promises)
      setHasChanges(false)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    } finally {
      setSaving(false)
    }
  }

  // Resetar configurações
  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      const originalConfig = getSystemConfig()
      setConfig(originalConfig)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Configurações de Notificação
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure como as notificações são enviadas e processadas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Resetar
              </Button>
              <Button onClick={handleSaveAll} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Tudo
              </Button>
            </>
          )}
        </div>
      </div>

      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-400">
                Você tem alterações não salvas. Clique em "Salvar Tudo" para aplicar as mudanças.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Configurações de Canais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Canais de Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notificações por email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.email_enabled}
                    onChange={(e) => updateConfig('email_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-gold/20 dark:peer-focus:ring-primary-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-gold"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notificações por SMS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sms_enabled}
                    onChange={(e) => updateConfig('sms_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-gold/20 dark:peer-focus:ring-primary-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-gold"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Push</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notificações push</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.push_enabled}
                    onChange={(e) => updateConfig('push_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-gold/20 dark:peer-focus:ring-primary-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-gold"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Retry */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Retry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número máximo de tentativas
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.retry_attempts}
                  onChange={(e) => updateConfig('retry_attempts', parseInt(e.target.value) || 3)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quantas vezes tentar reenviar uma notificação que falhou
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delay entre tentativas (minutos)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={config.retry_delay_minutes}
                  onChange={(e) => updateConfig('retry_delay_minutes', parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tempo de espera entre tentativas de reenvio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Lembrete */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Lembrete</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enviar lembrete (horas antes)
              </label>
              <Input
                type="number"
                min="1"
                max="168"
                value={config.lembrete_horas_antes}
                onChange={(e) => updateConfig('lembrete_horas_antes', parseInt(e.target.value) || 24)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Quantas horas antes do agendamento enviar o lembrete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email remetente
              </label>
              <Input
                type="email"
                value={config.email_from}
                onChange={(e) => updateConfig('email_from', e.target.value)}
                placeholder="StylloBarber <noreply@styllobarber.com>"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email que aparecerá como remetente das notificações
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Barbearia */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Barbearia</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone da barbearia
              </label>
              <Input
                type="tel"
                value={config.telefone_barbearia}
                onChange={(e) => updateConfig('telefone_barbearia', e.target.value)}
                placeholder="+55 11 99999-9999"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Telefone que aparecerá nas notificações para contato
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}