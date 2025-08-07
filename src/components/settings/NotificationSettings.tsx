
'use client'
/**
 * Componente para configurações de notificação
 */


import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useSettings } from '@/hooks/use-settings'
import type { NotificationSettings } from '@/types/settings'

interface NotificationToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-gold focus:ring-offset-2 ${
          checked ? 'bg-primary-gold' : 'bg-gray-200 dark:bg-gray-700'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export function NotificationSettings() {
  const { settings, updateNotificationSettings, loading } = useSettings()
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Sincronizar com as configurações carregadas
  useEffect(() => {
    if (settings?.notifications) {
      setLocalSettings(settings.notifications)
    }
  }, [settings])

  // Verificar se há mudanças
  useEffect(() => {
    if (settings?.notifications && localSettings) {
      const hasChanges = JSON.stringify(settings.notifications) !== JSON.stringify(localSettings)
      setHasChanges(hasChanges)
    }
  }, [settings?.notifications, localSettings])

  const updateLocalSetting = (
    category: keyof NotificationSettings,
    key: string,
    value: boolean
  ) => {
    if (!localSettings) return

    setLocalSettings((prev) => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!localSettings) return

    setSaving(true)
    try {
      const success = await updateNotificationSettings(localSettings)
      if (success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (settings?.notifications) {
      setLocalSettings(settings.notifications)
    }
  }

  if (loading || !localSettings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <Bell className="h-5 w-5 text-green-600" />
          </div>
          Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Configurações salvas com sucesso!</span>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Email</h3>
          </div>

          <NotificationToggle
            label="Ativar notificações por email"
            description="Receber notificações gerais por email"
            checked={localSettings.email.enabled}
            onChange={(checked) => updateLocalSetting('email', 'enabled', checked)}
          />

          <div className="ml-4 space-y-2 opacity-75">
            <NotificationToggle
              label="Agendamentos"
              description="Novos agendamentos e alterações"
              checked={localSettings.email.appointments}
              onChange={(checked) => updateLocalSetting('email', 'appointments', checked)}
              disabled={!localSettings.email.enabled}
            />
            <NotificationToggle
              label="Lembretes"
              description="Lembretes de agendamentos próximos"
              checked={localSettings.email.reminders}
              onChange={(checked) => updateLocalSetting('email', 'reminders', checked)}
              disabled={!localSettings.email.enabled}
            />
            <NotificationToggle
              label="Marketing"
              description="Promoções e novidades"
              checked={localSettings.email.marketing}
              onChange={(checked) => updateLocalSetting('email', 'marketing', checked)}
              disabled={!localSettings.email.enabled}
            />
            <NotificationToggle
              label="Sistema"
              description="Atualizações e manutenções"
              checked={localSettings.email.system}
              onChange={(checked) => updateLocalSetting('email', 'system', checked)}
              disabled={!localSettings.email.enabled}
            />
          </div>
        </div>

        {/* Push */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Smartphone className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Push (Navegador)</h3>
          </div>

          <NotificationToggle
            label="Ativar notificações push"
            description="Receber notificações no navegador"
            checked={localSettings.push.enabled}
            onChange={(checked) => updateLocalSetting('push', 'enabled', checked)}
          />

          <div className="ml-4 space-y-2 opacity-75">
            <NotificationToggle
              label="Agendamentos"
              description="Novos agendamentos e alterações"
              checked={localSettings.push.appointments}
              onChange={(checked) => updateLocalSetting('push', 'appointments', checked)}
              disabled={!localSettings.push.enabled}
            />
            <NotificationToggle
              label="Lembretes"
              description="Lembretes de agendamentos próximos"
              checked={localSettings.push.reminders}
              onChange={(checked) => updateLocalSetting('push', 'reminders', checked)}
              disabled={!localSettings.push.enabled}
            />
            <NotificationToggle
              label="Sistema"
              description="Atualizações importantes"
              checked={localSettings.push.system}
              onChange={(checked) => updateLocalSetting('push', 'system', checked)}
              disabled={!localSettings.push.enabled}
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">WhatsApp</h3>
          </div>

          <NotificationToggle
            label="Ativar notificações por WhatsApp"
            description="Receber notificações via WhatsApp"
            checked={localSettings.whatsapp.enabled}
            onChange={(checked) => updateLocalSetting('whatsapp', 'enabled', checked)}
          />

          <div className="ml-4 space-y-2 opacity-75">
            <NotificationToggle
              label="Agendamentos"
              description="Novos agendamentos e alterações"
              checked={localSettings.whatsapp.appointments}
              onChange={(checked) => updateLocalSetting('whatsapp', 'appointments', checked)}
              disabled={!localSettings.whatsapp.enabled}
            />
            <NotificationToggle
              label="Lembretes"
              description="Lembretes de agendamentos próximos"
              checked={localSettings.whatsapp.reminders}
              onChange={(checked) => updateLocalSetting('whatsapp', 'reminders', checked)}
              disabled={!localSettings.whatsapp.enabled}
            />
            <NotificationToggle
              label="Confirmações"
              description="Confirmações de agendamentos"
              checked={localSettings.whatsapp.confirmations}
              onChange={(checked) => updateLocalSetting('whatsapp', 'confirmations', checked)}
              disabled={!localSettings.whatsapp.enabled}
            />
            <NotificationToggle
              label="Marketing"
              description="Promoções e novidades"
              checked={localSettings.whatsapp.marketing}
              onChange={(checked) => updateLocalSetting('whatsapp', 'marketing', checked)}
              disabled={!localSettings.whatsapp.enabled}
            />
          </div>
        </div>

        {/* SMS */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">SMS</h3>
          </div>

          <NotificationToggle
            label="Ativar notificações por SMS"
            description="Receber notificações via SMS"
            checked={localSettings.sms.enabled}
            onChange={(checked) => updateLocalSetting('sms', 'enabled', checked)}
          />

          <div className="ml-4 space-y-2 opacity-75">
            <NotificationToggle
              label="Agendamentos"
              description="Novos agendamentos e alterações"
              checked={localSettings.sms.appointments}
              onChange={(checked) => updateLocalSetting('sms', 'appointments', checked)}
              disabled={!localSettings.sms.enabled}
            />
            <NotificationToggle
              label="Lembretes"
              description="Lembretes de agendamentos próximos"
              checked={localSettings.sms.reminders}
              onChange={(checked) => updateLocalSetting('sms', 'reminders', checked)}
              disabled={!localSettings.sms.enabled}
            />
          </div>
        </div>

        {/* Botões de ação */}
        {hasChanges && (
          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
