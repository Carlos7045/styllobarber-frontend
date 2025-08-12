'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Plus, Download, RefreshCw, Scissors, Settings } from 'lucide-react'

import { useAuth, UserProfile } from '@/domains/auth/hooks/use-auth'
import { usePermissions, PERMISSIONS } from '@/domains/auth/hooks/use-permissions'
import { PermissionGuard, AdminOnly } from '@/domains/auth/components/PermissionGuard'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { supabase } from '@/lib/supabase'
import { UserEditModal } from './UserEditModal'
import { ConfirmDialog } from './ConfirmDialog'
import { CriarFuncionarioModal } from './CriarFuncionarioModal'
import { EspecialidadesModal } from './EspecialidadesModal'
import { useFuncionariosEspecialidades } from '@/domains/users/hooks/use-funcionarios-especialidades-simple'
import type { FuncionarioComEspecialidades } from '@/types/funcionarios'

interface FuncionarioManagementProps {
    className?: string
}

export function FuncionarioManagement({ className }: FuncionarioManagementProps) {
    const { profile } = useAuth()
    const { canManageEmployees, hasPermission } = usePermissions()
    const {
        funcionarios,
        filteredFuncionarios,
        loading,
        error,
        refetch,
        stats
    } = useFuncionariosEspecialidades()

    // Debug: Log dos dados recebidos do hook
    console.log('🎯 [COMPONENTE] Dados do hook:', {
        funcionarios: funcionarios?.length || 0,
        filteredFuncionarios: filteredFuncionarios?.length || 0,
        loading,
        error,
        stats
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioComEspecialidades | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCriarFuncionarioOpen, setIsCriarFuncionarioOpen] = useState(false)
    const [isEspecialidadesModalOpen, setIsEspecialidadesModalOpen] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        title: string
        message: string
        action: () => void
        variant?: 'danger' | 'warning' | 'info'
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: () => { },
    })
    const [actionLoading, setActionLoading] = useState(false)

    // Mostrar loading se ainda não carregou o perfil
    if (!profile) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-text-secondary">Carregando...</p>
                </CardContent>
            </Card>
        )
    }

    // Função para recarregar funcionários
    const handleRefresh = () => {
        refetch()
    }

    // Função para abrir modal de especialidades
    const handleOpenEspecialidades = (funcionario: FuncionarioComEspecialidades) => {
        setSelectedFuncionario(funcionario)
        setIsEspecialidadesModalOpen(true)
    }

    // Função para exportar funcionários (CSV)
    const handleExportFuncionarios = () => {
        const csvContent = [
            ['Nome', 'Email', 'Telefone', 'Cargo', 'Data de Criação'].join(','),
            ...funcionariosFiltrados.map(funcionario => [
                funcionario.nome,
                funcionario.email,
                funcionario.telefone || '',
                getRoleName(funcionario.role),
                new Date(funcionario.created_at).toLocaleDateString('pt-BR')
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `funcionarios_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Usar funcionários filtrados do hook (aplicar filtros locais se necessário)
    const funcionariosFiltrados = funcionarios.filter(funcionario => {
        const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (funcionario.telefone && funcionario.telefone.includes(searchTerm))
        const matchesRole = roleFilter === 'all' || funcionario.role === roleFilter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && funcionario.ativo) ||
            (statusFilter === 'inactive' && !funcionario.ativo)
        return matchesSearch && matchesRole && matchesStatus
    })

    // Alterar role do funcionário (apenas entre admin e barber)
    const handleRoleChange = async (userId: string, newRole: 'admin' | 'barber') => {
        const funcionario = funcionarios.find(u => u.id === userId)
        if (!funcionario) return

        setConfirmDialog({
            isOpen: true,
            title: 'Alterar Cargo',
            message: `Tem certeza que deseja alterar o cargo de "${funcionario.nome}" para "${getRoleName(newRole)}"?`,
            variant: 'warning',
            action: async () => {
                try {
                    setActionLoading(true)

                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            role: newRole,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)

                    if (error) {
                        console.error('Erro ao alterar cargo:', error)
                        alert('Erro ao alterar cargo: ' + error.message)
                        return
                    }

                    // Recarregar dados
                    refetch()

                    alert('Cargo alterado com sucesso!')
                } catch (error) {
                    console.error('Erro ao alterar cargo:', error)
                    alert('Erro inesperado ao alterar cargo')
                } finally {
                    setActionLoading(false)
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    // Desativar/ativar funcionário
    const handleToggleFuncionarioStatus = async (userId: string, activate: boolean) => {
        const funcionario = funcionarios.find(u => u.id === userId)
        if (!funcionario) return

        setConfirmDialog({
            isOpen: true,
            title: activate ? 'Ativar Funcionário' : 'Desativar Funcionário',
            message: `Tem certeza que deseja ${activate ? 'ativar' : 'desativar'} o funcionário "${funcionario.nome}"?`,
            variant: activate ? 'info' : 'danger',
            action: async () => {
                try {
                    setActionLoading(true)

                    if (!activate) {
                        // Verificar se funcionário tem agendamentos futuros
                        const { data: agendamentosFuturos, error: checkError } = await supabase
                            .from('appointments')
                            .select('id')
                            .eq('barbeiro_id', userId)
                            .gte('data_agendamento', new Date().toISOString())
                            .neq('status', 'cancelado')

                        if (checkError) {
                            throw checkError
                        }

                        if (agendamentosFuturos && agendamentosFuturos.length > 0) {
                            alert(`Funcionário possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Cancele-os primeiro.`)
                            return
                        }
                    }

                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ ativo: activate })
                        .eq('id', userId)

                    if (updateError) {
                        throw updateError
                    }

                    // Recarregar dados
                    refetch()

                    alert(`Funcionário ${activate ? 'ativado' : 'desativado'} com sucesso!`)
                } catch (error) {
                    console.error('Erro ao alterar status:', error)
                    alert('Erro inesperado ao alterar status do funcionário')
                } finally {
                    setActionLoading(false)
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    // Função para deletar funcionário (ação perigosa)
    const handleDeleteFuncionario = async (userId: string) => {
        const funcionario = funcionarios.find(u => u.id === userId)
        if (!funcionario) return

        setConfirmDialog({
            isOpen: true,
            title: 'Deletar Funcionário',
            message: `ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja deletar permanentemente o funcionário "${funcionario.nome}"?`,
            variant: 'danger',
            action: async () => {
                try {
                    setActionLoading(true)

                    // Deletar do banco
                    const { error } = await supabase
                        .from('profiles')
                        .delete()
                        .eq('id', userId)

                    if (error) {
                        console.error('Erro ao deletar funcionário:', error)
                        alert('Erro ao deletar funcionário: ' + error.message)
                        return
                    }

                    // Recarregar dados
                    refetch()
                    alert('Funcionário deletado com sucesso!')
                } catch (error) {
                    console.error('Erro ao deletar funcionário:', error)
                    alert('Erro inesperado ao deletar funcionário')
                } finally {
                    setActionLoading(false)
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    // Callback para quando funcionário é editado
    const handleFuncionarioSaved = (updatedFuncionario: UserProfile) => {
        refetch()
    }

    // Obter cor do badge baseado no role
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-error text-white'
            case 'barber':
                return 'bg-primary-gold text-primary-black'
            default:
                return 'bg-neutral-medium-gray text-white'
        }
    }

    // Obter nome do role em português
    const getRoleName = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrador'
            case 'barber':
                return 'Barbeiro'
            default:
                return role
        }
    }

    return (
        <PermissionGuard 
            requiredPermissions={[PERMISSIONS.MANAGE_EMPLOYEES]} 
            type="component"
            accessDeniedMessage="Apenas administradores podem gerenciar funcionários."
        >
            <Card className={`${className} bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite shadow-lg`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Gestão de Funcionários
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mr-4">
                                {funcionariosFiltrados.length} funcionário{funcionariosFiltrados.length !== 1 ? 's' : ''}
                            </div>
                            <PermissionGuard requiredPermissions={[PERMISSIONS.CREATE_EMPLOYEES]}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCriarFuncionarioOpen(true)}
                                    className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black border-primary-gold"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Funcionário
                                </Button>
                            </PermissionGuard>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <PermissionGuard requiredPermissions={[PERMISSIONS.EXPORT_DATA]}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportFuncionarios}
                                    disabled={loading || funcionariosFiltrados.length === 0}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </PermissionGuard>
                        </div>
                    </div>
                </CardHeader>

            <CardContent className="space-y-6">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por nome, email ou telefone..."
                            leftIcon={<Search className="h-4 w-4" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-md bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent disabled:opacity-50"
                        >
                            <option value="all" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Todos os cargos</option>
                            <option value="admin" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Administradores</option>
                            <option value="barber" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Barbeiros</option>
                        </select>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-md bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent disabled:opacity-50"
                        >
                            <option value="all" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Todos os status</option>
                            <option value="active" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Ativos</option>
                            <option value="inactive" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Inativos</option>
                        </select>
                    </div>
                </div>

                {/* Lista de funcionários */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-gray-600 dark:text-gray-300">Carregando funcionários...</p>
                    </div>
                ) : funcionariosFiltrados.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-gray-600 dark:text-gray-300">Nenhum funcionário encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {funcionariosFiltrados.map((funcionario) => (
                            <div
                                key={funcionario.id}
                                className="p-6 rounded-xl border border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite hover:from-primary-gold/5 hover:to-primary-gold/10 hover:border-primary-gold/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-semibold">
                                            {funcionario.avatar_url ? (
                                                <img
                                                    src={funcionario.avatar_url}
                                                    alt={funcionario.nome}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                funcionario.nome.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* Informações do funcionário */}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white">{funcionario.nome}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{funcionario.email}</p>
                                            {funcionario.telefone && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{funcionario.telefone}</p>
                                            )}

                                            {/* Especialidades */}
                                            <div className="mt-2">
                                                {funcionario.servicos && funcionario.servicos.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {funcionario.servicos.slice(0, 3).map((servico) => (
                                                            <span
                                                                key={servico.id}
                                                                className="px-2 py-1 bg-primary-gold/10 text-primary-gold text-xs rounded-full"
                                                            >
                                                                {servico.nome}
                                                            </span>
                                                        ))}
                                                        {funcionario.servicos.length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-secondary-graphite-card text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                                                +{funcionario.servicos.length - 3} mais
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                        Sem especialidades - não realiza serviços
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Badge do status */}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${funcionario.ativo
                                            ? 'bg-success/10 text-success border border-success/20'
                                            : 'bg-error/10 text-error border border-error/20'
                                            }`}>
                                            {funcionario.ativo ? 'Ativo' : 'Inativo'}
                                        </span>

                                        {/* Badge do cargo */}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(funcionario.role)}`}>
                                            {getRoleName(funcionario.role)}
                                        </span>

                                        {/* Data de criação */}
                                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                            {new Date(funcionario.created_at).toLocaleDateString('pt-BR')}
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center gap-1">
                                            {/* Alterar cargo (apenas entre admin e barber) */}
                                            <select
                                                value={funcionario.role}
                                                onChange={(e) => handleRoleChange(funcionario.id, e.target.value as 'admin' | 'barber')}
                                                disabled={loading || actionLoading}
                                                className="text-xs px-2 py-1 border border-gray-200 dark:border-secondary-graphite-card/30 rounded bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-gold disabled:opacity-50"
                                            >
                                                <option value="barber" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Barbeiro</option>
                                                <option value="admin" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Admin</option>
                                            </select>

                                            {/* Botão de especialidades */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEspecialidades(funcionario)}
                                                disabled={loading || actionLoading}
                                                title="Gerenciar especialidades"
                                                className="text-primary-gold hover:text-primary-gold-dark hover:bg-primary-gold/10"
                                            >
                                                <Scissors className="h-4 w-4" />
                                            </Button>

                                            {/* Botão de editar */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(funcionario)
                                                    setIsEditModalOpen(true)
                                                }}
                                                disabled={loading || actionLoading}
                                                title="Editar funcionário"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            {/* Botão de ativar/desativar */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleFuncionarioStatus(funcionario.id, !funcionario.ativo)}
                                                disabled={loading || actionLoading}
                                                title={funcionario.ativo ? 'Desativar funcionário' : 'Ativar funcionário'}
                                                className={funcionario.ativo
                                                    ? "text-warning hover:text-warning hover:bg-warning/10"
                                                    : "text-success hover:text-success hover:bg-success/10"
                                                }
                                            >
                                                {funcionario.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                            </Button>

                                            {/* Botão de deletar */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteFuncionario(funcionario.id)}
                                                disabled={loading || actionLoading}
                                                title="Deletar funcionário"
                                                className="text-error hover:text-error hover:bg-error/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border-default">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-error">
                            {stats?.total_admins || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Administradores</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary-gold">
                            {stats?.total_barbeiros || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Barbeiros</div>
                    </div>
                </div>
            </CardContent>

            {/* Modal de edição */}
            <UserEditModal
                user={selectedUser}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedUser(null)
                }}
                onSave={handleFuncionarioSaved}
            />

            {/* Dialog de confirmação */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                loading={actionLoading}
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Modal de criar funcionário */}
            <CriarFuncionarioModal
                isOpen={isCriarFuncionarioOpen}
                onClose={() => setIsCriarFuncionarioOpen(false)}
                onSuccess={() => {
                    setIsCriarFuncionarioOpen(false)
                    refetch() // Recarregar lista de funcionários
                }}
            />

            {/* Modal de especialidades */}
            <EspecialidadesModal
                funcionario={selectedFuncionario}
                isOpen={isEspecialidadesModalOpen}
                onClose={() => {
                    setIsEspecialidadesModalOpen(false)
                    setSelectedFuncionario(null)
                }}
                onSuccess={() => {
                    setIsEspecialidadesModalOpen(false)
                    setSelectedFuncionario(null)
                    refetch() // Recarregar lista de funcionários
                }}
            />
        </Card>
        </PermissionGuard>
    )
}
