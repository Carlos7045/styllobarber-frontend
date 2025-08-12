'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Plus, Download, RefreshCw } from 'lucide-react'

import { useAuth, UserProfile } from '@/domains/auth/hooks/use-auth'
import { usePermissions, PERMISSIONS } from '@/domains/auth/hooks/use-permissions'
import { PermissionGuard, AdminOnly } from '@/domains/auth/components/PermissionGuard'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { supabase } from '@/lib/supabase'
import { UserEditModal } from './UserEditModal'
import { ConfirmDialog } from './ConfirmDialog'
import { NovoFuncionarioModal } from './NovoFuncionarioModal'

interface UserManagementProps {
  className?: string
}

export function UserManagement({ className }: UserManagementProps) {
  const { profile } = useAuth()
  const { canManageUsers, hasPermission } = usePermissions()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNovoFuncionarioOpen, setIsNovoFuncionarioOpen] = useState(false)
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
    action: () => {},
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Carregar usuários
  useEffect(() => {
    console.log('🔐 [USUARIOS] Verificação de permissão:', {
      canManageUsers,
      profileExists: !!profile,
      profileId: profile?.id
    })
    
    // TEMPORÁRIO: Carregar sempre para debug
    loadUsers()
  }, [canManageUsers, profile?.id])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('🔍 [USUARIOS] Iniciando busca de clientes...')
      
      // Buscar apenas clientes
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      console.log('📋 [USUARIOS] Resultado da busca:', {
        hasData: !!data,
        hasError: !!error,
        count: data?.length || 0,
        error: error
      })

      if (error) {
        console.error('❌ [USUARIOS] Erro ao carregar usuários:', error)
        alert('Erro ao carregar usuários: ' + error.message)
        return
      }

      console.log('✅ [USUARIOS] Clientes encontrados:', data?.length || 0)
      setUsers(data as UserProfile[])
    } catch (error) {
      console.error('❌ [USUARIOS] Erro inesperado:', error)
      alert('Erro inesperado ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Função para recarregar usuários
  const handleRefresh = () => {
    loadUsers()
  }

  // Função para exportar usuários (CSV)
  const handleExportUsers = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Role', 'Data de Criação'].join(','),
      ...filteredUsers.map(user => [
        user.nome,
        user.email,
        user.telefone || '',
        getRoleName(user.role),
        new Date(user.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.telefone && user.telefone.includes(searchTerm))
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.ativo) ||
                         (statusFilter === 'inactive' && !user.ativo)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Alterar role do usuário
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'barber' | 'client') => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setConfirmDialog({
      isOpen: true,
      title: 'Alterar Perfil de Acesso',
      message: `Tem certeza que deseja alterar o perfil de "${user.nome}" para "${getRoleName(newRole)}"?`,
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
            console.error('Erro ao alterar role:', error)
            alert('Erro ao alterar perfil: ' + error.message)
            return
          }

          // Atualizar lista local
          setUsers(users.map(user => 
            user.id === userId ? { 
              ...user, 
              role: newRole,
              updated_at: new Date().toISOString()
            } : user
          ))

          alert('Perfil alterado com sucesso!')
        } catch (error) {
          console.error('Erro ao alterar role:', error)
          alert('Erro inesperado ao alterar perfil')
        } finally {
          setActionLoading(false)
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  // Desativar/ativar usuário
  const handleToggleUserStatus = async (userId: string, activate: boolean) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setConfirmDialog({
      isOpen: true,
      title: activate ? 'Ativar Usuário' : 'Desativar Usuário',
      message: `Tem certeza que deseja ${activate ? 'ativar' : 'desativar'} o usuário "${user.nome}"?`,
      variant: activate ? 'info' : 'danger',
      action: async () => {
        try {
          setActionLoading(true)
          
          if (!activate) {
            // Verificar se usuário tem agendamentos futuros
            const { data: agendamentosFuturos, error: checkError } = await supabase
              .from('appointments')
              .select('id')
              .or(`cliente_id.eq.${userId},barbeiro_id.eq.${userId}`)
              .gte('data_agendamento', new Date().toISOString())
              .neq('status', 'cancelado')

            if (checkError) {
              throw checkError
            }

            if (agendamentosFuturos && agendamentosFuturos.length > 0) {
              alert(`Usuário possui ${agendamentosFuturos.length} agendamento(s) futuro(s). Cancele-os primeiro.`)
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

          // Atualizar lista local
          setUsers(users.map(user => 
            user.id === userId ? { 
              ...user, 
              ativo: activate,
              updated_at: new Date().toISOString()
            } : user
          ))

          alert(`Usuário ${activate ? 'ativado' : 'desativado'} com sucesso!`)
        } catch (error) {
          console.error('Erro ao alterar status:', error)
          alert('Erro inesperado ao alterar status do usuário')
        } finally {
          setActionLoading(false)
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  // Função para deletar usuário (ação perigosa)
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setConfirmDialog({
      isOpen: true,
      title: 'Deletar Usuário',
      message: `ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja deletar permanentemente o usuário "${user.nome}"?`,
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
            console.error('Erro ao deletar usuário:', error)
            alert('Erro ao deletar usuário: ' + error.message)
            return
          }

          // Remover da lista local
          setUsers(users.filter(u => u.id !== userId))
          alert('Usuário deletado com sucesso!')
        } catch (error) {
          console.error('Erro ao deletar usuário:', error)
          alert('Erro inesperado ao deletar usuário')
        } finally {
          setActionLoading(false)
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  // Callback para quando usuário é editado
  const handleUserSaved = (updatedUser: UserProfile) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
  }

  // Obter cor do badge baseado no role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error text-white'
      case 'barber':
        return 'bg-primary-gold text-primary-black'
      case 'client':
        return 'bg-info text-white'
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
      case 'client':
        return 'Cliente'
      default:
        return role
    }
  }

  return (
    <PermissionGuard 
      requiredPermissions={[PERMISSIONS.MANAGE_USERS]} 
      type="component"
      accessDeniedMessage="Apenas administradores podem gerenciar usuários."
    >
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Clientes
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 mr-4">
                {filteredUsers.length} cliente{filteredUsers.length !== 1 ? 's' : ''}
              </div>
              <PermissionGuard requiredPermissions={[PERMISSIONS.CREATE_USERS]}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNovoFuncionarioOpen(true)}
                  className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black border-primary-gold"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Cliente
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
                  onClick={handleExportUsers}
                  disabled={loading || filteredUsers.length === 0}
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
              <option value="all" className="bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white">Todos os clientes</option>
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

        {/* Lista de usuários */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Carregando usuários...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-6 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite hover:from-primary-gold/5 hover:to-primary-gold/10 hover:border-primary-gold/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-primary-gold rounded-full flex items-center justify-center text-primary-black font-semibold">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.nome.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Informações do usuário */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{user.nome}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                    {user.telefone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.telefone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Badge do status */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.ativo 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-error/10 text-error border border-error/20'
                  }`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>

                  {/* Badge do role */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>

                  {/* Data de criação */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    {/* Status do cliente (sempre cliente) */}
                    <span className="text-xs px-2 py-1 bg-info/10 text-info border border-info/20 rounded">
                      Cliente
                    </span>

                    {/* Botão de editar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditModalOpen(true)
                      }}
                      disabled={loading || actionLoading}
                      title="Editar usuário"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Botão de ativar/desativar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, !user.ativo)}
                      disabled={loading || actionLoading}
                      title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                      className={user.ativo 
                        ? "text-warning hover:text-warning hover:bg-warning/10"
                        : "text-success hover:text-success hover:bg-success/10"
                      }
                    >
                      {user.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>

                    {/* Botão de deletar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={loading || actionLoading}
                      title="Deletar usuário"
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-info">
              {users.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total de Clientes</div>
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
        onSave={handleUserSaved}
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

      {/* Modal de novo funcionário */}
      <NovoFuncionarioModal
        isOpen={isNovoFuncionarioOpen}
        onClose={() => setIsNovoFuncionarioOpen(false)}
        onSuccess={() => {
          setIsNovoFuncionarioOpen(false)
          loadUsers() // Recarregar lista de usuários
        }}
      />
    </Card>
  </PermissionGuard>
  )
}
