'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Eye } from 'lucide-react'

import { useAdminNotificacoes } from '@/hooks/use-admin-notificacoes'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'

import type { AdminNotification, TipoAdminNotification } from '@/types/notifications'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    adminNotifications,
    markAdminNotificationAsRead,
    loadAdminNotifications
  } = useAdminNotificacoes()

  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Atualizar contador de não lidas
  useEffect(() => {
    const unread = adminNotifications.filter(n => !n.lida).length
    setUnreadCount(unread)
  }, [adminNotifications])

  // Carregar notificações periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      loadAdminNotifications()
    }, 30000) // A cada 30 segundos

    return () => clearInterval(interval)
  }, [loadAdminNotifications])

  // Obter cor do tipo
  const getTipoColor = (tipo: TipoAdminNotification) => {
    switch (tipo) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'info':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  // Marcar como lida
  const handleMarkAsRead = async (notification: AdminNotification) => {
    if (!notification.lida) {
      await markAdminNotificationAsRead(notification.id)
    }
    
    // Se tem URL de ação, navegar
    if (notification.acao_url) {
      window.location.href = notification.acao_url
    }
  }

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    const unreadNotifications = adminNotifications.filter(n => !n.lida)
    await Promise.all(
      unreadNotifications.map(n => markAdminNotificationAsRead(n.id))
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Botão de notificações */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-secondary-graphite-light border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="max-h-96 overflow-y-auto">
              {adminNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                adminNotifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-secondary-graphite transition-colors",
                      getTipoColor(notification.tipo),
                      !notification.lida && "font-medium"
                    )}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "text-sm text-gray-900 dark:text-white truncate",
                          !notification.lida && "font-semibold"
                        )}>
                          {notification.titulo}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 overflow-hidden">
                          {notification.mensagem}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {!notification.lida && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {notification.acao_url && (
                          <Eye className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {adminNotifications.length > 10 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <Button variant="outline" size="sm">
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}