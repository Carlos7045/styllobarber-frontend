/**
 * Exemplo de componente DataTable com tipagem forte
 */

import React, { useMemo, useCallback } from 'react'
import { TableProps, TableColumn } from '@/shared/types/components'
import { BaseEntity, SortOptions } from '@/shared/types/base'

// Componente genérico de tabela tipada
export function TypedDataTable<T extends BaseEntity>({
    data,
    columns,
    loading = false,
    empty,
    keyExtractor,
    onRowClick,
    onRowDoubleClick,
    selectable = false,
    selectedRows = [],
    onSelectionChange,
    sortable = false,
    sortBy,
    sortDirection = 'asc',
    onSort,
    pagination,
    stickyHeader = false,
    striped = false,
    bordered = false,
    compact = false,
    className = '',
    'data-testid': testId,
    ...props
}: TableProps<T>) {
    // Memoizar o extrator de chave padrão
    const defaultKeyExtractor = useCallback((item: T, index: number) => {
        return item.id || index.toString()
    }, [])

    const getItemKey = keyExtractor || defaultKeyExtractor

    // Memoizar dados ordenados
    const sortedData = useMemo(() => {
        if (!sortable || !sortBy || !onSort) {
            return data
        }

        const column = columns.find(col => col.key === sortBy)
        if (!column) return data

        return [...data].sort((a, b) => {
            let aValue: any
            let bValue: any

            if (column.accessor) {
                if (typeof column.accessor === 'function') {
                    aValue = column.accessor(a)
                    bValue = column.accessor(b)
                } else {
                    aValue = a[column.accessor]
                    bValue = b[column.accessor]
                }
            } else {
                aValue = (a as any)[column.key]
                bValue = (b as any)[column.key]
            }

            // Tratamento de valores nulos/undefined
            if (aValue == null && bValue == null) return 0
            if (aValue == null) return 1
            if (bValue == null) return -1

            // Comparação
            let comparison = 0
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue)
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue
            } else if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime()
            } else {
                comparison = String(aValue).localeCompare(String(bValue))
            }

            return sortDirection === 'desc' ? -comparison : comparison
        })
    }, [data, columns, sortBy, sortDirection, sortable, onSort])

    // Handler para clique no cabeçalho (ordenação)
    const handleHeaderClick = useCallback((column: TableColumn<T>) => {
        if (!column.sortable || !onSort) return

        const newDirection = sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
        onSort(column.key, newDirection)
    }, [sortBy, sortDirection, onSort])

    // Handler para seleção de linha
    const handleRowSelection = useCallback((itemKey: string, selected: boolean) => {
        if (!onSelectionChange) return

        const newSelection = selected
            ? [...selectedRows, itemKey]
            : selectedRows.filter(key => key !== itemKey)

        onSelectionChange(newSelection)
    }, [selectedRows, onSelectionChange])

    // Handler para seleção de todas as linhas
    const handleSelectAll = useCallback((selected: boolean) => {
        if (!onSelectionChange) return

        const newSelection = selected
            ? sortedData.map((item, index) => getItemKey(item, index))
            : []

        onSelectionChange(newSelection)
    }, [sortedData, getItemKey, onSelectionChange])

    // Renderizar célula
    const renderCell = useCallback((column: TableColumn<T>, item: T, index: number) => {
        let value: any

        if (column.accessor) {
            if (typeof column.accessor === 'function') {
                value = column.accessor(item)
            } else {
                value = item[column.accessor]
            }
        } else {
            value = (item as any)[column.key]
        }

        if (column.render) {
            return column.render(value, item, index)
        }

        // Formatação padrão baseada no tipo
        if (value == null) {
            return <span className="text-gray-400">—</span>
        }

        if (value instanceof Date) {
            return value.toLocaleDateString()
        }

        if (typeof value === 'boolean') {
            return (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${value
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {value ? 'Sim' : 'Não'}
                </span>
            )
        }

        return String(value)
    }, [])

    // Classes CSS
    const tableClasses = [
        'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
        bordered && 'border border-gray-200 dark:border-gray-700',
        className
    ].filter(Boolean).join(' ')

    const headerClasses = [
        'bg-gray-50 dark:bg-gray-800',
        stickyHeader && 'sticky top-0 z-10'
    ].filter(Boolean).join(' ')

    const bodyClasses = 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'

    // Loading state
    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                ))}
            </div>
        )
    }

    // Empty state
    if (sortedData.length === 0) {
        return (
            <div className="text-center py-12">
                {empty || (
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            Nenhum dado encontrado
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Tente ajustar os filtros ou adicionar novos itens
                        </p>
                    </div>
                )}
            </div>
        )
    }

    const allSelected = selectedRows.length === sortedData.length && sortedData.length > 0
    const someSelected = selectedRows.length > 0 && selectedRows.length < sortedData.length

    return (
        <div className="overflow-x-auto" data-testid={testId} {...props}>
            <table className={tableClasses}>
                {/* Header */}
                <thead className={headerClasses}>
                    <tr>
                        {selectable && (
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = someSelected
                                    }}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                        )}
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                                    } ${column.headerClassName || ''}`}
                                style={{
                                    width: column.width,
                                    minWidth: column.minWidth,
                                    maxWidth: column.maxWidth,
                                    textAlign: column.align || 'left'
                                }}
                                onClick={() => handleHeaderClick(column)}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{column.header}</span>
                                    {column.sortable && sortBy === column.key && (
                                        <span className="text-primary-600 dark:text-primary-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody className={bodyClasses}>
                    {sortedData.map((item, index) => {
                        const itemKey = getItemKey(item, index)
                        const isSelected = selectedRows.includes(itemKey)

                        return (
                            <tr
                                key={itemKey}
                                className={`
                  ${striped && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                  ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  ${compact ? 'h-10' : 'h-12'}
                  transition-colors
                `}
                                onClick={() => onRowClick?.(item, index)}
                                onDoubleClick={() => onRowDoubleClick?.(item, index)}
                            >
                                {selectable && (
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleRowSelection(itemKey, e.target.checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </td>
                                )}
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${column.className || ''
                                            }`}
                                        style={{
                                            width: column.width,
                                            minWidth: column.minWidth,
                                            maxWidth: column.maxWidth,
                                            textAlign: column.align || 'left'
                                        }}
                                    >
                                        {renderCell(column, item, index)}
                                    </td>
                                ))}
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Pagination */}
            {pagination && (
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} até{' '}
                            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
                            {pagination.total} resultados
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => pagination.onPageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm">
                                Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
                            </span>
                            <button
                                onClick={() => pagination.onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Exemplo de uso específico
interface User extends BaseEntity {
    name: string
    email: string
    role: 'admin' | 'user'
    last_login: string
    active: boolean
}

export function UserTable() {
    const users: User[] = [
        {
            id: '1',
            created_at: '2024-01-01T00:00:00Z',
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'admin',
            last_login: '2024-01-15T10:30:00Z',
            active: true
        },
        // ... mais usuários
    ]

    const columns: TableColumn<User>[] = [
        {
            key: 'name',
            header: 'Nome',
            sortable: true,
            render: (value, user) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{value}</span>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true
        },
        {
            key: 'role',
            header: 'Função',
            render: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                    {value === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
            )
        },
        {
            key: 'last_login',
            header: 'Último Login',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('pt-BR')
        },
        {
            key: 'active',
            header: 'Status',
            render: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {value ? 'Ativo' : 'Inativo'}
                </span>
            )
        }
    ]

    return (
        <TypedDataTable
            data={users}
            columns={columns}
            sortable
            selectable
            striped
            onRowClick={(user) => console.log('Clicked user:', user)}
            onSort={(field, direction) => console.log('Sort:', field, direction)}
            onSelectionChange={(selected) => console.log('Selected:', selected)}
            data-testid="users-table"
        />
    )
}