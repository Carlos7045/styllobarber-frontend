
'use client'
/**
 * Componente para configurações de privacidade
 */


import { useState, useEffect } from 'react'
import { Shield, Eye, Users, BarChart3, Share2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useSettings } from '@/hooks/use-settings'
import type { PrivacySettings } from '@/types/settings'

interface PrivacyToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function PrivacyToggle({ label, description, checked, onChange, disabled }: PrivacyToggleProps) {
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

interface PrivacySelectProps {
  label: string
  description?: string
  value: string
  options: { value: string; label: string; description?: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}

function PrivacySelect({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
}: PrivacySelectProps) {
  return (
    <div className="py-3">
      <div className="mb-3">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              value === option.value
                ? 'border-primary-gold bg-primary-gold/5'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="mt-0.5 text-primary-gold focus:ring-primary-gold"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{option.label}</div>
              {option.description && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export function PrivacySettings() {
  const { settings, updatePrivacySettings, loading } = useSettings()
  const [localSettings, setLocalSettings] = useState<PrivacySettings | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Sincronizar com as configurações carregadas
  useEffect(() => {
    if (settings?.privacy) {
      setLocalSettings(settings.privacy)
    }
  }, [settings])

  // Verificar se há mudanças
  useEffect(() => {
    if (settings?.privacy && localSettings) {
      const hasChanges = JSON.stringify(settings.privacy) !== JSON.stringify(localSettings)
      setHasChanges(hasChanges)
    }
  }, [settings?.privacy, localSettings])

  const updateLocalSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (!localSettings) return

    setLocalSettings((prev) => ({
      ...prev!,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    if (!localSettings) return

    setSaving(true)
    try {
      const success = await updatePrivacySettings(localSettings)
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
    if (settings?.privacy) {
      setLocalSettings(settings.privacy)
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

  const profileVisibilityOptions = [
    {
      value: 'public',
      label: 'Público',
      description: 'Seu perfil pode ser visto por qualquer pessoa',
    },
    {
      value: 'contacts',
      label: 'Apenas contatos',
      description: 'Apenas pessoas em sua lista de contatos podem ver seu perfil',
    },
    {
      value: 'private',
      label: 'Privado',
      description: 'Seu perfil não é visível para outras pessoas',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          Configurações de Privacidade
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

        {/* Visibilidade do Perfil */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Eye className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Visibilidade do Perfil</h3>
          </div>

          <PrivacySelect
            label="Quem pode ver seu perfil"
            description="Controle quem pode visualizar suas informações de perfil"
            value={localSettings.profileVisibility}
            options={profileVisibilityOptions}
            onChange={(value) => updateLocalSetting('profileVisibility', value as any)}
          />
        </div>

        {/* Status Online */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Status de Presença</h3>
          </div>

          <PrivacyToggle
            label="Mostrar quando estou online"
            description="Permitir que outros vejam quando você está ativo no sistema"
            checked={localSettings.showOnlineStatus}
            onChange={(checked) => updateLocalSetting('showOnlineStatus', checked)}
          />
        </div>

        {/* Dados e Analytics */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Dados e Analytics</h3>
          </div>

          <PrivacyToggle
            label="Permitir coleta de dados de uso"
            description="Ajudar a melhorar o sistema compartilhando dados anônimos de uso"
            checked={localSettings.dataUsage}
            onChange={(checked) => updateLocalSetting('dataUsage', checked)}
          />

          <PrivacyToggle
            label="Permitir analytics"
            description="Permitir análise de comportamento para melhorar a experiência"
            checked={localSettings.analytics}
            onChange={(checked) => updateLocalSetting('analytics', checked)}
          />
        </div>

        {/* Compartilhamento */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Share2 className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Compartilhamento de Dados</h3>
          </div>

          <PrivacyToggle
            label="Compartilhar dados com parceiros"
            description="Permitir compartilhamento de dados com parceiros confiáveis para melhorar serviços"
            checked={localSettings.shareData}
            onChange={(checked) => updateLocalSetting('shareData', checked)}
          />
        </div>

        {/* Aviso sobre LGPD */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <p className="mb-1 font-medium text-blue-800 dark:text-blue-300">
                Seus dados estão protegidos
              </p>
              <p className="text-blue-700 dark:text-blue-400">
                Seguimos rigorosamente a Lei Geral de Proteção de Dados (LGPD). Você pode solicitar
                a exportação ou exclusão dos seus dados a qualquer momento.
              </p>
            </div>
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
