// Componente para listar e gerenciar despesas

'use client'

import React, { useState } from 'react'
import { useExpenses } from '../hooks/use-expenses'
import { ExpenseForm } from './ExpenseForm'
import { Despesa } from '../types'
import { ExpenseFilters } from '../services/expense-service'
import { formatCurrency, formatDate } from '../utils'

interface ExpenseListProps {
  showFilters?: boolean
  showActions?: boolean
  initialFilters?: ExpenseFilters
}

export function ExpenseList({ 
  showFilters = true, 
  showActions = true,
  initialFilters 
}: ExpenseListProps) {
  const {
    expenses,
    categories,
    loading,
    error,
    total,
    createExpense,
    updateExpense,
    deleteExpense,
    loadExpenses,
    clearError
  } = useExpenses({ filters: initialFilters })

  // Estado local
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Despesa | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters || {})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Aplicar filtros
  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    loadExpenses(updatedFilters)
  }

  // Limpar filtros
  const clearFilters = () => {
    const clearedFilters: ExpenseFilters = {}
    setFilters(clearedFilters)
    loadExpenses(clearedFilters)
  }

  // Salvar despesa
  const handleSave = async (data: any) => {
    try {
      if (editingExpense) {
        await updateExpense(data)
      } else {
        await createExpense(data)
      }
      
      setShowForm(false)
      setEditingExpense(null)
    } catch (error) {
      // Erro já tratado pelo hook
    }
  }

  // Cancelar edição
  const handleCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  // Iniciar edição
  const startEdit = (expense: Despesa) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  // Confirmar exclusão
  const confirmDelete = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId)
      setShowDeleteConfirm(null)
    } catch (error) {
      // Erro já tratado pelo hook
    }
  }

  // Obter cor da categoria
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.cor || '#6B7280'
  }

  // Obter nome da categoria
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.nome || 'Categoria Desconhecida'
  }

  if (showForm) {
    return (
      <ExpenseForm
        expense={editingExpense || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Cabeçalho */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Despesas Operacionais
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {total} despesa{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
            </p>
          </div>
          
          {showActions && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nova Despesa
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={filters.categoriaId || ''}
                onChange={(e) => handleFilterChange({ categoriaId: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) => handleFilterChange({ dataInicio: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => handleFilterChange({ dataFim: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.recorrente === undefined ? '' : filters.recorrente.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  handleFilterChange({ 
                    recorrente: value === '' ? undefined : value === 'true' 
                  })
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="false">Avulsas</option>
                <option value="true">Recorrentes</option>
              </select>
            </div>
          </div>

          {/* Botões de filtro */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-gray-600 bg-gray-100 rounded text-sm hover:bg-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="text-red-800">
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando despesas...</p>
        </div>
      )}

      {/* Lista de despesas */}
      {!loading && (
        <div className="divide-y divide-gray-200">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">💰</div>
              <p>Nenhuma despesa encontrada</p>
              <p className="text-sm mt-1">
                {showActions ? 'Clique em "Nova Despesa" para começar' : 'Ajuste os filtros para ver mais resultados'}
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.categoria_id) }}
                      />
                      <h3 className="font-medium text-gray-900">
                        {expense.descricao}
                      </h3>
                      {expense.recorrente && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {expense.frequencia?.toLowerCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Valor:</span>
                        <span className="ml-2 text-lg font-semibold text-red-600">
                          {formatCurrency(expense.valor)}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Categoria:</span>
                        <span className="ml-2">{getCategoryName(expense.categoria_id)}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Data:</span>
                        <span className="ml-2">{formatDate(expense.data_despesa)}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Comprovantes:</span>
                        <span className="ml-2">
                          {expense.comprovantes?.length || 0} arquivo{(expense.comprovantes?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {expense.observacoes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Observações:</span>
                        <span className="ml-2">{expense.observacoes}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  {showActions && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(expense.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para resumo de despesas
interface ExpenseSummaryProps {
  periodo?: { inicio: string; fim: string }
}

export function ExpenseSummary({ periodo }: ExpenseSummaryProps) {
  const { expenses, categories, loading } = useExpenses({
    filters: periodo ? {
      dataInicio: periodo.inicio,
      dataFim: periodo.fim
    } : undefined
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const totalDespesas = expenses.reduce((sum, expense) => sum + expense.valor, 0)
  const despesasRecorrentes = expenses.filter(e => e.recorrente).length
  const despesasAvulsas = expenses.length - despesasRecorrentes

  // Agrupar por categoria
  const despesasPorCategoria = expenses.reduce((acc, expense) => {
    const categoryId = expense.categoria_id
    if (!acc[categoryId]) {
      const category = categories.find(c => c.id === categoryId)
      acc[categoryId] = {
        nome: category?.nome || 'Categoria Desconhecida',
        cor: category?.cor || '#6B7280',
        total: 0,
        count: 0
      }
    }
    acc[categoryId].total += expense.valor
    acc[categoryId].count += 1
    return acc
  }, {} as Record<string, { nome: string; cor: string; total: number; count: number }>)

  const categoriasSorted = Object.values(despesasPorCategoria)
    .sort((a, b) => b.total - a.total)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Resumo de Despesas
      </h3>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-red-600 text-sm font-medium">Total de Despesas</div>
          <div className="text-2xl font-bold text-red-900">
            {formatCurrency(totalDespesas)}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Recorrentes</div>
          <div className="text-2xl font-bold text-blue-900">
            {despesasRecorrentes}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Avulsas</div>
          <div className="text-2xl font-bold text-green-900">
            {despesasAvulsas}
          </div>
        </div>
      </div>

      {/* Despesas por categoria */}
      {categoriasSorted.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Por Categoria</h4>
          <div className="space-y-2">
            {categoriasSorted.map((categoria, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <span className="text-sm text-gray-700">{categoria.nome}</span>
                  <span className="text-xs text-gray-500">({categoria.count})</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(categoria.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Nenhuma despesa no período selecionado</p>
        </div>
      )}
    </div>
  )
}