// Hook para gerenciar despesas no React

import { useState, useEffect, useCallback } from 'react'
import { expenseService } from '../services/expense-service'
import { categoryService } from '../services/category-service'
import { Despesa, CategoriaFinanceira } from '../types'
import { 
  CreateExpenseData, 
  UpdateExpenseData, 
  ExpenseFilters, 
  ExpenseReport,
  BudgetAlert 
} from '../services/expense-service'

// Tipos para o hook
export interface UseExpensesReturn {
  // Estado
  expenses: Despesa[]
  categories: CategoriaFinanceira[]
  report: ExpenseReport | null
  budgetAlerts: BudgetAlert[]
  loading: boolean
  error: string | null
  total: number

  // Ações
  createExpense: (data: CreateExpenseData) => Promise<Despesa>
  updateExpense: (data: UpdateExpenseData) => Promise<Despesa>
  deleteExpense: (id: string) => Promise<void>
  loadExpenses: (filters?: ExpenseFilters) => Promise<void>
  loadCategories: (tipo?: 'RECEITA' | 'DESPESA') => Promise<void>
  generateReport: (periodo: { inicio: string; fim: string }) => Promise<void>
  checkBudgetAlerts: () => Promise<void>
  processRecurringExpenses: () => Promise<void>
  uploadReceipt: (expenseId: string, file: File) => Promise<void>
  removeReceipt: (expenseId: string, fileUrl: string) => Promise<void>
  clearError: () => void
  refresh: () => Promise<void>
}

export interface UseExpensesOptions {
  autoLoad?: boolean
  filters?: ExpenseFilters
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

// Hook principal para gerenciar despesas
export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { autoLoad = true, filters, onError, onSuccess } = options

  // Estado
  const [expenses, setExpenses] = useState<Despesa[]>([])
  const [categories, setCategories] = useState<CategoriaFinanceira[]>([])
  const [report, setReport] = useState<ExpenseReport | null>(null)
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Função para tratar erros
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage
    setError(errorMessage)
    onError?.(errorMessage)
    console.error(defaultMessage, err)
  }, [onError])

  // Função para tratar sucesso
  const handleSuccess = useCallback((message: string) => {
    setError(null)
    onSuccess?.(message)
  }, [onSuccess])

  // Criar despesa
  const createExpense = useCallback(async (data: CreateExpenseData): Promise<Despesa> => {
    try {
      setLoading(true)
      setError(null)

      // Validar dados
      const validation = expenseService.validateExpenseData(data)
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`)
      }

      const newExpense = await expenseService.createExpense(data)
      
      // Atualizar lista local
      setExpenses(prev => [newExpense, ...prev])
      setTotal(prev => prev + 1)

      handleSuccess('Despesa criada com sucesso')
      return newExpense
    } catch (err) {
      handleError(err, 'Erro ao criar despesa')
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Atualizar despesa
  const updateExpense = useCallback(async (data: UpdateExpenseData): Promise<Despesa> => {
    try {
      setLoading(true)
      setError(null)

      const updatedExpense = await expenseService.updateExpense(data)
      
      // Atualizar lista local
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === data.id ? updatedExpense : expense
        )
      )

      handleSuccess('Despesa atualizada com sucesso')
      return updatedExpense
    } catch (err) {
      handleError(err, 'Erro ao atualizar despesa')
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Deletar despesa
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      await expenseService.deleteExpense(id)
      
      // Remover da lista local
      setExpenses(prev => prev.filter(expense => expense.id !== id))
      setTotal(prev => prev - 1)

      handleSuccess('Despesa deletada com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao deletar despesa')
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Carregar despesas
  const loadExpenses = useCallback(async (loadFilters?: ExpenseFilters): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const filtersToUse = loadFilters || filters || {}
      const result = await expenseService.listExpenses(filtersToUse)
      
      setExpenses(result.despesas)
      setTotal(result.total)
    } catch (err) {
      handleError(err, 'Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }, [filters, handleError])

  // Carregar categorias
  const loadCategories = useCallback(async (tipo?: 'RECEITA' | 'DESPESA'): Promise<void> => {
    try {
      setError(null)
      const categoriesList = await categoryService.listCategories({ 
        tipo, 
        ativo: true 
      })
      setCategories(categoriesList)
    } catch (err) {
      handleError(err, 'Erro ao carregar categorias')
    }
  }, [handleError])

  // Gerar relatório
  const generateReport = useCallback(async (periodo: { inicio: string; fim: string }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const reportData = await expenseService.generateExpenseReport(periodo)
      setReport(reportData)

      handleSuccess('Relatório gerado com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Verificar alertas de orçamento
  const checkBudgetAlerts = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      const alerts = await expenseService.checkBudgetAlerts()
      setBudgetAlerts(alerts)
    } catch (err) {
      handleError(err, 'Erro ao verificar alertas de orçamento')
    }
  }, [handleError])

  // Processar despesas recorrentes
  const processRecurringExpenses = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const result = await expenseService.processRecurringExpenses()
      
      if (result.created.length > 0) {
        // Atualizar lista local com novas despesas
        setExpenses(prev => [...result.created, ...prev])
        setTotal(prev => prev + result.created.length)
        
        handleSuccess(`${result.created.length} despesas recorrentes processadas`)
      } else {
        handleSuccess('Nenhuma despesa recorrente para processar')
      }

      if (result.errors.length > 0) {
        console.warn('Erros no processamento:', result.errors)
      }
    } catch (err) {
      handleError(err, 'Erro ao processar despesas recorrentes')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Upload de comprovante
  const uploadReceipt = useCallback(async (expenseId: string, file: File): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Implementar upload real do arquivo
      // Por enquanto, simular URL do arquivo
      const fileUrl = `uploads/receipts/${expenseId}/${file.name}`
      
      await expenseService.uploadReceipt(expenseId, fileUrl)
      
      // Atualizar despesa local
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === expenseId 
            ? { ...expense, comprovantes: [...(expense.comprovantes || []), fileUrl] }
            : expense
        )
      )

      handleSuccess('Comprovante enviado com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao enviar comprovante')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Remover comprovante
  const removeReceipt = useCallback(async (expenseId: string, fileUrl: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      await expenseService.removeReceipt(expenseId, fileUrl)
      
      // Atualizar despesa local
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === expenseId 
            ? { 
                ...expense, 
                comprovantes: (expense.comprovantes || []).filter(url => url !== fileUrl) 
              }
            : expense
        )
      )

      handleSuccess('Comprovante removido com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao remover comprovante')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Atualizar dados
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadExpenses(),
      loadCategories('DESPESA'),
      checkBudgetAlerts()
    ])
  }, [loadExpenses, loadCategories, checkBudgetAlerts])

  // Carregar dados iniciais
  useEffect(() => {
    if (autoLoad) {
      refresh()
    }
  }, [autoLoad, refresh])

  return {
    // Estado
    expenses,
    categories,
    report,
    budgetAlerts,
    loading,
    error,
    total,

    // Ações
    createExpense,
    updateExpense,
    deleteExpense,
    loadExpenses,
    loadCategories,
    generateReport,
    checkBudgetAlerts,
    processRecurringExpenses,
    uploadReceipt,
    removeReceipt,
    clearError,
    refresh
  }
}

// Hook específico para categorias
export function useCategories(tipo?: 'RECEITA' | 'DESPESA') {
  const [categories, setCategories] = useState<CategoriaFinanceira[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const categoriesList = await categoryService.listCategories({ 
        tipo, 
        ativo: true 
      })
      setCategories(categoriesList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias'
      setError(errorMessage)
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setLoading(false)
    }
  }, [tipo])

  const createCategory = useCallback(async (data: {
    nome: string
    tipo: 'RECEITA' | 'DESPESA'
    cor?: string
    orcamentoMensal?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const newCategory = await categoryService.createCategory(data)
      setCategories(prev => [...prev, newCategory])
      
      return newCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    clearError: () => setError(null)
  }
}

// Hook para alertas de orçamento
export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [loading, setLoading] = useState(false)

  const checkAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const budgetAlerts = await expenseService.checkBudgetAlerts()
      setAlerts(budgetAlerts)
    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAlerts()
    
    // Verificar alertas a cada 5 minutos
    const interval = setInterval(checkAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkAlerts])

  return {
    alerts,
    loading,
    checkAlerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(alert => alert.status === 'EXCEDIDO'),
    warningAlerts: alerts.filter(alert => alert.status === 'ATENCAO')
  }
}

// Hook para relatórios de despesas
export function useExpenseReports() {
  const [report, setReport] = useState<ExpenseReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(async (periodo: { inicio: string; fim: string }) => {
    try {
      setLoading(true)
      setError(null)
      
      const reportData = await expenseService.generateExpenseReport(periodo)
      setReport(reportData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório'
      setError(errorMessage)
      console.error('Erro ao gerar relatório:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateCurrentMonthReport = useCallback(async () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await generateReport({
      inicio: firstDay.toISOString().split('T')[0],
      fim: lastDay.toISOString().split('T')[0]
    })
  }, [generateReport])

  return {
    report,
    loading,
    error,
    generateReport,
    generateCurrentMonthReport,
    clearError: () => setError(null)
  }
}