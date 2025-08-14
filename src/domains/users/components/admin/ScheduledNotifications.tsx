'use client'

import { useState } from 'react'
import { Clock, Calendar, Mail, MessageSquare, Bell, Smartphone, Trash2, Plus, Search, Filter, Play, Pause } from 'lucide-react'

import { useAdminNotificacoes } from '@/domains/users/hooks/use-admin-notificacoes'
import { Button, Input, Card, CardContent } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import { formatDate } from '@/shared/utils/date-utils'

import type {
    ScheduledNotification,
    TipoNotificacao,
    StatusAgendamento
} from '@/types/notifications'

export function ScheduledNotifications() {
    const {
        scheduledNotifications,
        templates,
        loading,
        loadScheduledNotifications
    } = useAdminNotificacoes()

    // Estados locais
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusAgendamento | ''>('')

    // Filtrar notificações
    const filteredNotifications = scheduledNotifications.filter(notification => {
        const matchesSearch = notification.destinatario.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = !statusFilter || notification.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Obter template
    const getTemplate = (templateId: string) => {
        return templates.find(t => t.id === templateId)
    }

    // Obter ícone do tipo
    const getTipoIcon = (tipo: TipoNotificacao) => {
        switch (tipo) {
            case 'email':
                return <Mail className="h-4 w-4" />
            case 'sms':
                return <MessageSquare className="h-4 w-4" />
            case 'push':
                return <Bell className="h-4 w-4" />
            case 'whatsapp':
                return <Smartphone className="h-4 w-4" />
        }
    }

    // Obter cor do status
    const getStatusColor = (status: StatusAgendamento) => {
        switch (status) {
            case 'agendado':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
            case 'processado':
                return 'text-green-600 bg-green-100 dark:bg-green-900/20'
            case 'cancelado':
                return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
        }
    }

    // Verificar se está atrasado
    const isOverdue = (agendadoPara: string) => {
        return new Date(agendadoPara) < new Date()
    }

    // Cancelar notificação agendada
    const handleCancelNotification = async (id: string) => {
        if (confirm('Tem certeza que deseja cancelar esta notificação agendada?')) {
            // Implementar cancelamento
            console.log('Cancelar notificação:', id)
        }
    }

    // Processar notificação agendada manualmente
    const handleProcessNotification = async (id: string) => {
        if (confirm('Tem certeza que deseja processar esta notificação agora?')) {
            // Implementar processamento manual
            console.log('Processar notificação:', id)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header com busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar por destinatário..."
                        leftIcon={<Search className="h-4 w-4" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusAgendamento | '')}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
                    >
                        <option value="">Todos os status</option>
                        <option value="agendado">Agendado</option>
                        <option value="processado">Processado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>

                    <Button
                        variant="outline"
                        onClick={loadScheduledNotifications}
                        disabled={loading}
                    >
                        <Clock className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Agendadas</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {scheduledNotifications.filter(n => n.status === 'agendado').length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Processadas</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {scheduledNotifications.filter(n => n.status === 'processado').length}
                                </p>
                            </div>
                            <Play className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {scheduledNotifications.filter(n =>
                                        n.status === 'agendado' && isOverdue(n.agendado_para)
                                    ).length}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de notificações agendadas */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando notificações agendadas...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma notificação agendada</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm || statusFilter
                                ? 'Nenhuma notificação corresponde aos filtros aplicados.'
                                : 'Ainda não há notificações agendadas.'}
                        </p>
                    </Card>
                ) : (
                    filteredNotifications.map((notification) => {
                        const template = getTemplate(notification.template_id)
                        const overdue = isOverdue(notification.agendado_para)

                        return (
                            <Card
                                key={notification.id}
                                className={cn(
                                    "hover:shadow-md transition-shadow",
                                    overdue && notification.status === 'agendado' && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {template && (
                                                    <div className="flex items-center gap-2">
                                                        {getTipoIcon(template.tipo)}
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                                            {template.tipo}
                                                        </span>
                                                    </div>
                                                )}

                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    getStatusColor(notification.status)
                                                )}>
                                                    {notification.status}
                                                </span>

                                                {overdue && notification.status === 'agendado' && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
                                                        Atrasada
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Destinatário</p>
                                                    <p className="font-medium">{notification.destinatario}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Agendado para</p>
                                                    <p className={cn(
                                                        "font-medium",
                                                        overdue && notification.status === 'agendado' && "text-red-600 dark:text-red-400"
                                                    )}>
                                                        {formatDate(new Date(notification.agendado_para))}
                                                    </p>
                                                </div>
                                            </div>

                                            {template && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Template</p>
                                                    <p className="text-sm font-medium">{template.nome}</p>
                                                </div>
                                            )}

                                            {notification.dados_contexto && Object.keys(notification.dados_contexto).length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Variáveis</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(notification.dados_contexto).slice(0, 3).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded"
                                                            >
                                                                {key}: {String(value).substring(0, 20)}
                                                            </span>
                                                        ))}
                                                        {Object.keys(notification.dados_contexto).length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 text-xs rounded">
                                                                +{Object.keys(notification.dados_contexto).length - 3} mais
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Criado em {formatDate(new Date(notification.created_at))}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {notification.status === 'agendado' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleProcessNotification(notification.id)}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelNotification(notification.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Pause className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelNotification(notification.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
