// Serviço para gestão de despesas operacionais

import { mcp_supabase_execute_sql } from '../../../lib/supabase'
import { Despesa, CategoriaFinanceira, TransacaoFinanceira } from '../types'
import { formatCurrency, formatDate } from '../utils'

// Tipos específicos para o serviço de despesas
export interface CreateExpenseData {
  descricao: string
  valor: number
  categoriaId: string
  dataDespesa: string
  recorrente?: boolean
  frequencia?: 'MENSAL' | 'TRIMESTRAL' | 'ANUAL'
  comprovantes?: string[]
  observacoes?: string
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: string
}

export interface ExpenseFilters {
  categoriaId?: string
  dataInicio?: string
  dataFim?: string
  recorrente?: boolean
  valorMinimo?: number
  valorMaximo?: number
  limit?: number
  offset?: number
}

export interface ExpenseReport {
  periodo: {
    inicio: string
    fim: string
  }
  totalDespesas: number
  numeroDespesas: number
  despesaMedia: number
  categorias: {
    id: string
    nome: string
    totalGasto: number
    orcamentoMensal?: number
    percentualOrcamento?: number
    numeroDespesas: number
    cor: string
  }[]
  evolucaoMensal: {
    mes: string
    valor: number
  }[]
  despesasRecorrentes: number
  despesasAvulsas: number
}

export interface BudgetAlert {
  categoriaId: string
  categoriaNome: string
  orcamentoMensal: number
  gastoAtual: number
  percentualGasto: number
  status: 'OK' | 'ATENCAO' | 'EXCEDIDO'
  diasRestantes: number
}

// Serviço principal de despesas
export class ExpenseService {
  // Criar nova despesa
  async createExpense(expenseData: CreateExpenseData): Promise<Despesa> {
    try {
      const query = `
        INSERT INTO despesas (
          descricao, valor, categoria_id, data_despesa, recorrente, 
          frequencia, comprovantes, observacoes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING *
      `

      const result = await mcp_supabase_execute_sql(query, [
        expenseData.descricao,
        expenseData.valor,
        expenseData.categoriaId,
        expenseData.dataDespesa,
        expenseData.recorrente || false,
        expenseData.frequencia || null,
        expenseData.comprovantes || [],
        expenseData.observacoes || null
      ])

      if (result.data && result.data.length > 0) {
        const despesa = result.data[0] as Despesa

        // Criar transação financeira correspondente
        await this.createExpenseTransaction(despesa)

        // Verificar alertas de orçamento
        await this.checkBudgetAlerts(despesa.categoria_id)

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('Despesa criada:', {
            id: despesa.id,
            descricao: despesa.descricao,
            valor: formatCurrency(despesa.valor),
            categoria: despesa.categoria_id
          })
        }

        return despesa
      }

      throw new Error('Falha ao criar despesa')
    } catch (error) {
      console.error('Erro ao criar despesa:', error)
      throw error
    }
  }

  // Buscar despesa por ID
  async getExpense(expenseId: string): Promise<Despesa | null> {
    try {
      const query = `
        SELECT 
          d.*,
          cf.nome as categoria_nome,
          cf.cor as categoria_cor,
          cf.orcamento_mensal
        FROM despesas d
        LEFT JOIN categorias_financeiras cf ON d.categoria_id = cf.id
        WHERE d.id = $1
      `

      const result = await mcp_supabase_execute_sql(query, [expenseId])

      if (result.data && result.data.length > 0) {
        return result.data[0] as Despesa
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar despesa:', error)
      throw error
    }
  }

  // Listar despesas com filtros
  async listExpenses(filters: ExpenseFilters = {}): Promise<{
    despesas: Despesa[]
    total: number
  }> {
    try {
      let whereConditions: string[] = []
      let params: any[] = []
      let paramIndex = 1

      // Construir condições WHERE
      if (filters.categoriaId) {
        whereConditions.push(`d.categoria_id = $${paramIndex}`)
        params.push(filters.categoriaId)
        paramIndex++
      }

      if (filters.dataInicio) {
        whereConditions.push(`d.data_despesa >= $${paramIndex}`)
        params.push(filters.dataInicio)
        paramIndex++
      }

      if (filters.dataFim) {
        whereConditions.push(`d.data_despesa <= $${paramIndex}`)
        params.push(filters.dataFim)
        paramIndex++
      }

      if (filters.recorrente !== undefined) {
        whereConditions.push(`d.recorrente = $${paramIndex}`)
        params.push(filters.recorrente)
        paramIndex++
      }

      if (filters.valorMinimo) {
        whereConditions.push(`d.valor >= $${paramIndex}`)
        params.push(filters.valorMinimo)
        paramIndex++
      }

      if (filters.valorMaximo) {
        whereConditions.push(`d.valor <= $${paramIndex}`)
        params.push(filters.valorMaximo)
        paramIndex++
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      // Query principal
      const query = `
        SELECT 
          d.*,
          cf.nome as categoria_nome,
          cf.cor as categoria_cor,
          cf.orcamento_mensal
        FROM despesas d
        LEFT JOIN categorias_financeiras cf ON d.categoria_id = cf.id
        ${whereClause}
        ORDER BY d.data_despesa DESC, d.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      params.push(filters.limit || 50)
      params.push(filters.offset || 0)

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM despesas d
        ${whereClause}
      `

      const [despesasResult, countResult] = await Promise.all([
        mcp_supabase_execute_sql(query, params),
        mcp_supabase_execute_sql(countQuery, params.slice(0, -2)) // Remove limit e offset
      ])

      return {
        despesas: despesasResult.data || [],
        total: countResult.data?.[0]?.total || 0
      }
    } catch (error) {
      console.error('Erro ao listar despesas:', error)
      throw error
    }
  }

  // Atualizar despesa
  async updateExpense(updateData: UpdateExpenseData): Promise<Despesa> {
    try {
      const { id, ...data } = updateData
      
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')

      const query = `
        UPDATE despesas 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `

      const params = [id, ...Object.values(data)]
      const result = await mcp_supabase_execute_sql(query, params)

      if (result.data && result.data.length > 0) {
        const despesa = result.data[0] as Despesa

        // Atualizar transação financeira correspondente
        await this.updateExpenseTransaction(despesa)

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('Despesa atualizada:', {
            id: despesa.id,
            descricao: despesa.descricao,
            valor: formatCurrency(despesa.valor)
          })
        }

        return despesa
      }

      throw new Error('Falha ao atualizar despesa')
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error)
      throw error
    }
  }

  // Deletar despesa
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      // Primeiro, deletar transação financeira correspondente
      await this.deleteExpenseTransaction(expenseId)

      // Depois, deletar a despesa
      const query = `DELETE FROM despesas WHERE id = $1`
      await mcp_supabase_execute_sql(query, [expenseId])

      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Despesa deletada:', expenseId)
      }
    } catch (error) {
      console.error('Erro ao deletar despesa:', error)
      throw error
    }
  }

  // Criar transação financeira para despesa
  private async createExpenseTransaction(despesa: Despesa): Promise<void> {
    try {
      const query = `
        INSERT INTO transacoes_financeiras (
          tipo, valor, descricao, categoria_id, data_transacao, status, observacoes
        ) VALUES (
          'DESPESA', $1, $2, $3, $4, 'CONFIRMADA', $5
        )
      `

      const observacoes = `Despesa ID: ${despesa.id}${despesa.recorrente ? ' (Recorrente)' : ''}`

      await mcp_supabase_execute_sql(query, [
        despesa.valor,
        despesa.descricao,
        despesa.categoria_id,
        despesa.data_despesa,
        observacoes
      ])
    } catch (error) {
      console.error('Erro ao criar transação de despesa:', error)
      throw error
    }
  }

  // Atualizar transação financeira da despesa
  private async updateExpenseTransaction(despesa: Despesa): Promise<void> {
    try {
      const query = `
        UPDATE transacoes_financeiras 
        SET valor = $1, descricao = $2, categoria_id = $3, data_transacao = $4, updated_at = NOW()
        WHERE observacoes LIKE $5 AND tipo = 'DESPESA'
      `

      await mcp_supabase_execute_sql(query, [
        despesa.valor,
        despesa.descricao,
        despesa.categoria_id,
        despesa.data_despesa,
        `%Despesa ID: ${despesa.id}%`
      ])
    } catch (error) {
      console.error('Erro ao atualizar transação de despesa:', error)
      throw error
    }
  }

  // Deletar transação financeira da despesa
  private async deleteExpenseTransaction(expenseId: string): Promise<void> {
    try {
      const query = `
        DELETE FROM transacoes_financeiras 
        WHERE observacoes LIKE $1 AND tipo = 'DESPESA'
      `

      await mcp_supabase_execute_sql(query, [`%Despesa ID: ${expenseId}%`])
    } catch (error) {
      console.error('Erro ao deletar transação de despesa:', error)
      throw error
    }
  }

  // Processar despesas recorrentes
  async processRecurringExpenses(): Promise<{
    processed: number
    created: Despesa[]
    errors: string[]
  }> {
    try {
      console.log('🔄 Processando despesas recorrentes...')

      // Buscar despesas recorrentes ativas
      const query = `
        SELECT * FROM despesas 
        WHERE recorrente = true 
          AND frequencia IS NOT NULL
        ORDER BY data_despesa ASC
      `

      const result = await mcp_supabase_execute_sql(query)
      const despesasRecorrentes = result.data || []

      const created: Despesa[] = []
      const errors: string[] = []

      for (const despesa of despesasRecorrentes) {
        try {
          const proximaData = this.calculateNextRecurrenceDate(
            despesa.data_despesa,
            despesa.frequencia
          )

          // Verificar se já passou da data de recorrência
          const hoje = new Date().toISOString().split('T')[0]
          if (proximaData <= hoje) {
            // Verificar se já existe despesa para esta recorrência
            const existsQuery = `
              SELECT id FROM despesas 
              WHERE descricao LIKE $1 
                AND data_despesa = $2 
                AND categoria_id = $3
            `

            const existsResult = await mcp_supabase_execute_sql(existsQuery, [
              `${despesa.descricao}%`,
              proximaData,
              despesa.categoria_id
            ])

            if (existsResult.data && existsResult.data.length === 0) {
              // Criar nova despesa recorrente
              const novaDespesa = await this.createExpense({
                descricao: `${despesa.descricao} (Recorrente)`,
                valor: despesa.valor,
                categoriaId: despesa.categoria_id,
                dataDespesa: proximaData,
                recorrente: true,
                frequencia: despesa.frequencia,
                observacoes: `Gerada automaticamente da despesa ${despesa.id}`
              })

              created.push(novaDespesa)

              // Atualizar data da despesa original para próxima recorrência
              await this.updateExpense({
                id: despesa.id,
                dataDespesa: this.calculateNextRecurrenceDate(proximaData, despesa.frequencia)
              })
            }
          }
        } catch (error) {
          const errorMsg = `Erro ao processar despesa ${despesa.id}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      console.log(`✅ Processamento concluído: ${created.length} despesas criadas`)

      return {
        processed: despesasRecorrentes.length,
        created,
        errors
      }
    } catch (error) {
      console.error('Erro no processamento de despesas recorrentes:', error)
      throw error
    }
  }

  // Calcular próxima data de recorrência
  private calculateNextRecurrenceDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate)

    switch (frequency) {
      case 'MENSAL':
        date.setMonth(date.getMonth() + 1)
        break
      case 'TRIMESTRAL':
        date.setMonth(date.getMonth() + 3)
        break
      case 'ANUAL':
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        throw new Error(`Frequência inválida: ${frequency}`)
    }

    return date.toISOString().split('T')[0]
  }

  // Gerar relatório de despesas
  async generateExpenseReport(periodo: {
    inicio: string
    fim: string
  }): Promise<ExpenseReport> {
    try {
      // Buscar despesas do período
      const despesasQuery = `
        SELECT 
          d.*,
          cf.nome as categoria_nome,
          cf.cor as categoria_cor,
          cf.orcamento_mensal
        FROM despesas d
        LEFT JOIN categorias_financeiras cf ON d.categoria_id = cf.id
        WHERE d.data_despesa BETWEEN $1 AND $2
        ORDER BY d.data_despesa DESC
      `

      const despesasResult = await mcp_supabase_execute_sql(despesasQuery, [
        periodo.inicio,
        periodo.fim
      ])

      const despesas = despesasResult.data || []

      // Calcular métricas gerais
      const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0)
      const numeroDespesas = despesas.length
      const despesaMedia = numeroDespesas > 0 ? totalDespesas / numeroDespesas : 0
      const despesasRecorrentes = despesas.filter(d => d.recorrente).length
      const despesasAvulsas = numeroDespesas - despesasRecorrentes

      // Agrupar por categoria
      const categoriaMap = new Map()
      despesas.forEach(despesa => {
        const catId = despesa.categoria_id
        if (!categoriaMap.has(catId)) {
          categoriaMap.set(catId, {
            id: catId,
            nome: despesa.categoria_nome || 'Categoria Desconhecida',
            cor: despesa.categoria_cor || '#6B7280',
            orcamentoMensal: despesa.orcamento_mensal,
            totalGasto: 0,
            numeroDespesas: 0
          })
        }

        const categoria = categoriaMap.get(catId)
        categoria.totalGasto += despesa.valor || 0
        categoria.numeroDespesas += 1
      })

      // Calcular percentual do orçamento
      const categorias = Array.from(categoriaMap.values()).map(cat => ({
        ...cat,
        percentualOrcamento: cat.orcamentoMensal 
          ? (cat.totalGasto / cat.orcamentoMensal) * 100 
          : undefined
      }))

      // Evolução mensal (simplificada)
      const evolucaoMensal = this.calculateMonthlyEvolution(despesas, periodo)

      return {
        periodo,
        totalDespesas,
        numeroDespesas,
        despesaMedia,
        categorias,
        evolucaoMensal,
        despesasRecorrentes,
        despesasAvulsas
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de despesas:', error)
      throw error
    }
  }

  // Calcular evolução mensal
  private calculateMonthlyEvolution(despesas: any[], periodo: { inicio: string; fim: string }) {
    const monthlyMap = new Map()

    despesas.forEach(despesa => {
      const date = new Date(despesa.data_despesa)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, 0)
      }
      
      monthlyMap.set(monthKey, monthlyMap.get(monthKey) + (despesa.valor || 0))
    })

    return Array.from(monthlyMap.entries())
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
  }

  // Verificar alertas de orçamento
  async checkBudgetAlerts(categoriaId?: string): Promise<BudgetAlert[]> {
    try {
      let whereClause = 'WHERE cf.tipo = \'DESPESA\' AND cf.orcamento_mensal IS NOT NULL AND cf.ativo = true'
      let params: any[] = []

      if (categoriaId) {
        whereClause += ' AND cf.id = $1'
        params.push(categoriaId)
      }

      // Buscar categorias com orçamento
      const query = `
        SELECT 
          cf.*,
          COALESCE(SUM(d.valor), 0) as gasto_atual
        FROM categorias_financeiras cf
        LEFT JOIN despesas d ON cf.id = d.categoria_id 
          AND d.data_despesa >= DATE_TRUNC('month', CURRENT_DATE)
          AND d.data_despesa < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ${whereClause}
        GROUP BY cf.id, cf.nome, cf.orcamento_mensal, cf.cor
        ORDER BY cf.nome
      `

      const result = await mcp_supabase_execute_sql(query, params)
      const categorias = result.data || []

      const alerts: BudgetAlert[] = []
      const hoje = new Date()
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
      const diasRestantes = ultimoDiaMes - hoje.getDate()

      for (const categoria of categorias) {
        const percentualGasto = (categoria.gasto_atual / categoria.orcamento_mensal) * 100
        
        let status: 'OK' | 'ATENCAO' | 'EXCEDIDO' = 'OK'
        if (percentualGasto >= 100) {
          status = 'EXCEDIDO'
        } else if (percentualGasto >= 80) {
          status = 'ATENCAO'
        }

        alerts.push({
          categoriaId: categoria.id,
          categoriaNome: categoria.nome,
          orcamentoMensal: categoria.orcamento_mensal,
          gastoAtual: categoria.gasto_atual,
          percentualGasto,
          status,
          diasRestantes
        })
      }

      return alerts.filter(alert => alert.status !== 'OK') // Retornar apenas alertas
    } catch (error) {
      console.error('Erro ao verificar alertas de orçamento:', error)
      throw error
    }
  }

  // Upload de comprovante
  async uploadReceipt(expenseId: string, fileUrl: string): Promise<void> {
    try {
      // Buscar comprovantes atuais
      const currentQuery = `SELECT comprovantes FROM despesas WHERE id = $1`
      const currentResult = await mcp_supabase_execute_sql(currentQuery, [expenseId])
      
      if (!currentResult.data || currentResult.data.length === 0) {
        throw new Error('Despesa não encontrada')
      }

      const currentReceipts = currentResult.data[0].comprovantes || []
      const updatedReceipts = [...currentReceipts, fileUrl]

      // Atualizar comprovantes
      const updateQuery = `
        UPDATE despesas 
        SET comprovantes = $1, updated_at = NOW()
        WHERE id = $2
      `

      await mcp_supabase_execute_sql(updateQuery, [updatedReceipts, expenseId])

      console.log('Comprovante adicionado:', { expenseId, fileUrl })
    } catch (error) {
      console.error('Erro ao fazer upload de comprovante:', error)
      throw error
    }
  }

  // Remover comprovante
  async removeReceipt(expenseId: string, fileUrl: string): Promise<void> {
    try {
      // Buscar comprovantes atuais
      const currentQuery = `SELECT comprovantes FROM despesas WHERE id = $1`
      const currentResult = await mcp_supabase_execute_sql(currentQuery, [expenseId])
      
      if (!currentResult.data || currentResult.data.length === 0) {
        throw new Error('Despesa não encontrada')
      }

      const currentReceipts = currentResult.data[0].comprovantes || []
      const updatedReceipts = currentReceipts.filter((url: string) => url !== fileUrl)

      // Atualizar comprovantes
      const updateQuery = `
        UPDATE despesas 
        SET comprovantes = $1, updated_at = NOW()
        WHERE id = $2
      `

      await mcp_supabase_execute_sql(updateQuery, [updatedReceipts, expenseId])

      console.log('Comprovante removido:', { expenseId, fileUrl })
    } catch (error) {
      console.error('Erro ao remover comprovante:', error)
      throw error
    }
  }

  // Validar dados de despesa
  validateExpenseData(expenseData: CreateExpenseData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Descrição é obrigatória
    if (!expenseData.descricao || expenseData.descricao.trim().length < 3) {
      errors.push('Descrição deve ter pelo menos 3 caracteres')
    }

    // Valor deve ser positivo
    if (!expenseData.valor || expenseData.valor <= 0) {
      errors.push('Valor deve ser maior que zero')
    }

    // Categoria é obrigatória
    if (!expenseData.categoriaId) {
      errors.push('Categoria é obrigatória')
    }

    // Data é obrigatória
    if (!expenseData.dataDespesa) {
      errors.push('Data da despesa é obrigatória')
    }

    // Se recorrente, frequência é obrigatória
    if (expenseData.recorrente && !expenseData.frequencia) {
      errors.push('Frequência é obrigatória para despesas recorrentes')
    }

    // Validar frequência
    if (expenseData.frequencia && !['MENSAL', 'TRIMESTRAL', 'ANUAL'].includes(expenseData.frequencia)) {
      errors.push('Frequência deve ser MENSAL, TRIMESTRAL ou ANUAL')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Instância singleton do serviço
export const expenseService = new ExpenseService()