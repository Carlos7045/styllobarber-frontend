/**
 * Componente para configurações de aparência
 */

'use client'

import { useState, useEffect } from 'react'
import { Palette, Sun, Moon, Monitor, Globe, Type, Zap, Check, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useSettings } from '@/hooks/use-settings'
import type { AppearanceSettings } from '@/types/settings'

interface AppearanceSelectProps {
  label: string
  description?: string
  value: string
  options: { value: string; label: string; description?: string; icon?: React.ReactNode }[]
  onChange: (value: string) => void
  disabled?: boolean
}

function AppearanceSelect({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
}: AppearanceSelectProps) {
  return (
    <div className="py-3">
      <div className="mb-3">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
              value === option.value
                ? 'border-primary-gold bg-primary-gold/5 ring-2 ring-primary-gold/20'
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
              className="sr-only"
            />
            {option.icon && (
              <div
                className={`rounded-lg p-2 ${
                  value === option.value
                    ? 'bg-primary-gold text-primary-black'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {option.icon}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{option.label}</div>
              {option.description && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              )}
            </div>
            {value === option.value && <Check className="h-4 w-4 text-primary-gold" />}
          </label>
        ))}
      </div>
    </div>
  )
}

interface AppearanceToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function AppearanceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: AppearanceToggleProps) {
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

export function AppearanceSettings() {
  const { settings, updateAppearanceSettings, loading } = useSettings()
  const [localSettings, setLocalSettings] = useState<AppearanceSettings | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Função para obter textos baseados no idioma
  const getLocalizedText = (ptText: string, enText: string) => {
    if (!localSettings) return ptText
    return localSettings.language === 'en-US' ? enText : ptText
  }

  // Sincronizar com as configurações carregadas
  useEffect(() => {
    if (settings?.appearance) {
      setLocalSettings(settings.appearance)
    }
  }, [settings])

  // Verificar se há mudanças
  useEffect(() => {
    if (settings?.appearance && localSettings) {
      const hasChanges = JSON.stringify(settings.appearance) !== JSON.stringify(localSettings)
      setHasChanges(hasChanges)
    }
  }, [settings?.appearance, localSettings])

  const updateLocalSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
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
      const success = await updateAppearanceSettings(localSettings)
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
    if (settings?.appearance) {
      setLocalSettings(settings.appearance)
    }
  }

  if (loading || !localSettings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const themeOptions = [
    {
      value: 'light',
      label: getLocalizedText('Claro', 'Light'),
      description: getLocalizedText(
        'Tema claro para ambientes bem iluminados',
        'Light theme for well-lit environments'
      ),
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: 'dark',
      label: getLocalizedText('Escuro', 'Dark'),
      description: getLocalizedText(
        'Tema escuro para reduzir cansaço visual',
        'Dark theme to reduce eye strain'
      ),
      icon: <Moon className="h-4 w-4" />,
    },
    {
      value: 'system',
      label: getLocalizedText('Sistema', 'System'),
      description: getLocalizedText(
        'Seguir configuração do sistema operacional',
        'Follow operating system setting'
      ),
      icon: <Monitor className="h-4 w-4" />,
    },
  ]

  const languageOptions = [
    {
      value: 'pt-BR',
      label: 'Português (Brasil)',
      description: getLocalizedText('Idioma padrão do sistema', 'System default language'),
      icon: <Globe className="h-4 w-4" />,
    },
    {
      value: 'en-US',
      label: 'English (US)',
      description: getLocalizedText('Suporte ao idioma inglês', 'English language support'),
      icon: <Globe className="h-4 w-4" />,
    },
  ]

  const densityOptions = [
    {
      value: 'compact',
      label: getLocalizedText('Compacto', 'Compact'),
      description: getLocalizedText(
        'Mais informações em menos espaço',
        'More information in less space'
      ),
      icon: <Type className="h-3 w-3" />,
    },
    {
      value: 'comfortable',
      label: getLocalizedText('Confortável', 'Comfortable'),
      description: getLocalizedText(
        'Equilíbrio entre espaço e informação',
        'Balance between space and information'
      ),
      icon: <Type className="h-4 w-4" />,
    },
    {
      value: 'spacious',
      label: getLocalizedText('Espaçoso', 'Spacious'),
      description: getLocalizedText('Mais espaço entre elementos', 'More space between elements'),
      icon: <Type className="h-5 w-5" />,
    },
  ]

  const fontSizeOptions = [
    {
      value: 'small',
      label: getLocalizedText('Pequeno', 'Small'),
      description: getLocalizedText(
        'Texto menor para mais conteúdo',
        'Smaller text for more content'
      ),
      icon: <Type className="h-3 w-3" />,
    },
    {
      value: 'medium',
      label: getLocalizedText('Médio', 'Medium'),
      description: getLocalizedText('Tamanho padrão recomendado', 'Recommended default size'),
      icon: <Type className="h-4 w-4" />,
    },
    {
      value: 'large',
      label: getLocalizedText('Grande', 'Large'),
      description: getLocalizedText(
        'Texto maior para melhor legibilidade',
        'Larger text for better readability'
      ),
      icon: <Type className="h-5 w-5" />,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
            <Palette className="h-5 w-5 text-purple-600" />
          </div>
          {getLocalizedText('Configurações de Aparência', 'Appearance Settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">
                {getLocalizedText(
                  'Configurações salvas com sucesso!',
                  'Settings saved successfully!'
                )}
              </span>
            </div>
          </div>
        )}

        {/* Tema */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Palette className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">{getLocalizedText('Tema', 'Theme')}</h3>
          </div>

          <AppearanceSelect
            label={getLocalizedText('Escolha o tema da interface', 'Choose interface theme')}
            description={getLocalizedText(
              'Selecione como a interface deve aparecer',
              'Select how the interface should appear'
            )}
            value={localSettings.theme}
            options={themeOptions}
            onChange={(value) => updateLocalSetting('theme', value as any)}
          />
        </div>

        {/* Idioma */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Globe className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">{getLocalizedText('Idioma', 'Language')}</h3>
          </div>

          <AppearanceSelect
            label={getLocalizedText('Idioma da interface', 'Interface language')}
            description={getLocalizedText(
              'Selecione o idioma preferido',
              'Select preferred language'
            )}
            value={localSettings.language}
            options={languageOptions}
            onChange={(value) => updateLocalSetting('language', value as any)}
          />
        </div>

        {/* Densidade */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Type className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">
              {getLocalizedText('Densidade da Interface', 'Interface Density')}
            </h3>
          </div>

          <AppearanceSelect
            label={getLocalizedText('Densidade dos elementos', 'Element density')}
            description={getLocalizedText(
              'Controle o espaçamento entre elementos da interface',
              'Control spacing between interface elements'
            )}
            value={localSettings.density}
            options={densityOptions}
            onChange={(value) => updateLocalSetting('density', value as any)}
          />
        </div>

        {/* Tamanho da Fonte */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Type className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">{getLocalizedText('Tamanho da Fonte', 'Font Size')}</h3>
          </div>

          <AppearanceSelect
            label={getLocalizedText('Tamanho do texto', 'Text size')}
            description={getLocalizedText(
              'Ajuste o tamanho da fonte para melhor legibilidade',
              'Adjust font size for better readability'
            )}
            value={localSettings.fontSize}
            options={fontSizeOptions}
            onChange={(value) => updateLocalSetting('fontSize', value as any)}
          />
        </div>

        {/* Animações */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">{getLocalizedText('Animações', 'Animations')}</h3>
          </div>

          <AppearanceToggle
            label={getLocalizedText('Ativar animações', 'Enable animations')}
            description={getLocalizedText(
              'Habilitar transições e animações na interface (pode afetar performance)',
              'Enable transitions and animations in the interface (may affect performance)'
            )}
            checked={localSettings.animations}
            onChange={(checked) => updateLocalSetting('animations', checked)}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:from-gray-800 dark:to-gray-900">
          <h4 className="mb-3 flex items-center gap-2 font-semibold">
            <Eye className="h-4 w-4" />
            {getLocalizedText('Preview das Configurações', 'Settings Preview')}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{getLocalizedText('Tema:', 'Theme:')}:</span>
              <span className="font-medium">
                {themeOptions.find((t) => t.value === localSettings.theme)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{getLocalizedText('Idioma:', 'Language:')}:</span>
              <span className="font-medium">
                {languageOptions.find((l) => l.value === localSettings.language)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{getLocalizedText('Densidade:', 'Density:')}:</span>
              <span className="font-medium">
                {densityOptions.find((d) => d.value === localSettings.density)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{getLocalizedText('Fonte:', 'Font:')}:</span>
              <span className="font-medium">
                {fontSizeOptions.find((f) => f.value === localSettings.fontSize)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{getLocalizedText('Animações:', 'Animations:')}:</span>
              <span className="font-medium">
                {localSettings.animations
                  ? getLocalizedText('Ativadas', 'Enabled')
                  : getLocalizedText('Desativadas', 'Disabled')}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        {hasChanges && (
          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving
                ? getLocalizedText('Salvando...', 'Saving...')
                : getLocalizedText('Salvar Alterações', 'Save Changes')}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              {getLocalizedText('Cancelar', 'Cancel')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
