'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { Input } from '@/shared/components/ui'
import { Label } from '@/shared/components/ui'
import { Textarea } from '@/shared/components/ui'
import { ArrowLeft, Calendar, Save, AlertCircle, User } from 'lucide-react'
import { useAdminHorarios, BloqueioHorario } from '@/domains/users/hooks/use-admin-horarios'
import { useAdminFuncionarios } from '@/domains/users/hooks/use-admin-funcionarios'

interface BloqueioHorarioFormProps {
  bloqueio?: BloqueioHorario | null
  onClose: () => void
}

export function BloqueioHorarioForm({ bloqueio, onClose }: BloqueioHorarioFormProps) {
  const [formData, setFormData] = useState({
    data_inicio: bloqueio?.data_inicio ?? '',
    data_fim: bloqueio?.data_fim ?? '',
    horario_inicio: bloqueio?.horario_inicio ?? '',
    horario_fim: bloqueio?.horario_fim ?? '',
    motivo: bloqueio?.motivo ?? '',
    funcionario_id: bloqueio?.funcionario_id ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createBloqueioHorario, updateBloqueioHorario } = useAdminHorarios()
  const { funcionarios } = useAdminFuncionarios()

  // Definir data mínima como hoje
  const hoje = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validações
      if (formData.data_inicio > formData.data_fim) {
        throw new Error('Data de início deve ser anterior ou igual à data de fim')
      }

      if (formData.horario_inicio && formData.horario_fim) {
        if (formData.horario_inicio >= formData.horario_fim) {
          throw new Error('Horário de início deve ser anterior ao horário de fim')
        }
      }

      if (!formData.motivo.trim()) {
        throw new Error('Motivo é obrigatório')
      }

      const result =
        bloqueio?.id && bloqueio.id !== ''
          ? await updateBloqueioHorario(bloqueio.id, formData)
          : await createBloqueioHorario(formData)

      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Erro ao salvar bloqueio')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar bloqueio')
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
                <Calendar className="mr-2 h-5 w-5 text-primary-gold" />
                {bloqueio?.id && bloqueio.id !== ''
                  ? 'Editar Bloqueio'
                  : 'Novo Bloqueio de Horário'}
              </CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Configure períodos onde não haverá atendimento
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

            {/* Período */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Período do Bloqueio</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                    min={hoje}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data de Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => handleInputChange('data_fim', e.target.value)}
                    min={formData.data_inicio || hoje}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Horários Específicos (Opcional) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label className="text-base font-medium">Horários Específicos (Opcional)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_inicio">Horário de Início</Label>
                  <Input
                    id="horario_inicio"
                    type="time"
                    value={formData.horario_inicio}
                    onChange={(e) => handleInputChange('horario_inicio', e.target.value)}
                    placeholder="Ex: 12:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_fim">Horário de Fim</Label>
                  <Input
                    id="horario_fim"
                    type="time"
                    value={formData.horario_fim}
                    onChange={(e) => handleInputChange('horario_fim', e.target.value)}
                    placeholder="Ex: 14:00"
                  />
                </div>
              </div>
              <p className="text-xs text-text-muted">Deixe em branco para bloquear o dia inteiro</p>
            </div>

            {/* Funcionário Específico (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="funcionario_id">Funcionário (Opcional)</Label>
              <select
                id="funcionario_id"
                value={formData.funcionario_id}
                onChange={(e) => handleInputChange('funcionario_id', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-secondary-graphite dark:text-white"
              >
                <option value="">Todos os funcionários</option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.profile.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted">
                Selecione um funcionário específico ou deixe em branco para aplicar a todos
              </p>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Bloqueio</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                placeholder="Ex: Feriado, Manutenção, Férias..."
                rows={3}
                required
              />
            </div>

            {/* Preview do Bloqueio */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-secondary-graphite-light">
              <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                Preview do Bloqueio:
              </h4>
              <div className="space-y-1 text-sm text-text-muted">
                <p>
                  <strong>Período:</strong> {formData.data_inicio || 'Data início'} até{' '}
                  {formData.data_fim || 'Data fim'}
                </p>
                {formData.horario_inicio && formData.horario_fim && (
                  <p>
                    <strong>Horário:</strong> {formData.horario_inicio} às {formData.horario_fim}
                  </p>
                )}
                <p>
                  <strong>Aplicado a:</strong>{' '}
                  {formData.funcionario_id
                    ? funcionarios.find((f) => f.id === formData.funcionario_id)?.profile.nome ||
                      'Funcionário selecionado'
                    : 'Todos os funcionários'}
                </p>
                {formData.motivo && (
                  <p>
                    <strong>Motivo:</strong> {formData.motivo}
                  </p>
                )}
              </div>
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
                    {bloqueio?.id && bloqueio.id !== '' ? 'Atualizar' : 'Criar'} Bloqueio
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
