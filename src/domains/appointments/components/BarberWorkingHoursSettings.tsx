/**
 * Componente para configuração de horários de funcionamento do barbeiro
 */

'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/shared/components/ui/switch'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/ui'
import { Clock, Calendar, Settings, AlertCircle, RotateCcw } from 'lucide-react'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { supabase } from '@/lib/api/supabase'

interface WorkingHours {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
  break_start_time?: string
  break_end_time?: string
  source: 'barber' | 'business'
}

interface BarberWorkingHoursSettingsProps {
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export function BarberWorkingHoursSettings({ className }: BarberWorkingHoursSettingsProps) {
  const { user, profile } = useAuth()
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar horários atuais
  useEffect(() => {
    if (!user?.id || !profile) return

    const loadWorkingHours = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar horários efetivos do barbeiro (com fallback para horários gerais)
        const { data, error: fetchError } = await supabase.rpc('get_barber_effective_hours', {
          p_barber_id: user.id,
        })

        if (fetchError) {
          throw fetchError
        }

        if (data) {
          setWorkingHours(data)
        }
      } catch (err) {
        console.error('Erro ao carregar horários:', err)
        setError('Erro ao carregar horários de funcionamento')
      } finally {
        setLoading(false)
      }
    }

    loadWorkingHours()
  }, [user?.id, profile])

  // Salvar horários personalizados
  const handleSaveHours = async (dayOfWeek: number, updates: Partial<WorkingHours>) => {
    if (!user?.id) return

    const currentDay = workingHours.find((h) => h.day_of_week === dayOfWeek)
    if (!currentDay) return

    // Atualizar estado local imediatamente para feedback visual
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, ...updates, source: 'barber' as const } : h
      )
    )

    try {
      setSaving(true)
      setError(null)

      const updatedHours = { ...currentDay, ...updates }

      // Validar horários apenas se estiver aberto
      if (updatedHours.is_open) {
        if (updatedHours.open_time >= updatedHours.close_time) {
          throw new Error('Horário de abertura deve ser anterior ao de fechamento')
        }

        if (updatedHours.break_start_time && updatedHours.break_end_time) {
          if (updatedHours.break_start_time >= updatedHours.break_end_time) {
            throw new Error('Horário de início da pausa deve ser anterior ao fim')
          }
          if (
            updatedHours.break_start_time <= updatedHours.open_time ||
            updatedHours.break_end_time >= updatedHours.close_time
          ) {
            throw new Error('Pausa deve estar dentro do horário de funcionamento')
          }
        }
      }

      // Salvar no banco (upsert)
      const { error: upsertError } = await supabase.from('barber_working_hours').upsert(
        {
          barber_id: user.id,
          day_of_week: dayOfWeek,
          is_open: updatedHours.is_open,
          open_time: updatedHours.open_time,
          close_time: updatedHours.close_time,
          break_start_time: updatedHours.break_start_time || null,
          break_end_time: updatedHours.break_end_time || null,
        },
        {
          onConflict: 'barber_id,day_of_week',
        }
      )

      if (upsertError) {
        throw upsertError
      }
    } catch (err) {
      console.error('Erro ao salvar horários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar horários')

      // Reverter estado local em caso de erro
      setWorkingHours((prev) => prev.map((h) => (h.day_of_week === dayOfWeek ? currentDay : h)))
    } finally {
      setSaving(false)
    }
  }

  // Resetar para horários gerais
  const handleResetToDefault = async (dayOfWeek: number) => {
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)

      // Deletar horário personalizado
      const { error: deleteError } = await supabase
        .from('barber_working_hours')
        .delete()
        .eq('barber_id', user.id)
        .eq('day_of_week', dayOfWeek)

      if (deleteError) {
        throw deleteError
      }

      // Recarregar horários para pegar o fallback
      const { data, error: fetchError } = await supabase.rpc('get_barber_effective_hours', {
        p_barber_id: user.id,
        p_day_of_week: dayOfWeek,
      })

      if (fetchError) {
        throw fetchError
      }

      if (data && data.length > 0) {
        setWorkingHours((prev) =>
          prev.map((h) =>
            h.day_of_week === dayOfWeek ? { ...data[0], source: 'business' as const } : h
          )
        )
      }
    } catch (err) {
      console.error('Erro ao resetar horários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao resetar horários')
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
          <Clock className="h-5 w-5 text-blue-600" />
          Horários de Funcionamento
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure seus horários de atendimento personalizados
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Lista de dias da semana */}
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = workingHours.find((h) => h.day_of_week === day.value)
            if (!dayHours) return null

            return (
              <div
                key={day.value}
                className="rounded-lg border border-gray-200 p-4 dark:border-secondary-graphite-card/30"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{day.label}</span>
                    {dayHours.source === 'business' && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Padrão
                      </span>
                    )}
                    {dayHours.source === 'barber' && (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Personalizado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dayHours.is_open}
                      onCheckedChange={(checked) =>
                        handleSaveHours(day.value, { is_open: checked })
                      }
                      disabled={saving}
                    />
                    {dayHours.source === 'barber' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetToDefault(day.value)}
                        disabled={saving}
                        className="text-xs"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Resetar
                      </Button>
                    )}
                  </div>
                </div>

                {dayHours.is_open && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Horários de funcionamento */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Abertura</label>
                      <Input
                        type="time"
                        value={dayHours.open_time}
                        onChange={(e) => handleSaveHours(day.value, { open_time: e.target.value })}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fechamento</label>
                      <Input
                        type="time"
                        value={dayHours.close_time}
                        onChange={(e) => handleSaveHours(day.value, { close_time: e.target.value })}
                        disabled={saving}
                      />
                    </div>

                    {/* Horário de pausa (opcional) */}
                    <div className="col-span-2 border-t border-gray-100 pt-2 dark:border-secondary-graphite-card/30">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium">Pausa/Almoço (opcional)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Início da pausa
                          </label>
                          <Input
                            type="time"
                            value={dayHours.break_start_time || ''}
                            onChange={(e) =>
                              handleSaveHours(day.value, {
                                break_start_time: e.target.value || undefined,
                              })
                            }
                            disabled={saving}
                            placeholder="--:--"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Fim da pausa
                          </label>
                          <Input
                            type="time"
                            value={dayHours.break_end_time || ''}
                            onChange={(e) =>
                              handleSaveHours(day.value, {
                                break_end_time: e.target.value || undefined,
                              })
                            }
                            disabled={saving}
                            placeholder="--:--"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!dayHours.is_open && (
                  <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                    <span className="text-sm">Fechado neste dia</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Informações sobre o sistema */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">Como funciona:</h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>
              • <strong>Ativo (Verde):</strong> Você está disponível neste dia
            </li>
            <li>
              • <strong>Inativo (Cinza):</strong> Você não atende neste dia
            </li>
            <li>
              • <strong>Personalizado:</strong> Seus horários específicos
            </li>
            <li>
              • <strong>Resetar:</strong> Volta para os horários gerais da barbearia
            </li>
            <li>
              • <strong>Pausa:</strong> Período indisponível (almoço, etc.)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
