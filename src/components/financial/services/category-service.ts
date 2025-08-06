// Serviço para gerenciar categorias financeiras

import { mcp_supabase_execute_sql } from '../../../lib/supabase'
import { CategoriaFinanceira, CATEGORY_TYPES, DEFAULT_CATEGORY_COLORS } from '../types'
import { formatCurrency } from '../utils'

// Tipos específicos para o serviço de categorias
export interface CreateCategoryData {
  nome: string
  tipo: keyof typeof CATEGORY_TYPES
  cor?: string
  orcamentoMensal?: number
  ativo?: boolean
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string
}

export interface CategoryUsage {
  categoriaId: string
  categoriaNome: string
  totalTransacoes: number
  valorTotal: number
  ultimaTransacao: string
  ativa: boolean
}

export interface BudgetAnalysis {
  categoriaId: string
  categoriaNome: string
  orcamentoMensal: number
  gastoAtual: number
  gastoAnterior: number
  percentualAtual: number
  percentualAnterior: number
  tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL'
  projecaoMes: number
  diasRestantes: number
  mediaGastoDiario: number
}

// Serviço principal de categorias
export class CategoryService {
  // Criar nova categoria
  async createCategory(categoryData: CreateCategoryData): Promise<CategoriaFinanceira> {
    try {
      // Validar dados
      const validation = this.validateCategoryData(categoryData)
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`)
      }

      // Selecionar cor automaticamente se não fornecida
      const cor = categoryData.cor || await this.getNextAvailableColor()

      const query = `
        INSERT INTO categorias_financeiras (
          nome, tipo, cor, orcamento_mensal, ativo
        ) VALUES (
          $1, $2, $3, $4, $5
        )
        RETURNING *
      `

      const result = await mcp_supabase_execute_sql(query, [
        categoryData.nome,
        categoryData.tipo,
        cor,
        categoryData.orcamentoMensal || null,
        categoryData.ativo ?? true
      ])

      if (result.data && result.data.length > 0) {
        const categoria = result.data[0] as CategoriaFinanceira

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('Categoria criada:', {
            id: categoria.id,
            nome: categoria.nome,
            tipo: categoria.tipo,
            cor: categoria.cor
          })
        }

        return categoria
      }

      throw new Error('Falha ao criar categoria')
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  }

  // Buscar categoria por ID
  async getCategory(categoryId: string): Promise<CategoriaFinanceira | null> {
    try {
      const query = `SELECT * FROM categorias_financeiras WHERE id = $1`
      const result = await mcp_supabase_execute_sql(query, [categoryId])

      if (result.data && result.data.length > 0) {
        return result.data[0] as CategoriaFinanceira
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar categoria:', error)
      throw error
    }
  }

  // Listar categorias
  async listCategories(filters: {
    tipo?: keyof typeof CATEGORY_TYPES
    ativo?: boolean
    comOrcamento?: boolean
  } = {}): Promise<CategoriaFinanceira[]> {
    try {
      const whereConditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (filters.tipo) {
        whereConditions.push(`tipo = $${paramIndex}`)
        params.push(filters.tipo)
        paramIndex++
      }

      if (filters.ativo !== undefined) {
        whereConditions.push(`ativo = $${paramIndex}`)
        params.push(filters.ativo)
        paramIndex++
      }

      if (filters.comOrcamento) {
        whereConditions.push(`orcamento_mensal IS NOT NULL`)
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      const query = `
        SELECT * FROM categorias_financeiras 
        ${whereClause}
        ORDER BY tipo, nome
      `

      const result = await mcp_supabase_execute_sql(query, params)
      return result.data || []
    } catch (error) {
      console.error('Erro ao listar categorias:', error)
      throw error
    }
  }

  // Atualizar categoria
  async updateCategory(updateData: UpdateCategoryData): Promise<CategoriaFinanceira> {
    try {
      const { id, ...data } = updateData
      
      // Validar dados se fornecidos
      if (Object.keys(data).length > 0) {
        const validation = this.validateCategoryData(data as CreateCategoryData, true)
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`)
        }
      }

      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')

      const query = `
        UPDATE categorias_financeiras 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `

      const params = [id, ...Object.values(data)]
      const result = await mcp_supabase_execute_sql(query, params)

      if (result.data && result.data.length > 0) {
        const categoria = result.data[0] as CategoriaFinanceira

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('Categoria atualizada:', {
            id: categoria.id,
            nome: categoria.nome,
            alteracoes: Object.keys(data)
          })
        }

        return categoria
      }

      throw new Error('Falha ao atualizar categoria')
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw error
    }
  }

  // Deletar categoria (soft delete)
  async deleteCategory(categoryId: string, force: boolean = false): Promise<void> {
    try {
      // Verificar se categoria está em uso
      const usageQuery = `
        SELECT COUNT(*) as count FROM (
          SELECT 1 FROM transacoes_financeiras WHERE categoria_id = $1
          UNION ALL
          SELECT 1 FROM despesas WHERE categoria_id = $1
        ) as usage
      `

      const usageResult = await mcp_supabase_execute_sql(usageQuery, [categoryId])
      const isInUse = usageResult.data?.[0]?.count > 0

      if (isInUse && !force) {
        throw new Error('Categoria não pode ser deletada pois está em uso. Use force=true para desativar.')
      }

      if (force && isInUse) {
        // Soft delete - apenas desativar
        await this.updateCategory({ id: categoryId, ativo: false })
        console.log('Categoria desativada (soft delete):', categoryId)
      } else {
        // Hard delete - remover completamente
        const query = `DELETE FROM categorias_financeiras WHERE id = $1`
        await mcp_supabase_execute_sql(query, [categoryId])
        console.log('Categoria deletada:', categoryId)
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      throw error
    }
  }

  // Obter uso das categorias
  async getCategoryUsage(): Promise<CategoryUsage[]> {
    try {
      const query = `
        SELECT 
          cf.id as categoria_id,
          cf.nome as categoria_nome,
          cf.ativo,
          COALESCE(usage.total_transacoes, 0) as total_transacoes,
          COALESCE(usage.valor_total, 0) as valor_total,
          usage.ultima_transacao
        FROM categorias_financeiras cf
        LEFT JOIN (
          SELECT 
            categoria_id,
            COUNT(*) as total_transacoes,
            SUM(valor) as valor_total,
            MAX(data_transacao) as ultima_transacao
          FROM transacoes_financeiras
          WHERE categoria_id IS NOT NULL
          GROUP BY categoria_id
        ) usage ON cf.id = usage.categoria_id
        ORDER BY usage.total_transacoes DESC NULLS LAST, cf.nome
      `

      const result = await mcp_supabase_execute_sql(query)
      return result.data || []
    } catch (error) {
      console.error('Erro ao obter uso das categorias:', error)
      throw error
    }
  }

  // Análise de orçamento por categoria
  async getBudgetAnalysis(): Promise<BudgetAnalysis[]> {
    try {
      const hoje = new Date()
      const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
      const diasRestantes = ultimoDiaMes - hoje.getDate()
      const diasDecorridos = hoje.getDate()

      const query = `
        SELECT 
          cf.id as categoria_id,
          cf.nome as categoria_nome,
          cf.orcamento_mensal,
          COALESCE(atual.gasto_atual, 0) as gasto_atual,
          COALESCE(anterior.gasto_anterior, 0) as gasto_anterior
        FROM categorias_financeiras cf
        LEFT JOIN (
          SELECT 
            categoria_id,
            SUM(valor) as gasto_atual
          FROM despesas
          WHERE data_despesa >= $1
            AND data_despesa <= CURRENT_DATE
          GROUP BY categoria_id
        ) atual ON cf.id = atual.categoria_id
        LEFT JOIN (
          SELECT 
            categoria_id,
            SUM(valor) as gasto_anterior
          FROM despesas
          WHERE data_despesa >= $2
            AND data_despesa <= $3
          GROUP BY categoria_id
        ) anterior ON cf.id = anterior.categoria_id
        WHERE cf.tipo = 'DESPESA' 
          AND cf.orcamento_mensal IS NOT NULL 
          AND cf.ativo = true
        ORDER BY cf.nome
      `

      const result = await mcp_supabase_execute_sql(query, [
        inicioMesAtual.toISOString().split('T')[0],
        inicioMesAnterior.toISOString().split('T')[0],
        fimMesAnterior.toISOString().split('T')[0]
      ])

      const categorias = result.data || []

      return categorias.map(cat => {
        const percentualAtual = (cat.gasto_atual / cat.orcamento_mensal) * 100
        const percentualAnterior = cat.gasto_anterior > 0 
          ? (cat.gasto_anterior / cat.orcamento_mensal) * 100 
          : 0

        let tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL' = 'ESTAVEL'
        if (percentualAtual > percentualAnterior + 5) {
          tendencia = 'SUBINDO'
        } else if (percentualAtual < percentualAnterior - 5) {
          tendencia = 'DESCENDO'
        }

        const mediaGastoDiario = diasDecorridos > 0 ? cat.gasto_atual / diasDecorridos : 0
        const projecaoMes = mediaGastoDiario * ultimoDiaMes

        return {
          categoriaId: cat.categoria_id,
          categoriaNome: cat.categoria_nome,
          orcamentoMensal: cat.orcamento_mensal,
          gastoAtual: cat.gasto_atual,
          gastoAnterior: cat.gasto_anterior,
          percentualAtual,
          percentualAnterior,
          tendencia,
          projecaoMes,
          diasRestantes,
          mediaGastoDiario
        }
      })
    } catch (error) {
      console.error('Erro na análise de orçamento:', error)
      throw error
    }
  }

  // Obter próxima cor disponível
  private async getNextAvailableColor(): Promise<string> {
    try {
      const query = `SELECT cor FROM categorias_financeiras WHERE ativo = true`
      const result = await mcp_supabase_execute_sql(query)
      const coresUsadas = new Set((result.data || []).map(c => c.cor))

      // Encontrar primeira cor não usada
      for (const cor of DEFAULT_CATEGORY_COLORS) {
        if (!coresUsadas.has(cor)) {
          return cor
        }
      }

      // Se todas as cores estão em uso, retornar uma aleatória
      const randomIndex = Math.floor(Math.random() * DEFAULT_CATEGORY_COLORS.length)
      return DEFAULT_CATEGORY_COLORS[randomIndex]
    } catch (error) {
      console.error('Erro ao obter próxima cor:', error)
      return DEFAULT_CATEGORY_COLORS[0] // Cor padrão
    }
  }

  // Importar categorias padrão
  async importDefaultCategories(): Promise<{
    created: number
    skipped: number
    errors: string[]
  }> {
    try {
      const defaultCategories = [
        // Receitas
        { nome: 'Serviços de Corte', tipo: 'RECEITA' as const, cor: '#10B981' },
        { nome: 'Serviços de Barba', tipo: 'RECEITA' as const, cor: '#3B82F6' },
        { nome: 'Produtos Vendidos', tipo: 'RECEITA' as const, cor: '#8B5CF6' },
        { nome: 'Outros Serviços', tipo: 'RECEITA' as const, cor: '#F59E0B' },

        // Despesas
        { nome: 'Aluguel', tipo: 'DESPESA' as const, cor: '#EF4444', orcamentoMensal: 3000 },
        { nome: 'Energia Elétrica', tipo: 'DESPESA' as const, cor: '#F97316', orcamentoMensal: 500 },
        { nome: 'Água', tipo: 'DESPESA' as const, cor: '#06B6D4', orcamentoMensal: 200 },
        { nome: 'Internet/Telefone', tipo: 'DESPESA' as const, cor: '#84CC16', orcamentoMensal: 150 },
        { nome: 'Produtos para Revenda', tipo: 'DESPESA' as const, cor: '#EC4899', orcamentoMensal: 1000 },
        { nome: 'Material de Limpeza', tipo: 'DESPESA' as const, cor: '#6B7280', orcamentoMensal: 300 },
        { nome: 'Equipamentos', tipo: 'DESPESA' as const, cor: '#F59E0B', orcamentoMensal: 500 },
        { nome: 'Marketing', tipo: 'DESPESA' as const, cor: '#8B5CF6', orcamentoMensal: 400 },
        { nome: 'Impostos', tipo: 'DESPESA' as const, cor: '#EF4444', orcamentoMensal: 800 },
        { nome: 'Outras Despesas', tipo: 'DESPESA' as const, cor: '#6B7280', orcamentoMensal: 200 }
      ]

      let created = 0
      let skipped = 0
      const errors: string[] = []

      for (const categoryData of defaultCategories) {
        try {
          // Verificar se categoria já existe
          const existsQuery = `
            SELECT id FROM categorias_financeiras 
            WHERE nome = $1 AND tipo = $2
          `
          const existsResult = await mcp_supabase_execute_sql(existsQuery, [
            categoryData.nome,
            categoryData.tipo
          ])

          if (existsResult.data && existsResult.data.length > 0) {
            skipped++
            continue
          }

          // Criar categoria
          await this.createCategory(categoryData)
          created++

        } catch (error) {
          const errorMsg = `Erro ao criar categoria ${categoryData.nome}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      console.log(`Importação concluída: ${created} criadas, ${skipped} ignoradas`)

      return { created, skipped, errors }
    } catch (error) {
      console.error('Erro na importação de categorias padrão:', error)
      throw error
    }
  }

  // Validar dados de categoria
  validateCategoryData(
    categoryData: Partial<CreateCategoryData>, 
    isUpdate: boolean = false
  ): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Nome é obrigatório (exceto em updates parciais)
    if (!isUpdate && (!categoryData.nome || categoryData.nome.trim().length < 2)) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    // Tipo é obrigatório (exceto em updates parciais)
    if (!isUpdate && !categoryData.tipo) {
      errors.push('Tipo é obrigatório')
    }

    // Validar tipo se fornecido
    if (categoryData.tipo && !Object.keys(CATEGORY_TYPES).includes(categoryData.tipo)) {
      errors.push('Tipo deve ser RECEITA ou DESPESA')
    }

    // Validar cor se fornecida
    if (categoryData.cor && !/^#[0-9A-Fa-f]{6}$/.test(categoryData.cor)) {
      errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)')
    }

    // Orçamento deve ser positivo se fornecido
    if (categoryData.orcamentoMensal !== undefined && categoryData.orcamentoMensal <= 0) {
      errors.push('Orçamento mensal deve ser maior que zero')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Duplicar categoria
  async duplicateCategory(categoryId: string, newName: string): Promise<CategoriaFinanceira> {
    try {
      const originalCategory = await this.getCategory(categoryId)
      if (!originalCategory) {
        throw new Error('Categoria original não encontrada')
      }

      const duplicatedCategory = await this.createCategory({
        nome: newName,
        tipo: originalCategory.tipo as keyof typeof CATEGORY_TYPES,
        cor: originalCategory.cor,
        orcamentoMensal: originalCategory.orcamento_mensal,
        ativo: true
      })

      console.log('Categoria duplicada:', {
        original: originalCategory.nome,
        nova: duplicatedCategory.nome
      })

      return duplicatedCategory
    } catch (error) {
      console.error('Erro ao duplicar categoria:', error)
      throw error
    }
  }
}

// Instância singleton do serviço
export const categoryService = new CategoryService()
