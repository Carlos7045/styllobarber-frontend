// Componente para formulário de despesas

'use client'

import React, { useState, useEffect } from 'react'
import { useCategories } from '../hooks/use-expenses'
import { CreateExpenseData, UpdateExpenseData } from '../services/expense-service'
import { Despesa } from '../types'
import { formatCurrency } from '../utils'

interface ExpenseFormProps {
  expense?: Despesa
  onSave: (data: CreateExpenseData | UpdateExpenseData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ExpenseForm({ expense, onSave, onCancel, loading = false }: ExpenseFormProps) {
  const { categories, loading: categoriesLoading } = useCategories('DESPESA')

  // Estado do formulário
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoriaId: '',
    dataDespesa: new Date().toISOString().split('T')[0],
    recorrente: false,
    frequencia: '' as '' | 'MENSAL' | 'TRIMESTRAL' | 'ANUAL',
    observacoes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Preencher formulário se editando
  useEffect(() => {
    if (expense) {
      setFormData({
        descricao: expense.descricao,
        valor: expense.valor.toString(),
        categoriaId: expense.categoria_id,
        dataDespesa: expense.data_despesa,
        recorrente: expense.recorrente,
        frequencia: expense.frequencia || '',
        observacoes: expense.observacoes || ''
      })
    }
  }, [expense])

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    } else if (formData.descricao.trim().length < 3) {
      newErrors.descricao = 'Descrição deve ter pelo menos 3 caracteres'
    }

    const valor = parseFloat(formData.valor)
    if (!formData.valor || isNaN(valor) || valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero'
    }

    if (!formData.categoriaId) {
      newErrors.categoriaId = 'Categoria é obrigatória'
    }

    if (!formData.dataDespesa) {
      newErrors.dataDespesa = 'Data é obrigatória'
    }

    if (formData.recorrente && !formData.frequencia) {
      newErrors.frequencia = 'Frequência é obrigatória para despesas recorrentes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const data = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        categoriaId: formData.categoriaId,
        dataDespesa: formData.dataDespesa,
        recorrente: formData.recorrente,
        frequencia: formData.recorrente ? formData.frequencia : undefined,
        observacoes: formData.observacoes.trim() || undefined
      }

      if (expense) {
        await onSave({ id: expense.id, ...data } as UpdateExpenseData)
      } else {
        await onSave(data as CreateExpenseData)
      }
    } catch (error) {
      // Erro já tratado pelo componente pai
    }
  }

  // Calcular preview de recorrência
  const getRecurrencePreview = () => {
    if (!formData.recorrente || !formData.frequencia || !formData.valor) {
      return null
    }

    const valor = parseFloat(formData.valor)
    if (isNaN(valor)) return null

    const multipliers = {
      MENSAL: 12,
      TRIMESTRAL: 4,
      ANUAL: 1
    }

    const valorAnual = valor * multipliers[formData.frequencia]
    
    return {
      frequencia: formData.frequencia,
      valorAnual,
      proximaData: getNextRecurrenceDate()
    }
  }

  // Calcular próxima data de recorrência
  const getNextRecurrenceDate = () => {
    if (!formData.frequencia || !formData.dataDespesa) return null

    const date = new Date(formData.dataDespesa)
    
    switch (formData.frequencia) {
      case 'MENSAL':
        date.setMonth(date.getMonth() + 1)
        break
      case 'TRIMESTRAL':
        date.setMonth(date.getMonth() + 3)
        break
      case 'ANUAL':
        date.setFullYear(date.getFullYear() + 1)
        break
    }

    return date.toISOString().split('T')[0]
  }

  const recurrencePreview = getRecurrencePreview()

  return (
    <div className="bg-white dark:bg-secondary-graphite-light rounded-lg shadow-md p-6 border border-gray-200 dark:border-secondary-graphite hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {expense ? 'Editar Despesa' : 'Nova Despesa'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição *
          </label>
          <input
            type="text"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.descricao ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ex: Conta de luz, Material de limpeza..."
            disabled={loading}
          />
          {errors.descricao && (
            <p className="text-red-600 text-sm mt-1">{errors.descricao}</p>
          )}
        </div>

        {/* Valor e Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                className={`w-full border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.valor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0,00"
                disabled={loading}
              />
            </div>
            {errors.valor && (
              <p className="text-red-600 text-sm mt-1">{errors.valor}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              value={formData.categoriaId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.categoriaId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || categoriesLoading}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
            {errors.categoriaId && (
              <p className="text-red-600 text-sm mt-1">{errors.categoriaId}</p>
            )}
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data da Despesa *
          </label>
          <input
            type="date"
            value={formData.dataDespesa}
            onChange={(e) => setFormData(prev => ({ ...prev, dataDespesa: e.target.value }))}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dataDespesa ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.dataDespesa && (
            <p className="text-red-600 text-sm mt-1">{errors.dataDespesa}</p>
          )}
        </div>

        {/* Despesa Recorrente */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="recorrente"
              checked={formData.recorrente}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                recorrente: e.target.checked,
                frequencia: e.target.checked ? prev.frequencia : ''
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="recorrente" className="ml-2 text-sm font-medium text-gray-700">
              Despesa Recorrente
            </label>
          </div>

          {formData.recorrente && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequência *
              </label>
              <select
                value={formData.frequencia}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frequencia: e.target.value as 'MENSAL' | 'TRIMESTRAL' | 'ANUAL'
                }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.frequencia ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Selecione a frequência</option>
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="ANUAL">Anual</option>
              </select>
              {errors.frequencia && (
                <p className="text-red-600 text-sm mt-1">{errors.frequencia}</p>
              )}

              {/* Preview da recorrência */}
              {recurrencePreview && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Preview da Recorrência
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Frequência: {recurrencePreview.frequencia.toLowerCase()}</div>
                    <div>Valor anual estimado: {formatCurrency(recurrencePreview.valorAnual)}</div>
                    {recurrencePreview.proximaData && (
                      <div>Próxima ocorrência: {new Date(recurrencePreview.proximaData).toLocaleDateString('pt-BR')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Informações adicionais sobre a despesa..."
            disabled={loading}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {expense ? 'Atualizar Despesa' : 'Criar Despesa'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Componente para upload de comprovantes
interface ReceiptUploadProps {
  expenseId: string
  receipts: string[]
  onUpload: (file: File) => Promise<void>
  onRemove: (fileUrl: string) => Promise<void>
  loading?: boolean
}

export function ReceiptUpload({ 
  expenseId, 
  receipts, 
  onUpload, 
  onRemove, 
  loading = false 
}: ReceiptUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Apenas imagens (JPG, PNG) e PDFs são permitidos')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo deve ter no máximo 5MB')
      return
    }

    try {
      await onUpload(file)
    } catch (error) {
      console.error('Erro no upload:', error)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Comprovantes</h3>

      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-gray-400 text-4xl">📎</div>
          <div>
            <p className="text-gray-600">
              Arraste arquivos aqui ou{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                clique para selecionar
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={loading}
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Imagens (JPG, PNG) ou PDF até 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Lista de comprovantes */}
      {receipts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Arquivos Enviados</h4>
          <div className="space-y-2">
            {receipts.map((receipt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">📄</div>
                  <span className="text-sm text-gray-700">
                    {receipt.split('/').pop() || `Comprovante ${index + 1}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(receipt, '_blank')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => onRemove(receipt)}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={loading}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}