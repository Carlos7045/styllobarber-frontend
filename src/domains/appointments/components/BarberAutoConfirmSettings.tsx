/**
 * Componente para configurações de confirmação automática do barbeiro
 */

'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/shared/components/ui/switch'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { supabase } from '@/lib/api/supabase'

interface BarberAutoConfirmSettingsProps {
  className?: string
}

interface BarberSettings {
  auto_confirm_appointments: boolean
  auto_confirm_timeout_minutes: number
}

export function BarberAutoConfirmSettings({ className }: BarberAutoConfirmSettingsProps) {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<BarberSettings>({
    auto_confirm_appointments: false,
    auto_confirm_timeout_minutes: 5,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar configurações atuais
  useEffect(() => {
    if (!user?.id || !profile) return

    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('auto_confirm_appointments, auto_confirm_timeout_minutes')
          .eq('id', user.id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (data) {
          setSettings({
            auto_confirm_appointments: data.auto_confirm_appointments || false,
            auto_confirm_timeout_minutes: data.auto_confirm_timeout_minutes || 5,
          })
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
        setError('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user?.id, profile])

  // Salvar configurações
  const handleSaveSettings = async (newSettings: Partial<BarberSettings>) => {
    if (!user?.id) return

    const previousSettings = { ...settings }

    // Atualizar estado local imediatamente para feedback visual
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      setSaving(true)
      setError(null)

      // Usar a função do banco para validação e segurança
      const { error: updateError } = await supabase.rpc('update_barber_auto_confirm_settings', {
        p_barbeiro_id: user.id,
        p_auto_confirm: updatedSettings.auto_confirm_appointments,
        p_timeout_minutes: updatedSettings.auto_confirm_timeout_minutes,
      })

      if (updateError) {
        throw updateError
      }

      // Feedback visual de sucesso
      const successMessage = updatedSettings.auto_confirm_appointments
        ? 'Confirmação automática ativada!'
        : 'Confirmação automática desativada!'

      // Aqui você pode adicionar um toast de sucesso
      console.log('✅', successMessage)
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações')

      // Reverter estado local em caso de erro
      setSettings(previousSettings)
    } finally {
      setSaving(false)
    }
  }

  // Verificar se usuário tem permissão
  if (!profile || !['barber', 'admin'].includes(profile.role)) {
    return null
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-gold"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-gold" />
          Confirmação Automática
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure como seus agendamentos são confirmados
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Toggle de Confirmação Automática */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Confirmação Automática</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Novos agendamentos são confirmados automaticamente
            </p>
          </div>

          <Switch
            checked={settings.auto_confirm_appointments}
            onCheckedChange={(checked) =>
              handleSaveSettings({ auto_confirm_appointments: checked })
            }
            disabled={saving}
          />
        </div>

        {/* Configuração de Tempo (apenas se confirmação automática estiver ativa) */}
        {settings.auto_confirm_appointments && (
          <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-secondary-graphite-card/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Tempo para Confirmação</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agendamentos são confirmados automaticamente assim que são criados
              </p>

              {/* Opções de tempo predefinidas */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '2 min', value: 2 },
                  { label: '5 min', value: 5 },
                  { label: '10 min', value: 10 },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      settings.auto_confirm_timeout_minutes === option.value ? 'primary' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      handleSaveSettings({ auto_confirm_timeout_minutes: option.value })
                    }
                    disabled={saving}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Informações sobre o comportamento */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">Como funciona:</h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            {settings.auto_confirm_appointments ? (
              <>
                <li>• Novos agendamentos são confirmados automaticamente</li>
                <li>• Clientes recebem confirmação imediata</li>
                <li>• Você pode alterar o status manualmente se necessário</li>
              </>
            ) : (
              <>
                <li>• Novos agendamentos ficam como "Pendente"</li>
                <li>• Você precisa confirmar manualmente cada agendamento</li>
                <li>• Clientes aguardam sua confirmação</li>
              </>
            )}
          </ul>
        </div>

        {/* Status atual */}
        <div className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-secondary-graphite-card/30">
          <span className="text-sm font-medium">Status Atual:</span>
          <div className="flex items-center gap-2">
            {settings.auto_confirm_appointments ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Confirmação Automática Ativa
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Confirmação Manual</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
