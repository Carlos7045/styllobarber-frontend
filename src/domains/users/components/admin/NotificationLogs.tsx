'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Bell, 
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react'

import { useAdminNotificacoes } from '@/domains/users/hooks/use-admin-notificacoes'
import { Button, Input, Card, CardContent } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import { formatDate } from '@/shared/utils/date-utils'

import type { 
  NotificationLog, 
  TipoNotificacao, 
  StatusNotificacao,
  NotificationFilters 
} from '@/types/notifications'

export function NotificationLogs() {
  const {
    logs,
    templates,
    logsLoading,
    loadLogs
  } = useAdminNotificacoes()

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<NotificationFilters>({})
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Carregar logs iniciais
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Aplicar filtros
  const applyFilters = () => {
    loadLogs(filters)
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    loadLogs()
  }

  // Filtrar logs localmente por busca
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      log.destinatario.toLowerCase().includes(searchLower) ||
      log.conteudo.toLowerCase().includes(searchLower) ||
      (log.assunto && log.assunto.toLowerCase().includes(searchLower))
    )
  })

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

  // Obter ícone e cor do status
  const getStatusInfo = (status: StatusNotificacao) => {
    switch (status) {
      case 'enviado':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
        }
      case 'falhou':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
        }
      case 'pendente':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
        }
      case 'cancelado':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
        }
    }
  }

  // Exportar logs
  const exportLogs = () => {
    const csvContent = [
      ['Data', 'Tipo', 'Destinatário', 'Status', 'Tentativas', 'Assunto'].join(','),
      ...filteredLogs.map(log => [
        formatDate(log.created_at),
        log.tipo,
        log.destinatario,
        log.status,
        log.tentativas,
        log.assunto || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notification-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1">
          <Input
            placeholder="Buscar por destinatário, assunto ou conteúdo..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => loadLogs(filters)}
            disabled={logsLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", logsLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={filters.tipo || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value as TipoNotificacao || undefined }))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
                >
                  <option value="">Todos</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as StatusNotificacao || undefined }))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
                >
                  <option value="">Todos</option>
                  <option value="enviado">Enviado</option>
                  <option value="falhou">Falhou</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.data_inicio || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, data_inicio: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.data_fim || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, data_fim: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters}>
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de logs */}
      <div className="space-y-4">
        {logsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || Object.keys(filters).length > 0 
                ? 'Nenhum log corresponde aos filtros aplicados.' 
                : 'Ainda não há logs de notificações.'}
            </p>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const statusInfo = getStatusInfo(log.status)
            const template = templates.find(t => t.id === log.template_id)
            
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(log.tipo)}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                            {log.tipo}
                          </span>
                        </div>
                        
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          statusInfo.color
                        )}>
                          {statusInfo.icon}
                          {log.status}
                        </span>

                        {log.tentativas > 1 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs rounded-full">
                            {log.tentativas} tentativas
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Destinatário</p>
                          <p className="font-medium">{log.destinatario}</p>
                        </div>
                        
                        {log.assunto && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Assunto</p>
                            <p className="font-medium truncate">{log.assunto}</p>
                          </div>
                        )}
                      </div>

                      {template && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Template</p>
                          <p className="text-sm font-medium">{template.nome}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>Criado em {formatDate(log.created_at)}</span>
                        {log.enviado_em && (
                          <span>Enviado em {formatDate(log.enviado_em)}</span>
                        )}
                      </div>

                      {log.erro_detalhes && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-400">
                          <strong>Erro:</strong> {log.erro_detalhes}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de detalhes do log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-graphite-light rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Detalhes da Notificação
              </h2>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <div className="flex items-center gap-2">
                      {getTipoIcon(selectedLog.tipo)}
                      <span className="capitalize">{selectedLog.tipo}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusInfo(selectedLog.status).icon}
                      <span className="capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Destinatário</p>
                  <p className="font-medium">{selectedLog.destinatario}</p>
                </div>

                {selectedLog.assunto && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assunto</p>
                    <p className="font-medium">{selectedLog.assunto}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conteúdo</p>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-secondary-graphite rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{selectedLog.conteudo}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tentativas</p>
                    <p className="font-medium">{selectedLog.tentativas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                  </div>
                </div>

                {selectedLog.enviado_em && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enviado em</p>
                    <p className="font-medium">{formatDate(selectedLog.enviado_em)}</p>
                  </div>
                )}

                {selectedLog.erro_detalhes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Detalhes do Erro</p>
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-400">{selectedLog.erro_detalhes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
