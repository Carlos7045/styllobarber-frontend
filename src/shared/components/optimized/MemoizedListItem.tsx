
// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
import React, { memo, useCallback } from 'react'

import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

interface MemoizedListItemProps {
  id: string | number
  title: string
  subtitle?: string
  description?: string
  avatar?: React.ReactNode
  badge?: React.ReactNode
  status?: 'active' | 'inactive' | 'pending' | 'error'
  actions?: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
  onClick?: () => void
  className?: string
  showActions?: boolean
  animated?: boolean
}

/**
 * Item de lista memoizado para evitar re-renders desnecessários
 */
function MemoizedListItemComponent({
  id,
  title,
  subtitle,
  description,
  avatar,
  badge,
  status = 'active',
  actions = [],
  onClick,
  className = '',
  showActions = true,
  animated = true
}: MemoizedListItemProps) {
  // Memoizar handler de clique
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  // Memoizar handler de ação
  const handleActionClick = useCallback((actionFn: () => void, e: React.MouseEvent) => {
    e.stopPropagation()
    actionFn()
  }, [])

  // Definir cores do status
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const statusLabels = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    error: 'Erro'
  }

  const itemContent = (
    <div
      className={`
        flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
        transition-colors duration-200 cursor-pointer
        ${className}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Avatar */}
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h3>
            {badge}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${statusColors[status]}
          `}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* Ações */}
      {showActions && actions.length > 0 && (
        <div className="flex-shrink-0 ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e) => handleActionClick(action.onClick, e)}
                    className={action.variant === 'destructive' ? 'text-red-600 dark:text-red-400' : ''}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {itemContent}
      </motion.div>
    )
  }

  return itemContent
}

export const MemoizedListItem = memo(MemoizedListItemComponent)

/**
 * Comparador customizado para casos específicos
 */
export const MemoizedListItemWithCustomCompare = memo(
  MemoizedListItemComponent,
  (prevProps, nextProps) => {
    // Comparação customizada para otimizar ainda mais
    return (
      prevProps.id === nextProps.id &&
      prevProps.title === nextProps.title &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.status === nextProps.status &&
      prevProps.showActions === nextProps.showActions &&
      prevProps.actions.length === nextProps.actions.length
    )
  }
)