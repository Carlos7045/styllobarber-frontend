'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { Input } from '@/shared/components/ui'
import { Label } from '@/shared/components/ui'
import { Switch } from '@/shared/components/ui'
import { ArrowLeft, Clock, Save, AlertCircle } from 'lucide-react'
import { useAdminHorarios, HorarioFuncionamento } from '@/domains/users/hooks/use-admin-horarios'

interface HorarioFuncionamentoFormProps {
  horario?: HorarioFuncionamento | null
  onClose: () => void
}

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export function HorarioFuncionamentoForm({ horario, onClose }: HorarioFuncionamentoFormProps) {
  const [formData, setFormData] = useState({
    dia_semana: horario && horario.dia_semana !== null ? horario.dia_semana : 0,
    horario_inicio: horario?.horario_inicio ?? '08:00',
    horario_fim: horario?.horario_fim ?? '18:00',
    intervalo_inicio: horario?.intervalo_inicio ?? '',
    intervalo_fim: horario?.intervalo_fim ?? '',
    ativo: horario?.ativo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createHorarioFuncionamento, updateHorarioFuncionamento } = useAdminHorarios()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validações
      if (formData.horario_inicio >= formData.horario_fim) {
        throw new Error('Horário de início deve ser anterior ao horário de fim')
      }

      if (formData.intervalo_inicio && formData.intervalo_fim) {
        if (formData.intervalo_inicio >= formData.intervalo_fim) {
          throw new Error('Horário de início do intervalo deve ser anterior ao horário de fim')
        }
        if (
          formData.intervalo_inicio < formData.horario_inicio ||
          formData.intervalo_fim > formData.horario_fim
        ) {
          throw new Error('Intervalo deve estar dentro do horário de funcionamento')
        }
      }

      const result =
        horario?.id && horario.id !== ''
          ? await updateHorarioFuncionamento(horario.id, formData)
          : await createHorarioFuncionamento(formData)

      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Erro ao salvar horário')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar horário')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary-gold" />
                {horario?.id && horario.id !== ''
                  ? 'Editar Horário'
                  : 'Novo Horário de Funcionamento'}
              </CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Configure os horários de funcionamento para{' '}
                {DIAS_SEMANA[formData.dia_semana] || 'Domingo'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Dia da Semana */}
            <div className="space-y-2">
              <Label htmlFor="dia_semana">Dia da Semana</Label>
              <select
                id="dia_semana"
                value={formData.dia_semana}
                onChange={(e) => handleInputChange('dia_semana', parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-secondary-graphite dark:text-white"
                disabled={!!(horario?.id && horario.id !== '')} // Não permitir alterar dia se estiver editando
              >
                {DIAS_SEMANA.map((dia, index) => (
                  <option key={index} value={index}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>

            {/* Horários Principais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário de Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => handleInputChange('horario_inicio', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário de Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => handleInputChange('horario_fim', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Intervalo (Opcional) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label className="text-base font-medium">Intervalo (Opcional)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intervalo_inicio">Início do Intervalo</Label>
                  <Input
                    id="intervalo_inicio"
                    type="time"
                    value={formData.intervalo_inicio}
                    onChange={(e) => handleInputChange('intervalo_inicio', e.target.value)}
                    placeholder="Ex: 12:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalo_fim">Fim do Intervalo</Label>
                  <Input
                    id="intervalo_fim"
                    type="time"
                    value={formData.intervalo_fim}
                    onChange={(e) => handleInputChange('intervalo_fim', e.target.value)}
                    placeholder="Ex: 13:00"
                  />
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Durante o intervalo, não será possível fazer agendamentos
              </p>
            </div>

            {/* Status Ativo */}
            <div className="flex items-center space-x-3">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange('ativo', checked)}
              />
              <Label htmlFor="ativo" className="text-sm">
                Horário ativo (permite agendamentos)
              </Label>
            </div>

            {/* Botões */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-gold text-primary-black hover:bg-primary-gold-dark"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-black"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {horario?.id && horario.id !== '' ? 'Atualizar' : 'Criar'} Horário
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
