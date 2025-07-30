'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useToast } from '@/components/ui'
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react'
import { useAdminHorarios, HorarioFuncionamento, BloqueioHorario } from '@/hooks/use-admin-horarios'
import { HorarioFuncionamentoForm } from './HorarioFuncionamentoForm'
import { BloqueioHorarioForm } from './BloqueioHorarioForm'
import { formatTimeString, formatDateString } from '@/lib/date-utils'

interface HorariosManagerProps {
  activeTab: 'funcionamento' | 'bloqueios'
  horariosFuncionamento: HorarioFuncionamento[]
  bloqueiosHorario: BloqueioHorario[]
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

export function HorariosManager({
  activeTab,
  horariosFuncionamento,
  bloqueiosHorario,
}: HorariosManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<HorarioFuncionamento | BloqueioHorario | null>(
    null
  )
  const [loadingToggle, setLoadingToggle] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const { addToast } = useToast()
  const { deleteHorarioFuncionamento, deleteBloqueioHorario, updateHorarioFuncionamento, refetch } =
    useAdminHorarios()

  const handleEdit = (item: HorarioFuncionamento | BloqueioHorario) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCreateHorario = (diaSemana: number) => {
    const novoHorario: HorarioFuncionamento = {
      id: '',
      dia_semana: diaSemana,
      horario_inicio: '08:00',
      horario_fim: '18:00',
      intervalo_inicio: undefined,
      intervalo_fim: undefined,
      ativo: true,
      created_at: '',
      updated_at: '',
    }
    setEditingItem(novoHorario)
    setShowForm(true)
  }

  const handleDelete = async (id: string, type: 'funcionamento' | 'bloqueio') => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    setLoadingDelete(id)
    try {
      const result =
        type === 'funcionamento'
          ? await deleteHorarioFuncionamento(id)
          : await deleteBloqueioHorario(id)

      if (!result.success) {
        addToast({
          type: 'error',
          title: 'Erro ao excluir',
          description: `Não foi possível excluir o ${type === 'funcionamento' ? 'horário' : 'bloqueio'}: ${result.error}`,
        })
      } else {
        addToast({
          type: 'success',
          title: 'Item excluído',
          description: `${type === 'funcionamento' ? 'Horário' : 'Bloqueio'} excluído com sucesso`,
        })
        await refetch() // Atualizar dados após exclusão
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao excluir o item',
      })
    } finally {
      setLoadingDelete(null)
    }
  }

  const handleToggleAtivo = async (horario: HorarioFuncionamento) => {
    setLoadingToggle(horario.id)

    const novoStatus = !horario.ativo
    const diaSemana = DIAS_SEMANA[horario.dia_semana || 0]

    try {
      const result = await updateHorarioFuncionamento(horario.id, {
        ativo: novoStatus,
      })

      if (!result.success) {
        addToast({
          type: 'error',
          title: 'Erro ao alterar status',
          description: `Não foi possível ${novoStatus ? 'ativar' : 'desativar'} o horário de ${diaSemana}: ${result.error}`,
        })
      } else {
        addToast({
          type: 'success',
          title: 'Status alterado',
          description: `Horário de ${diaSemana} ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
        })
        // Não precisa mais do refetch - o estado já foi atualizado no hook
      }
    } catch (error) {
      console.error('Erro ao alterar status do horário:', error)
      addToast({
        type: 'error',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado ao alterar o status do horário',
      })
    } finally {
      setLoadingToggle(null)
    }
  }

  const closeForm = async () => {
    setShowForm(false)
    setEditingItem(null)
    await refetch() // Atualizar dados quando fechar o formulário
  }

  if (showForm) {
    return activeTab === 'funcionamento' ? (
      <HorarioFuncionamentoForm horario={editingItem as HorarioFuncionamento} onClose={closeForm} />
    ) : (
      <BloqueioHorarioForm bloqueio={editingItem as BloqueioHorario | null} onClose={closeForm} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'funcionamento' ? 'Horários de Funcionamento' : 'Bloqueios de Horário'}
          </h2>
          <p className="text-text-muted">
            {activeTab === 'funcionamento'
              ? 'Configure os horários de funcionamento da barbearia'
              : 'Gerencie bloqueios e exceções de horário'}
          </p>
        </div>
        <Button
          onClick={() => {
            if (activeTab === 'funcionamento') {
              handleCreateHorario(0) // Domingo por padrão
            } else {
              setEditingItem(null)
              setShowForm(true)
            }
          }}
          className="bg-primary-gold text-primary-black hover:bg-primary-gold-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === 'funcionamento' ? 'Novo Horário' : 'Novo Bloqueio'}
        </Button>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'funcionamento' ? (
        <HorariosFuncionamentoList
          horarios={horariosFuncionamento}
          onEdit={handleEdit}
          onDelete={(id) => handleDelete(id, 'funcionamento')}
          onToggleAtivo={handleToggleAtivo}
          onCreateHorario={handleCreateHorario}
          loadingToggle={loadingToggle}
          loadingDelete={loadingDelete}
        />
      ) : (
        <BloqueiosHorarioList
          bloqueios={bloqueiosHorario}
          onEdit={handleEdit}
          onDelete={(id) => handleDelete(id, 'bloqueio')}
          loadingDelete={loadingDelete}
        />
      )}
    </div>
  )
}

// Componente para lista de horários de funcionamento
function HorariosFuncionamentoList({
  horarios,
  onEdit,
  onDelete,
  onToggleAtivo,
  onCreateHorario,
  loadingToggle,
  loadingDelete,
}: {
  horarios: HorarioFuncionamento[]
  onEdit: (horario: HorarioFuncionamento) => void
  onDelete: (id: string) => void
  onToggleAtivo: (horario: HorarioFuncionamento) => void
  onCreateHorario: (diaSemana: number) => void
  loadingToggle: string | null
  loadingDelete: string | null
}) {
  // Organizar horários por dia da semana
  const horariosPorDia = DIAS_SEMANA.map((dia, index) => {
    const horario = horarios.find((h) => h.dia_semana === index)
    return { dia, horario, diaSemana: index }
  })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {horariosPorDia.map(({ dia, horario, diaSemana }) => (
        <Card key={diaSemana} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{dia}</CardTitle>
              {horario ? (
                <Badge
                  variant="outline"
                  className={`transition-all duration-200 ${
                    horario.ativo
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 dark:border-emerald-400/50 dark:text-emerald-300'
                      : 'border-gray-500/50 bg-gray-500/10 text-gray-400 dark:border-gray-400/50 dark:text-gray-300'
                  }`}
                >
                  {horario.ativo ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {horario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/10 text-amber-400 dark:border-amber-400/50 dark:text-amber-300"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Não configurado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {horario ? (
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-primary-gold" />
                  <span>
                    {formatTimeString(horario.horario_inicio)} -{' '}
                    {formatTimeString(horario.horario_fim)}
                  </span>
                </div>

                {horario.intervalo_inicio && horario.intervalo_fim && (
                  <div className="flex items-center text-sm text-text-muted">
                    <span className="mr-2">Intervalo:</span>
                    <span>
                      {formatTimeString(horario.intervalo_inicio)} -{' '}
                      {formatTimeString(horario.intervalo_fim)}
                    </span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(horario)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleAtivo(horario)}
                    disabled={loadingToggle === horario.id}
                    className={`transition-all duration-200 ${
                      horario.ativo
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:border-orange-400 hover:bg-orange-500/20 dark:border-orange-400/50 dark:text-orange-300 dark:hover:bg-orange-400/20'
                        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/20 dark:border-emerald-400/50 dark:text-emerald-300 dark:hover:bg-emerald-400/20'
                    }`}
                  >
                    {loadingToggle === horario.id ? (
                      <div className="flex items-center">
                        <div className="mr-1 h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
                        <span className="text-xs">
                          {horario.ativo ? 'Desativando...' : 'Ativando...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {horario.ativo ? (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            <span className="text-xs">Desativar</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            <span className="text-xs">Ativar</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(horario.id)}
                    disabled={loadingDelete === horario.id}
                  >
                    {loadingDelete === horario.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-3 text-sm text-text-muted">
                  Nenhum horário configurado para este dia
                </p>
                <Button size="sm" variant="outline" onClick={() => onCreateHorario(diaSemana)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Configurar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Componente para lista de bloqueios
function BloqueiosHorarioList({
  bloqueios,
  onEdit,
  onDelete,
  loadingDelete,
}: {
  bloqueios: BloqueioHorario[]
  onEdit: (bloqueio: BloqueioHorario) => void
  onDelete: (id: string) => void
  loadingDelete: string | null
}) {
  const hoje = new Date().toISOString().split('T')[0]
  const bloqueiosAtivos = bloqueios.filter((b) => b.data_fim >= hoje)
  const bloqueiosExpirados = bloqueios.filter((b) => b.data_fim < hoje)

  if (bloqueios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum bloqueio configurado
          </h3>
          <p className="text-text-muted">
            Crie bloqueios para períodos específicos onde não haverá atendimento
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bloqueios Ativos */}
      {bloqueiosAtivos.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Bloqueios Ativos ({bloqueiosAtivos.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bloqueiosAtivos.map((bloqueio) => (
              <BloqueioCard
                key={bloqueio.id}
                bloqueio={bloqueio}
                onEdit={onEdit}
                onDelete={onDelete}
                isExpired={false}
                loadingDelete={loadingDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bloqueios Expirados */}
      {bloqueiosExpirados.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-500 dark:text-gray-400">
            Bloqueios Expirados ({bloqueiosExpirados.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bloqueiosExpirados.map((bloqueio) => (
              <BloqueioCard
                key={bloqueio.id}
                bloqueio={bloqueio}
                onEdit={onEdit}
                onDelete={onDelete}
                isExpired={true}
                loadingDelete={loadingDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Card individual de bloqueio
function BloqueioCard({
  bloqueio,
  onEdit,
  onDelete,
  isExpired,
  loadingDelete,
}: {
  bloqueio: BloqueioHorario
  onEdit: (bloqueio: BloqueioHorario) => void
  onDelete: (id: string) => void
  isExpired: boolean
  loadingDelete: string | null
}) {
  return (
    <Card className={`relative ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{bloqueio.motivo}</CardTitle>
          <Badge
            variant="outline"
            className={
              isExpired
                ? 'border-gray-500/50 bg-gray-500/10 text-gray-400 dark:border-gray-400/50 dark:text-gray-300'
                : 'border-red-500/50 bg-red-500/10 text-red-400 dark:border-red-400/50 dark:text-red-300'
            }
          >
            {isExpired ? 'Expirado' : 'Ativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-primary-gold" />
            <span>
              {formatDateString(bloqueio.data_inicio)} - {formatDateString(bloqueio.data_fim)}
            </span>
          </div>

          {bloqueio.horario_inicio && bloqueio.horario_fim && (
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-primary-gold" />
              <span>
                {formatTimeString(bloqueio.horario_inicio)} -{' '}
                {formatTimeString(bloqueio.horario_fim)}
              </span>
            </div>
          )}

          {bloqueio.funcionario && (
            <div className="flex items-center text-sm text-text-muted">
              <User className="mr-2 h-4 w-4" />
              <span>{bloqueio.funcionario.profile.nome}</span>
            </div>
          )}

          <div className="flex space-x-2 pt-3">
            <Button size="sm" variant="outline" onClick={() => onEdit(bloqueio)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(bloqueio.id)}
              disabled={loadingDelete === bloqueio.id}
            >
              {loadingDelete === bloqueio.id ? (
                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
